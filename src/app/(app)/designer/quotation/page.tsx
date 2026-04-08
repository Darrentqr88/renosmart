'use client';

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useI18n } from '@/lib/i18n/context';
import { extractTextFromFile } from '@/lib/pdf/extractor';
import { buildQuotationPrompt, buildGanttParamsPrompt, fetchDbPriceReference } from '@/lib/ai/quotation-prompt';
import { generateGanttFromAIParams, generateGanttFromQuotation } from '@/lib/utils/gantt-rules';
import { QuotationAnalysis, QuotationItem, AIItemStatus, SupplyType, GanttParams, ScoreBreakdown, DimensionBreakdown } from '@/types';
import { formatCurrency, getCurrencySymbol } from '@/lib/utils';
import { calculateHybridScores } from '@/lib/utils/score-calculator';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { GanttAutoGenerator } from '@/components/gantt/GanttAutoGenerator';
import {
  FileText, CheckCircle2, XCircle,
  Loader2, X, RefreshCw, Printer,
  ChevronRight, User, Save, Calendar, ArrowRight, Send,
} from 'lucide-react';

type UploadStep = 'idle' | 'extracting' | 'analyzing' | 'done' | 'error';

/* ─── Status configs ─────────────────────────────────────────────────────── */
const STATUS_CONFIG: Record<AIItemStatus, { label: string; color: string; bg: string; dot: string; cls: string }> = {
  ok:     { label: '✓ 正常',   color: 'text-green-700', bg: 'bg-green-50',  dot: '#16A34A', cls: '#16A34A' },
  warn:   { label: '⚠ 注意',   color: 'text-amber-600', bg: 'bg-amber-50',  dot: '#F59E0B', cls: '#F97316' },
  flag:   { label: '✗ 异常',   color: 'text-red-600',   bg: 'bg-red-50',    dot: '#E53935', cls: '#E53935' },
  nodata: { label: '– 待确认', color: 'text-gray-500',  bg: 'bg-gray-100',  dot: '#9CA3AF', cls: '#9CA3AF' },
};

const SUPPLY_BADGE: Record<SupplyType, { label: string; bg: string; color: string }> = {
  supply_install: { label: 'S&I',    bg: 'rgba(46,107,230,0.12)',  color: '#2E6BE6' },
  labour_only:    { label: 'Labour', bg: 'rgba(249,115,22,0.12)',  color: '#F97316' },
  supply_only:    { label: 'Supply', bg: 'rgba(22,163,74,0.12)',   color: '#16A34A' },
};

