'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { QuotationAnalysis, GanttTask, GanttParams, SiteType } from '@/types';
import { generateGanttTasks, generateGanttFromAIParams, getPhaseChecklist, getPhaseById, CONSTRUCTION_PHASES, classifyItemTrade } from '@/lib/utils/gantt-rules';
import { GanttChart } from './GanttChart';
import { TaskDetailPanel } from './TaskDetailPanel';
import { Sparkles, Pencil, Building2, Zap } from 'lucide-react';
import { format, parseISO, addDays } from 'date-fns';
import { exportGanttToExcel } from '@/lib/utils/excel-export';
import { MY_HOLIDAYS, SG_HOLIDAYS } from '@/lib/utils/dates';
import { useI18n } from '@/lib/i18n/context';

// Simple workday check for BFS cascade (skips weekends + MY holidays)
function isWorkday_simple(d: Date): boolean {
  const day = d.getDay();
  if (day === 0 || day === 6) return false;
  return !MY_HOLIDAYS.has(format(d, 'yyyy-MM-dd'));
}

// Add workdays (skipping weekends + holidays) — for BFS cascade
function addWorkdays_simple(start: Date, workdays: number): Date {
  let d = new Date(start);
  let count = 0;
  while (count < workdays) {
    d = addDays(d, 1);
    if (isWorkday_simple(d)) count++;
  }
  return d;
}

// Find next workday on or after given date
function nextWorkday_simple(d: Date): Date {
  let cursor = new Date(d);
  while (!isWorkday_simple(cursor)) {
    cursor = addDays(cursor, 1);
  }
  return cursor;
}

const SITE_TYPE_OPTIONS: { value: SiteType; label: string; label_zh: string }[] = [
  { value: 'condo', label: 'Condo', label_zh: '公寓 Condo' },
  { value: 'apartment', label: 'Apartment', label_zh: '公寓 Apartment' },
  { value: 'landed_terrace', label: 'Landed (Terrace)', label_zh: '排屋 Terrace' },
  { value: 'landed_semid', label: 'Landed (Semi-D)', label_zh: '半独立 Semi-D' },
  { value: 'landed_bungalow', label: 'Landed (Bungalow)', label_zh: '独栋 Bungalow' },
  { value: 'shop_lot', label: 'Shop Lot', label_zh: '店铺 Shop Lot' },
  { value: 'commercial', label: 'Commercial', label_zh: '商业空间' },
  { value: 'mall', label: 'Mall', label_zh: '商场' },
  { value: 'factory', label: 'Factory', label_zh: '工厂' },
  { value: 'other', label: 'Other', label_zh: '其他' },
];

function detectSiteType(analysis: QuotationAnalysis): SiteType {
  const pt = analysis.projectType?.toLowerCase() || analysis.ganttParams?.projectType || '';
  // Exact match from AI (new specific types)
  const EXACT: Record<string, SiteType> = {
    condo: 'condo', apartment: 'apartment', landed_terrace: 'landed_terrace',
    landed_semid: 'landed_semid', landed_bungalow: 'landed_bungalow',
    shop_lot: 'shop_lot', commercial: 'commercial', mall: 'mall', factory: 'factory',
  };
  if (EXACT[pt]) return EXACT[pt];
  // Fuzzy match fallback
  if (/condo|condominium/.test(pt)) return 'condo';
  if (/apartment/.test(pt)) return 'apartment';
  if (/bungalow|banglo/.test(pt)) return 'landed_bungalow';
  if (/semi.?d|semi.?detach/.test(pt)) return 'landed_semid';
  if (/terrace|link|landed/.test(pt)) return 'landed_terrace';
  if (/shop/.test(pt)) return 'shop_lot';
  if (/mall|retail/.test(pt)) return 'mall';
  if (/commercial|office/.test(pt)) return 'commercial';
  if (/factory|industrial|warehouse/.test(pt)) return 'factory';
  if (/residential/.test(pt)) return 'landed_terrace';
  return 'landed_terrace'; // default — most common in MY/SG
}

interface GanttAutoGeneratorProps {
  analysis: QuotationAnalysis;
  projectId?: string;
  onSave?: (tasks: GanttTask[]) => void;
}

export function GanttAutoGenerator({ analysis, projectId = 'temp', onSave }: GanttAutoGeneratorProps) {
  const { lang } = useI18n();
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [generating, setGenerating] = useState(true);
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [deadline, setDeadline] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [workSat, setWorkSat] = useState(false);
  const [workSun, setWorkSun] = useState(false);
  const [siteType, setSiteType] = useState<SiteType>(() => detectSiteType(analysis));
  const [customSiteType, setCustomSiteType] = useState('');
  const [pendingSave, setPendingSave] = useState(false);
  const tasksRef = useRef<GanttTask[]>([]);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Keep tasksRef in sync
  useEffect(() => { tasksRef.current = tasks; }, [tasks]);

  // Auto-save with 1.5s debounce after task edits (Apply / drag)
  useEffect(() => {
    if (!pendingSave || !onSave || tasksRef.current.length === 0) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      onSave(tasksRef.current);
      setPendingSave(false);
    }, 1500);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [pendingSave, onSave]);

  useEffect(() => {
    generateTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysis, siteType, startDate, workSat, workSun, customSiteType]);

  const generateTasks = useCallback(() => {
    setGenerating(true);
    const effectiveSiteType = siteType === 'other' && customSiteType ? customSiteType : siteType;

    // Use AI-extracted ganttParams when available (phase filtering by tradeScope)
    const ganttParams = (analysis as QuotationAnalysis & { ganttParams?: GanttParams }).ganttParams;
    if (ganttParams) {
      // Enrich tradeScope with itemNames from quotation items (AI doesn't return these).
      // Clone to avoid mutating the analysis object in React state.
      const enrichedScope = { ...ganttParams.tradeScope };
      if (analysis.items?.length) {
        const tradeItems: Record<string, string[]> = {};
        for (const item of analysis.items) {
          const trade = classifyItemTrade(item.section || '', item.name);
          if (trade) {
            if (!tradeItems[trade]) tradeItems[trade] = [];
            if (!tradeItems[trade].includes(item.name)) tradeItems[trade].push(item.name);
          }
        }
        for (const [key, data] of Object.entries(enrichedScope)) {
          if (data && !data.itemNames?.length && tradeItems[key]?.length) {
            enrichedScope[key as keyof typeof enrichedScope] = { ...data, itemNames: tradeItems[key] };
          }
        }
        // Add itemNames-only entries for trades found in quotation but missing from AI tradeScope
        // (e.g. masonry phase included via hasDemolition but not in tradeScope)
        for (const [trade, items] of Object.entries(tradeItems)) {
          if (items.length && !(trade in enrichedScope)) {
            Object.assign(enrichedScope, { [trade]: { itemNames: items } });
          }
        }
      }
      const enrichedParams = { ...ganttParams, tradeScope: enrichedScope };
      const generatedTasks = generateGanttFromAIParams(projectId, enrichedParams, new Date(startDate), 'MY', workSat, workSun, effectiveSiteType);
      setTasks(generatedTasks);
      setGenerating(false);
      return;
    }

    // Fallback: detect scope from items
    let sqft = 1000;
    for (const item of analysis.items) {
      const name = item.name.toLowerCase();
      if ((name.includes('tiling') || name.includes('floor') || name.includes('wall') || name.includes('tile')) && item.unit === 'sqft') {
        sqft = Math.max(sqft, item.qty);
      }
    }

    const hasDemolition = analysis.items.some(i =>
      i.name.toLowerCase().includes('demolition') ||
      i.name.toLowerCase().includes('hacking') ||
      i.section?.toLowerCase().includes('demolition')
    );

    const generatedTasks = generateGanttTasks(projectId, new Date(startDate), sqft, hasDemolition, 'residential', 'MY', workSat, workSun, effectiveSiteType);
    setTasks(generatedTasks);
    setGenerating(false);
  }, [analysis, projectId, startDate, workSat, workSun, siteType, customSiteType]);

  const handleTaskUpdate = (taskId: string, updates: Partial<GanttTask>) => {
    setTasks(prev => {
      // Apply direct update
      let updated = prev.map(t => t.id === taskId ? { ...t, ...updates } : t);

      // Cascade: auto-adjust all dependent tasks
      const changedTask = updated.find(t => t.id === taskId);
      if (!changedTask) return updated;

      // Build dependency graph: taskId → list of tasks that depend on it
      const dependents = new Map<string, string[]>();
      for (const t of updated) {
        for (const depId of (t.dependencies || [])) {
          if (!dependents.has(depId)) dependents.set(depId, []);
          dependents.get(depId)!.push(t.id);
        }
      }

      // BFS cascade from the changed task (uses workdays — skips weekends & holidays)
      const queue = [taskId];
      const visited = new Set<string>([taskId]);
      while (queue.length > 0) {
        const currentId = queue.shift()!;
        const children = dependents.get(currentId) || [];

        for (const childId of children) {
          if (visited.has(childId)) continue;
          visited.add(childId);
          const child = updated.find(t => t.id === childId);
          if (!child) continue;

          // Child's start should be >= next workday after all its dependencies' end dates
          const allDepEnds = (child.dependencies || [])
            .map(dId => updated.find(t => t.id === dId))
            .filter(Boolean)
            .map(t => parseISO(t!.end_date));
          if (allDepEnds.length === 0) continue;

          const latestDepEnd = new Date(Math.max(...allDepEnds.map(d => d.getTime())));
          const minStart = nextWorkday_simple(addDays(latestDepEnd, 1));
          const childStart = parseISO(child.start_date);

          // Only shift if child starts before its dependency allows
          if (childStart < minStart) {
            const childWorkdays = child.duration || Math.max(1, Math.round(
              (parseISO(child.end_date).getTime() - childStart.getTime()) / (86400000)
            ));
            const newStart = minStart;
            const newEnd = childWorkdays > 1
              ? addWorkdays_simple(newStart, childWorkdays - 1)
              : newStart;
            updated = updated.map(t => t.id === childId ? {
              ...t,
              start_date: format(newStart, 'yyyy-MM-dd'),
              end_date: format(newEnd, 'yyyy-MM-dd'),
              duration: childWorkdays,
            } : t);
          }
          queue.push(childId);
        }
      }
      return updated;
    });
    // Trigger debounced auto-save
    setPendingSave(true);
  };

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  const handleSubtaskToggle = (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        subtasks: t.subtasks.map(s =>
          s.id === subtaskId ? { ...s, completed: !s.completed } : s
        ),
      };
    }));
  };

  const handleTaskDelete = (taskId: string) => {
    setTasks(prev => {
      const filtered = prev.filter(t => t.id !== taskId);
      return filtered.map((t, i) => ({ ...t, sort_order: i }));
    });
  };

  const handleTaskReorder = (taskId: string, newIndex: number, recalcDates: boolean) => {
    setTasks(prev => {
      const idx = prev.findIndex(t => t.id === taskId);
      if (idx < 0) return prev;
      const updated = [...prev];
      const [moved] = updated.splice(idx, 1);
      updated.splice(newIndex, 0, moved);
      return updated.map((t, i) => ({ ...t, sort_order: i }));
    });
    // TODO: if recalcDates, rebuild schedule from new order
  };

  const [showAddModal, setShowAddModal] = useState(false);
  const [aiOptimizing, setAiOptimizing] = useState(false);
  const [aiNotes, setAiNotes] = useState<Record<string, string>>({});

  // ── Export Gantt schedule to Excel ──
  const handleExportExcel = useCallback(async () => {
    await exportGanttToExcel({ tasks, lang, startDate, siteType, workSat, workSun });
  }, [tasks, lang, startDate, siteType, workSat, workSun]);

  // AI schedule optimization: sends current schedule + quotation items to Haiku for professional review
  const handleAIOptimize = useCallback(async () => {
    if (aiOptimizing || tasks.length === 0) return;
    setAiOptimizing(true);
    setAiNotes({});
    try {
      const totalAmt = analysis.totalAmount || analysis.items.reduce((s, i) => s + (i.total || 0), 0);
      const prompt = `You are a senior interior design project manager in Malaysia/Singapore.
Analyze this renovation construction schedule and optimize task durations based on the actual quotation scope.

Contract Value: RM ${totalAmt.toLocaleString()}

Current schedule (generated by rule engine):
${JSON.stringify(tasks.map(t => ({
  id: t.id, name: t.name, trade: t.trade,
  duration: t.duration, start: t.start_date, end: t.end_date,
  items: (t.source_items || []).slice(0, 5),
})), null, 2)}

Quotation items (top 20 by value):
${analysis.items.slice(0, 20).map(i => `- ${i.section || ''} | ${i.name} | ${i.qty || ''} ${i.unit || ''} | RM${i.total || 0}`).join('\n')}

Rules:
1. Respect construction dependencies (M&E BEFORE waterproofing BEFORE tiling)
2. Only adjust durations — do NOT change task order or dependencies
3. Be realistic: large tiling areas need more days, simple electrical work needs fewer
4. Carpentry manufacturing is typically 4-6 weeks — adjust if scope is small/large
5. Return ONLY valid JSON array, no explanation

Format: [{"id":"full_task_id","duration":N,"aiNote":"brief reason in Chinese"}]
Only include tasks where you changed the duration. Skip unchanged tasks.`;

      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1500,
          messages: [{ role: 'user', content: prompt }],
          skipQuota: true,
        }),
      });

      if (!response.ok) throw new Error('AI request failed');
      const data = await response.json();
      const text = data.content?.[0]?.text || '';
      const match = text.match(/\[[\s\S]*\]/);
      if (!match) throw new Error('No JSON array in response');

      const aiTasks: { id: string; duration: number; aiNote?: string }[] = JSON.parse(match[0]);
      const notes: Record<string, string> = {};

      setTasks(prev => prev.map(t => {
        const aiTask = aiTasks.find(a => a.id === t.id);
        if (!aiTask || aiTask.duration === t.duration) return t;
        if (aiTask.aiNote) notes[t.id] = aiTask.aiNote;
        // Recalculate end_date based on new duration
        let d = parseISO(t.start_date);
        let count = 0;
        while (count < aiTask.duration - 1) {
          d = addDays(d, 1);
          const day = d.getDay();
          const dateStr = format(d, 'yyyy-MM-dd');
          if (day !== 0 && day !== 6 && !MY_HOLIDAYS.has(dateStr)) {
            count++;
          }
        }
        return { ...t, duration: aiTask.duration, end_date: format(d, 'yyyy-MM-dd') };
      }));
      setAiNotes(notes);
    } catch {
      // silently fail — user can retry
    } finally {
      setAiOptimizing(false);
    }
  }, [tasks, analysis, aiOptimizing]);

  const handleAddTask = (newTask: { name: string; trade: string; duration: number; phaseGroup: string }) => {
    const id = `${projectId}-custom_${Date.now()}`;
    const lastTask = tasks[tasks.length - 1];
    const startD = lastTask ? lastTask.end_date : startDate;

    setTasks(prev => [...prev, {
      id,
      project_id: projectId,
      name: newTask.name,
      name_zh: newTask.name,
      trade: newTask.trade,
      start_date: startD,
      end_date: startD, // simplified
      duration: newTask.duration,
      progress: 0,
      dependencies: [],
      color: '#94A3B8',
      is_critical: false,
      subtasks: [],
      assigned_workers: [],
      sort_order: prev.length,
      phase_group: newTask.phaseGroup as 'design' | 'preparation' | 'construction',
    }]);
    setShowAddModal(false);
  };

  const handleDurationChange = (taskId: string, newDuration: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || newDuration < 1) return;

    const startD = parseISO(task.start_date);
    let d = new Date(startD);
    let count = 0;
    while (count < newDuration - 1) {
      d = new Date(d.getTime() + 86400000);
      const day = d.getDay();
      const dateStr = format(d, 'yyyy-MM-dd');
      if (day !== 0 && day !== 6 && !MY_HOLIDAYS.has(dateStr)) {
        count++;
      }
    }

    handleTaskUpdate(taskId, {
      duration: newDuration,
      end_date: format(d, 'yyyy-MM-dd'),
    });
  };

  if (generating) {
    return (
      <div className="bg-white border border-rs-border rounded-xl p-10 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#4F8EF7]" style={{
                animation: `bounce 0.8s ease-in-out ${i * 0.15}s infinite`
              }} />
            ))}
          </div>
        </div>
        <p className="text-[15px] font-semibold text-rs-text">
          {lang === 'ZH' ? '正在生成甘特图...' : 'Generating Gantt Chart...'}
        </p>
        <p className="text-sm text-rs-text3 mt-1">
          {lang === 'ZH' ? '基于报价单范围和MY/SG施工流程' : 'Based on quotation scope and MY/SG construction workflow'}
        </p>
      </div>
    );
  }

  const projectEnd = tasks.length > 0 ? tasks[tasks.length - 1].end_date : '';
  const calWeeks = tasks.length > 0
    ? ((new Date(tasks[tasks.length - 1].end_date).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24 * 7)).toFixed(1)
    : '0';
  const calMonths = (parseFloat(calWeeks) / 4.33).toFixed(1);

  // Collect holidays in range
  const holidaysInRange: { date: string; name: string; name_zh: string }[] = [];
  if (tasks.length > 0) {
    let d = new Date(startDate);
    const end = parseISO(tasks[tasks.length - 1].end_date);
    while (d <= end) {
      const dateStr = format(d, 'yyyy-MM-dd');
      if (MY_HOLIDAYS.has(dateStr)) {
        const info = getHolidayInfo(dateStr);
        holidaysInRange.push({ date: dateStr, name: info.name, name_zh: info.name_zh });
      }
      d = new Date(d.getTime() + 86400000);
    }
  }

  const selectedTask = selectedTaskId ? tasks.find(t => t.id === selectedTaskId) : null;
  const selectedPhaseId = selectedTaskId?.replace(`${projectId}-`, '') || '';

  return (
    <>
      {/* ── Top Schedule Controls ── */}
      <div className="bg-white border border-rs-border rounded-xl shadow-sm mb-4 overflow-hidden">
        <div className="px-4 py-3 flex items-center gap-4 flex-wrap">
          {/* Start Date */}
          <div>
            <div className="text-xs text-rs-text3 font-semibold tracking-wide mb-1">Start Date</div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs border border-rs-border rounded-lg px-2.5 py-1.5 text-rs-text bg-white focus:outline-none focus:border-[#4F8EF7] transition-colors font-sans"
            />
          </div>

          {/* Target Deadline */}
          <div>
            <div className="text-xs text-rs-text3 font-semibold tracking-wide mb-1 flex items-center gap-1">
              <span className="text-[#EF4444]">🎯</span> Target Deadline
            </div>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="text-xs border border-rs-border rounded-lg px-2.5 py-1.5 text-rs-text bg-white focus:outline-none focus:border-[#4F8EF7] transition-colors font-sans"
            />
          </div>

          {/* Work Days */}
          <div>
            <div className="text-xs text-rs-text3 font-semibold tracking-wide mb-1">Work Days</div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs text-rs-text2 cursor-pointer">
                <input type="checkbox" checked={workSat} onChange={(e) => setWorkSat(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-rs-border accent-[#4F8EF7]" />
                Sat
              </label>
              <label className="flex items-center gap-1.5 text-xs text-rs-text2 cursor-pointer">
                <input type="checkbox" checked={workSun} onChange={(e) => setWorkSun(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-rs-border accent-[#4F8EF7]" />
                Sun
              </label>
            </div>
            <div className="text-[10px] text-rs-text3 mt-0.5">Weekends excluded by default</div>
          </div>

          {/* Site Type */}
          <div>
            <div className="text-xs text-rs-text3 font-semibold tracking-wide mb-1 flex items-center gap-1">
              <Building2 className="w-3 h-3" /> {lang === 'ZH' ? '工地类型' : 'Site Type'}
            </div>
            <select
              value={siteType}
              onChange={(e) => {
                setSiteType(e.target.value as SiteType);
              }}
              className="text-xs border border-rs-border rounded-lg px-2.5 py-1.5 text-rs-text bg-white focus:outline-none focus:border-[#4F8EF7] transition-colors font-sans"
            >
              {SITE_TYPE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {lang === 'ZH' ? opt.label_zh : opt.label}
                </option>
              ))}
            </select>
            {siteType === 'other' && (
              <input
                type="text"
                placeholder={lang === 'ZH' ? '输入工地类型...' : 'Enter site type...'}
                value={customSiteType}
                onChange={(e) => setCustomSiteType(e.target.value)}
                className="text-xs border border-rs-border rounded-lg px-2.5 py-1.5 mt-1 w-full text-rs-text bg-white focus:outline-none focus:border-[#4F8EF7]"
              />
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-10 bg-rs-border" />

          {/* Summary */}
          <div className="text-sm">
            <div className="text-rs-text">
              <strong>{calWeeks}</strong> {lang === 'ZH' ? '日历周' : 'calendar weeks'}
              <span className="text-rs-text3 ml-1">(≈{calMonths} {lang === 'ZH' ? '个月' : 'months'})</span>
            </div>
            <div className="text-xs text-rs-text3 mt-0.5">
              {projectEnd ? `${format(new Date(startDate), 'dd MMM')} → ${format(parseISO(projectEnd), 'dd MMM')}` : ''}
            </div>
          </div>

          {/* Buttons */}
          <div className="ml-auto flex items-center gap-2 flex-wrap">
            <button
              onClick={generateTasks}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-[#4F8EF7] text-white hover:bg-[#3B7BE8] transition-all shadow-sm border border-[#4F8EF7]/30"
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI {lang === 'ZH' ? '智能编排' : 'Schedule'}
            </button>
            <button
              onClick={handleAIOptimize}
              disabled={aiOptimizing}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 transition-all shadow-sm disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5" />
              {aiOptimizing
                ? (lang === 'ZH' ? 'AI优化中...' : 'AI Optimizing...')
                : (lang === 'ZH' ? 'AI优化工期' : 'AI Optimize')}
            </button>
            <button
              onClick={() => setShowOverrideModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-rs-text2 border border-rs-border rounded-lg bg-white hover:border-[#4F8EF7] hover:text-[#2563EB] transition-all"
            >
              <Pencil className="w-3.5 h-3.5" />
              Override Special Work Days
            </button>
          </div>
        </div>
      </div>

      {/* ── Gantt Card ── */}
      <div className="bg-white border border-rs-border rounded-xl shadow-sm overflow-hidden">
        {/* Gantt Header */}
        <div className="px-4 py-3 border-b border-rs-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="bg-[#4F8EF7] text-white text-[10px] font-bold tracking-[1.5px] px-2 py-0.5 rounded">GANTT</span>
            <span className="text-[15px] font-semibold text-rs-text">
              Construction Gantt Chart (Calendar Sync)
            </span>
          </div>
          <span className="text-xs text-rs-text3">
            {projectEnd ? `${format(new Date(startDate), 'dd MMM')} – ${format(parseISO(projectEnd), 'dd MMM')}` : ''}
          </span>
        </div>

        {/* Instruction hint */}
        <div className="px-4 py-2 bg-[rgba(96,165,250,0.04)] border-b border-rs-border text-xs text-rs-text3">
          {lang === 'ZH'
            ? '💡 点击任意施工行查看细分内容和备料清单 · 拖拽条形图右边缘可调整工期 · 拖拽条形图主体可移动开始时间'
            : '💡 Click any task row for details & prep checklist · Drag bar right edge to resize · Drag bar body to move start date'}
        </div>

        {/* Gantt chart */}
        <div className="p-0">
          <GanttChart
            tasks={tasks}
            onTaskUpdate={handleTaskUpdate}
            onTaskClick={handleTaskClick}
            onTaskDelete={handleTaskDelete}
            onTaskReorder={handleTaskReorder}
            onTaskAdd={() => setShowAddModal(true)}
            deadline={deadline}
            projectId={projectId}
          />
        </div>

        {/* AI optimization notes */}
        {Object.keys(aiNotes).length > 0 && (
          <div className="px-4 py-2.5 border-t border-rs-border bg-amber-50/50">
            <div className="text-xs font-semibold text-amber-700 mb-1.5 flex items-center gap-1">
              <Zap className="w-3 h-3" /> {lang === 'ZH' ? 'AI 工期优化建议' : 'AI Duration Adjustments'}
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(aiNotes).map(([taskId, note]) => {
                const task = tasks.find(t => t.id === taskId);
                return task ? (
                  <span key={taskId} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md border border-amber-200 bg-white text-amber-800">
                    <span className="font-semibold">{(lang === 'ZH' && task.name_zh) ? task.name_zh.slice(0, 12) : task.name.slice(0, 20)}</span>
                    <span className="text-amber-600">→ {task.duration}d</span>
                    <span className="text-amber-500">{note}</span>
                  </span>
                ) : null;
              })}
            </div>
          </div>
        )}

        {/* Holiday legend */}
        {holidaysInRange.length > 0 && (
          <div className="px-4 py-2.5 border-t border-rs-border flex flex-wrap gap-2 items-center">
            {holidaysInRange.map(h => (
              <span key={h.date} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md border border-rs-orange/20 bg-rs-orange/10 text-rs-orange">
                <span>🎌</span>
                {lang === 'ZH' ? h.name_zh : h.name} {format(parseISO(h.date), 'MM-dd')}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Bottom Action Bar ── */}
      <div className="mt-4 flex items-center gap-3 flex-wrap">
        {onSave && (
          <button
            onClick={() => onSave?.(tasks)}
            className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold text-rs-text bg-[#4F8EF7] rounded-lg hover:bg-[#3B7BE8] transition-all shadow-sm"
          >
            📁 {lang === 'ZH' ? '保存为项目' : 'Save to Project'}
          </button>
        )}
        <button
          onClick={handleExportExcel}
          disabled={tasks.length === 0}
          className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-rs-text2 border border-rs-border rounded-lg bg-white hover:border-[#4F8EF7] hover:text-[#2563EB] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          📊 {lang === 'ZH' ? '导出Excel排程' : 'Export Excel Schedule'}
        </button>
        <span className="ml-auto text-xs text-rs-text3">
          {lang === 'ZH' ? '排好进度后保存，即可在项目列表中分配工人' : 'Save schedule to assign workers in project view'}
        </span>
      </div>

      {/* Task Detail Panel */}
      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          phaseId={selectedPhaseId}
          onClose={() => setSelectedTaskId(null)}
          onSubtaskToggle={(subtaskId) => handleSubtaskToggle(selectedTask.id, subtaskId)}
          onDurationChange={(newDuration) => handleDurationChange(selectedTask.id, newDuration)}
          quotationItems={analysis.items}
        />
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <AddTaskModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddTask}
        />
      )}

      {/* Override Modal */}
      {showOverrideModal && (
        <OverrideModal
          tasks={tasks}
          startDate={startDate}
          projectEnd={projectEnd}
          onClose={() => setShowOverrideModal(false)}
        />
      )}
    </>
  );
}

// Add Task Modal
const TRADE_OPTIONS = [
  'Measurement', 'Demolition', 'Construction', 'Electrical', 'Plumbing',
  'Waterproofing', 'Tiling', 'False Ceiling', 'Painting', 'Carpentry',
  'Air Conditioning', 'Aluminium', 'Glass', 'Metal Work', 'Landscape',
  'Cleaning', 'Preliminaries', 'Other',
];

function AddTaskModal({ onClose, onAdd }: {
  onClose: () => void;
  onAdd: (task: { name: string; trade: string; duration: number; phaseGroup: string }) => void;
}) {
  const [name, setName] = useState('');
  const [trade, setTrade] = useState('Construction');
  const [duration, setDuration] = useState(3);
  const [phaseGroup, setPhaseGroup] = useState('construction');

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl border border-rs-border w-full max-w-[420px] p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[15px] font-bold text-rs-text">添加工序</div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-rs-surface2 flex items-center justify-center text-rs-text3 hover:bg-rs-border transition-colors text-sm">✕</button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-rs-text3 mb-1 block">工序名称 *</label>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="例如: 玻璃淋浴房安装"
              className="w-full text-sm border border-rs-border rounded-lg px-3 py-2 text-rs-text focus:outline-none focus:border-[#4F8EF7]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-rs-text3 mb-1 block">工种</label>
              <select value={trade} onChange={e => setTrade(e.target.value)}
                className="w-full text-sm border border-rs-border rounded-lg px-3 py-2 text-rs-text focus:outline-none focus:border-[#4F8EF7]">
                {TRADE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-rs-text3 mb-1 block">工期（天）</label>
              <input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} min={1} max={90}
                className="w-full text-sm border border-rs-border rounded-lg px-3 py-2 text-rs-text focus:outline-none focus:border-[#4F8EF7]" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-rs-text3 mb-1 block">分组</label>
            <select value={phaseGroup} onChange={e => setPhaseGroup(e.target.value)}
              className="w-full text-sm border border-rs-border rounded-lg px-3 py-2 text-rs-text focus:outline-none focus:border-[#4F8EF7]">
              <option value="design">🎨 设计确认 (Design)</option>
              <option value="preparation">🔧 前期准备 (Preparation)</option>
              <option value="construction">🏗️ 施工阶段 (Construction)</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => name.trim() && onAdd({ name: name.trim(), trade, duration, phaseGroup })}
            disabled={!name.trim()}
            className="flex-1 px-4 py-2 text-xs font-semibold bg-[#4F8EF7] text-white rounded-lg hover:bg-[#3B7BE8] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            添加
          </button>
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-rs-text3 border border-rs-border rounded-lg bg-white hover:bg-rs-surface2 transition-all">
            取消
          </button>
        </div>
      </div>
    </div>
  );
}

// Holiday info lookup
function getHolidayInfo(dateStr: string): { name: string; name_zh: string } {
  const info: Record<string, { name: string; name_zh: string }> = {
    '2025-01-01': { name: 'New Year', name_zh: '元旦' },
    '2025-01-29': { name: 'CNY Day 1', name_zh: '农历新年第一天' },
    '2025-01-30': { name: 'CNY Day 2', name_zh: '农历新年第二天' },
    '2025-03-30': { name: 'Hari Raya Aidilfitri (1)', name_zh: '开斋节(1)' },
    '2025-03-31': { name: 'Hari Raya Aidilfitri (2)', name_zh: '开斋节(2)' },
    '2025-04-14': { name: 'Agong Birthday (est.)', name_zh: '最高元首生日' },
    '2025-05-01': { name: 'Labour Day', name_zh: '劳动节' },
    '2025-05-12': { name: 'Wesak Day (est.)', name_zh: '卫塞节' },
    '2025-06-06': { name: 'Hari Raya Aidiladha (est.)', name_zh: '哈芝节' },
    '2025-08-31': { name: 'Merdeka Day', name_zh: '国庆日' },
    '2025-09-16': { name: 'Malaysia Day', name_zh: '马来西亚日' },
    '2025-10-20': { name: 'Deepavali', name_zh: '屠妖节' },
    '2025-12-25': { name: 'Christmas', name_zh: '圣诞节' },
    '2026-01-01': { name: 'New Year', name_zh: '元旦' },
    '2026-02-17': { name: 'CNY Day 1', name_zh: '农历新年第一天' },
    '2026-02-18': { name: 'CNY Day 2', name_zh: '农历新年第二天' },
    '2026-03-20': { name: 'Hari Raya Aidilfitri (1)', name_zh: '开斋节(1)' },
    '2026-03-21': { name: 'Hari Raya Aidilfitri (2)', name_zh: '开斋节(2)' },
    '2026-05-01': { name: 'Labour Day', name_zh: '劳动节' },
    '2026-05-31': { name: 'Wesak Day (est.)', name_zh: '卫塞节' },
    '2026-08-31': { name: 'Merdeka Day', name_zh: '国庆日' },
    '2026-09-16': { name: 'Malaysia Day', name_zh: '马来西亚日' },
    '2026-12-25': { name: 'Christmas', name_zh: '圣诞节' },
  };
  return info[dateStr] || { name: 'Public Holiday', name_zh: '公共假期' };
}

// Override Special Work Days Modal
function OverrideModal({ tasks, startDate, projectEnd, onClose }: {
  tasks: GanttTask[];
  startDate: string;
  projectEnd: string;
  onClose: () => void;
}) {
  const specialDays: { date: string; type: 'weekend' | 'holiday'; name: string; work: boolean }[] = [];
  if (projectEnd) {
    let d = new Date(startDate);
    const end = parseISO(projectEnd);
    while (d <= end) {
      const dateStr = format(d, 'yyyy-MM-dd');
      const day = d.getDay();
      const isHol = MY_HOLIDAYS.has(dateStr);
      if (day === 0 || day === 6 || isHol) {
        specialDays.push({
          date: dateStr,
          type: isHol ? 'holiday' : 'weekend',
          name: isHol ? getHolidayInfo(dateStr).name : (day === 0 ? 'Sunday' : 'Saturday'),
          work: false,
        });
      }
      d = new Date(d.getTime() + 86400000);
    }
  }

  const [days, setDays] = useState(specialDays);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl border border-rs-border w-full max-w-[480px] p-5 shadow-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[15px] font-bold text-rs-text">
            <Pencil className="w-4 h-4 inline mr-2" />
            手动调整施工日
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-rs-surface2 flex items-center justify-center text-rs-text3 hover:bg-rs-border transition-colors text-sm">
            ✕
          </button>
        </div>
        <p className="text-xs text-rs-text3 mb-3">
          设定特殊日期是否施工（覆盖系统默认）。橙色 = 公共假期，灰色 = 周末。
        </p>
        <div className="flex-1 overflow-y-auto space-y-2 mb-4">
          {days.map((day, idx) => (
            <div key={day.date} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${day.type === 'holiday' ? 'border-l-[3px] border-l-rs-orange/50 border-rs-border' : 'border-l-[3px] border-l-rs-border border-rs-border'} bg-[#FAFBFC]`}>
              <div className="flex-1">
                <div className="text-xs font-semibold text-rs-text">{format(parseISO(day.date), 'EEE, dd MMM yyyy')}</div>
                <div className="text-xs text-rs-text3">{day.name}</div>
              </div>
              <button
                onClick={() => {
                  const updated = [...days];
                  updated[idx] = { ...updated[idx], work: !updated[idx].work };
                  setDays(updated);
                }}
                className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${day.work
                  ? 'bg-rs-green/10 border-rs-green/30 text-rs-green'
                  : 'bg-rs-surface2 border-rs-border text-rs-text3'
                }`}
              >
                {day.work ? 'WORK' : 'OFF'}
              </button>
            </div>
          ))}
          {days.length === 0 && (
            <p className="text-center text-sm text-rs-text3 py-6">No weekends or holidays in project range.</p>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-xs font-semibold bg-[#4F8EF7] text-white rounded-lg hover:bg-[#3B7BE8] transition-all">
            保存调整
          </button>
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-rs-text3 border border-rs-border rounded-lg bg-white hover:bg-rs-surface2 transition-all">
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