/* ─── Sub-components ─────────────────────────────────────────────────────── */
function ScoreCircle({ score }: { score: number }) {
  const color = score >= 80 ? '#16A34A' : score >= 60 ? '#F0B90B' : '#E53935';
  return (
    <div style={{ width: 80, height: 80, borderRadius: '50%', border: `3px solid #F0B90B`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(240,185,11,0.08)', flexShrink: 0 }}>
      <span style={{ fontSize: 24, fontWeight: 700, color, lineHeight: 1 }}>{score}</span>
      <span style={{ fontSize: 9, color: '#9CA3AF', letterSpacing: 1 }}>/ 100</span>
    </div>
  );
}

function ScoreBar({ label, value, color, breakdown }: { label: string; value: number; color: string; breakdown?: DimensionBreakdown }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="group relative flex items-center gap-2.5">
      <span style={{ fontSize: 12, color: '#6B7A94', width: 100, flexShrink: 0 }}>{label}</span>
      <div
        style={{ flex: 1, height: 6, background: '#E4E7F0', borderRadius: 3, overflow: 'hidden', border: '1px solid #E4E7F0', cursor: breakdown ? 'pointer' : undefined }}
        onClick={() => breakdown && setOpen(o => !o)}
        onKeyDown={e => { if (breakdown && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setOpen(o => !o); } }}
        tabIndex={breakdown ? 0 : undefined}
        role={breakdown ? 'button' : undefined}
        aria-expanded={breakdown ? open : undefined}
      >
        <div style={{ height: '100%', borderRadius: 3, width: `${value}%`, background: color, transition: 'width 1s ease' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#1B2336', width: 30, textAlign: 'right' }}>{value}</span>
      {breakdown && (
        <div className={`${open ? 'block' : 'hidden md:group-hover:block'} absolute left-0 top-full mt-1 z-50
                        bg-white border border-rs-surface3 rounded-lg shadow-lg p-3 w-72 text-[11px]`}>
          <div className="flex justify-between mb-1">
            <span className="text-rs-text3">AI Score:</span>
            <span className="font-medium">{breakdown.aiScore}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="text-rs-text3">Data Score:</span>
            <span className="font-medium">{breakdown.dataScore}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-rs-text3">Blended (40/60):</span>
            <span className="font-bold text-[#F0B90B]">{breakdown.blendedScore}</span>
          </div>
          <div className="text-rs-text2 border-t border-rs-surface3 pt-1.5">{breakdown.detail}</div>
        </div>
      )}
    </div>
  );
}

function SupplyBadge({ type }: { type?: SupplyType }) {
  if (!type) return null;
  const cfg = SUPPLY_BADGE[type];
  return (
    <span style={{ background: cfg.bg, color: cfg.color, fontSize: 10, fontWeight: 700, borderRadius: 4, padding: '2px 6px' }}>
      {cfg.label}
    </span>
  );
}

/* ─── Detect MY sub-region from address ──────────────────────────────────── */
function detectMYRegion(address?: string, textForAI?: string): string {
  const haystack = `${address || ''} ${textForAI || ''}`.toLowerCase();
  // Johor patterns
  if (/\bjohor\b|\bjb\b|\biskandar\b|\bnusajaya\b|\bgelang\s*patah\b|\bskudai\b|\bkulai\b|\bsenai\b|\bmasai\b|\bpasir\s*gudang\b|\bpermas\b|\btebrau\b|\bmount\s*austin\b|\bsetia\s*tropika\b/.test(haystack)) return 'MY_JB';
  // Penang patterns
  if (/\bpenang\b|\bpulau\s*pinang\b|\bgeorgetown\b|\bgeorge\s*town\b|\bbayan\s*lepas\b|\btanjung\s*bungah\b|\bbukit\s*mertajam\b|\bbutterwort?h\b|\bnibong\s*tebal\b|\bseberang\s*(perai|prai)\b|\bjelutong\b|\bairs?\s*itam\b/.test(haystack)) return 'MY_PG';
  // Default: KL/Selangor (largest market)
  return 'MY_KL';
}

/* ─── Sanitize AI response ───────────────────────────────────────────────── */
function sanitizeAnalysis(raw: QuotationAnalysis): QuotationAnalysis {
  const items = (raw.items ?? []).map(item => ({
    ...item,
    qty:       Number(item.qty)       || 0,
    unitPrice: Number(item.unitPrice) || 0,
    total:     Number(item.total)     || 0,
  }));
  const subtotals = (raw.subtotals ?? []).map(s => ({
    ...s,
    amount: Number(s.amount) || 0,
  }));

  // totalAmount: use AI value, or fallback to sum of subtotals, or sum of items
  let totalAmount = Number(raw.totalAmount) || 0;
  if (totalAmount === 0 && subtotals.length > 0) {
    totalAmount = subtotals.reduce((sum, s) => sum + s.amount, 0);
  }
  if (totalAmount === 0 && items.length > 0) {
    totalAmount = items.reduce((sum, item) => sum + item.total, 0);
  }

  return {
    ...raw,
    totalAmount,
    items,
    subtotals,
    score: raw.score ?? { total: 0, completeness: 0, price: 0, logic: 0, risk: 0 },
    missing: raw.missing ?? [],
    alerts:  raw.alerts  ?? [],
  };
}

// Group alerts with the same title into one combined alert (merges repeated per-item alerts)
function groupAlertsByTitle<T extends { title: string; desc: string; level: string }>(alerts: T[]): T[] {
  const seen = new Map<string, { base: T; descs: string[] }>();
  for (const a of alerts) {
    const key = `${a.level}::${a.title}`;
    if (seen.has(key)) {
      seen.get(key)!.descs.push(a.desc);
    } else {
      seen.set(key, { base: a, descs: [a.desc] });
    }
  }
  return Array.from(seen.values()).map(({ base, descs }) => ({
    ...base,
    desc: descs.length === 1 ? descs[0] : descs.map(d => `• ${d}`).join('\n'),
  }));
}

// Filter out false-positive warning alerts:
// 1. Price alerts where calculation/price is confirmed correct/within range
// 2. "Calculation Error" alerts where the description concludes it is actually correct
function isFalsePositiveAlert(alert: { title: string; desc: string }): boolean {
  const d = (alert.desc || '').toLowerCase();
  const t = (alert.title || '').toLowerCase();

  // Price "within range" false positives
  const isWithinRange =
    (t.includes('price anomaly') || t.includes('price')) &&
    (d.includes('within range') || d.includes('within the range') || d.includes('is in range') ||
     d.includes('this is within') || d.includes('reasonable for') || d.includes('in range'));

  // Calculation "error" that actually confirms it is correct
  const isCorrectCalc =
    t.includes('calculation') &&
    (d.includes('calculation is correct') || d.includes('is correct') ||
     d.includes('= correct') || d.includes('matches') || d.endsWith('correct.'));

  return isWithinRange || isCorrectCalc;
}

/* ─── Main Page ─────────────────────────────────────────────────────────── */
export default function QuotationPage() {
  const { lang, region, t } = useI18n();
  const currency = getCurrencySymbol(region);
  const fmtCurrency = (amount: number) => formatCurrency(amount, currency);
  const router = useRouter();
  const supabase = createClient();

  // Upload / step state
  const [step, setStep] = useState<UploadStep>('idle');
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Analysis
  const [analysis, setAnalysis] = useState<QuotationAnalysis | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [showGantt, setShowGantt] = useState(false);
  const [activeSection, setActiveSection] = useState('all');

  // Editable client info
  const [clientInfo, setClientInfo] = useState<QuotationAnalysis['client'] | null>(null);

  // Hybrid scoring
  const [scoreBreakdown, setScoreBreakdown] = useState<ScoreBreakdown | null>(null);

  // Full report
  const [showFullReport, setShowFullReport] = useState(false);
  const [expandMissing, setExpandMissing] = useState(false);
  const [expandFlags, setExpandFlags] = useState(false);
  const [expandTips, setExpandTips] = useState(false);

  // Save to project
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveMode, setSaveMode] = useState<'new' | 'existing'>('new');
  const [newProjectName, setNewProjectName] = useState('');
  const [existingProjects, setExistingProjects] = useState<{ id: string; name: string; status: string }[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedProjectId, setSavedProjectId] = useState<string | null>(null);

  // Linked project (from ?projectId= URL param — set when navigating from +New Project)
  const [linkedProjectId, setLinkedProjectId] = useState<string | null>(null);
  const [linkedProjectName, setLinkedProjectName] = useState<string>('');

  // Read ?projectId= from URL on mount, load project name
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const pid = params.get('projectId');
      if (pid) {
        setLinkedProjectId(pid);
        supabase.from('projects').select('name').eq('id', pid).single().then(({ data }) => {
          if (data) setLinkedProjectName(data.name);
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync clientInfo when analysis changes
  useEffect(() => {
    if (analysis) {
      setClientInfo({ ...analysis.client });
      setActiveSection('all');
    }
  }, [analysis]);

  const clearAllState = useCallback(() => {
    setAnalysis(null);
    setPdfUrl(null);
    setShowPdfViewer(false);
    setShowGantt(false);
    setActiveSection('all');
    setClientInfo(null);
    setShowFullReport(false);
    setExpandMissing(false);
    setExpandFlags(false);
    setExpandTips(false);
    setScoreBreakdown(null);
    setSavedProjectId(null);
    setStep('idle');
    setProgress(0);
    setProgressLabel('');
  }, []);

  const processFile = async (file: File) => {
    clearAllState();
    setFileName(file.name);
    setFileSize(`${(file.size / 1024).toFixed(1)} KB`);
    if (file.name.endsWith('.pdf')) setPdfUrl(URL.createObjectURL(file));

    try {
      setStep('extracting');
      setProgressLabel(lang === 'ZH' ? '正在读取文件...' : 'Reading file...');
      setProgress(20);
      const text = await extractTextFromFile(file);
      setProgress(50);

      setStep('analyzing');
      setProgressLabel(lang === 'ZH' ? 'AI 正在分析报价单...' : 'AI analyzing quotation...');
      setProgress(60);

      const { data: { user: authUser } } = await supabase.auth.getUser();
      const { data: { session: tokenSession } } = await supabase.auth.getSession();
      const outputLang = lang === 'ZH' ? 'Chinese (Simplified)' : 'English';
      // Fetch live price reference from DB (falls back to hardcoded PRICE_REFERENCE if DB empty)
      const dbPriceRef = await fetchDbPriceReference(supabase, region === 'SG' ? 'SG' : 'MY_KL');
      const dbRegion = region === 'SG' ? 'SG' : 'MY_KL';
      const prompt = buildQuotationPrompt(text, outputLang, dbPriceRef, dbRegion);
      const authHeaders: Record<string, string> = tokenSession?.access_token ? { Authorization: `Bearer ${tokenSession.access_token}` } : {};

      // ── Streaming AI call for items + score (no ganttParams) ──
      const res = await fetch('/api/claude/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 32000, messages: [{ role: 'user', content: prompt }] }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'AI 分析失败');
      }

      // Read SSE stream
      const reader = res.body?.getReader();
      if (!reader) throw new Error('Stream unavailable');
      const decoder = new TextDecoder();
      let content = '';
      let charCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.error) throw new Error(parsed.error);
              if (parsed.text) {
                content += parsed.text;
                charCount += parsed.text.length;
                // Progress: scale from 60 to 95 based on chars received (typical ~8K-15K)
                setProgress(Math.min(95, 60 + Math.floor(charCount / 400)));
              }
            } catch { /* skip malformed SSE lines */ }
          }
        }
      }

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('AI 返回格式异常，请重试');

      // Repair truncated JSON
      let rawJson = jsonMatch[0];
      let parsed: QuotationAnalysis;
      try {
        parsed = JSON.parse(rawJson);
      } catch {
        const truncated = rawJson.replace(/,\s*$/, '').replace(/[\s,]*$/, '');
        const stack: string[] = [];
        for (const ch of truncated) {
          if (ch === '{') stack.push('}');
          else if (ch === '[') stack.push(']');
          else if (ch === '}' || ch === ']') stack.pop();
        }
        const repaired = truncated + stack.reverse().join('');
        try {
          parsed = JSON.parse(repaired);
        } catch {
          throw new Error('AI 返回格式异常，请重试（JSON 解析失败）');
        }
      }

      setProgress(98);
      setAnalysis(sanitizeAnalysis(parsed));
      setStep('done');
      setProgressLabel(lang === 'ZH' ? '分析完成' : 'Analysis complete');
      toast({ title: '✅ 分析完成', description: parsed.summary?.slice(0, 80) });
      setProgress(100);

      // ── Detect effective region for price scoring + DB update ──
      const effectiveRegion = region === 'SG' ? 'SG' : detectMYRegion(parsed.client?.address, text);

      // ── Background: hybrid scoring ──
      calculateHybridScores(parsed, effectiveRegion).then(breakdown => {
        setScoreBreakdown(breakdown);
        setAnalysis(prev => prev ? {
          ...prev,
          score: {
            total: breakdown.total,
            completeness: breakdown.completeness.blendedScore,
            price: breakdown.price.blendedScore,
            logic: breakdown.logic.blendedScore,
            risk: breakdown.risk.blendedScore,
          },
          items: prev.items.map((item, idx) => {
            const comp = breakdown.priceComparisons.find(c => c.itemIndex === idx);
            if (!comp || comp.source === 'ai_status') return item;
            // Determine status: price within range (ok/ai_estimated) → always 'ok', overrides AI status
            const isWithinRange = comp.verdict === 'ok' || comp.verdict === 'ai_estimated';
            const newStatus: AIItemStatus =
              isWithinRange ? 'ok' :
              (comp.verdict === 'flag_high' || comp.verdict === 'flag_low') ? 'flag' :
              comp.verdict === 'warn_high' ? 'warn' : item.status;
            // Only show range label for warn/flag items — 'ok' items don't need the range displayed
            const showRange = !isWithinRange;
            const rangeLabel = showRange
              ? ((comp.source === 'database' || comp.source === 'known_range') && comp.dbMin != null && comp.dbMax != null
                  ? `市场${comp.dbMin.toFixed(0)}-${comp.dbMax.toFixed(0)}`
                  : comp.source === 'ai_estimate' && comp.aiEstMin != null && comp.aiEstMax != null
                    ? `AI估${comp.aiEstMin.toFixed(0)}-${comp.aiEstMax.toFixed(0)}`
                    : item.note)
              : item.note;
            return {
              ...item,
              status: newStatus,
              note: rangeLabel && rangeLabel.length <= 25 ? rangeLabel : item.note,
            };
          }),
        } : prev);
      }).catch(() => {});

      // Background: price-db update
      if (parsed.items?.length > 0) {
        fetch('/api/price-db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({ items: parsed.items, region: effectiveRegion }),
        }).catch(() => {});
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '分析失败';
      setStep('error');
      setProgressLabel(msg);
      toast({ variant: 'destructive', title: '分析失败', description: msg });
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  /* ─── Section tabs ─────────────────────────────────────────────────────── */
  const sections = useMemo(() => {
    if (!analysis) return [];
    const map = new Map<string, number>();
    for (const item of analysis.items) {
      const sec = item.section || '综合';
      map.set(sec, (map.get(sec) || 0) + 1);
    }
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [analysis]);

  // Page-based grouping
  const pages = useMemo(() => {
    if (!analysis) return [];
    const map = new Map<number, number>();
    for (const item of analysis.items) {
      const pg = item.page || 1;
      map.set(pg, (map.get(pg) || 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]).map(([page, count]) => ({ page, count }));
  }, [analysis]);

  const [filterMode, setFilterMode] = useState<'section' | 'page'>('section');
  const [activePage, setActivePage] = useState<number | 'all'>('all');

  const filteredItems: QuotationItem[] = useMemo(() => {
    if (!analysis) return [];
    if (filterMode === 'page') {
      if (activePage === 'all') return analysis.items;
      return analysis.items.filter(i => (i.page || 1) === activePage);
    }
    if (activeSection === 'all') return analysis.items;
    return analysis.items.filter(i => (i.section || '综合') === activeSection);
  }, [analysis, activeSection, filterMode, activePage]);

  const displayedItems = filteredItems;

  /* ─── Save Gantt tasks to DB from quotation analysis ─────────────────── */
  const saveGanttFromAnalysis = async (
    projectId: string,
    analysisData: QuotationAnalysis,
    userId: string,
    smartMerge = false,
  ) => {
    try {
      const ganttParams = (analysisData as QuotationAnalysis & { ganttParams?: GanttParams }).ganttParams;
      const startDate = new Date();
      const newTasks = ganttParams
        ? generateGanttFromAIParams(projectId, ganttParams, startDate, 'MY', false, false)
        : analysisData.items?.length > 0
          ? generateGanttFromQuotation(projectId, analysisData.items.map(i => ({ ...i, unit: i.unit || '' })), startDate, 'MY', false, false)
          : null;
      if (!newTasks || newTasks.length === 0) return;

      if (smartMerge) {
        // ── Smart merge: preserve existing progress ──
        const { data: existingTasks } = await supabase
          .from('gantt_tasks').select('*').eq('project_id', projectId);

        if (existingTasks && existingTasks.length > 0) {
          // Build lookup by phase_id (most reliable) or trade name
          const existingByPhase = new Map<string, typeof existingTasks[0]>();
          const existingByTrade = new Map<string, typeof existingTasks[0]>();
          for (const et of existingTasks) {
            if (et.phase_id) existingByPhase.set(et.phase_id, et);
            existingByTrade.set(et.trade?.toLowerCase(), et);
          }

          // Merge: for each new task, check if an existing task with same phase_id exists
          const mergedTasks = newTasks.map(nt => {
            const existing = existingByPhase.get(nt.phase_id || '') || existingByTrade.get(nt.trade?.toLowerCase());
            if (!existing) return nt; // new task, use as-is

            // Preserve progress & completed subtasks from existing task
            const preservedProgress = existing.progress || 0;
            const preservedSubtasks = nt.subtasks.map(sub => {
              // Check if this subtask existed before and was completed
              const oldSub = (existing.subtasks as { id: string; completed: boolean }[] || [])
                .find(os => os.id === sub.id || (sub.name && os.id?.includes?.(sub.name.slice(0, 10))));
              return oldSub?.completed ? { ...sub, completed: true } : sub;
            });

            // If existing task has progress > 0, preserve its dates
            const preserveDates = preservedProgress > 0;
            // If new duration is longer (scope increased), extend end date but keep start
            const newDurationIsLonger = nt.duration > (existing.duration || 0);

            return {
              ...nt,
              progress: preservedProgress,
              subtasks: preservedSubtasks,
              // Keep existing start/end if task has progress, unless new scope is larger
              start_date: preserveDates ? existing.start_date : nt.start_date,
              end_date: preserveDates && !newDurationIsLonger ? existing.end_date : nt.end_date,
              duration: preserveDates && !newDurationIsLonger ? (existing.duration || nt.duration) : nt.duration,
              assigned_workers: existing.assigned_workers || nt.assigned_workers || [],
              ai_hint: existing.ai_hint || null,
            };
          });

          // Delete old and insert merged
          await supabase.from('gantt_tasks').delete().eq('project_id', projectId);
          await supabase.from('gantt_tasks').insert(
            mergedTasks.map(t => ({
              id: t.id, project_id: t.project_id, user_id: userId,
              name: t.name, name_zh: t.name_zh, trade: t.trade,
              start_date: t.start_date, end_date: t.end_date, duration: t.duration,
              progress: t.progress, dependencies: t.dependencies, color: t.color,
              is_critical: t.is_critical, subtasks: t.subtasks,
              assigned_workers: t.assigned_workers || [],
              phase_id: t.phase_id,
            }))
          );
          return;
        }
      }

      // Full replace (new project or no existing tasks)
      await supabase.from('gantt_tasks').delete().eq('project_id', projectId);
      await supabase.from('gantt_tasks').insert(
        newTasks.map(t => ({
          id: t.id, project_id: t.project_id, user_id: userId,
          name: t.name, name_zh: t.name_zh, trade: t.trade,
          start_date: t.start_date, end_date: t.end_date, duration: t.duration,
          progress: t.progress, dependencies: t.dependencies, color: t.color,
          is_critical: t.is_critical, subtasks: t.subtasks,
          assigned_workers: t.assigned_workers || [],
          phase_id: t.phase_id,
        }))
      );
    } catch { /* non-blocking */ }
  };

  /* ─── Direct save to linked project (from ?projectId= flow) ──────────── */
  const handleDirectSaveToProject = async (): Promise<string | null> => {
    if (!analysis || !clientInfo || !linkedProjectId) return null;
    if (savedProjectId) return savedProjectId; // already saved
    setIsSaving(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('请先登录');

      // Update project with AI-extracted client data
      await supabase.from('projects').update({
        contract_amount: analysis.totalAmount,
        client_name: clientInfo.attention || clientInfo.company || '',
        address: clientInfo.address || '',
      }).eq('id', linkedProjectId);

      // Deactivate old quotations and save this analysis as the new active version
      await supabase.from('project_quotations').update({ is_active: false }).eq('project_id', linkedProjectId);
      const { data: existingQvs2 } = await supabase.from('project_quotations').select('version').eq('project_id', linkedProjectId).order('version', { ascending: false }).limit(1);
      const nextVer = existingQvs2 && existingQvs2.length > 0 ? (existingQvs2[0].version || 1) + 1 : 1;
      await supabase.from('project_quotations').insert({
        project_id: linkedProjectId,
        user_id: authUser.id,
        file_name: fileName,
        version: nextVer,
        is_active: true,
        parsed_items: analysis.items,
        analysis_result: analysis,
        total_amount: analysis.totalAmount,
      });

      // Update payment phases: recalculate amounts proportionally, preserve collected status
      const total = analysis.totalAmount;
      const { data: existingPay } = await supabase
        .from('payment_phases').select('*').eq('project_id', linkedProjectId).order('phase_number');
      if (existingPay && existingPay.length > 0) {
        // Recalculate amounts based on new total, preserve status
        for (const phase of existingPay) {
          const pct = phase.percentage || 25;
          const newAmount = total * pct / 100;
          await supabase.from('payment_phases').update({ amount: newAmount }).eq('id', phase.id);
        }
      } else {
        // No existing phases — create default
        const terms = (analysis as { paymentTerms?: { label: string; percentage: number; amount: number; condition?: string }[] }).paymentTerms;
        const phases = terms && terms.length > 0
          ? terms.map((t, i) => ({
              project_id: linkedProjectId,
              user_id: authUser.id,
              phase_number: i + 1,
              label: t.label + (t.condition ? ` — ${t.condition}` : ''),
              amount: t.amount || (total * t.percentage / 100),
              percentage: t.percentage,
              status: 'pending',
            }))
          : [
              { project_id: linkedProjectId, user_id: authUser.id, phase_number: 1, label: '第一期 — 签约订金 (30%)', amount: total * 0.3, percentage: 30, status: 'pending' },
              { project_id: linkedProjectId, user_id: authUser.id, phase_number: 2, label: '第二期 — 工程中期 (30%)', amount: total * 0.3, percentage: 30, status: 'pending' },
              { project_id: linkedProjectId, user_id: authUser.id, phase_number: 3, label: '第三期 — 接近完工 (30%)', amount: total * 0.3, percentage: 30, status: 'pending' },
              { project_id: linkedProjectId, user_id: authUser.id, phase_number: 4, label: '第四期 — 竣工尾款 (10%)', amount: total * 0.1, percentage: 10, status: 'pending' },
            ];
        await supabase.from('payment_phases').insert(phases);
      }

      // Smart merge Gantt: preserve existing progress, only extend durations for new scope
      await saveGanttFromAnalysis(linkedProjectId, analysis, authUser.id, true);

      setSavedProjectId(linkedProjectId);
      toast({ title: '✅ 已保存至项目', description: linkedProjectName });
      return linkedProjectId;
    } catch (err) {
      const msg = err instanceof Error ? err.message : (err as { message?: string })?.message || JSON.stringify(err);
      toast({ variant: 'destructive', title: '保存失败', description: msg });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  /* ─── Navigate to project Gantt after saving ──────────────────────────── */
  const handleGoToGantt = async () => {
    let pid = savedProjectId;
    if (!pid && linkedProjectId) {
      pid = await handleDirectSaveToProject();
    }
    if (pid) {
      router.push(`/designer/projects/${pid}?tab=gantt`);
    }
  };

  /* ─── Save to project ──────────────────────────────────────────────────── */
  const handleOpenSaveDialog = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) { toast({ variant: 'destructive', title: '请先登录' }); return; }
    // Query by both designer_id and user_id to catch all owned projects
    const { data } = await supabase.from('projects').select('id, name, status')
      .or(`designer_id.eq.${authUser.id},user_id.eq.${authUser.id}`)
      .order('updated_at', { ascending: false });
    const projects = data || [];
    setExistingProjects(projects);
    setNewProjectName(clientInfo?.company || fileName.replace(/\.(pdf|xlsx|xls|csv)$/i, '') || '新项目');
    // Default to existing project mode when projects exist
    setSaveMode(projects.length > 0 ? 'existing' : 'new');
    setSelectedProjectId('');
    setShowSaveDialog(true);
  };

  const handleSaveToProject = async () => {
    if (!analysis || !clientInfo) return;
    setIsSaving(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('请先登录');

      let projectId: string;

      if (saveMode === 'new') {
        const { data, error } = await supabase.from('projects').insert({
          designer_id: authUser.id,
          user_id: authUser.id,
          name: newProjectName || clientInfo.company || '新项目',
          address: clientInfo.address || '',
          client_name: clientInfo.attention || clientInfo.company || '',
          contract_amount: analysis.totalAmount,
          status: 'pending',
          progress: 0,
        }).select().single();
        if (error) throw error;
        projectId = data.id;
      } else {
        projectId = selectedProjectId;
        await supabase.from('projects').update({
          contract_amount: analysis.totalAmount,
          client_name: clientInfo.attention || clientInfo.company || '',
        }).eq('id', projectId);
      }

      // Deactivate old quotations, then insert new active one
      await supabase.from('project_quotations').update({ is_active: false }).eq('project_id', projectId);
      const { data: existingQvs } = await supabase.from('project_quotations').select('version').eq('project_id', projectId).order('version', { ascending: false }).limit(1);
      const nextVersion = existingQvs && existingQvs.length > 0 ? (existingQvs[0].version || 1) + 1 : 1;
      await supabase.from('project_quotations').insert({
        project_id: projectId,
        user_id: authUser.id,
        file_name: fileName,
        version: nextVersion,
        is_active: true,
        parsed_items: analysis.items,
        analysis_result: analysis,
        total_amount: analysis.totalAmount,
      });

      // For existing projects: update payment phases proportionally + smart merge Gantt
      const isExisting = saveMode === 'existing';
      if (isExisting) {
        const total = analysis.totalAmount;
        const { data: existingPayPhases } = await supabase
          .from('payment_phases').select('*').eq('project_id', projectId).order('phase_number');
        if (existingPayPhases && existingPayPhases.length > 0) {
          for (const phase of existingPayPhases) {
            const pct = phase.percentage || 25;
            await supabase.from('payment_phases').update({ amount: total * pct / 100 }).eq('id', phase.id);
          }
        }
      }

      // Smart merge for existing projects, full replace for new
      await saveGanttFromAnalysis(projectId, analysis, authUser.id, isExisting);

      setSavedProjectId(projectId);
      setShowSaveDialog(false);
      toast({ title: '✅ 已保存至项目', description: saveMode === 'new' ? `新项目: ${newProjectName}` : '已更新现有项目' });
      // Auto-navigate to the project detail page
      router.push(`/designer/projects/${projectId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : (err as { message?: string })?.message || JSON.stringify(err);
      toast({ variant: 'destructive', title: '保存失败', description: msg });
    } finally {
      setIsSaving(false);
    }
  };

  /* ─── Export PDF ───────────────────────────────────────────────────────── */
  const handleExportPDF = () => {
    if (!analysis) return;
    const criticals = analysis.alerts.filter(a => a.level === 'critical');
    const warnings  = analysis.alerts.filter(a => a.level === 'warning' && !isFalsePositiveAlert(a));
    const infos     = analysis.alerts.filter(a => a.level === 'info');

    // Use blended scores from scoreBreakdown when available, otherwise fall back to AI scores
    const totalScore        = scoreBreakdown ? scoreBreakdown.total                         : analysis.score.total;
    const completenessScore = scoreBreakdown ? scoreBreakdown.completeness.blendedScore     : analysis.score.completeness;
    const priceScore        = scoreBreakdown ? scoreBreakdown.price.blendedScore            : analysis.score.price;
    const logicScore        = scoreBreakdown ? scoreBreakdown.logic.blendedScore            : analysis.score.logic;
    const riskScore         = scoreBreakdown ? scoreBreakdown.risk.blendedScore             : analysis.score.risk;

    // Score detail lines (e.g. "AI: 75 | Data: 80 | 数据库 5项 + AI估算 3项")
    const scoreDetailRow = (label: string, blended: number, dim?: DimensionBreakdown) =>
      `<tr>
        <td>${label}</td>
        <td style="text-align:center"><b>${blended}</b>/100</td>
        <td style="text-align:center">${blended >= 75 ? '✓ 良好' : blended >= 50 ? '⚠ 一般' : '✗ 偏低'}</td>
        <td style="font-size:11px;color:#6B7A94">${dim ? `AI ${dim.aiScore} · 数据 ${dim.dataScore} · ${dim.detail}` : ''}</td>
      </tr>`;

    // Price flags from score calculator (only data-sourced, not ai_status)
    const priceFlags = (scoreBreakdown?.priceComparisons ?? []).filter(
      c => c.source !== 'ai_status' && c.source !== 'ai_estimate' && (c.verdict === 'flag_high' || c.verdict === 'flag_low' || c.verdict === 'warn_high'),
    );

    // Missing items — prefer missingCritical (with urgency/reason/cost) over plain missing
    const hasMissingCritical = (analysis.missingCritical ?? []).length > 0;
    const missingHtml = hasMissingCritical
      ? (analysis.missingCritical ?? []).map(m =>
          `<div class="missing-card ${m.urgency === 'critical' ? 'miss-critical' : 'miss-warn'}">
            <div class="miss-title">${m.urgency === 'critical' ? '✗' : '⚠'} ${m.item}</div>
            ${m.reason ? `<div class="miss-reason">${m.reason}</div>` : ''}
            ${m.estimatedCost ? `<div class="miss-cost">预估费用：${m.estimatedCost}</div>` : ''}
          </div>`
        ).join('')
      : analysis.missing.map(m => `<div class="missing-card miss-warn"><div class="miss-title">⚠ ${m}</div></div>`).join('');

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
<!DOCTYPE html><html lang="zh"><head><meta charset="UTF-8">
<title>AI 完整审核报告 — ${fileName}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif; padding: 40px; color: #1B2336; line-height: 1.6; font-size: 13px; }
  h1 { font-size: 22px; font-weight: 800; margin-bottom: 4px; }
  h2 { font-size: 15px; font-weight: 700; color: #4F8EF7; margin: 28px 0 10px; border-bottom: 2px solid #4F8EF7; padding-bottom: 6px; }
  .meta { color: #6B7A94; font-size: 12px; margin-bottom: 28px; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 24px; margin-bottom: 20px; }
  .field { padding: 7px 0; border-bottom: 1px solid #E4E7F0; }
  .label { font-size: 10px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.5px; }
  .value { font-size: 13px; font-weight: 600; margin-top: 1px; }
  /* Score */
  .score-header { display: flex; gap: 20px; align-items: center; background: #F8F9FB; border-radius: 12px; padding: 16px 20px; margin-bottom: 12px; }
  .score-circle { width: 72px; height: 72px; border-radius: 50%; border: 3px solid #F0B90B; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(240,185,11,0.08); flex-shrink: 0; }
  .score-num { font-size: 26px; font-weight: 800; line-height: 1; }
  .score-sub { font-size: 9px; color: #9CA3AF; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 16px; }
  th { background: #F0F2F7; padding: 8px 10px; text-align: left; border: 1px solid #E4E7F0; font-size: 11px; color: #6B7A94; font-weight: 600; }
  td { padding: 7px 10px; border: 1px solid #E4E7F0; vertical-align: top; }
  .total-row td { background: rgba(79,142,247,0.08); font-weight: 700; font-size: 13px; }
  /* Alerts */
  .alert { padding: 10px 14px; border-radius: 8px; margin-bottom: 8px; }
  .critical { background: rgba(229,57,53,0.07); border-left: 3px solid #E53935; }
  .warning  { background: rgba(249,115,22,0.07); border-left: 3px solid #F97316; }
  .info     { background: rgba(46,107,230,0.07); border-left: 3px solid #2E6BE6; }
  .alert-title { font-weight: 700; font-size: 13px; margin-bottom: 2px; }
  .alert-desc  { font-size: 12px; color: #3D4A60; }
  /* Missing */
  .missing-card { border-radius: 8px; padding: 10px 14px; margin-bottom: 8px; }
  .miss-critical { background: rgba(229,57,53,0.07); border-left: 3px solid #E53935; }
  .miss-warn { background: rgba(249,115,22,0.07); border-left: 3px solid #F97316; }
  .miss-title { font-weight: 700; font-size: 13px; }
  .miss-reason { font-size: 12px; color: #6B7A94; margin-top: 3px; }
  .miss-cost { font-size: 12px; font-weight: 700; color: #E53935; margin-top: 3px; }
  /* Price flags */
  .flag-high { color: #E53935; font-weight: 700; }
  .flag-low  { color: #2E6BE6; font-weight: 700; }
  .warn-high { color: #F97316; }
  /* Summary box */
  .summary-box { background: #F8F9FB; border-radius: 10px; padding: 12px 16px; font-size: 13px; color: #3D4A60; margin-bottom: 20px; line-height: 1.7; }
  @media print { body { padding: 20px; } h2 { page-break-before: auto; } }
</style></head><body>

<h1>AI 完整审核报告</h1>
<div class="meta">${fileName} &nbsp;·&nbsp; ${analysis.items.length} 项工程 &nbsp;·&nbsp; ${fmtCurrency(analysis.totalAmount)} &nbsp;·&nbsp; 生成于 ${new Date().toLocaleString('zh-MY')}</div>

<h2>客户资料</h2>
<div class="grid2">
  <div class="field"><div class="label">公司 / 业主</div><div class="value">${analysis.client.company || '—'}</div></div>
  <div class="field"><div class="label">联系人</div><div class="value">${analysis.client.attention || '—'}</div></div>
  <div class="field"><div class="label">电话</div><div class="value">${analysis.client.tel || '—'}</div></div>
  <div class="field"><div class="label">邮箱</div><div class="value">${analysis.client.email || '—'}</div></div>
  <div class="field" style="grid-column:1/-1"><div class="label">地址</div><div class="value">${analysis.client.address || '—'}</div></div>
  <div class="field"><div class="label">报价单编号</div><div class="value">${analysis.client.projectRef || '—'}</div></div>
</div>

<h2>AI 审核评分</h2>
<div class="score-header">
  <div class="score-circle">
    <div class="score-num" style="color:${totalScore >= 80 ? '#16A34A' : totalScore >= 60 ? '#F0B90B' : '#E53935'}">${totalScore}</div>
    <div class="score-sub">/ 100</div>
  </div>
  <div style="flex:1">
    <table style="margin:0">
      <thead><tr><th>维度</th><th style="text-align:center">分数</th><th style="text-align:center">评级</th><th>数据来源</th></tr></thead>
      <tbody>
        ${scoreDetailRow('项目完整性', completenessScore, scoreBreakdown?.completeness)}
        ${scoreDetailRow('单价合理性', priceScore,        scoreBreakdown?.price)}
        ${scoreDetailRow('工序逻辑性', logicScore,        scoreBreakdown?.logic)}
        ${scoreDetailRow('漏项风险',   riskScore,         scoreBreakdown?.risk)}
      </tbody>
    </table>
  </div>
</div>

${analysis.summary ? `<div class="summary-box">🤖 <strong>{t.quotation.aiSummary}:</strong>${analysis.summary}</div>` : ''}

${(hasMissingCritical || analysis.missing.length > 0) ? `
<h2>📋 关键缺失项目 (${hasMissingCritical ? (analysis.missingCritical?.length ?? 0) : analysis.missing.length} 项)</h2>
${missingHtml}` : ''}

${priceFlags.length > 0 ? `
<h2>价格异常项目 (${priceFlags.length} 项)</h2>
<table><thead><tr><th>#</th><th>工程描述</th><th style="text-align:right">报价单价</th><th style="text-align:right">市场区间</th><th>来源</th><th>结论</th></tr></thead><tbody>
${priceFlags.map((c, i) => {
  const verdictLabel = c.verdict === 'flag_high' ? '<span class="flag-high">严重偏高</span>' : c.verdict === 'flag_low' ? '<span class="flag-low">严重偏低</span>' : '<span class="warn-high">偏高注意</span>';
  const range = c.dbMin != null && c.dbMax != null ? `${c.dbMin.toFixed(0)} – ${c.dbMax.toFixed(0)}` : '—';
  return `<tr><td>${i+1}</td><td>${c.itemName}</td><td style="text-align:right">${c.quotedPrice.toFixed(2)}</td><td style="text-align:right">${range}</td><td>${c.source === 'database' ? '数据库' : c.source === 'known_range' ? '已知区间' : 'AI估算'}</td><td>${verdictLabel}</td></tr>`;
}).join('')}
</tbody></table>` : ''}

${criticals.length > 0 ? `<h2>🔴 严重问题（需立即处理）</h2>${criticals.map(a => `<div class="alert critical"><div class="alert-title">${a.title}</div><div class="alert-desc">${a.desc}</div></div>`).join('')}` : ''}
${warnings.length > 0 ? `<h2>🟡 警告（建议确认）</h2>${warnings.map(a => `<div class="alert warning"><div class="alert-title">${a.title}</div><div class="alert-desc">${a.desc}</div></div>`).join('')}` : ''}
${infos.length > 0 ? `<h2>💡 提示（可选考虑）</h2>${infos.map(a => `<div class="alert info"><div class="alert-title">${a.title}</div><div class="alert-desc">${a.desc}</div></div>`).join('')}` : ''}

<h2>报价工程项目 (${analysis.items.length} 项)</h2>
<table><thead><tr><th>#</th><th>工程描述</th><th>类型</th><th>单位</th><th style="text-align:right">数量</th><th style="text-align:right">单价</th><th style="text-align:right">金额</th><th>状态</th></tr></thead>
<tbody>
${analysis.items.map(item => `<tr><td>${item.no}</td><td><div style="font-size:10px;color:#9CA3AF">${item.section||''}</div>${item.name}</td><td><span style="font-size:10px;color:#6B7A94">${item.supplyType === 'labour_only' ? 'Labour' : item.supplyType === 'supply_only' ? 'Supply' : 'S&I'}</span></td><td>${item.unit}</td><td style="text-align:right">${item.qty}</td><td style="text-align:right">${item.unitPrice.toFixed(2)}${item.unitPriceDerived ? '*' : ''}</td><td style="text-align:right;font-weight:600">${fmtCurrency(item.total)}</td><td style="white-space:nowrap">${STATUS_CONFIG[item.status].label}${item.note ? '<br><span style="font-size:10px;color:#6B7A94">'+item.note+'</span>' : ''}</td></tr>`).join('')}
</tbody>
${analysis.subtotals.map(s => `<tfoot><tr><td colspan="6" style="text-align:right;font-weight:600">${s.label}</td><td style="text-align:right;font-weight:700">${fmtCurrency(s.amount)}</td><td></td></tr></tfoot>`).join('')}
<tfoot><tr class="total-row"><td colspan="6" style="text-align:right">报价总额</td><td style="text-align:right;color:#4F8EF7">${fmtCurrency(analysis.totalAmount)}</td><td></td></tr></tfoot></table>

<div style="margin-top:40px;padding-top:16px;border-top:1px solid #E4E7F0;font-size:11px;color:#9CA3AF">
  * 单价标 * 表示由「总价 ÷ 数量（尺寸）」计算得出，非原始报价直接提供<br>
  Generated by RenoSmart AI · Based on MY/SG 2025 market data
</div>
<script>window.print(); setTimeout(() => window.close(), 1000);</script>
</body></html>`);
    win.document.close();
  };

  const isLoading = step === 'extracting' || step === 'analyzing';

  /* ─── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <Toaster />

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="px-8 py-5 border-b border-rs-border bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-[22px] font-semibold text-rs-text">Upload Quotation</h1>
            <p className="text-[13px] text-rs-text3 mt-0.5">
              Supports Excel (.xlsx/.xls), CSV, PDF · <span className="text-[#2E6BE6]">AI reads and auto-reviews content</span>
            </p>
          </div>
          {linkedProjectId && linkedProjectName && (
            <div className="ml-4 flex items-center gap-2 px-3 py-1.5 bg-[rgba(79,142,247,0.1)] border border-[rgba(79,142,247,0.3)] rounded-xl">
              <div className="w-2 h-2 rounded-full bg-[#4F8EF7] animate-pulse" />
              <span className="text-[12px] font-semibold text-rs-text">{linkedProjectName}</span>
              <span className="text-[11px] text-rs-text3">· 上传后将自动关联此项目</span>
            </div>
          )}
        </div>
        {linkedProjectId && (
          <div className="flex items-center gap-2 mt-3">
            {[
              { step: 1, label: '新建项目', done: true },
              { step: 2, label: '上传报价单', active: true },
              { step: 3, label: 'AI 分析审核', active: false },
              { step: 4, label: '生成 Gantt 图', active: false },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                  s.done ? 'bg-green-500 text-white' : s.active ? 'bg-[#4F8EF7] text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                  {s.done ? '✓' : s.step}
                </div>
                <span className={`text-[11px] font-semibold ${s.done ? 'text-green-600' : s.active ? 'text-[#4F8EF7]' : 'text-gray-400'}`}>{s.label}</span>
                {i < 3 && <div className="w-6 h-px bg-gray-200 mx-0.5" />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Scrollable content ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 md:py-6 space-y-5" style={{ paddingBottom: analysis ? 80 : 24 }}>

        {/* Upload zone — shown when idle or loading (no results yet) */}
        {!analysis && (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => !isLoading && fileInputRef.current?.click()}
            className={`relative rounded-xl border-2 border-dashed p-12 text-center transition-all cursor-pointer bg-white
              ${isDragging ? 'border-[#4F8EF7] bg-[rgba(79,142,247,0.04)] scale-[1.01]' : 'border-[rgba(79,142,247,0.2)] hover:border-[#4F8EF7] hover:bg-[rgba(79,142,247,0.04)]'}
              ${isLoading ? 'pointer-events-none' : ''}`}
          >
            <input ref={fileInputRef} type="file" accept=".pdf,.xlsx,.xls,.csv,.txt" className="hidden" onChange={handleFileSelect} />

            {!isLoading && step !== 'error' ? (
              <>
                <div className="text-5xl mb-4">📄</div>
                <p className="text-[15px] text-rs-text2 mb-1">
                  Drop your quotation file here or <strong className="text-[#4F8EF7]">click to browse</strong>
                </p>
                <p className="text-[12px] text-[#9CA3AF]">PDF, Excel (.xlsx/.xls), CSV · Max 50MB</p>
              </>
            ) : isLoading ? (
              <div className="max-w-md mx-auto py-4">
                {/* File info pill */}
                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-gradient-to-r from-[rgba(79,142,247,0.08)] to-[rgba(139,92,246,0.08)] border border-[rgba(79,142,247,0.15)] mb-8">
                  <FileText className="w-4 h-4 text-[#4F8EF7]" />
                  <span className="text-sm font-medium text-rs-text">{fileName}</span>
                  <span className="text-xs text-rs-text3">{fileSize}</span>
                </div>
                {/* Animated orbital loader */}
                <div className="relative w-28 h-28 mx-auto mb-8">
                  <div className="absolute inset-0 rounded-full animate-[spin_3s_linear_infinite]" style={{ background: 'conic-gradient(from 0deg, transparent 0%, #4F8EF7 25%, #8B5CF6 50%, #EC4899 75%, transparent 100%)', padding: 2 }}>
                    <div className="w-full h-full rounded-full bg-white" />
                  </div>
                  <div className="absolute inset-3 rounded-full bg-gradient-to-br from-[rgba(79,142,247,0.12)] to-[rgba(139,92,246,0.12)] animate-pulse" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    {step === 'extracting' ? (
                      <FileText className="w-8 h-8 text-[#4F8EF7] animate-bounce" style={{ animationDuration: '1.5s' }} />
                    ) : (
                      <svg className="w-8 h-8 animate-pulse" viewBox="0 0 24 24" fill="none" style={{ animationDuration: '2s' }}>
                        <path d="M12 2L2 7l10 5 10-5-10-5z" fill="url(#ai-grad)" opacity="0.9" />
                        <path d="M2 17l10 5 10-5" stroke="url(#ai-grad)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                        <path d="M2 12l10 5 10-5" stroke="url(#ai-grad)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                        <defs><linearGradient id="ai-grad" x1="2" y1="2" x2="22" y2="22"><stop stopColor="#4F8EF7" /><stop offset="1" stopColor="#8B5CF6" /></linearGradient></defs>
                      </svg>
                    )}
                  </div>
                </div>
                {/* Step indicators */}
                <div className="flex items-center justify-center gap-3 mb-6">
                  {[
                    { key: 'extract', label: t.quotation.reading, threshold: 0 },
                    { key: 'parse', label: t.quotation.parsing, threshold: 40 },
                    { key: 'ai', label: t.quotation.aiReview, threshold: 60 },
                  ].map((s, i) => {
                    const active = progress >= s.threshold;
                    const done = progress >= [40, 60, 100][i];
                    return (
                      <div key={s.key} className="flex items-center gap-2">
                        {i > 0 && <div className={`w-6 h-px transition-colors duration-500 ${active ? 'bg-[#4F8EF7]' : 'bg-gray-200'}`} />}
                        <div className="flex items-center gap-1.5">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-all duration-500 ${done ? 'bg-[#4F8EF7] text-white scale-100' : active ? 'bg-[#4F8EF7]/15 text-[#4F8EF7] animate-pulse' : 'bg-gray-100 text-gray-400'}`}>
                            {done ? '✓' : i + 1}
                          </div>
                          <span className={`text-xs font-medium transition-colors duration-500 ${active ? 'text-rs-text' : 'text-gray-300'}`}>{s.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Gradient progress bar */}
                <div className="relative h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                  <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #4F8EF7, #8B5CF6, #EC4899)' }} />
                  <div className="absolute inset-0 overflow-hidden rounded-full">
                    <div className="h-full w-1/3 animate-[shimmer_1.5s_ease-in-out_infinite]" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }} />
                  </div>
                </div>
                {/* Status text */}
                <p className="text-sm text-rs-text2 font-medium">{progressLabel}</p>
                <p className="text-xs text-rs-text3 mt-1">
                  {step === 'extracting' ? t.quotation.identifyingFormat : t.quotation.analyzingPrices}
                </p>
                {step === 'analyzing' && (
                  <p className="text-[11px] text-rs-text3/60 mt-2">
                    {t.quotation.waitMinutes}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <XCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                <p className="text-rs-red font-medium">{progressLabel}</p>
                <p className="text-[13px] text-rs-text3 mt-1">Click to try again</p>
              </div>
            )}
          </div>
        )}

        {/* ── Results ─────────────────────────────────────────────────────── */}
        {analysis && (
          <>
            {/* File banner */}
            <div className="bg-white border border-rs-surface3 rounded-xl px-5 py-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[rgba(79,142,247,0.1)] flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-[#4F8EF7]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-rs-text text-[14px] truncate">{fileName}</p>
                <p className="text-[12px] text-rs-text3">
                  已识别 <span className="text-rs-text font-semibold">{analysis.items.length}</span> 填工程 &nbsp;·&nbsp;
                  <span className="text-[#4F8EF7] font-semibold">{fmtCurrency(analysis.totalAmount)}</span>
                </p>
              </div>
              {savedProjectId && (
                <a href={`/designer/projects/${savedProjectId}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded-lg text-[12px] font-medium hover:bg-green-100 transition-colors mr-2">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 查看项目
                </a>
              )}
              <button
                onClick={() => { clearAllState(); fileInputRef.current?.click(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-[12px] font-medium hover:bg-gray-200 transition-colors flex-shrink-0">
                <RefreshCw className="w-3.5 h-3.5" /> Re-upload
              </button>
              <input ref={fileInputRef} type="file" accept=".pdf,.xlsx,.xls,.csv,.txt" className="hidden" onChange={handleFileSelect} />
            </div>

            {/* Client info (editable) */}
            <div className="bg-white border border-rs-surface3 rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[#F0F2F7] bg-gradient-to-r from-[rgba(46,107,230,0.04)] to-transparent flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[#2E6BE6]" />
                  <span className="text-[13px] font-semibold text-rs-text">已自动识别客户资料</span>
                  <span className="text-[12px] text-rs-text3">· 可直接编辑保存</span>
                </div>
                {savedProjectId ? (
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg text-[12px] font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 已保存至项目
                    </span>
                    <button
                      onClick={handleGoToGantt}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4F8EF7] text-white rounded-lg text-[12px] font-bold hover:bg-[#4F8EF7]-hover transition-colors"
                    >
                      生成工程进度 <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    className="bg-[#4F8EF7] hover:bg-[#3B7BE8] text-white font-semibold text-[12px] gap-1.5 h-8"
                    onClick={linkedProjectId ? handleDirectSaveToProject : handleOpenSaveDialog}
                    disabled={isSaving}
                  >
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    {linkedProjectId
                      ? (isSaving ? '保存中...' : `✓ 保存至 ${linkedProjectName || '项目'}`)
                      : '✓ 保存至项目客户档案'}
                  </Button>
                )}
              </div>
              {clientInfo && (
                <div className="p-5">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-[11px] text-rs-text3 mb-1 block font-medium">公司</label>
                      <Input value={clientInfo.company || ''} onChange={e => setClientInfo(p => p ? { ...p, company: e.target.value } : p)}
                        className="h-8 text-[13px] border-rs-surface3" placeholder="公司名称" />
                    </div>
                    <div>
                      <label className="text-[11px] text-rs-text3 mb-1 block font-medium">联系人</label>
                      <Input value={clientInfo.attention || ''} onChange={e => setClientInfo(p => p ? { ...p, attention: e.target.value } : p)}
                        className="h-8 text-[13px] border-rs-surface3" placeholder="联系人姓名" />
                    </div>
                    <div>
                      <label className="text-[11px] text-rs-text3 mb-1 block font-medium">电话</label>
                      <Input value={clientInfo.tel || ''} onChange={e => setClientInfo(p => p ? { ...p, tel: e.target.value } : p)}
                        className="h-8 text-[13px] border-rs-surface3" placeholder="+60xx-xxx xxxx" />
                    </div>
                    <div>
                      <label className="text-[11px] text-rs-text3 mb-1 block font-medium">邮箱</label>
                      <Input value={clientInfo.email || ''} onChange={e => setClientInfo(p => p ? { ...p, email: e.target.value } : p)}
                        className="h-8 text-[13px] border-rs-surface3" placeholder="email@example.com" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[11px] text-rs-text3 mb-1 block font-medium">地址</label>
                      <Input value={clientInfo.address || ''} onChange={e => setClientInfo(p => p ? { ...p, address: e.target.value } : p)}
                        className="h-8 text-[13px] border-rs-surface3" placeholder="完整地址" />
                    </div>
                    <div>
                      <label className="text-[11px] text-rs-text3 mb-1 block font-medium">报价单编号</label>
                      <Input value={clientInfo.projectRef || ''} onChange={e => setClientInfo(p => p ? { ...p, projectRef: e.target.value } : p)}
                        className="h-8 text-[13px] border-rs-surface3" placeholder="QUO-YYYY/MM/DD" />
                    </div>
                  </div>
                  <p className="text-[11px] text-[#9CA3AF]">
                    📝 资料已从报价单自动抽取，可直接修改后保存，点击「保存至项目客户档案」即可更新
                  </p>
                </div>
              )}
            </div>

            {/* AI Review */}
            <div className="bg-white border border-rs-surface3 rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[#F0F2F7] bg-gradient-to-r from-[rgba(79,142,247,0.06)] to-transparent flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-[#4F8EF7] text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wider">AI REVIEW</span>
                  <span className="text-[14px] font-semibold text-rs-text">Overall Score &amp; Risk Assessment</span>
                </div>
                <span className="text-[11px] text-[#9CA3AF]">Based on MY/SG 2025 market data</span>
              </div>
              <div className="p-5">
                <div className="flex items-start gap-6 mb-4">
                  <ScoreCircle score={analysis.score.total} />
                  <div className="flex-1 space-y-2 pt-1">
                    <ScoreBar label={t.quotation.scoreCompleteness} value={analysis.score.completeness} color="#F97316" breakdown={scoreBreakdown?.completeness} />
                    <ScoreBar label={t.quotation.scorePrice} value={analysis.score.price} color="#16A34A" breakdown={scoreBreakdown?.price} />
                    <ScoreBar label={t.quotation.scoreLogic} value={analysis.score.logic} color="#16A34A" breakdown={scoreBreakdown?.logic} />
                    <ScoreBar label={t.quotation.scoreRisk} value={analysis.score.risk} color="#E53935" breakdown={scoreBreakdown?.risk} />
                  </div>
                </div>
                {scoreBreakdown && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded">
                      {t.quotation.dataSupport}
                    </span>
                    <span className="text-[11px] text-rs-text3">
                      {scoreBreakdown.dbMatchCount > 0 && <span className="text-green-600 font-medium">{scoreBreakdown.dbMatchCount} DB</span>}
                      {scoreBreakdown.dbMatchCount > 0 && scoreBreakdown.aiEstimateCount > 0 && ' + '}
                      {scoreBreakdown.aiEstimateCount > 0 && <span className="text-blue-600 font-medium">{scoreBreakdown.aiEstimateCount} {t.quotation.aiEstimate}</span>}
                      {(scoreBreakdown.dbMatchCount > 0 || scoreBreakdown.aiEstimateCount > 0) && ' / '}
                      {scoreBreakdown.dbMatchTotal} items
                    </span>
                  </div>
                )}
                {analysis.summary && (
                  <div className="bg-[#F8F9FB] rounded-xl px-4 py-3 text-[13px] text-rs-text2 leading-relaxed border border-rs-surface3">
                    <span className="text-base mr-1.5">🤖</span>
                    <strong className="text-rs-text">AI 总结：</strong>{analysis.summary}
                  </div>
                )}
              </div>
            </div>

            {/* AI QS Audit Summary — 3 columns */}
            {(analysis.missing.length > 0 || analysis.alerts.length > 0 || scoreBreakdown) && (
              <div className="bg-white border border-rs-surface3 rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-[#F0F2F7] bg-gradient-to-r from-[rgba(233,30,99,0.04)] to-transparent flex items-center gap-2">
                  <span className="text-base">🔍</span>
                  <span className="text-[14px] font-bold text-rs-text tracking-wide">AI QS AUDIT SUMMARY</span>
                  <span className="text-[11px] text-rs-text3 ml-2">Powered by price_database + AI</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#F0F2F7]">
                  {/* Column 1: Missing Items */}
                  {(() => {
                    const mc = analysis.missingCritical ?? [];
                    const allItems = mc.length > 0 ? mc : analysis.missing.map(m => ({ item: m, reason: '', estimatedCost: '', urgency: 'critical' as const }));
                    const visible = expandMissing ? allItems : allItems.slice(0, 5);
                    return (
                      <div className="p-4 flex flex-col">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                          <span className="text-[12px] font-bold text-red-600 tracking-wide">MISSING ITEMS</span>
                          <span className="bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{allItems.length}</span>
                        </div>
                        {allItems.length > 0 ? (
                          <>
                            <div className="space-y-2">
                              {visible.map((m, i) => (
                                <div key={i} className={`rounded-lg p-3 ${'urgency' in m && m.urgency === 'critical' ? 'bg-red-50 border border-red-100' : 'bg-amber-50 border border-amber-100'}`}>
                                  <div className={`text-[12px] font-semibold flex items-start gap-1.5 ${'urgency' in m && m.urgency === 'critical' ? 'text-red-700' : 'text-amber-700'}`}>
                                    <span className="flex-shrink-0">{'urgency' in m && m.urgency === 'critical' ? '✗' : '⚠'}</span>
                                    <span>{m.item}</span>
                                  </div>
                                  {m.reason && <div className="text-[11px] text-gray-500 mt-1 leading-relaxed">{m.reason}</div>}
                                  {m.estimatedCost && <div className="text-[11px] font-semibold text-red-600 mt-1">Est. {m.estimatedCost}</div>}
                                </div>
                              ))}
                            </div>
                            {allItems.length > 5 && (
                              <button onClick={() => setExpandMissing(v => !v)} className="mt-2 text-[11px] text-red-500 hover:text-red-700 font-medium self-start">
                                {expandMissing ? '▲ 收起' : `▼ 展开全部 (${allItems.length})`}
                              </button>
                            )}
                          </>
                        ) : (
                          <p className="text-[12px] text-green-600">✓ No missing items detected</p>
                        )}
                      </div>
                    );
                  })()}

                  {/* Column 2: Price Flags — scoreBreakdown only, no AI alerts */}
                  {(() => {
                    const flagged = (scoreBreakdown?.priceComparisons ?? [])
                      .filter(c => (c.verdict === 'flag_high' || c.verdict === 'flag_low' || c.verdict === 'warn_high') && c.source !== 'ai_status');
                    const visible = expandFlags ? flagged : flagged.slice(0, 5);
                    return (
                      <div className="p-4 flex flex-col">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          <span className="text-[12px] font-bold text-amber-600 tracking-wide">PRICE FLAGS</span>
                          <span className="bg-amber-100 text-amber-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{flagged.length}</span>
                        </div>
                        {flagged.length > 0 ? (
                          <>
                            <div className="space-y-2">
                              {visible.map((comp, i) => {
                                const item = analysis.items[comp.itemIndex];
                                if (!item) return null;
                                const isHigh = comp.verdict === 'flag_high' || comp.verdict === 'warn_high';
                                const pct = comp.deviation != null ? Math.abs(Math.round(comp.deviation * 100)) : null;
                                const marketRange = comp.dbMin != null && comp.dbMax != null
                                  ? `${currency} ${comp.dbMin.toFixed(0)}-${comp.dbMax.toFixed(0)}`
                                  : comp.aiEstMin != null && comp.aiEstMax != null
                                    ? `${currency} ${comp.aiEstMin.toFixed(0)}-${comp.aiEstMax.toFixed(0)}`
                                    : null;
                                return (
                                  <div key={i} className={`rounded-lg p-3 ${comp.verdict === 'flag_high' ? 'bg-red-50 border border-red-100' : 'bg-amber-50 border border-amber-100'}`}>
                                    <div className="text-[12px] font-semibold text-gray-800 leading-snug">{item.name}</div>
                                    <div className="text-[11px] text-gray-500 mt-1">Quoted: {currency} {(item.unitPrice ?? 0).toFixed(2)}/{item.unit || 'unit'}</div>
                                    {marketRange && <div className="text-[11px] text-gray-500">Market: {marketRange}/{item.unit || 'unit'}</div>}
                                    {pct != null && (
                                      <div className={`text-[11px] font-semibold mt-1 ${isHigh ? 'text-red-500' : 'text-blue-500'}`}>
                                        {isHigh ? '▲' : '▼'} {isHigh ? 'Above' : 'Below'} {pct}%
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            {flagged.length > 5 && (
                              <button onClick={() => setExpandFlags(v => !v)} className="mt-2 text-[11px] text-amber-600 hover:text-amber-800 font-medium self-start">
                                {expandFlags ? '▲ 收起' : `▼ 展开全部 (${flagged.length})`}
                              </button>
                            )}
                          </>
                        ) : (
                          <p className="text-[12px] text-green-600">✓ No price anomalies detected</p>
                        )}
                      </div>
                    );
                  })()}

                  {/* Column 3: SUGGESTIONS — info-level tips only, NO pricing anomaly (those belong in PRICE FLAGS) */}
                  {(() => {
                    const tips = groupAlertsByTitle(analysis.alerts.filter(a => a.level === 'info' && !/pric(e|ing)\s*anomal/i.test(a.title ?? '')));
                    const visible = expandTips ? tips : tips.slice(0, 5);
                    return (
                      <div className="p-4 flex flex-col">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          <span className="text-[12px] font-bold text-blue-600 tracking-wide">SUGGESTIONS</span>
                          <span className="bg-blue-100 text-blue-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{tips.length}</span>
                        </div>
                        {tips.length > 0 ? (
                          <>
                            <div className="space-y-2">
                              {visible.map((alert, i) => (
                                <div key={i} className="rounded-lg p-3 bg-blue-50 border border-blue-100">
                                  <div className="text-[12px] font-semibold text-blue-700">💡 {alert.title}</div>
                                  <div className="text-[11px] text-gray-500 mt-1 leading-relaxed whitespace-pre-line">{alert.desc}</div>
                                </div>
                              ))}
                            </div>
                            {tips.length > 5 && (
                              <button onClick={() => setExpandTips(v => !v)} className="mt-2 text-[11px] text-blue-500 hover:text-blue-700 font-medium self-start">
                                {expandTips ? '▲ 收起' : `▼ 展开全部 (${tips.length})`}
                              </button>
                            )}
                          </>
                        ) : (
                          <p className="text-[12px] text-green-600">✓ 没有额外提示</p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Work Items */}
            <div className="bg-white border border-rs-surface3 rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[#F0F2F7] flex items-center justify-between">
                <span className="text-[14px] font-semibold text-rs-text">Identified Work Items</span>
                <span className="text-[12px] text-rs-text3">共 {analysis.items.length} 项</span>
              </div>

              {/* Filter tabs: Section / Page toggle + pills */}
              {(sections.length > 1 || pages.length > 1) && (
                <div className="px-5 py-2.5 border-b border-[#F0F2F7]">
                  {/* Mode toggle */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex bg-gray-100 rounded-lg p-0.5">
                      <button onClick={() => { setFilterMode('section'); setActivePage('all'); }}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${filterMode === 'section' ? 'bg-white text-[#F0B90B] shadow-sm' : 'text-gray-500'}`}>
                        {t.quotation.bySection}
                      </button>
                      {pages.length > 1 && (
                        <button onClick={() => { setFilterMode('page'); setActiveSection('all'); }}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${filterMode === 'page' ? 'bg-white text-[#F0B90B] shadow-sm' : 'text-gray-500'}`}>
                          {t.quotation.byPage}
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Section pills — reference q-page-tab style */}
                  {filterMode === 'section' && (
                    <div className="flex gap-1.5 flex-wrap">
                      <button onClick={() => setActiveSection('all')}
                        style={activeSection === 'all' ? { background: 'rgba(240,185,11,.15)', borderColor: '#F0B90B', color: '#F0B90B' } : {}}
                        className={`px-3.5 py-1 rounded-full text-[11px] font-semibold border transition-all whitespace-nowrap ${activeSection === 'all' ? 'border-[#F0B90B]' : 'border-[#E4E7F0] bg-[#F7F8FA] text-[#6B7A94] hover:border-[#F0B90B] hover:text-[#F0B90B]'}`}>
                        全部 <span style={{ opacity: .6, fontWeight: 400, marginLeft: 4 }}>{analysis.items.length}</span>
                      </button>
                      {sections.map(({ name, count }) => (
                        <button key={name} onClick={() => setActiveSection(name)}
                          style={activeSection === name ? { background: 'rgba(240,185,11,.15)', borderColor: '#F0B90B', color: '#F0B90B' } : {}}
                          className={`px-3.5 py-1 rounded-full text-[11px] font-semibold border transition-all whitespace-nowrap ${activeSection === name ? 'border-[#F0B90B]' : 'border-[#E4E7F0] bg-[#F7F8FA] text-[#6B7A94] hover:border-[#F0B90B] hover:text-[#F0B90B]'}`}>
                          {name} <span style={{ opacity: .6, fontWeight: 400, marginLeft: 4 }}>{count}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {/* Page pills */}
                  {filterMode === 'page' && (
                    <div className="flex gap-1.5 flex-wrap">
                      <button onClick={() => setActivePage('all')}
                        style={activePage === 'all' ? { background: 'rgba(240,185,11,.15)', borderColor: '#F0B90B', color: '#F0B90B' } : {}}
                        className={`px-3.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${activePage === 'all' ? 'border-[#F0B90B]' : 'border-[#E4E7F0] bg-[#F7F8FA] text-[#6B7A94] hover:border-[#F0B90B] hover:text-[#F0B90B]'}`}>
                        全部 <span style={{ opacity: .6, fontWeight: 400, marginLeft: 4 }}>{analysis.items.length}</span>
                      </button>
                      {pages.map(({ page, count }) => (
                        <button key={page} onClick={() => setActivePage(page)}
                          style={activePage === page ? { background: 'rgba(240,185,11,.15)', borderColor: '#F0B90B', color: '#F0B90B' } : {}}
                          className={`px-3.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${activePage === page ? 'border-[#F0B90B]' : 'border-[#E4E7F0] bg-[#F7F8FA] text-[#6B7A94] hover:border-[#F0B90B] hover:text-[#F0B90B]'}`}>
                          Pg {page} <span style={{ opacity: .6, fontWeight: 400, marginLeft: 4 }}>({count})</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full" style={{ fontSize: 13, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E4E7F0' }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, letterSpacing: 1.5, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' }}>#</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, letterSpacing: 1.5, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' }}>工程项目</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 11, letterSpacing: 1.5, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' }}>类型</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 11, letterSpacing: 1.5, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' }}>单位</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 11, letterSpacing: 1.5, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' }}>数量</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 11, letterSpacing: 1.5, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' }}>单价</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 11, letterSpacing: 1.5, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' }}>小计</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, letterSpacing: 1.5, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' }}>AI 状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      let lastSection: string | null = null;
                      const rows: React.ReactNode[] = [];
                      displayedItems.forEach((item, i) => {
                        const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.nodata;
                        // Section header row
                        const curSection = item.section || null;
                        if (curSection && curSection !== lastSection) {
                          lastSection = curSection;
                          rows.push(
                            <tr key={`sec-${i}`}>
                              <td colSpan={8} style={{ padding: '12px 14px 5px', fontSize: 11, fontWeight: 700, color: '#F0B90B', letterSpacing: .8, textTransform: 'uppercase', borderTop: '1px solid #E4E7F0', background: 'rgba(240,185,11,0.04)' }}>
                                📁 {curSection}
                              </td>
                            </tr>
                          );
                        }
                        // Page badge (ALL mode, multi-page)
                        const pageBadge = pages.length > 1 && filterMode === 'section' && item.page
                          ? <div style={{ fontSize: 9, color: '#9CA3AF', marginTop: 2, letterSpacing: .3 }}>P{item.page}</div>
                          : null;
                        rows.push(
                          <tr key={i} style={{ borderBottom: '1px solid #F0F2F7' }} className="hover:bg-[#FAFBFC] transition-colors">
                            <td style={{ padding: '11px 12px', color: '#9CA3AF', fontSize: 11, fontFamily: 'monospace', verticalAlign: 'top', paddingTop: 13 }}>
                              {item.no || i + 1}{pageBadge}
                            </td>
                            <td style={{ padding: '11px 12px', fontWeight: 500, color: '#1B2336', lineHeight: 1.5, minWidth: 200 }}>{item.name}</td>
                            <td style={{ padding: '11px 12px', textAlign: 'center' }}><SupplyBadge type={item.supplyType} /></td>
                            <td style={{ padding: '11px 12px', color: '#6B7A94', textAlign: 'center' }}>{item.unit}</td>
                            <td style={{ padding: '11px 12px', fontFamily: 'monospace', textAlign: 'right', color: '#6B7A94' }}>{item.qty}</td>
                            <td style={{ padding: '11px 12px', fontFamily: 'monospace', textAlign: 'right' }}>
                              <span style={{ color: item.unitPriceDerived ? '#F97316' : '#6B7A94' }}>
                                {(item.unitPrice ?? 0).toFixed(2)}{item.unitPriceDerived ? <sup style={{ fontSize: 9, color: '#9CA3AF' }}>*</sup> : ''}
                              </span>
                              {(() => {
                                const origIdx = analysis?.items.indexOf(item) ?? -1;
                                const comp = scoreBreakdown?.priceComparisons.find(c => c.itemIndex === origIdx);
                                if (!comp || comp.verdict === 'ok' || comp.verdict === 'ai_estimated') return null;
                                if ((comp.source === 'database' || comp.source === 'known_range') && comp.dbMin != null && comp.dbMax != null) {
                                  return <div style={{ fontSize: 9, color: '#F97316', marginTop: 2 }}>市场 {comp.dbMin.toFixed(0)}-{comp.dbMax.toFixed(0)}</div>;
                                }
                                if (comp.source === 'ai_estimate' && comp.aiEstMin != null && comp.aiEstMax != null) {
                                  return <div style={{ fontSize: 9, color: '#F97316', marginTop: 2 }}>AI估 {comp.aiEstMin.toFixed(0)}-{comp.aiEstMax.toFixed(0)}</div>;
                                }
                                return null;
                              })()}
                            </td>
                            <td style={{ padding: '11px 12px', fontFamily: 'monospace', fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap' }}>
                              {currency} {(item.total ?? 0).toLocaleString()}
                            </td>
                            <td style={{ padding: '11px 12px', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                              <span style={{ color: cfg.cls, fontSize: 12 }}>{cfg.label}</span>
                              {item.note && <div style={{ fontSize: 10, color: '#6B7A94', marginTop: 2, whiteSpace: 'normal', minWidth: 90 }}>{item.note}</div>}
                            </td>
                          </tr>
                        );
                      });
                      return rows;
                    })()}
                  </tbody>

                  {/* Subtotals */}
                  {(activeSection === 'all' || filterMode === 'page') && analysis.subtotals.map((sub, i) => (
                    <tfoot key={i}>
                      <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <td colSpan={6} style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#6B7A94', fontSize: 12 }}>{sub.label}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#F0B90B', fontFamily: 'monospace' }}>
                          {currency} {(sub.amount ?? 0).toLocaleString()}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  ))}

                  {/* Total row — gold like reference */}
                  {(activeSection === 'all' || filterMode === 'page') && (
                    <tfoot>
                      <tr style={{ background: 'rgba(240,185,11,0.07)', borderTop: '2px solid #F0B90B' }}>
                        <td colSpan={6} style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#1B2336', fontSize: 13 }}>报价总额</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#F0B90B', fontFamily: 'monospace', fontSize: 15 }}>
                          {currency} {(analysis.totalAmount ?? 0).toLocaleString()}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* Legend */}
              <div className="px-5 py-3 border-t border-[#F0F2F7]" style={{ fontSize: 11, color: '#9CA3AF', lineHeight: 2 }}>
                <span style={{ color: '#16A34A' }}>✓ 正常</span>
                <span style={{ margin: '0 8px', color: '#9CA3AF' }}>│</span>
                <span style={{ color: '#F97316' }}>⚠ 注意</span>
                <span style={{ margin: '0 8px', color: '#9CA3AF' }}>│</span>
                <span style={{ color: '#E53935' }}>✗ 异常</span>
                <span style={{ margin: '0 8px', color: '#9CA3AF' }}>│</span>
                <span>– 待确认 = 原始报价未提供数据</span>
                <br />
                <span>* 单价标 * 表示由「总价 ÷ 数量」计算得出，非原始报价直接提供</span>
              </div>
            </div>

            {/* Old missing/alerts sections removed — now in AI QS AUDIT SUMMARY card above */}

            {/* Gantt (when shown) */}
            {showGantt && <GanttAutoGenerator analysis={analysis} onSave={async (tasks) => {
              const pid = savedProjectId || linkedProjectId;
              if (!pid) return;
              const { data: { user: authUser } } = await supabase.auth.getUser();
              if (!authUser?.id) return;
              const upsertData = tasks.map(t => ({
                id: t.id, project_id: pid, user_id: authUser.id,
                name: t.name, name_zh: t.name_zh, trade: t.trade,
                start_date: t.start_date, end_date: t.end_date, duration: t.duration,
                progress: t.progress, dependencies: t.dependencies, color: t.color,
                is_critical: t.is_critical, subtasks: t.subtasks, assigned_workers: t.assigned_workers,
                ai_hint: t.ai_hint ?? null, phase_id: t.phase_id ?? null,
                source_items: t.source_items ?? [], sort_order: t.sort_order ?? 0,
              }));
              await supabase.from('gantt_tasks').upsert(upsertData, { onConflict: 'id' });
            }} />}
          </>
        )}
      </div>

      {/* ── Bottom action bar ─────────────────────────────────────────────── */}
      {analysis && (
        <div className="flex-shrink-0 bg-white border-t border-rs-surface3 px-8 py-3 flex items-center gap-2"
          style={{ boxShadow: '0 -2px 12px rgba(27,35,54,0.06)' }}>
          <button
            onClick={() => setShowFullReport(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white rounded-lg text-[13px] font-medium hover:bg-gray-800 transition-colors"
          >
            View Full AI Report <ChevronRight className="w-4 h-4" />
          </button>
          {/* Show "生成工程进度" as primary CTA when coming from new-project flow */}
          {linkedProjectId ? (
            <button
              onClick={handleGoToGantt}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-bold transition-colors"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {savedProjectId ? '生成工程进度 →' : '保存并生成进度 →'}
            </button>
          ) : (
            <button
              onClick={() => setShowGantt(!showGantt)}
              className="flex items-center gap-1.5 px-4 py-2 bg-white border border-rs-surface3 text-rs-text2 rounded-lg text-[13px] font-medium hover:border-[#4F8EF7] hover:text-[#4F8EF7] transition-colors"
            >
              <Calendar className="w-4 h-4" /> Generate Schedule
            </button>
          )}
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-rs-surface3 text-rs-text2 rounded-lg text-[13px] font-medium hover:border-[#4F8EF7] hover:text-[#4F8EF7] transition-colors"
          >
            <Printer className="w-4 h-4" /> Export PDF Report
          </button>
          {pdfUrl && (
            <button
              onClick={() => setShowPdfViewer(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-white border border-rs-surface3 text-rs-text2 rounded-lg text-[13px] font-medium hover:border-[#4F8EF7] hover:text-[#4F8EF7] transition-colors"
            >
              View PDF
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={() => { clearAllState(); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 text-gray-500 rounded-lg text-[13px] font-medium hover:border-gray-400 hover:text-gray-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> {t.quotation.reUpload}
          </button>
          <button
            onClick={async () => {
              if (linkedProjectId) {
                // Project already exists — save directly, no dialog (prevents duplicate creation)
                const pid = savedProjectId || await handleDirectSaveToProject();
                if (pid) router.push(`/designer/projects/${pid}`);
              } else {
                // No linked project — open dialog to create new or select existing
                handleOpenSaveDialog();
              }
            }}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-[13px] font-bold transition-all text-white shadow-md hover:shadow-lg"
            style={{ background: 'linear-gradient(135deg, #4F8EF7, #8B5CF6)' }}
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {t.quotation.saveContinue}
          </button>
        </div>
      )}

      {/* ── Full Report Modal ─────────────────────────────────────────────── */}
      {showFullReport && analysis && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900">AI 完整审核报告</h3>
                <p className="text-[12px] text-gray-500 mt-0.5">{fileName} · {analysis.items.length} 项工程 · {fmtCurrency(analysis.totalAmount)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleExportPDF}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg text-[12px] text-gray-700 hover:bg-gray-200">
                  <Printer className="w-3.5 h-3.5" /> {t.quotation.exportPdf}
                </button>
                <button onClick={() => setShowFullReport(false)} className="p-2 rounded-xl hover:bg-gray-100">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Score summary */}
              <div className="bg-[#F8F9FB] rounded-2xl p-4 flex items-center gap-5">
                <ScoreCircle score={analysis.score.total} />
                <div className="flex-1 space-y-2">
                  <ScoreBar label="项目完整性" value={analysis.score.completeness} color="#F97316" breakdown={scoreBreakdown?.completeness} />
                  <ScoreBar label="单价合理性" value={analysis.score.price} color="#16A34A" breakdown={scoreBreakdown?.price} />
                  <ScoreBar label="工序逻辑性" value={analysis.score.logic} color="#16A34A" breakdown={scoreBreakdown?.logic} />
                  <ScoreBar label="漏项风险" value={analysis.score.risk} color="#E53935" breakdown={scoreBreakdown?.risk} />
                </div>
              </div>
              {analysis.summary && (
                <div className="bg-[#F8F9FB] rounded-xl px-4 py-3 text-[13px] text-rs-text2 leading-relaxed">
                  🤖 <strong>{t.quotation.aiSummary}:</strong>{analysis.summary}
                </div>
              )}

              {/* Missing — use missingCritical with cost estimates if available */}
              {((analysis.missingCritical ?? []).length > 0 || analysis.missing.length > 0) && (
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-2">📋 {t.quotation.missingCritical}</h4>
                  <div className="space-y-1.5">
                    {(analysis.missingCritical ?? []).length > 0
                      ? (analysis.missingCritical ?? []).map((m, i) => (
                        <div key={i} className={`rounded-lg px-3 py-2.5 ${m.urgency === 'critical' ? 'bg-red-50 border border-red-100' : 'bg-amber-50 border border-amber-100'}`}>
                          <div className={`flex items-start gap-2 text-[13px] font-semibold ${m.urgency === 'critical' ? 'text-red-700' : 'text-amber-700'}`}>
                            <XCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> {m.item}
                          </div>
                          <div className="text-[12px] text-gray-500 mt-1 ml-5">{m.reason}</div>
                          {m.estimatedCost && <div className="text-[12px] font-semibold text-red-600 mt-1 ml-5">Est. {m.estimatedCost}</div>}
                        </div>
                      ))
                      : analysis.missing.map((m, i) => (
                        <div key={i} className="flex items-start gap-2 text-[13px] text-rs-text2 bg-red-50 rounded-lg px-3 py-2">
                          <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" /> {m}
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}

              {/* Criticals — grouped by title */}
              {groupAlertsByTitle(analysis.alerts.filter(a => a.level === 'critical')).length > 0 && (
                <div>
                  <h4 className="font-bold text-red-600 text-sm mb-2 uppercase tracking-wide">严重问题（需立即处理）</h4>
                  {groupAlertsByTitle(analysis.alerts.filter(a => a.level === 'critical')).map((alert, i) => (
                    <div key={i} className="flex gap-3 p-4 rounded-xl mb-2 bg-[rgba(229,57,53,0.06)] border border-[rgba(229,57,53,0.2)]">
                      <span className="text-lg flex-shrink-0">🔴</span>
                      <div>
                        <div className="text-[13px] font-semibold text-red-600 mb-1">{alert.title}</div>
                        <div className="text-[13px] text-rs-text2 leading-relaxed whitespace-pre-line">{alert.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Warnings — grouped by title, false-positives removed */}
              {(() => {
                const grouped = groupAlertsByTitle(analysis.alerts.filter(a => a.level === 'warning' && !isFalsePositiveAlert(a)));
                return grouped.length > 0 ? (
                  <div>
                    <h4 className="font-bold text-amber-600 text-sm mb-2 uppercase tracking-wide">警告（建议确认）</h4>
                    {grouped.map((alert, i) => (
                      <div key={i} className="flex gap-3 p-4 rounded-xl mb-2 bg-[rgba(251,191,36,0.08)] border border-[rgba(251,191,36,0.25)]">
                        <span className="text-lg flex-shrink-0">🟡</span>
                        <div>
                          <div className="text-[13px] font-semibold text-amber-700 mb-1">{alert.title}</div>
                          <div className="text-[13px] text-rs-text2 leading-relaxed whitespace-pre-line">{alert.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null;
              })()}

              {/* Infos — grouped by title */}
              {(() => {
                const grouped = groupAlertsByTitle(analysis.alerts.filter(a => a.level === 'info'));
                return grouped.length > 0 ? (
                  <div>
                    <h4 className="font-bold text-blue-600 text-sm mb-2 uppercase tracking-wide">提示（可选考虑）</h4>
                    {grouped.map((alert, i) => (
                      <div key={i} className="flex gap-3 p-4 rounded-xl mb-2 bg-[rgba(46,107,230,0.06)] border border-[rgba(46,107,230,0.2)]">
                        <span className="text-lg flex-shrink-0">💡</span>
                        <div>
                          <div className="text-[13px] font-semibold text-blue-700 mb-1">{alert.title}</div>
                          <div className="text-[13px] text-rs-text2 leading-relaxed whitespace-pre-line">{alert.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null;
              })()}
            </div>

            {/* Full Report footer action buttons */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-3 flex-shrink-0 bg-white">
              {(linkedProjectId || savedProjectId) && (
                <button
                  onClick={async () => { setShowFullReport(false); await handleGoToGantt(); }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold transition-colors"
                  style={{ background: 'var(--accent)', color: '#fff' }}
                >
                  生成工程进度 <ArrowRight className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => { setShowFullReport(false); handleExportPDF(); }}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-[13px] font-medium hover:border-[#4F8EF7] hover:text-[#4F8EF7] transition-colors"
              >
                <Printer className="w-4 h-4" /> 导出 PDF 报告
              </button>
              <button
                onClick={() => {
                  toast({ title: '📤 分享功能', description: '即将推出 — 可分享报告链接给业主' });
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-[13px] font-medium hover:border-[#2E6BE6] hover:text-[#2E6BE6] transition-colors"
              >
                <Send className="w-4 h-4" /> Send to Owner for Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Save to Project Dialog ────────────────────────────────────────── */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">保存至项目</h3>
                <p className="text-[12px] text-gray-500 mt-0.5">选择保存方式</p>
              </div>
              <button onClick={() => setShowSaveDialog(false)} className="p-2 rounded-xl hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Mode tabs */}
              <div className="flex rounded-xl bg-gray-100 p-1 gap-1">
                <button onClick={() => setSaveMode('new')}
                  className={`flex-1 py-2 rounded-lg text-[13px] font-medium transition-colors ${saveMode === 'new' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
                  新建项目
                </button>
                {existingProjects.length > 0 && (
                  <button onClick={() => setSaveMode('existing')}
                    className={`flex-1 py-2 rounded-lg text-[13px] font-medium transition-colors ${saveMode === 'existing' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
                    选择现有项目
                  </button>
                )}
              </div>

              {saveMode === 'new' ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-[12px] text-gray-500 mb-1 block">项目名称</label>
                    <Input value={newProjectName} onChange={e => setNewProjectName(e.target.value)} placeholder="项目名称" className="text-[13px]" />
                  </div>
                  <div className="bg-amber-50 rounded-xl p-3 text-[12px] text-amber-700">
                    <strong>状态：Pending 待谈</strong><br />
                    合同金额：{fmtCurrency(analysis?.totalAmount || 0)}<br />
                    客户：{clientInfo?.company || clientInfo?.attention || '—'}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-[12px] text-gray-500 mb-1 block">选择项目</label>
                    <select
                      value={selectedProjectId}
                      onChange={e => setSelectedProjectId(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] bg-white"
                    >
                      <option value="">请选择项目...</option>
                      {existingProjects.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.status})</option>
                      ))}
                    </select>
                  </div>
                  {selectedProjectId && (
                    <div className="bg-blue-50 rounded-xl p-3 text-[12px] text-blue-700 space-y-1">
                      <strong>📋 更新现有项目</strong>
                      <div>• 新报价单将替换为 Active 版本</div>
                      <div>• 合同金额更新为 {fmtCurrency(analysis?.totalAmount || 0)}</div>
                      <div>• 付款阶段金额按比例重算</div>
                      <div>• 进度表保留已有进度，工期自动调整</div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowSaveDialog(false)} className="flex-1">取消</Button>
                <Button
                  className="flex-1 bg-[#4F8EF7] hover:bg-[#3B7BE8] text-white font-semibold"
                  onClick={handleSaveToProject}
                  disabled={isSaving || (saveMode === 'new' ? !newProjectName : !selectedProjectId)}
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {isSaving ? '保存中...' : '✓ 确认保存'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PDF Viewer ────────────────────────────────────────────────────── */}
      {showPdfViewer && pdfUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 bg-[#1A2332] border-b border-white/10">
            <span className="text-white font-medium">{fileName}</span>
            <button onClick={() => setShowPdfViewer(false)} className="text-white/60 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <iframe src={pdfUrl} className="flex-1 w-full" title="PDF Viewer" />
        </div>
      )}
    </div>
  );
}
