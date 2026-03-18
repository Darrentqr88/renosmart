'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatDate } from '@/lib/utils';
import { GanttChart, GanttWorkerInfo } from '@/components/gantt/GanttChart';
import { TaskDetailPanel } from '@/components/gantt/TaskDetailPanel';
import { generateGanttTasks, generateGanttFromQuotation, generateGanttFromAIParams, appendVOTask, addWorkdays } from '@/lib/utils/gantt-rules';
import { isWorkday } from '@/lib/utils/dates';
import { Project, PaymentPhase, GanttTask, GanttTaskStatus, VariationOrder, GanttParams } from '@/types';
import {
  ArrowLeft, BarChart2, CreditCard, User, Camera, FileText, GitBranch,
  Plus, TrendingUp, TrendingDown, Star, Trash2, GitCompare,
  CheckCircle2, XCircle, Clock, AlertTriangle,
  Upload, Receipt, Printer, Eye, Loader2, X, Search, UserCheck, Send,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { useI18n } from '@/lib/i18n/context';

type PaymentStatus = 'pending' | 'collected' | 'overdue';

// ─── Local types ──────────────────────────────────────────────────────────────
type CostRecordLocal = {
  id: string;
  category: string;
  description: string;
  total_amount: number;
  supplier: string;
  receipt_date: string;
  trade?: string;
  work_item?: string;
  items?: unknown;
  receipt_number?: string;
};
type QAuditAlert = { level: 'critical' | 'warning' | 'tip'; title: string; desc?: string };
type QAuditScore = { total?: number; completeness?: number; price?: number; logic?: number; risk?: number };
type QAnalysisResult = {
  score?: QAuditScore;
  summary?: string;
  alerts?: QAuditAlert[];
  missing?: string[];
  ganttParams?: GanttParams;
};
type QuotationVersionLocal = {
  id: string;
  version: string;
  total_amount: number;
  created_at: string;
  is_active: boolean;
  file_name?: string;
  parsed_items?: { name: string; section?: string; total?: number; qty?: number; unitPrice?: number; status?: string; note?: string }[];
  analysis_result?: QAnalysisResult;
};
type DesignerOcrResult = {
  supplier: string;
  date: string;
  items: { description: string; qty: number; unit: string; unit_cost: number; total: number }[];
  total_amount: number;
  receipt_number?: string;
};

const STATUS_CYCLE: Record<PaymentStatus, PaymentStatus> = {
  pending: 'collected',
  collected: 'overdue',
  overdue: 'pending',
};

const STATUS_LABELS: Record<PaymentStatus, { label: string; color: string }> = {
  pending: { label: '未到期', color: 'bg-gray-100 text-gray-600' },
  collected: { label: '已收款', color: 'bg-green-100 text-green-700' },
  overdue: { label: '待收款', color: 'bg-amber-100 text-amber-700' },
};

export default function ProjectDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();
  const { t } = useI18n();

  const [project, setProject] = useState<Project | null>(null);
  const [ganttTasks, setGanttTasks] = useState<GanttTask[]>([]);
  const [payments, setPayments] = useState<PaymentPhase[]>([]);
  const [photos, setPhotos] = useState<{ id: string; url: string; caption?: string; created_at: string }[]>([]);
  const [costRecords, setCostRecords] = useState<CostRecordLocal[]>([]);
  const [quotationVersions, setQuotationVersions] = useState<QuotationVersionLocal[]>([]);
  const [variationOrders, setVariationOrders] = useState<VariationOrder[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const [showAddVO, setShowAddVO] = useState(false);
  const [voDescription, setVoDescription] = useState('');
  const [voAmount, setVoAmount] = useState('');
  const [voNotes, setVoNotes] = useState('');
  const [contractDirty, setContractDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(() => {
    // Read ?tab= from URL on first render (client-side only)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab) return tab;
    }
    return 'quotations';
  });

  // Gantt schedule controls
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [ganttStartDate, setGanttStartDate] = useState('');
  const [workOnSaturday, setWorkOnSaturday] = useState(false);
  const [workOnSunday, setWorkOnSunday] = useState(false);
  const [ganttDeadline, setGanttDeadline] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // ── Worker assignment ─────────────────────────────────────────────────────
  const [designerWorkers, setDesignerWorkers] = useState<GanttWorkerInfo[]>([]);
  const [workerModal, setWorkerModal] = useState<{ open: boolean; taskId: string | null }>({ open: false, taskId: null });
  const [workerSearch, setWorkerSearch] = useState('');
  const [workerTradeFilter, setWorkerTradeFilter] = useState('all');
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);
  const [isSendingTasks, setIsSendingTasks] = useState(false);

  // Editable client info at top
  const [clientEditMode, setClientEditMode] = useState(false);
  const [editClientName, setEditClientName] = useState('');
  const [editClientPhone, setEditClientPhone] = useState('');
  const [editClientEmail, setEditClientEmail] = useState('');
  const [editClientAddress, setEditClientAddress] = useState('');

  // Quotation view modal
  const [viewingQuotation, setViewingQuotation] = useState<QuotationVersionLocal | null>(null);
  const [quotationViewTab, setQuotationViewTab] = useState<'items' | 'audit'>('items');

  // VO document OCR
  const [voScanState, setVoScanState] = useState<'idle' | 'scanning' | 'done'>('idle');
  const voFileRef = useRef<HTMLInputElement>(null);

  // Designer receipt upload
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTrade, setUploadTrade] = useState('');
  const [uploadOcrState, setUploadOcrState] = useState<'idle' | 'scanning' | 'review' | 'saving' | 'done'>('idle');
  const [uploadOcrResult, setUploadOcrResult] = useState<DesignerOcrResult | null>(null);
  const [uploadOcrError, setUploadOcrError] = useState<string | null>(null);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  // Receipt view
  const [viewingReceipt, setViewingReceipt] = useState<CostRecordLocal | null>(null);
  const uploadFileRef = useRef<HTMLInputElement>(null);
  // Sync status: records when Gantt was last auto-rebuilt from a quotation
  const [ganttSyncedAt, setGanttSyncedAt] = useState<string | null>(null);

  // ── Detect project region from address ────────────────────────────────────
  const projectRegion: 'MY' | 'SG' = (() => {
    const addr = (project?.address || '').toLowerCase();
    return addr.includes('singapore') || addr.includes(', sg') ? 'SG' : 'MY';
  })();

  useEffect(() => {
    loadProject();
  }, [id]);

  const loadProject = async () => { try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setSessionUserId(session.user.id);
      // Load designer's workers
      const { data: dw } = await supabase
        .from('designer_workers')
        .select('id, profile_id, name, phone, trades, status')
        .eq('designer_id', session.user.id)
        .eq('status', 'active');
      if (dw) {
        setDesignerWorkers(dw.map((w: { id: string; profile_id: string; name: string; phone?: string; trades?: string[]; status: string }) => ({
          id: w.id,
          profile_id: w.profile_id || w.id,
          name: w.name,
          phone: w.phone,
          trades: w.trades || [],
          rating: 4.5,
          completion_rate: 90,
        })));
      }
    }

    const { data: p } = await supabase.from('projects').select('*').eq('id', id).single();
    setProject(p);

    const { data: g } = await supabase.from('gantt_tasks').select('*').eq('project_id', id).order('start_date');
    const { data: qvs } = await supabase.from('project_quotations').select('*').eq('project_id', id).order('created_at', { ascending: false });
    if (qvs) setQuotationVersions(qvs);

    // Determine Gantt source: active quotation ganttParams is always source of truth
    const activeQ = qvs?.find((q: QuotationVersionLocal) => q.is_active);
    const ganttParams = activeQ?.analysis_result?.ganttParams;
    const region: 'MY' | 'SG' = (p?.address || '').toLowerCase().includes('singapore') ? 'SG' : 'MY';

    // Use DB start date as reference (preserve user's chosen start date)
    const dbStartDate = (g && g.length > 0) ? new Date(g[0].start_date + 'T00:00:00') : new Date();

    if (ganttParams) {
      // Active quotation has AI-analysed params → always generate from it (source of truth)
      const newTasks = generateGanttFromAIParams(id as string, ganttParams, dbStartDate, region, false, false);
      setGanttTasks(newTasks);

      // Sync DB if content differs (bidirectional trade check)
      const tradeNameToKey: Record<string, string> = {
        electrical: 'electrical', plumbing: 'plumbing', tiling: 'tiling',
        carpentry: 'carpentry', painting: 'painting', 'false ceiling': 'falseCeiling',
        waterproofing: 'waterproofing', demolition: 'demolition',
        construction: 'masonry', aluminium: 'aluminium', flooring: 'flooring', ac: 'aircon',
      };
      const ts = ganttParams.tradeScope || {};
      const dbTrades = new Set((g || []).map((t: GanttTask) => t.trade.toLowerCase()));
      const scopeKeys = Object.keys(ts) as (keyof typeof ts)[];
      // Stale if DB has extra trades or is missing scope trades
      const dbHasExtra = [...dbTrades].some(name => { const k = tradeNameToKey[name]; return k && ts[k as keyof typeof ts] == null; });
      const scopeHasNew = scopeKeys.some(k => { const name = Object.entries(tradeNameToKey).find(([, v]) => v === k)?.[0]; return name && !dbTrades.has(name); });
      const isAllDefault = dbTrades.size <= 2 && dbTrades.has('general') && !dbTrades.has('tiling');
      if (dbHasExtra || scopeHasNew || isAllDefault || !g || g.length === 0) {
        (async () => {
          try {
            await supabase.from('gantt_tasks').delete().eq('project_id', id);
            await supabase.from('gantt_tasks').insert(newTasks.map(t => ({ ...t, assigned_workers: t.assigned_workers || [] })));
          } catch { /* non-blocking */ }
        })();
      }
    } else if (activeQ?.parsed_items && activeQ.parsed_items.length > 0) {
      // No ganttParams but have parsed items — derive trade scope from items
      const newTasks = generateGanttFromQuotation(
        id as string,
        activeQ.parsed_items.map((i: { name: string; section?: string; qty?: number; unitPrice?: number; total?: number }) => ({ ...i, unit: '' })),
        dbStartDate, region, false, false,
      );
      setGanttTasks(newTasks);
      if (!g || g.length === 0) {
        (async () => {
          try { await supabase.from('gantt_tasks').insert(newTasks.map(t => ({ ...t, assigned_workers: [] }))); } catch { /* non-blocking */ }
        })();
      }
    } else if (g && g.length > 0) {
      // No quotation analysis → use saved DB tasks (user-customized schedule)
      setGanttTasks(g);
    } else {
      // No quotation and no DB tasks → show default schedule
      const tasks = generateGanttTasks(id as string, new Date(), 1000, true);
      setGanttTasks(tasks);
    }

    const { data: pay } = await supabase.from('payment_phases').select('*').eq('project_id', id).order('phase_number');
    if (pay) setPayments(pay);
    else {
      const contractAmount = p?.contract_amount || 0;
      setPayments([
        { id: '1', project_id: id as string, phase_number: 1, label: 'Deposit (20%)', amount: contractAmount * 0.2, percentage: 20, status: 'pending' },
        { id: '2', project_id: id as string, phase_number: 2, label: 'Second Payment (30%)', amount: contractAmount * 0.3, percentage: 30, status: 'pending' },
        { id: '3', project_id: id as string, phase_number: 3, label: 'Third Payment (30%)', amount: contractAmount * 0.3, percentage: 30, status: 'pending' },
        { id: '4', project_id: id as string, phase_number: 4, label: 'Final Payment (20%)', amount: contractAmount * 0.2, percentage: 20, status: 'pending' },
      ] as PaymentPhase[]);
    }

    const { data: ph } = await supabase.from('site_photos').select('*').eq('project_id', id).order('created_at', { ascending: false });
    if (ph) setPhotos(ph);

    const { data: costs } = await supabase.from('cost_records').select('*').eq('project_id', id).order('receipt_date', { ascending: false });
    if (costs) setCostRecords(costs);

    const { data: vos } = await supabase.from('variation_orders').select('*').eq('project_id', id).order('created_at', { ascending: false });
    if (vos) setVariationOrders(vos);

    setLoading(false);
  } catch (err) { console.error('[loadProject error]', err); setLoading(false); } };

  const handleTaskUpdate = (taskId: string, updates: Partial<GanttTask>) => {
    setGanttTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
    setIsDirty(true);
  };

  const handleStatusToggle = (taskId: string) => {
    const cycle: GanttTaskStatus[] = ['pending', 'confirmed', 'completed'];
    setGanttTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const cur = cycle.indexOf(t.taskStatus || 'confirmed');
      return { ...t, taskStatus: cycle[(cur + 1) % cycle.length] };
    }));
    setIsDirty(true);
  };

  const handleDurationChange = (taskId: string, newDuration: number) => {
    setGanttTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const start = new Date(t.start_date + 'T00:00:00');
      const newEnd = addWorkdays(start, newDuration - 1, projectRegion, workOnSaturday, workOnSunday);
      const newEndStr = newEnd.toISOString().split('T')[0];
      return { ...t, duration: newDuration, end_date: newEndStr };
    }));
    setIsDirty(true);
  };

  const handleSubtaskToggle = (taskId: string, subtaskId: string) => {
    setGanttTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        subtasks: t.subtasks.map(s =>
          s.id === subtaskId ? { ...s, completed: !s.completed } : s
        ),
      };
    }));
    setIsDirty(true);
  };

  const handleRegenerateGantt = () => {
    if (!ganttStartDate) return;
    const newStart = new Date(ganttStartDate + 'T00:00:00');
    const activeQ = quotationVersions.find(q => q.is_active);
    const ganttParams = activeQ?.analysis_result?.ganttParams;
    const newTasks: GanttTask[] = ganttParams
      ? generateGanttFromAIParams(id as string, ganttParams, newStart, projectRegion, workOnSaturday, workOnSunday)
      : activeQ?.parsed_items && activeQ.parsed_items.length > 0
        ? generateGanttFromQuotation(id as string, activeQ.parsed_items.map(i => ({ ...i, unit: '' })), newStart, projectRegion, workOnSaturday, workOnSunday)
        : generateGanttTasks(id as string, newStart, 1000, true, 'residential', projectRegion, workOnSaturday, workOnSunday);
    setGanttTasks(newTasks);
    setIsDirty(true);
  };

  // ── AI Smart Schedule: compress tasks to fit deadline (dependency-aware) ──
  const handleSmartSchedule = () => {
    if (!ganttDeadline || ganttTasks.length === 0) return;

    const currentStart = ganttTasks.reduce((m, t) => t.start_date < m ? t.start_date : m, ganttTasks[0].start_date);
    const currentEnd   = ganttTasks.reduce((m, t) => t.end_date   > m ? t.end_date   : m, ganttTasks[0].end_date);

    const startDate = new Date(currentStart + 'T00:00:00');
    const currentEndDate = new Date(currentEnd + 'T00:00:00');
    const targetEndDate  = new Date(ganttDeadline + 'T00:00:00');

    if (targetEndDate <= startDate) {
      toast({ title: '⚠️ 截止日期不能早于开始日期', variant: 'destructive' });
      return;
    }
    if (targetEndDate >= currentEndDate) {
      toast({ title: '🎯 已在截止日期内', description: '当前工期不超过截止日期，无需压缩' });
      return;
    }

    // Count workdays from start to current end and to deadline
    const countWorkdays = (from: Date, to: Date): number => {
      let count = 0;
      const d = new Date(from);
      d.setDate(d.getDate() + 1); // start counting from next day
      while (d <= to) {
        if (isWorkday(d, projectRegion, workOnSaturday, workOnSunday)) count++;
        d.setDate(d.getDate() + 1);
      }
      return Math.max(1, count);
    };

    const currentWorkdays = countWorkdays(startDate, currentEndDate);
    const targetWorkdays  = countWorkdays(startDate, targetEndDate);
    const scaleFactor = targetWorkdays / currentWorkdays;

    // Scale durations proportionally (min 1 day each)
    const scaledTasks: GanttTask[] = ganttTasks.map(t => ({
      ...t,
      duration: Math.max(1, Math.round(t.duration * scaleFactor)),
    }));

    // Recompute all start/end dates in dependency order
    const taskEndDates: Record<string, Date> = {};
    for (const task of scaledTasks) {
      let taskStart: Date;
      if (!task.dependencies || task.dependencies.length === 0) {
        taskStart = new Date(startDate);
      } else {
        const depEnds = task.dependencies.map(depId => taskEndDates[depId]).filter(Boolean);
        if (depEnds.length > 0) {
          const latestDepEnd = new Date(Math.max(...depEnds.map(d => d.getTime())));
          // next workday after the dependency ends
          taskStart = addWorkdays(latestDepEnd, 1, projectRegion, workOnSaturday, workOnSunday);
        } else {
          taskStart = new Date(startDate);
        }
      }
      const taskEnd = addWorkdays(taskStart, task.duration - 1, projectRegion, workOnSaturday, workOnSunday);
      taskEndDates[task.id] = taskEnd;
      task.start_date = taskStart.toISOString().split('T')[0];
      task.end_date   = taskEnd.toISOString().split('T')[0];
    }

    setGanttTasks([...scaledTasks]);
    setIsDirty(true);
    const savedDays = Math.round(currentWorkdays - targetWorkdays);
    toast({ title: `🎯 AI 智能压缩完成`, description: `已压缩 ${savedDays} 工作日，截止日期：${ganttDeadline}` });
  };

  // ── Auto-regenerate when workday settings change ───────────────────────────
  useEffect(() => {
    if (!ganttStartDate || ganttTasks.length === 0) return;
    const activeQ = quotationVersions.find(q => q.is_active);
    const startDate = new Date(ganttStartDate + 'T00:00:00');
    if (activeQ?.parsed_items && activeQ.parsed_items.length > 0) {
      const newTasks = generateGanttFromQuotation(
        id as string,
        activeQ.parsed_items.map(pi => ({ ...pi, unit: '' })),
        startDate,
        projectRegion,
        workOnSaturday,
        workOnSunday
      );
      setGanttTasks(newTasks);
    } else {
      const newTasks = generateGanttTasks(id as string, startDate, 1000, true, 'residential', projectRegion, workOnSaturday, workOnSunday);
      setGanttTasks(newTasks);
    }
    setIsDirty(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workOnSaturday, workOnSunday]);

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const upsertData = ganttTasks.map(t => ({
        id: t.id,
        project_id: t.project_id,
        user_id: sessionUserId,
        name: t.name,
        name_zh: t.name_zh,
        trade: t.trade,
        start_date: t.start_date,
        end_date: t.end_date,
        duration: t.duration,
        progress: t.progress,
        dependencies: t.dependencies,
        color: t.color,
        is_critical: t.is_critical,
        taskStatus: t.taskStatus,
        subtasks: t.subtasks,
        assigned_workers: t.assigned_workers,
      }));
      const { error } = await supabase.from('gantt_tasks').upsert(upsertData, { onConflict: 'id' });
      if (error) throw error;
      setIsDirty(false);
      setShowPublishModal(false);
      toast({ title: '✅ 进度已发布！', description: '工人将即时看到最新工序安排' });
    } catch (err) {
      console.error('Gantt publish error:', err);
      toast({ title: '发布失败', description: '请稍后重试', variant: 'destructive' });
    } finally {
      setIsPublishing(false);
    }
  };

  // ── Auto-rebuild Gantt from quotation items + save to DB ─────────────────
  const regenerateAndSaveGantt = async (
    parsedItems?: QuotationVersionLocal['parsed_items'],
    startDateStr?: string,
    ganttParams?: GanttParams,
  ) => {
    const region: 'MY' | 'SG' = (() => {
      const addr = (project?.address || '').toLowerCase();
      return addr.includes('singapore') || addr.includes(', sg') ? 'SG' : 'MY';
    })();

    const start = startDateStr
      ? new Date(startDateStr + 'T00:00:00')
      : ganttTasks.length > 0
        ? new Date(ganttTasks[0].start_date + 'T00:00:00')
        : new Date();

    // Priority: AI params > parsed items regex > default
    const newTasks = ganttParams
      ? generateGanttFromAIParams(id as string, ganttParams, start, region, workOnSaturday, workOnSunday)
      : parsedItems && parsedItems.length > 0
        ? generateGanttFromQuotation(
            id as string,
            parsedItems.map(pi => ({ ...pi, unit: '' })),
            start,
            region,
            workOnSaturday,
            workOnSunday
          )
        : generateGanttTasks(id as string, start, 1000, true, 'residential', region, workOnSaturday, workOnSunday);

    setGanttTasks(newTasks);
    setIsDirty(false);

    // Preserve existing worker assignments where task IDs match
    const existingAssignments: Record<string, string[]> = {};
    for (const t of ganttTasks) {
      if ((t.assigned_workers || []).length > 0) {
        existingAssignments[t.id] = t.assigned_workers!;
      }
    }
    const tasksWithWorkers = newTasks.map(t => ({
      ...t,
      assigned_workers: existingAssignments[t.id] || [],
    }));

    // Delete old tasks and insert new ones atomically
    try {
      const { error: delErr } = await supabase.from('gantt_tasks').delete().eq('project_id', id);
      if (delErr) console.error('Gantt delete error:', delErr);
      const { error: insErr } = await supabase.from('gantt_tasks').insert(
        tasksWithWorkers.map(t => ({
          id: t.id,
          project_id: t.project_id,
          user_id: sessionUserId,
          name: t.name,
          name_zh: t.name_zh,
          trade: t.trade,
          start_date: t.start_date,
          end_date: t.end_date,
          duration: t.duration,
          progress: t.progress,
          dependencies: t.dependencies,
          color: t.color,
          is_critical: t.is_critical,
          taskStatus: t.taskStatus,
          subtasks: t.subtasks,
          assigned_workers: t.assigned_workers,
        }))
      );
      if (insErr) console.error('Gantt insert error:', insErr);
      const now = new Date().toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' });
      setGanttSyncedAt(now);
      setGanttTasks(tasksWithWorkers);
    } catch (err) {
      console.error('Gantt save error:', err);
    }
  };

  // ── Open worker assign modal ───────────────────────────────────────────────
  const openWorkerModal = (taskId: string) => {
    const task = ganttTasks.find(t => t.id === taskId);
    if (!task) return;
    setSelectedWorkerIds(task.assigned_workers || []);
    setWorkerSearch('');
    setWorkerTradeFilter('all');
    setWorkerModal({ open: true, taskId });
  };

  const confirmAssignWorkers = async () => {
    if (!workerModal.taskId) return;
    setGanttTasks(prev => prev.map(t =>
      t.id === workerModal.taskId ? { ...t, assigned_workers: selectedWorkerIds } : t
    ));
    setIsDirty(true);
    setWorkerModal({ open: false, taskId: null });
    toast({ title: '✅ 工人已分配', description: `已为该工序分配 ${selectedWorkerIds.length} 位工人` });
  };

  const removeWorkerFromTask = (taskId: string, workerId: string) => {
    setGanttTasks(prev => prev.map(t =>
      t.id === taskId
        ? { ...t, assigned_workers: (t.assigned_workers || []).filter(w => w !== workerId) }
        : t
    ));
    setIsDirty(true);
  };

  // ── Send tasks to assigned workers ────────────────────────────────────────
  const handleSendToWorkers = async () => {
    setIsSendingTasks(true);
    try {
      // Upsert gantt tasks with worker assignments
      const upsertData = ganttTasks.map(t => ({
        id: t.id,
        project_id: t.project_id,
        user_id: sessionUserId,
        name: t.name,
        name_zh: t.name_zh,
        trade: t.trade,
        start_date: t.start_date,
        end_date: t.end_date,
        duration: t.duration,
        progress: t.progress,
        dependencies: t.dependencies,
        color: t.color,
        is_critical: t.is_critical,
        taskStatus: t.taskStatus,
        subtasks: t.subtasks,
        assigned_workers: t.assigned_workers,
      }));
      await supabase.from('gantt_tasks').upsert(upsertData, { onConflict: 'id' });
      setIsDirty(false);
      toast({
        title: '📤 任务已发送给工人！',
        description: `${ganttTasks.filter(t => (t.assigned_workers || []).length > 0).length} 个工序已通知 ${Array.from(new Set(ganttTasks.flatMap(t => t.assigned_workers || []))).length} 位工人`,
      });
    } catch {
      toast({ title: '发送失败', description: '请稍后重试', variant: 'destructive' });
    } finally {
      setIsSendingTasks(false);
    }
  };

  const saveClientInfo = async () => {
    await supabase.from('projects').update({
      client_name: editClientName,
      client_phone: editClientPhone,
      client_email: editClientEmail,
      address: editClientAddress,
    }).eq('id', id as string);
    setProject(prev => prev ? { ...prev, client_name: editClientName, client_phone: editClientPhone, client_email: editClientEmail, address: editClientAddress } : prev);
    setClientEditMode(false);
    toast({ title: '✅ 客户资料已保存' });
  };

  const handleVOFileUpload = async (file: File) => {
    setVoScanState('scanning');
    try {
      const readAsBase64 = (f: File): Promise<string> =>
        new Promise((res, rej) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            res(result.split(',')[1]);
          };
          reader.onerror = rej;
          reader.readAsDataURL(f);
        });
      const base64 = await readAsBase64(file);
      const mimeType = file.type || 'image/jpeg';
      const resp = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      });
      const data = await resp.json();
      if (data.supplier || data.total_amount) {
        // Auto-fill VO form
        const desc = data.items?.[0]?.description || data.supplier || '变更内容';
        const amt = data.total_amount || 0;
        setVoDescription(desc);
        setVoAmount(String(amt));
        setShowAddVO(true);
        toast({ title: '✅ OCR 识别成功', description: `已提取金额 RM ${amt}` });
      }
    } catch {
      toast({ title: 'OCR 识别失败', variant: 'destructive' });
    } finally {
      setVoScanState('done');
    }
  };

  const printQuotation = (qv: QuotationVersionLocal) => {
    const items = qv.parsed_items || [];
    const win = window.open('', '_blank');
    if (!win) return;
    const rows = items.map(i =>
      `<tr><td>${i.section || ''}</td><td>${i.name}</td><td style="text-align:right">${i.qty || ''}</td><td style="text-align:right">RM ${(i.unitPrice || 0).toFixed(2)}</td><td style="text-align:right">RM ${(i.total || 0).toFixed(2)}</td></tr>`
    ).join('');
    win.document.write(`
      <html><head><title>${qv.file_name || 'Quotation'}</title>
      <style>body{font-family:Arial,sans-serif;padding:30px;font-size:12px}h2{font-size:16px;margin-bottom:4px}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #ddd;padding:6px 8px;text-align:left}th{background:#f5f5f5;font-weight:600}.total{text-align:right;font-weight:bold;margin-top:12px;font-size:14px}</style>
      </head><body>
      <h2>${project?.name || 'Project'} — ${qv.file_name || 'Quotation'}</h2>
      <p style="color:#666;font-size:11px">${project?.address || ''} · ${qv.created_at.slice(0,10)} · Version ${qv.version}</p>
      <table><thead><tr><th>Section</th><th>Description</th><th style="text-align:right">Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Total</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <p class="total">Total: RM ${(qv.total_amount || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}</p>
      <script>window.onload=function(){window.print();}</script>
      </body></html>`);
    win.document.close();
  };

  const cyclePaymentStatus = async (payId: string) => {
    setPayments(prev => prev.map(p => {
      if (p.id !== payId) return p;
      const next = STATUS_CYCLE[p.status as PaymentStatus];
      return { ...p, status: next };
    }));
    const payment = payments.find(p => p.id === payId);
    if (payment) {
      const next = STATUS_CYCLE[payment.status as PaymentStatus];
      await supabase.from('payment_phases').update({ status: next, updated_at: new Date().toISOString() }).eq('id', payId);
    }
  };

  const handleAddVO = async () => {
    if (!voDescription.trim() || !voAmount) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const approvedVOs = variationOrders.filter(v => v.status === 'approved');
    const voNumber = `VO-${String(variationOrders.length + 1).padStart(3, '0')}`;
    const amount = parseFloat(voAmount) || 0;

    const { data, error } = await supabase.from('variation_orders').insert({
      project_id: id,
      vo_number: voNumber,
      description: voDescription,
      amount,
      status: 'pending',
    }).select().single();

    if (!error && data) {
      setVariationOrders(prev => [data, ...prev]);
      setVoDescription('');
      setVoAmount('');
      setVoNotes('');
      setShowAddVO(false);
      toast({ title: 'Variation order added', description: `${voNumber} pending approval` });
    }
  };

  const handleVOStatusChange = async (voId: string, newStatus: 'approved' | 'rejected') => {
    const vo = variationOrders.find(v => v.id === voId);
    if (!vo) return;

    const updates: Partial<VariationOrder> & { approved_at?: string } = {
      status: newStatus,
      ...(newStatus === 'approved' ? { approved_at: new Date().toISOString() } : {}),
    };

    await supabase.from('variation_orders').update(updates).eq('id', voId);
    setVariationOrders(prev => prev.map(v => v.id === voId ? { ...v, ...updates } : v));

    if (newStatus === 'approved' && project) {
      // Update contract amount
      const newContractAmount = (project.contract_amount || 0) + (vo.status !== 'approved' ? vo.amount : 0);
      await supabase.from('projects').update({ contract_amount: newContractAmount }).eq('id', id);
      setProject(prev => prev ? { ...prev, contract_amount: newContractAmount } : prev);
      setContractDirty(true);
      toast({ title: 'VO Approved', description: `Contract updated to ${formatCurrency(newContractAmount)}` });

      // Append VO task to Gantt (auto insert before handover)
      const region: 'MY' | 'SG' = (() => {
        const addr = (project?.address || '').toLowerCase();
        return addr.includes('singapore') || addr.includes(', sg') ? 'SG' : 'MY';
      })();
      const newTasksWithVO = appendVOTask(ganttTasks, vo.id, vo.description, vo.amount, id as string, region);
      setGanttTasks(newTasksWithVO);
      setIsDirty(false);
      // Save updated tasks to DB
      await supabase.from('gantt_tasks').delete().eq('project_id', id);
      await supabase.from('gantt_tasks').insert(
        newTasksWithVO.map(t => ({
          id: t.id, project_id: t.project_id, name: t.name, name_zh: t.name_zh,
          trade: t.trade, start_date: t.start_date, end_date: t.end_date,
          duration: t.duration, progress: t.progress, dependencies: t.dependencies,
          color: t.color, is_critical: t.is_critical, taskStatus: t.taskStatus,
          subtasks: t.subtasks, assigned_workers: t.assigned_workers,
        }))
      );
      toast({ title: '📋 进度表已更新', description: `VO「${vo.description}」已加入施工排程` });

      // Auto-add VO as payment phase
      const voPhaseNumber = payments.length + 1;
      const { data: newPay } = await supabase.from('payment_phases').insert({
        project_id: id,
        phase_number: voPhaseNumber,
        label: `${vo.vo_number}: ${vo.description}`,
        amount: vo.amount,
        percentage: 0,
        status: 'pending',
      }).select().single();
      if (newPay) setPayments(prev => [...prev, newPay]);
    } else if (newStatus === 'rejected') {
      toast({ title: 'VO Rejected', description: vo.vo_number + ' has been rejected' });
    }
  };

  // ─── Helper: detect trade from text keywords (normalized lowercase output) ──
  const detectTrade = (text: string): string => {
    const t = (text || '').toLowerCase();
    if (/electr|wir|db board|switch|socket|mcb|conduit|breaker|fuse|cable/.test(t)) return 'electrical';
    if (/plumb|pipe|sanit|wc|basin|tap|cistern|drainage|sewage|toilet/.test(t)) return 'plumbing';
    if (/til|ceram|porcel|mosaic|grout|homogen/.test(t)) return 'tiling';
    if (/carp|cabinet|wardrobe|joiner|kitchen|built.in|carpentry|cabinetry/.test(t)) return 'carpentry';
    if (/paint|coat|primer|putty|skim|emulsion|finish/.test(t)) return 'painting';
    if (/ceil|partition|gypsum|plaster|false ceiling|cornice/.test(t)) return 'false ceiling';
    if (/water.?proof|membrane|tanking/.test(t)) return 'waterproofing';
    if (/demol|hack|break|knock|removal|hacking/.test(t)) return 'demolition';
    if (/floor|timber|vinyl|laminate|parquet|spc/.test(t)) return 'flooring';
    if (/alum|window|door frame|sliding|casement/.test(t)) return 'aluminium';
    if (/glass|shower scr|mirror|temper/.test(t)) return 'glass';
    if (/air.?con|daikin|midea|aircon|hvac|split unit|fcn/.test(t)) return 'ac';
    if (/stone|marble|quartz|granite|top/.test(t)) return 'stone';
    if (/clean|polish|wash/.test(t)) return 'cleaning';
    if (/brick|cement|sand|concrete|mason|plaster|screed|render/.test(t)) return 'construction';
    return 'other';
  };

  // ─── Helper: parse items JSONB ────────────────────────────────────────────
  const parseReceiptItems = (r: CostRecordLocal) => {
    try {
      const raw = r.items;
      const items = Array.isArray(raw) ? raw : (typeof raw === 'string' ? JSON.parse(raw) : []);
      if (Array.isArray(items) && items.length > 0)
        return items as { description: string; qty?: number; unit?: string; unit_cost?: number; total: number }[];
    } catch { /* fall through */ }
    return [{ description: r.description || '单据明细', total: r.total_amount }];
  };

  // ─── Print receipt in new window ──────────────────────────────────────────
  const handlePrintReceipt = (r: CostRecordLocal) => {
    const items = parseReceiptItems(r);
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>单据 ${r.supplier || ''}</title>
    <style>body{font-family:Arial,sans-serif;padding:40px;max-width:600px;margin:0 auto}
    h2{margin-bottom:4px}.meta{color:#666;font-size:13px;margin-bottom:20px;line-height:1.8}
    table{width:100%;border-collapse:collapse;margin-top:16px}
    th,td{border:1px solid #ddd;padding:8px 12px;text-align:left;font-size:13px}
    th{background:#f5f5f5;font-weight:600}.footer{margin-top:20px;text-align:right;font-weight:bold;font-size:15px}
    </style></head><body>
    <h2>单据 Receipt — ${r.supplier || 'Unknown'}</h2>
    <div class="meta">
      <div><b>供应商:</b> ${r.supplier || '—'}</div>
      <div><b>日期:</b> ${r.receipt_date || '—'}</div>
      <div><b>工种:</b> ${r.trade || r.category || '—'}</div>
      <div><b>工序:</b> ${r.work_item || '—'}</div>
      ${r.receipt_number ? `<div><b>单据编号:</b> ${r.receipt_number}</div>` : ''}
    </div>
    <table><tr><th>品项描述</th><th>数量</th><th>单位</th><th>单价</th><th>金额</th></tr>
    ${items.map(i => `<tr><td>${i.description || '—'}</td><td>${i.qty ?? '—'}</td><td>${i.unit ?? '—'}</td><td>${i.unit_cost != null ? 'RM ' + Number(i.unit_cost).toFixed(2) : '—'}</td><td>RM ${Number(i.total || 0).toFixed(2)}</td></tr>`).join('')}
    </table>
    <div class="footer">合计 Total: RM ${Number(r.total_amount || 0).toFixed(2)}</div>
    <script>window.onload=()=>{window.print();}</script>
    </body></html>`);
    win.document.close();
  };

  // ─── Designer: handle OCR file select ─────────────────────────────────────
  const handleDesignerFileSelect = async (file: File) => {
    setUploadOcrError(null);
    setUploadOcrState('scanning');

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setUploadOcrError('不支持的文件格式，请上传 JPG / PNG / PDF');
      setUploadOcrState('idle');
      return;
    }

    // File size check (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadOcrError('文件过大（最大 10MB），请压缩后重试');
      setUploadOcrState('idle');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const dataUrl = e.target?.result as string;
        // Strip data URL prefix to get pure base64
        const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
        const res = await fetch('/api/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || 'OCR failed');
        }
        setUploadOcrResult(data);
        setUploadOcrState('review');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'OCR 扫描失败';
        setUploadOcrError(msg.length < 80 ? msg : 'OCR 扫描失败，请重试或手动填写');
        setUploadOcrState('idle');
      }
    };
    reader.onerror = () => {
      setUploadOcrError('文件读取失败，请重试');
      setUploadOcrState('idle');
    };
    reader.readAsDataURL(file);
  };

  // ─── Designer: save receipt ────────────────────────────────────────────────
  const handleDesignerSave = async () => {
    if (!uploadOcrResult || !sessionUserId || !uploadTrade) return;
    setUploadOcrState('saving');
    try {
      const itemsToSave = uploadOcrResult.items.length > 0
        ? uploadOcrResult.items
        : [{ description: '单据明细', qty: 1, unit: 'lot', unit_cost: uploadOcrResult.total_amount, total: uploadOcrResult.total_amount }];
      for (const item of itemsToSave) {
        await supabase.from('cost_records').insert({
          project_id: id,
          user_id: sessionUserId,
          uploaded_by: sessionUserId,
          supplier: uploadOcrResult.supplier || '未知供应商',
          receipt_date: uploadOcrResult.date || new Date().toISOString().split('T')[0],
          category: uploadTrade + '_material',
          description: item.description,
          total_amount: item.total,
          items: uploadOcrResult.items,
          trade: uploadTrade,
          work_item: uploadTrade,
          receipt_number: uploadOcrResult.receipt_number,
        });
      }
      setUploadOcrState('done');
      setTimeout(() => {
        setShowUploadModal(false);
        setUploadOcrState('idle');
        setUploadOcrResult(null);
        setUploadTrade('');
        loadProject();
      }, 1200);
    } catch {
      setUploadOcrError('保存失败，请重试');
      setUploadOcrState('review');
    }
  };

  const totalCollected = payments.filter(p => p.status === 'collected').reduce((s, p) => s + p.amount, 0);
  const totalOutstanding = payments.filter(p => p.status !== 'collected').reduce((s, p) => s + p.amount, 0);
  const totalCost = costRecords.reduce((s, r) => s + (r.total_amount || 0), 0);
  const revenue = project?.contract_amount || 0;
  const grossProfit = revenue - totalCost;
  const margin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

  const COST_COLORS: Record<string, string> = {
    tiling_material: '#3B82F6', electrical_material: '#F59E0B', plumbing_material: '#10B981',
    carpentry_material: '#8B5CF6', paint: '#EC4899', cement: '#6B7280', steel: '#64748B',
    general_labour: '#F97316', other: '#9CA3AF',
  };
  const COST_LABELS: Record<string, string> = {
    tiling_material: 'Tiling', electrical_material: 'Electrical', plumbing_material: 'Plumbing',
    carpentry_material: 'Carpentry', paint: 'Paint', cement: 'Cement', steel: 'Steel',
    general_labour: 'Labour', other: 'Other',
  };
  const costByCategory: Record<string, number> = {};
  for (const r of costRecords) {
    costByCategory[r.category] = (costByCategory[r.category] || 0) + r.total_amount;
  }

  // ─── Per-trade computations ───────────────────────────────────────────────
  const catToTrade = (cat: string, tr?: string): string => {
    if (tr) return tr;
    if (cat.startsWith('electrical')) return 'electrical';
    if (cat.startsWith('plumbing')) return 'plumbing';
    if (cat.startsWith('tiling')) return 'tiling';
    if (cat.startsWith('carpentry')) return 'carpentry';
    if (cat === 'paint') return 'painting';
    if (cat === 'cement') return 'demolition';
    if (cat === 'waterproofing') return 'waterproofing';
    if (cat === 'ceiling') return 'ceiling';
    if (cat === 'flooring') return 'flooring';
    return 'other';
  };
  const costByTrade: Record<string, number> = {};
  for (const r of costRecords) {
    const key = catToTrade(r.category, r.trade).toLowerCase();
    costByTrade[key] = (costByTrade[key] || 0) + (r.total_amount || 0);
  }
  const activeQ = quotationVersions.find(q => q.is_active);
  const quotedByTrade: Record<string, number> = {};
  if (activeQ?.parsed_items) {
    for (const item of activeQ.parsed_items) {
      // Try section first, then item name — section often has better category info
      const sectionKey = detectTrade(item.section || '');
      const nameKey    = detectTrade(item.name || '');
      // Prefer section match unless it's 'other'
      const key = (sectionKey !== 'other' ? sectionKey : nameKey).toLowerCase();
      if (key !== 'other' || (item.total || 0) > 0) {
        quotedByTrade[key] = (quotedByTrade[key] || 0) + (item.total || 0);
      }
    }
  }
  // Normalize: merge gantt trade names to lowercase
  const ganttTradeKeys = Array.from(new Set(ganttTasks.map(t => t.trade.toLowerCase()))).filter(Boolean);
  const allTrades = Array.from(new Set([
    ...ganttTradeKeys,
    ...Object.keys(costByTrade),
    ...Object.keys(quotedByTrade),
  ])).filter(k => k && k !== 'other' && k !== 'measurement' && k !== 'handover');
  // Trade selector for upload dropdown
  const projectTrades = [
    ...Array.from(new Set(ganttTasks.map(t => t.trade))).filter(Boolean).map(trade => ({
      trade,
      label: (ganttTasks.find(t => t.trade === trade)?.name || trade) + ` (${trade})`,
    })),
    { trade: 'other', label: 'Other 其他' },
  ];
  const TRADE_DOT_COLORS: Record<string, string> = {
    electrical: '#f97316', plumbing: '#3b82f6', tiling: '#34d399',
    carpentry: '#60a5fa', painting: '#a78bfa', ceiling: '#4ade80',
    waterproofing: '#fbbf24', demolition: '#f87171', flooring: '#2dd4bf',
    aluminium: '#a3e635', glass: '#67e8f9', ac: '#38bdf8', other: '#9CA3AF',
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-400">Loading project...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <Toaster />
      {/* Header + Client Info (merged into one bar) */}
      <div className="bg-white border-b border-gray-100 px-6 pt-4 pb-3">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-2" aria-label="Breadcrumb">
          <button onClick={() => router.push('/designer/projects')} className="hover:text-[#4F8EF7] transition-colors">Projects</button>
          <span>/</span>
          <span className="text-gray-700 font-medium truncate max-w-[200px]">{project?.name || 'Project'}</span>
        </nav>
        {/* Row 1: back / title / status */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100 flex-shrink-0" aria-label="Go back">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 leading-tight">{project?.name || 'Project'}</h1>
          </div>
          <Badge className={`flex-shrink-0 ${
            project?.status === 'active' ? 'bg-orange-100 text-orange-700' :
            project?.status === 'completed' ? 'bg-green-100 text-green-700' :
            'bg-blue-100 text-blue-700'
          }`}>
            {project?.status === 'pending' ? t.proj.statusPending : project?.status === 'active' ? t.proj.statusActive : t.proj.statusCompleted}
          </Badge>
        </div>

        {/* Row 2: client info (view or edit) */}
        <div className="mt-2.5 pl-11">
          {clientEditMode ? (
            /* Edit mode */
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-400 uppercase tracking-wide block mb-1">客户姓名</label>
                  <input value={editClientName} onChange={e => setEditClientName(e.target.value)}
                    placeholder="客户姓名"
                    className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#4F8EF7]" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 uppercase tracking-wide block mb-1">手机号码</label>
                  <input value={editClientPhone} onChange={e => setEditClientPhone(e.target.value)}
                    placeholder="+60 12-345 6789"
                    className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#4F8EF7]" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 uppercase tracking-wide block mb-1">电子邮件</label>
                  <input value={editClientEmail} onChange={e => setEditClientEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#4F8EF7]" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 uppercase tracking-wide block mb-1">地址</label>
                  <input value={editClientAddress} onChange={e => setEditClientAddress(e.target.value)}
                    placeholder="施工地址"
                    className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#4F8EF7]" />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setClientEditMode(false)}
                  className="text-xs px-3 py-1 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50">
                  取消
                </button>
                <button onClick={saveClientInfo}
                  className="text-xs px-4 py-1 bg-[#4F8EF7] text-white rounded-lg hover:bg-[#3B7BE8] font-semibold">
                  ✓ 保存
                </button>
              </div>
            </div>
          ) : (
            /* Display mode */
            <div className="flex items-center gap-4 flex-wrap">
              {/* Address */}
              <span className="text-xs text-gray-400 truncate max-w-xs" title={project?.address || ''}>
                📍 {project?.address || '—'}
              </span>

              {/* Divider */}
              {(project?.client_name || project?.client_phone) && (
                <div className="w-px h-3.5 bg-gray-200 flex-shrink-0" />
              )}

              {/* Client name */}
              {project?.client_name && (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <div className="w-5 h-5 rounded-full bg-[#4F8EF7]/10 flex items-center justify-center">
                    <User className="w-3 h-3 text-[#4F8EF7]" />
                  </div>
                  <span className="text-sm font-semibold text-gray-800">{project.client_name}</span>
                </div>
              )}

              {/* Phone */}
              {project?.client_phone && (
                <a href={`tel:${project.client_phone}`}
                  className="text-xs text-gray-500 hover:text-[#4F8EF7] transition-colors flex-shrink-0">
                  📞 {project.client_phone}
                </a>
              )}

              {/* Email */}
              {project?.client_email && (
                <a href={`mailto:${project.client_email}`}
                  className="text-xs text-gray-500 hover:text-[#4F8EF7] transition-colors flex-shrink-0 hidden sm:block">
                  ✉️ {project.client_email}
                </a>
              )}

              {/* WhatsApp */}
              {project?.client_phone && (
                <a href={`https://wa.me/${project.client_phone.replace(/[^0-9]/g, '')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-xs px-2 py-0.5 bg-green-50 border border-green-200 text-green-700 rounded-md hover:bg-green-100 transition-colors flex-shrink-0">
                  💬 WA
                </a>
              )}

              {/* Edit */}
              <button
                onClick={() => {
                  setEditClientName(project?.client_name || '');
                  setEditClientPhone(project?.client_phone || '');
                  setEditClientEmail(project?.client_email || '');
                  setEditClientAddress(project?.address || '');
                  setClientEditMode(true);
                }}
                className="text-xs px-2.5 py-0.5 border border-gray-200 text-gray-400 rounded-md hover:text-gray-600 hover:border-gray-300 transition-colors flex-shrink-0"
              >
                {`✏️ ${t.proj.edit}`}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Financial Summary Bar */}
      <div className="bg-white border-b border-gray-100 px-6 py-3">
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: t.proj.contractTotal, value: formatCurrency(revenue), sub: t.proj.fromQuotation, color: '#3B82F6', bg: 'rgba(59,130,246,0.06)', borderColor: 'rgba(59,130,246,0.12)' },
            { label: t.proj.recordedCost, value: formatCurrency(totalCost), sub: t.proj.fromReceipts, color: '#F97316', bg: 'rgba(249,115,22,0.06)', borderColor: 'rgba(249,115,22,0.12)' },
            { label: t.proj.grossProfit, value: formatCurrency(grossProfit), sub: t.proj.revenueCost, color: grossProfit >= 0 ? '#22C55E' : '#EF4444', bg: grossProfit >= 0 ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)', borderColor: grossProfit >= 0 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)' },
            { label: t.proj.profitMargin, value: `${margin.toFixed(1)}%`, sub: margin >= 20 ? t.proj.healthy : margin >= 10 ? '一般' : revenue === 0 ? '—' : '偏低', color: revenue === 0 ? '#9CA3AF' : margin >= 20 ? '#22C55E' : margin >= 10 ? '#4F8EF7' : '#EF4444', bg: 'rgba(139,92,246,0.06)', borderColor: 'rgba(139,92,246,0.12)' },
          ].map(({ label, value, sub, color, bg, borderColor }) => (
            <div key={label} className="rounded-xl p-3 text-center" style={{ background: bg, border: `1px solid ${borderColor}` }}>
              <div className="text-xs text-gray-500 mb-1">{label}</div>
              <div className="font-bold text-sm" style={{ color }}>{value}</div>
              <div className="text-xs text-gray-400">{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="bg-white border-b border-gray-100 px-6" style={{ overflowX: 'auto', scrollbarWidth: 'none' }}>
            <TabsList className="bg-transparent h-auto p-0 gap-1.5 w-full justify-start" style={{ display: 'flex', padding: '8px 0' }}>
              {[
                { value: 'quotations', label: t.proj.quotationsVO, icon: FileText },
                { value: 'gantt',      label: t.proj.gantt, icon: BarChart2 },
                { value: 'payments',   label: t.proj.payments, icon: CreditCard },
                { value: 'photos',     label: t.proj.photos, icon: Camera },
                { value: 'profit',     label: t.proj.profit, icon: TrendingUp },
              ].map(({ value, label, icon: Icon }) => (
                <TabsTrigger key={value} value={value}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                    border border-transparent
                    data-[state=inactive]:text-gray-500 data-[state=inactive]:hover:text-gray-700 data-[state=inactive]:hover:bg-gray-50
                    data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#4F8EF7] data-[state=active]:via-[#8B5CF6] data-[state=active]:to-[#EC4899] data-[state=active]:text-white data-[state=active]:border-transparent data-[state=active]:shadow-md
                  `}>
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Gantt Tab */}
          <TabsContent value="gantt" className="flex-1 p-4 overflow-y-auto mt-0">

            {/* ── Dirty banner (info only, no extra button) ── */}
            {isDirty && (
              <div className="flex items-center gap-3 px-4 py-2.5 bg-[#4F8EF7]/5 border border-[#4F8EF7]/20 rounded-xl mb-3">
                <span className="w-2 h-2 rounded-full bg-[#4F8EF7] animate-pulse flex-shrink-0" />
                <p className="text-xs text-[#4A4A6A]">
                  <span className="font-semibold">进度已修改，尚未同步。</span>
                  完成分配工人后点击「保存并分配工人」按钮发布。
                </p>
              </div>
            )}

            {/* ── Top Schedule Planning Bar ── */}
            {(() => {
              // Exclude planning phases (site survey, design confirmation) from displayed start
              const PRE_PHASES = ['-measurement', '-design_conf'];
              const constructionTasks = ganttTasks.filter(t => !PRE_PHASES.some(p => t.id.endsWith(p)));
              const displayTasks = constructionTasks.length > 0 ? constructionTasks : ganttTasks;
              const gStart = displayTasks.length > 0 ? displayTasks.reduce((m,t)=>t.start_date<m?t.start_date:m, displayTasks[0].start_date) : '';
              const gEnd   = ganttTasks.length > 0 ? ganttTasks.reduce((m,t)=>t.end_date>m?t.end_date:m, ganttTasks[0].end_date)   : '';
              const calDays = gStart && gEnd
                ? Math.ceil((new Date(gEnd).getTime() - new Date(gStart).getTime()) / 86400000) + 1
                : 0;
              const calWeeks  = calDays > 0 ? (calDays / 7).toFixed(1) : '—';
              const calMonths = calDays > 0 ? (calDays / 30.4).toFixed(1) : '—';
              const fmtDate = (s: string) => {
                if (!s) return '';
                const d = new Date(s);
                return `${d.getDate()} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]}`;
              };
              return (
                <div className="mb-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <div className="flex flex-wrap items-center gap-4">
                    {/* Start Date */}
                    <div>
                      <div className="text-[10px] text-gray-400 mb-1 font-medium">开始日期</div>
                      <input
                        type="date"
                        value={ganttStartDate}
                        onChange={e => setGanttStartDate(e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 focus:outline-none focus:border-[#4F8EF7] bg-gray-50 w-36"
                      />
                    </div>

                    {/* Work Days */}
                    <div>
                      <div className="text-[10px] text-gray-400 mb-1 font-medium">工作日</div>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer select-none">
                          <input type="checkbox" checked={workOnSaturday}
                            onChange={e => setWorkOnSaturday(e.target.checked)}
                            className="accent-[#4F8EF7] w-3.5 h-3.5" />
                          周六
                        </label>
                        <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer select-none">
                          <input type="checkbox" checked={workOnSunday}
                            onChange={e => setWorkOnSunday(e.target.checked)}
                            className="accent-[#4F8EF7] w-3.5 h-3.5" />
                          周日
                        </label>
                        <span className="text-[10px] text-gray-400">默认排除周末</span>
                      </div>
                    </div>

                    {/* 🎯 Target Deadline */}
                    <div>
                      <div className="text-[10px] text-gray-400 mb-1 font-medium flex items-center gap-1">
                        🎯 交付截止日期
                      </div>
                      <input
                        type="date"
                        value={ganttDeadline}
                        onChange={e => setGanttDeadline(e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 focus:outline-none focus:border-[#4F8EF7] bg-gray-50 w-36"
                      />
                    </div>

                    {/* AI Duration Summary + Deadline status */}
                    {calDays > 0 && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-[#4F8EF7]/5 border border-[#4F8EF7]/15 rounded-xl">
                        <div>
                          <div className="text-sm font-bold text-[#1A1A2E]">{calWeeks} 日历周 <span className="text-xs font-normal text-[#4A4A6A]">(≈{calMonths}个月)</span></div>
                          <div className="text-[11px] text-[#4F8EF7]">{fmtDate(gStart)} → {fmtDate(gEnd)}</div>
                          {ganttDeadline && (() => {
                            const deadlineDays = Math.ceil((new Date(ganttDeadline).getTime() - new Date(gStart).getTime()) / 86400000) + 1;
                            const diff = deadlineDays - calDays;
                            if (diff >= 0) return (
                              <div className="text-[10px] text-green-600 font-medium mt-0.5">✅ 工期提前 {diff} 天完成</div>
                            );
                            return (
                              <div className="text-[10px] text-red-500 font-medium mt-0.5">⚠️ 超出截止日期 {Math.abs(diff)} 天</div>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Sync badge */}
                    {ganttSyncedAt && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-50 border border-green-200 rounded-xl">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                        <span className="text-[10px] text-green-700 font-medium whitespace-nowrap">
                          已自动同步 {ganttSyncedAt}
                        </span>
                      </div>
                    )}

                    {/* Regenerate + action buttons */}
                    <div className="flex items-center gap-2 ml-auto">
                      {/* AI Smart Schedule: compress to deadline */}
                      {ganttDeadline && ganttTasks.length > 0 && (() => {
                        const currentEnd = ganttTasks.reduce((m,t)=>t.end_date>m?t.end_date:m, ganttTasks[0].end_date);
                        const currentStart2 = ganttTasks.reduce((m,t)=>t.start_date<m?t.start_date:m, ganttTasks[0].start_date);
                        const calD = Math.ceil((new Date(currentEnd).getTime() - new Date(currentStart2).getTime()) / 86400000) + 1;
                        const tgtD = Math.ceil((new Date(ganttDeadline).getTime() - new Date(currentStart2).getTime()) / 86400000) + 1;
                        const needCompress = tgtD < calD;
                        return needCompress ? (
                          <button
                            onClick={handleSmartSchedule}
                            className="text-xs px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors whitespace-nowrap flex items-center gap-1 font-semibold"
                          >
                            ✦ AI 智能压缩工期
                          </button>
                        ) : null;
                      })()}
                      {/* Manual re-generate from active quotation */}
                      {quotationVersions.find(q => q.is_active)?.parsed_items && (
                        <button
                          onClick={async () => {
                            const activeQ = quotationVersions.find(q => q.is_active);
                            toast({ title: '🔄 重新推算工期…' });
                            await regenerateAndSaveGantt(activeQ?.parsed_items, ganttStartDate || undefined, activeQ?.analysis_result?.ganttParams);
                            toast({ title: '✅ 进度表已更新', description: '已根据报价单智能重新排程' });
                          }}
                          className="text-xs px-3 py-1.5 bg-[#4F8EF7]/10 text-[#4F8EF7] border border-[#4F8EF7]/30 rounded-lg hover:bg-[#4F8EF7]/20 transition-colors whitespace-nowrap flex items-center gap-1"
                        >
                          ✨ 根据报价重新排程
                        </button>
                      )}
                      {ganttStartDate && !(quotationVersions.find(q => q.is_active)?.parsed_items) && (
                        <button onClick={handleRegenerateGantt}
                          className="text-xs px-3 py-1.5 bg-[#4F8EF7]/10 text-[#4F8EF7] border border-[#4F8EF7]/30 rounded-lg hover:bg-[#4F8EF7]/20 transition-colors whitespace-nowrap flex items-center gap-1">
                          ✨ AI 重新推算工期
                        </button>
                      )}
                      <button
                        onClick={() => setShowPublishModal(true)}
                        className="text-xs px-3 py-1.5 text-white rounded-lg font-semibold whitespace-nowrap flex items-center gap-1 hover:brightness-110 shadow-sm"
                        style={{ background: 'linear-gradient(135deg, #4F8EF7, #8B5CF6, #EC4899)' }}
                      >
                        📤 保存并分配工人
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ── Gantt chart ── */}
            <GanttChart
              tasks={ganttTasks}
              onTaskUpdate={handleTaskUpdate}
              onStatusToggle={handleStatusToggle}
              onTaskClick={(taskId) => setSelectedTaskId(taskId)}
              onAssignWorker={openWorkerModal}
              onRemoveWorker={removeWorkerFromTask}
              workers={designerWorkers}
              workOnSaturday={workOnSaturday}
              workOnSunday={workOnSunday}
              region={projectRegion}
              projectName={project?.name}
            />

            {/* ── Task Detail Panel ── */}
            {selectedTaskId && (() => {
              const task = ganttTasks.find(t => t.id === selectedTaskId);
              if (!task) return null;
              const phaseId = task.id.replace(task.project_id + '-', '');
              const activeQ = quotationVersions.find(q => q.is_active);
              const qItems = (activeQ?.parsed_items || []).map(pi => ({
                no: '',
                section: pi.section || '',
                name: pi.name,
                unit: '',
                qty: pi.qty || 0,
                unitPrice: pi.unitPrice || 0,
                total: pi.total || 0,
                unitPriceDerived: false,
                supplyType: 'supply_install' as const,
                status: 'ok' as const,
                note: '',
              }));
              // Detect region from project address
              const region: 'MY' | 'SG' = (project?.address || '').toLowerCase().includes('singapore') ||
                (project?.address || '').toLowerCase().includes(', sg') ? 'SG' : 'MY';
              return (
                <TaskDetailPanel
                  task={task}
                  phaseId={phaseId}
                  onClose={() => setSelectedTaskId(null)}
                  onSubtaskToggle={(subtaskId) => handleSubtaskToggle(selectedTaskId, subtaskId)}
                  onDurationChange={(newDuration) => handleDurationChange(selectedTaskId, newDuration)}
                  quotationItems={qItems}
                  region={region}
                />
              );
            })()}

            {/* ── Publish modal ── */}
            {showPublishModal && (
              <div
                className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                onClick={(e) => { if (e.target === e.currentTarget) setShowPublishModal(false); }}
              >
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div>
                      <h3 className="font-bold text-gray-900">📤 确认并发布进度</h3>
                      <p className="text-xs text-gray-500 mt-0.5">将最新施工进度同步给工人</p>
                    </div>
                    <button onClick={() => setShowPublishModal(false)} className="p-2 rounded-xl hover:bg-gray-100">
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                  <div className="p-5">
                    {/* Summary */}
                    <div className="grid grid-cols-3 gap-3 mb-5">
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <div className="text-xl font-bold text-gray-900">{ganttTasks.length}</div>
                        <div className="text-xs text-gray-500">工序总数</div>
                      </div>
                      <div className="bg-green-50 rounded-xl p-3 text-center">
                        <div className="text-xl font-bold text-green-700">
                          {ganttTasks.filter(t => t.taskStatus === 'completed').length}
                        </div>
                        <div className="text-xs text-green-600">已完成</div>
                      </div>
                      <div className="bg-[#8B5CF6]/5 rounded-xl p-3 text-center">
                        <div className="text-xl font-bold text-[#8B5CF6]">
                          {ganttTasks.filter(t => (t.assigned_workers || []).length > 0).length}
                        </div>
                        <div className="text-xs text-[#8B8BA8]">已分配工人</div>
                      </div>
                    </div>

                    {/* Task status summary */}
                    <div className="mb-5 bg-gray-50 rounded-xl p-4">
                      <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">工序状态概览</p>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {ganttTasks.map(t => (
                          <div key={t.id} className="flex items-center gap-2 text-xs">
                            <span
                              className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold"
                              style={{
                                background: t.taskStatus === 'completed' ? '#16a34a' : t.taskStatus === 'pending' ? 'transparent' : `${t.color}22`,
                                border: t.taskStatus === 'completed' ? '1.5px solid #16a34a' : t.taskStatus === 'pending' ? '1.5px solid #9CA3AF' : `1.5px solid ${t.color}`,
                                color: t.taskStatus === 'completed' ? '#fff' : t.taskStatus === 'pending' ? '#9CA3AF' : t.color,
                              }}
                            >
                              {t.taskStatus === 'completed' ? '✓' : t.taskStatus === 'pending' ? '○' : '●'}
                            </span>
                            <span className="text-gray-700 truncate flex-1">{t.name_zh || t.name}</span>
                            <span className="text-gray-400 whitespace-nowrap">{t.start_date} – {t.end_date}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Unassigned warning */}
                    {ganttTasks.filter(t => (t.assigned_workers || []).length === 0).length > 0 && (
                      <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4 text-xs text-amber-700">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        <span>
                          有 {ganttTasks.filter(t => (t.assigned_workers || []).length === 0).length} 个工序尚未分配工人，发布后这些工序工人不会收到通知
                        </span>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button
                        className="flex-1 bg-[#4F8EF7] text-white hover:bg-[#3B7BE8] font-semibold"
                        onClick={handlePublish}
                        disabled={isPublishing}
                      >
                        {isPublishing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />发布中...</> : '✓ 保存进度表'}
                      </Button>
                      <Button
                        className="flex-1 bg-blue-600 text-white hover:bg-blue-700 font-semibold"
                        onClick={async () => { await handlePublish(); if (!isPublishing) handleSendToWorkers(); }}
                        disabled={isPublishing || isSendingTasks}
                      >
                        {isSendingTasks ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />发送中...</> : <><Send className="w-4 h-4 mr-1.5" />发布并通知工人</>}
                      </Button>
                      <Button variant="outline" onClick={() => setShowPublishModal(false)}>取消</Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Worker Assignment Modal ── */}
            {workerModal.open && workerModal.taskId && (() => {
              const task = ganttTasks.find(t => t.id === workerModal.taskId);
              if (!task) return null;

              // Workers matching this task's trade = recommended
              const taskTrade = task.trade.toLowerCase();
              const recommended = designerWorkers.filter(w =>
                w.trades.some(t => t.toLowerCase().includes(taskTrade) || taskTrade.includes(t.toLowerCase()))
              );
              const others = designerWorkers.filter(w => !recommended.find(r => r.id === w.id));

              // Filter by search + trade tab
              const filterWorkers = (list: GanttWorkerInfo[]) => list.filter(w => {
                const matchSearch = !workerSearch ||
                  w.name.toLowerCase().includes(workerSearch.toLowerCase()) ||
                  (w.phone || '').includes(workerSearch);
                const matchTrade = workerTradeFilter === 'all' ||
                  w.trades.some(t => t.toLowerCase() === workerTradeFilter.toLowerCase());
                return matchSearch && matchTrade;
              });

              // All unique trades across workers
              const allTrades = Array.from(new Set(designerWorkers.flatMap(w => w.trades)));

              const toggleWorker = (wid: string) => {
                setSelectedWorkerIds(prev =>
                  prev.includes(wid) ? prev.filter(x => x !== wid) : [...prev, wid]
                );
              };

              const avatarColors = ['#4F8EF7','#3B82F6','#10B981','#8B5CF6','#F97316','#EC4899'];
              const initials = (name: string) => {
                const p = name.trim().split(/\s+/);
                return p.length >= 2 ? (p[0][0]+p[p.length-1][0]).toUpperCase() : name.slice(0,2).toUpperCase();
              };
              const aColor = (id: string) => {
                let h = 0;
                for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffffffff;
                return avatarColors[Math.abs(h) % avatarColors.length];
              };

              const WorkerRow = ({ w }: { w: GanttWorkerInfo }) => {
                const checked = selectedWorkerIds.includes(w.id);
                return (
                  <button
                    key={w.id}
                    onClick={() => toggleWorker(w.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all border-b border-gray-50 hover:bg-gray-50 ${checked ? 'bg-amber-50' : ''}`}
                  >
                    {/* Checkbox */}
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${checked ? 'border-[#4F8EF7] bg-[#4F8EF7]' : 'border-gray-300'}`}>
                      {checked && <span className="text-black text-[10px] font-bold">✓</span>}
                    </div>
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      style={{ background: aColor(w.id) }}>
                      {initials(w.name)}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm">{w.name}</div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                        <span>{w.trades[0] || '—'}</span>
                        <span>{'⭐'.repeat(Math.round(w.rating || 4.5))} {(w.rating || 4.5).toFixed(1)}</span>
                        <span className="text-gray-400">{w.phone}</span>
                      </div>
                    </div>
                    {/* Completion rate */}
                    <div className={`text-sm font-bold flex-shrink-0 ${(w.completion_rate || 90) >= 95 ? 'text-green-600' : (w.completion_rate || 90) >= 85 ? 'text-amber-500' : 'text-red-500'}`}>
                      {w.completion_rate || 90}%<div className="text-[10px] font-normal text-gray-400">完成率</div>
                    </div>
                  </button>
                );
              };

              return (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                  onClick={(e) => { if (e.target === e.currentTarget) setWorkerModal({ open: false, taskId: null }); }}>
                  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col" style={{ maxHeight: '90vh' }}>
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-gray-100">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-gray-900">🔧 分配工人</h3>
                        <button onClick={() => setWorkerModal({ open: false, taskId: null })} className="p-1.5 rounded-xl hover:bg-gray-100">
                          <X className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                      <div className="text-sm font-semibold text-gray-700">{task.name_zh || task.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {task.start_date} → {task.end_date} · {task.duration} 工作日
                      </div>
                    </div>

                    {/* Search */}
                    <div className="px-4 pt-3 pb-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="搜索姓名或电话..."
                          value={workerSearch}
                          onChange={e => setWorkerSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#4F8EF7] bg-gray-50"
                        />
                      </div>
                    </div>

                    {/* Trade filter chips */}
                    <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
                      {['all', ...allTrades].map(trade => (
                        <button
                          key={trade}
                          onClick={() => setWorkerTradeFilter(trade)}
                          className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                            workerTradeFilter === trade
                              ? 'bg-[#4F8EF7] border-[#4F8EF7] text-white'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {trade === 'all' ? '全部工种' : trade}
                        </button>
                      ))}
                    </div>

                    {/* Worker list */}
                    <div className="flex-1 overflow-y-auto">
                      {designerWorkers.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                          <UserCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">还没有添加工人</p>
                          <p className="text-xs mt-1">请先在工人管理页面添加工人</p>
                        </div>
                      ) : (
                        <>
                          {/* Recommended */}
                          {filterWorkers(recommended).length > 0 && (
                            <>
                              <div className="px-4 py-2 text-xs font-semibold text-amber-600 bg-amber-50 border-b border-amber-100">
                                ⭐ 推荐工人（匹配工种）
                              </div>
                              {filterWorkers(recommended).map(w => <WorkerRow key={w.id} w={w} />)}
                            </>
                          )}
                          {/* Others */}
                          {filterWorkers(others).length > 0 && (
                            <>
                              <div className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-100">
                                其他工人
                              </div>
                              {filterWorkers(others).map(w => <WorkerRow key={w.id} w={w} />)}
                            </>
                          )}
                          {filterWorkers([...recommended, ...others]).length === 0 && (
                            <div className="text-center py-8 text-gray-400 text-sm">没有匹配的工人</div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
                      <Button
                        className="flex-1 bg-[#4F8EF7] text-white hover:bg-[#3B7BE8] font-semibold"
                        onClick={confirmAssignWorkers}
                        disabled={selectedWorkerIds.length === 0}
                      >
                        <UserCheck className="w-4 h-4 mr-1.5" />
                        确认分配 {selectedWorkerIds.length > 0 ? `(${selectedWorkerIds.length})` : ''}
                      </Button>
                      <Button variant="outline" onClick={() => setWorkerModal({ open: false, taskId: null })}>
                        取消
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="flex-1 p-6 overflow-y-auto mt-0">
            {(() => {
              // Total contract = quotation + approved VOs
              const approvedVOTotal = variationOrders.filter(v => v.status === 'approved').reduce((s, v) => s + v.amount, 0);
              const totalContract = (project?.contract_amount || 0) + approvedVOTotal;
              const phasesTotal = payments.reduce((s, p) => s + (p.amount || 0), 0);
              const diff = totalContract - phasesTotal;
              const isBalanced = Math.abs(diff) < 1;

              const savePayments = async () => {
                try {
                  // Delete existing phases
                  const { error: delErr } = await supabase.from('payment_phases').delete().eq('project_id', id);
                  if (delErr) throw delErr;

                  // Build insert rows — omit id for newly added phases (fake "new-..." ids)
                  const rows = payments.map((p, idx) => {
                    const isNew = !p.id || p.id.startsWith('new-');
                    return {
                      ...(isNew ? {} : { id: p.id }),
                      project_id: id as string,
                      user_id: sessionUserId,
                      phase_number: idx + 1,
                      label: p.label,
                      amount: p.amount,
                      percentage: totalContract > 0 ? Math.round((p.amount / totalContract) * 1000) / 10 : 0,
                      status: p.status,
                      due_date: p.due_date || null,
                      notes: p.notes || null,
                    };
                  });
                  const { data: saved, error: insErr } = await supabase.from('payment_phases').insert(rows).select();
                  if (insErr) throw insErr;
                  // Refresh state with DB-generated ids
                  if (saved) setPayments(saved as PaymentPhase[]);
                  toast({ title: '✅ 付款计划已保存', description: `共 ${rows.length} 期，合计 ${formatCurrency(phasesTotal)}` });
                } catch (err) {
                  console.error('Payment save error:', err);
                  toast({ title: '保存失败，请重试', variant: 'destructive' });
                }
              };

              const addPhase = () => {
                const newId = `new-${Date.now()}`;
                setPayments(prev => [...prev, {
                  id: newId,
                  project_id: id as string,
                  phase_number: prev.length + 1,
                  label: `第 ${prev.length + 1} 期付款`,
                  amount: 0,
                  percentage: 0,
                  status: 'pending',
                }]);
              };

              const deletePhase = (payId: string) => {
                setPayments(prev => prev.filter(p => p.id !== payId));
              };

              const updatePhase = (payId: string, field: 'label' | 'amount' | 'due_date', value: string) => {
                setPayments(prev => prev.map(p => {
                  if (p.id !== payId) return p;
                  if (field === 'amount') return { ...p, amount: parseFloat(value) || 0 };
                  return { ...p, [field]: value };
                }));
              };

              return (
                <>
                  {/* Summary cards */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-white rounded-xl border border-gray-100 p-4">
                      <div className="text-xs text-gray-500 mb-1">合同总额（含VO）</div>
                      <div className="text-lg font-bold text-gray-900">{formatCurrency(totalContract)}</div>
                      {approvedVOTotal > 0 && (
                        <div className="text-[10px] text-amber-600 mt-0.5">含 VO {formatCurrency(approvedVOTotal)}</div>
                      )}
                    </div>
                    <div className="bg-green-50 rounded-xl border border-green-100 p-4">
                      <div className="text-xs text-green-600 mb-1">已收款</div>
                      <div className="text-lg font-bold text-green-700">{formatCurrency(totalCollected)}</div>
                    </div>
                    <div className="bg-amber-50 rounded-xl border border-amber-100 p-4">
                      <div className="text-xs text-amber-600 mb-1">未收款</div>
                      <div className="text-lg font-bold text-amber-700">{formatCurrency(totalOutstanding)}</div>
                    </div>
                  </div>

                  {/* Balance check banner */}
                  <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl mb-4 ${isBalanced ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${isBalanced ? 'text-green-700' : 'text-red-600'}`}>
                        {isBalanced ? '✅ 付款计划与合同金额匹配' : `⚠️ 差额 ${formatCurrency(Math.abs(diff))} ${diff > 0 ? '（未分配）' : '（超出合同）'}`}
                      </span>
                      <span className="text-xs text-gray-500">各期合计：{formatCurrency(phasesTotal)}</span>
                    </div>
                    <button
                      onClick={savePayments}
                      className="text-xs px-4 py-1.5 bg-[#4F8EF7] text-white rounded-lg hover:bg-[#3B7BE8] font-semibold flex items-center gap-1"
                    >
                      💾 保存付款计划
                    </button>
                  </div>

                  {/* Payment phases table */}
                  <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-3">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 w-8">#</th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">付款说明</th>
                          <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">金额 (RM)</th>
                          <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 w-20">占比</th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">截止日期</th>
                          <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">状态</th>
                          <th className="w-8 px-2" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {payments.map((pay, idx) => {
                          const cfg = STATUS_LABELS[pay.status as PaymentStatus] || STATUS_LABELS.pending;
                          const pct = totalContract > 0 ? ((pay.amount / totalContract) * 100).toFixed(1) : '0.0';
                          return (
                            <tr key={pay.id} className="hover:bg-gray-50 group">
                              <td className="px-4 py-2.5 text-xs text-gray-400 font-medium">{idx + 1}</td>
                              <td className="px-4 py-2.5">
                                <input
                                  type="text"
                                  value={pay.label}
                                  onChange={e => updatePhase(pay.id, 'label', e.target.value)}
                                  className="w-full text-sm text-gray-800 border-0 bg-transparent focus:outline-none focus:bg-amber-50 focus:px-2 rounded transition-all"
                                  placeholder="付款说明..."
                                />
                              </td>
                              <td className="px-4 py-2.5">
                                <div className="flex items-center justify-end gap-1">
                                  <span className="text-xs text-gray-400">RM</span>
                                  <input
                                    type="number"
                                    value={pay.amount || ''}
                                    onChange={e => updatePhase(pay.id, 'amount', e.target.value)}
                                    className="w-28 text-sm font-semibold text-right text-gray-900 border border-transparent hover:border-gray-200 focus:border-[#4F8EF7] focus:outline-none rounded-lg px-2 py-1 bg-transparent"
                                    step="100"
                                    min="0"
                                  />
                                </div>
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                <span className="text-xs font-medium text-gray-500">{pct}%</span>
                              </td>
                              <td className="px-4 py-2.5">
                                <input
                                  type="date"
                                  value={pay.due_date || ''}
                                  onChange={e => updatePhase(pay.id, 'due_date', e.target.value)}
                                  className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600 focus:outline-none focus:border-[#4F8EF7] bg-gray-50"
                                />
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                <button
                                  onClick={() => cyclePaymentStatus(pay.id)}
                                  className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-opacity hover:opacity-80 ${cfg.color}`}
                                >
                                  {cfg.label}
                                </button>
                              </td>
                              <td className="px-2 py-2.5 text-center">
                                <button
                                  onClick={() => deletePhase(pay.id)}
                                  className="opacity-0 group-hover:opacity-100 p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-all"
                                  title="删除此期"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-gray-50 border-t border-gray-100">
                        <tr>
                          <td colSpan={2} className="px-4 py-2.5 text-xs font-semibold text-gray-600">合计</td>
                          <td className="px-4 py-2.5 text-right text-sm font-bold text-gray-900">
                            RM {phasesTotal.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                          </td>
                          <td colSpan={4} />
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Add phase button */}
                  <button
                    onClick={addPhase}
                    className="w-full py-3 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-500 hover:border-[#4F8EF7] hover:text-[#4F8EF7] transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> 添加付款阶段
                  </button>
                </>
              );
            })()}
          </TabsContent>


          {/* Photos Tab */}
          <TabsContent value="photos" className="flex-1 p-6 overflow-y-auto mt-0">
            {photos.length > 0 && (
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Site Photos ({photos.length})</h2>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    // Print site photos as PDF using browser print
                    const printWindow = window.open('', '_blank');
                    if (!printWindow) return;
                    const imgTags = photos.map(p =>
                      `<div class="photo-item"><img src="${p.url}" alt="${p.caption || ''}" />${p.caption ? `<p class="caption">${p.caption}</p>` : ''}<p class="date">${new Date(p.created_at).toLocaleDateString('en-MY')}</p></div>`
                    ).join('');
                    printWindow.document.write(`
                      <html><head><title>${project?.name || 'Site Photos'} — Site Progress Photos</title>
                      <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        h1 { font-size: 18px; margin-bottom: 4px; }
                        .subtitle { color: #666; font-size: 12px; margin-bottom: 20px; }
                        .photo-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
                        .photo-item img { width: 100%; height: 200px; object-fit: cover; border-radius: 8px; }
                        .caption { font-size: 11px; color: #333; margin: 4px 0 0; }
                        .date { font-size: 10px; color: #999; margin: 2px 0; }
                        @media print { .photo-grid { page-break-inside: avoid; } }
                      </style></head>
                      <body>
                        <h1>${project?.name || 'Project'} — Site Progress Photos</h1>
                        <p class="subtitle">${project?.address || ''} · Printed ${new Date().toLocaleDateString('en-MY')}</p>
                        <div class="photo-grid">${imgTags}</div>
                        <script>window.onload = function(){ window.print(); }</script>
                      </body></html>
                    `);
                    printWindow.document.close();
                  }}
                >
                  <FileText className="w-4 h-4" /> Print as PDF
                </Button>
              </div>
            )}
            {photos.length === 0 ? (
              <div className="text-center py-16">
                <Camera className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500">No site photos yet</p>
                <p className="text-sm text-gray-400 mt-1">Workers can upload progress photos from their dashboard</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo) => (
                  <div key={photo.id} className="rounded-xl overflow-hidden border border-gray-100 group">
                    <img src={photo.url} alt={photo.caption || 'Site photo'} className="w-full aspect-square object-cover" />
                    {photo.caption && (
                      <div className="p-2 text-xs text-gray-600">{photo.caption}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Quotations + VO unified tab */}
          <TabsContent value="quotations" className="flex-1 p-6 overflow-y-auto mt-0">
            <div className="w-full">

              {/* ── Active Quotation + AI Audit Report (shown at top) ─────────── */}
              {(() => {
                const aq = quotationVersions.find(q => q.is_active);
                if (!aq) return (
                  <div className="text-center py-16 bg-white rounded-xl border border-gray-100 mb-6">
                    <FileText className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-500">No quotations attached yet</p>
                    <p className="text-sm text-gray-400 mt-1">Upload a quotation and save it to this project from the Quotation Upload page</p>
                    <Button variant="gold" className="mt-4 gap-2" onClick={() => router.push(`/designer/quotation?projectId=${id}`)}>
                      <Plus className="w-4 h-4" /> Upload Quotation
                    </Button>
                  </div>
                );
                const ar = aq.analysis_result;
                const score = ar?.score?.total ?? null;
                const alerts = ar?.alerts || [];
                const criticalCount = alerts.filter(a => a.level === 'critical').length;
                const warnCount = alerts.filter(a => a.level === 'warning').length;
                return (
                  <div className="mb-6 bg-white rounded-2xl border-2 border-[#4F8EF7] overflow-hidden shadow-sm">
                    {/* Gold header bar */}
                    <div className="bg-gradient-to-r from-[#4F8EF7]/15 to-blue-50 px-5 py-3 border-b border-[#4F8EF7]/20 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-[#4F8EF7]" />
                        <span className="font-semibold text-gray-900 text-sm">{t.proj.activeQuotation}</span>
                        <Badge className="bg-[#4F8EF7]/20 text-[#4F8EF7] border-[#4F8EF7]/30 text-xs">Active</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="text-xs h-7 gap-1"
                          onClick={() => { setViewingQuotation(aq); setQuotationViewTab('items'); }}>
                          <Eye className="w-3 h-3" /> {t.proj.viewItems}
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs h-7 gap-1"
                          onClick={() => printQuotation(aq)}>
                          <Printer className="w-3 h-3" /> {t.proj.print}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 text-red-500 hover:text-red-600 hover:border-red-200"
                          onClick={async () => {
                            await supabase.from('project_quotations').delete().eq('id', aq.id);
                            const remaining = quotationVersions.filter(v => v.id !== aq.id);
                            setQuotationVersions(remaining);
                            toast({ title: '报价单已删除' });
                            if (remaining.length > 0) {
                              const nextActive = remaining[0];
                              await supabase.from('project_quotations').update({ is_active: true }).eq('id', nextActive.id);
                              setQuotationVersions(remaining.map((v, i) => ({ ...v, is_active: i === 0 })));
                              await regenerateAndSaveGantt(nextActive.parsed_items, ganttStartDate || undefined, nextActive.analysis_result?.ganttParams);
                              toast({ title: '✅ 进度表已切换至上一版报价' });
                            } else {
                              await regenerateAndSaveGantt(undefined, ganttStartDate || undefined);
                            }
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {/* File info row */}
                    <div className="px-5 py-3 flex items-center gap-4 border-b border-gray-50">
                      <div className="w-9 h-9 rounded-lg bg-[#4F8EF7]/15 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-[#4F8EF7]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{aq.file_name || 'Quotation'}</p>
                        <p className="text-xs text-gray-400">{formatDate(aq.created_at)} · {(aq.parsed_items || []).length} items · Total: <span className="font-semibold text-gray-700">{formatCurrency(aq.total_amount)}</span></p>
                      </div>
                      {score !== null && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 ${score >= 80 ? 'border-green-400 bg-green-50 text-green-700' : score >= 60 ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-red-400 bg-red-50 text-red-700'}`}>
                            {score}
                          </div>
                          <div className="text-xs text-gray-400">AI<br />Score</div>
                        </div>
                      )}
                    </div>

                    {/* AI Audit Report section */}
                    {ar ? (
                      <div className="px-5 py-4">
                        {/* Alert summary pills */}
                        {(criticalCount > 0 || warnCount > 0) && (
                          <div className="flex gap-2 mb-3 flex-wrap">
                            {criticalCount > 0 && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-xs font-medium text-red-700">
                                🔴 {criticalCount} 严重问题
                              </span>
                            )}
                            {warnCount > 0 && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-medium text-amber-700">
                                ⚠️ {warnCount} 警告
                              </span>
                            )}
                            {alerts.filter(a => a.level === 'tip').length > 0 && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-medium text-blue-700">
                                💡 {alerts.filter(a => a.level === 'tip').length} 建议
                              </span>
                            )}
                          </div>
                        )}

                        {/* Summary */}
                        {ar.summary && (
                          <p className="text-sm text-gray-600 mb-3 bg-gray-50 rounded-lg px-3 py-2">{ar.summary}</p>
                        )}

                        {/* Score breakdown */}
                        {ar.score && (
                          <div className="grid grid-cols-4 gap-2 mb-3">
                            {[
                              { label: '完整性', val: ar.score.completeness },
                              { label: '价格合理', val: ar.score.price },
                              { label: '逻辑性', val: ar.score.logic },
                              { label: '风险', val: ar.score.risk },
                            ].map(({ label, val }) => val !== undefined && (
                              <div key={label} className="bg-gray-50 rounded-lg p-2 text-center">
                                <div className="text-xs text-gray-400 mb-1">{label}</div>
                                <div className={`text-base font-bold ${(val || 0) >= 80 ? 'text-green-600' : (val || 0) >= 60 ? 'text-amber-600' : 'text-red-500'}`}>{val}</div>
                                <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                                  <div className={`h-1 rounded-full ${(val || 0) >= 80 ? 'bg-green-500' : (val || 0) >= 60 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${val}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Alerts (critical + warning) */}
                        {alerts.filter(a => a.level !== 'tip').length > 0 && (
                          <div className="space-y-1.5 mb-3">
                            {alerts.filter(a => a.level !== 'tip').slice(0, 4).map((alert, i) => (
                              <div key={i} className={`flex items-start gap-2 rounded-lg px-3 py-2 text-xs ${alert.level === 'critical' ? 'bg-red-50 border border-red-100' : 'bg-amber-50 border border-amber-100'}`}>
                                <span>{alert.level === 'critical' ? '🔴' : '⚠️'}</span>
                                <div>
                                  <span className={`font-semibold ${alert.level === 'critical' ? 'text-red-700' : 'text-amber-700'}`}>{alert.title}</span>
                                  {alert.desc && <span className={`ml-1 ${alert.level === 'critical' ? 'text-red-600' : 'text-amber-600'}`}>— {alert.desc}</span>}
                                </div>
                              </div>
                            ))}
                            {alerts.filter(a => a.level !== 'tip').length > 4 && (
                              <button className="text-xs text-gray-400 hover:text-gray-600 pl-1" onClick={() => { setViewingQuotation(aq); setQuotationViewTab('audit'); }}>
                                + {alerts.filter(a => a.level !== 'tip').length - 4} {t.proj.more} — {t.proj.viewFullReport} →
                              </button>
                            )}
                          </div>
                        )}

                        {/* Missing items */}
                        {ar.missing && ar.missing.length > 0 && (
                          <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700">
                            <span className="font-semibold">{t.proj.missingItems}：</span>{ar.missing.slice(0, 3).join(' · ')}
                            {ar.missing.length > 3 && ` · +${ar.missing.length - 3} ${t.proj.more}`}
                          </div>
                        )}

                        {/* View full audit link */}
                        <button className="mt-3 text-xs text-[#4F8EF7] hover:underline font-medium flex items-center gap-1"
                          onClick={() => { setViewingQuotation(aq); setQuotationViewTab('audit'); }}>
                          <FileText className="w-3 h-3" /> {t.proj.viewFullReport} →
                        </button>
                      </div>
                    ) : (
                      <div className="px-5 py-4 text-sm text-gray-400 italic">
                        No AI audit data — this quotation was saved without AI analysis.
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ── Quotation Versions (history list) ─────────────────────────── */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-gray-900">{t.proj.quotationVersions}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    设为 Active 的版本将自动重新生成进度表 · 删除 Active 版本将自动切换至上一版
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {quotationVersions.length >= 2 && (
                    <Button variant="outline" size="sm" onClick={() => setCompareMode(!compareMode)} className="gap-2">
                      <GitCompare className="w-4 h-4" />
                      {compareMode ? 'Hide Compare' : t.proj.compareVersions}
                    </Button>
                  )}
                  <Button variant="gold" size="sm" onClick={() => router.push('/designer/quotation')} className="gap-2">
                    <Plus className="w-4 h-4" /> {t.proj.uploadNewVersion}
                  </Button>
                </div>
              </div>

              {quotationVersions.length === 0 ? null : (
                <div className="space-y-3">
                  {quotationVersions.map((qv, idx) => (
                    <div key={qv.id} className={`bg-white rounded-xl border-2 p-4 ${qv.is_active ? 'border-[#4F8EF7]' : 'border-gray-100'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${qv.is_active ? 'bg-[#4F8EF7]/20' : 'bg-gray-100'}`}>
                          <FileText className={`w-4 h-4 ${qv.is_active ? 'text-[#4F8EF7]' : 'text-gray-400'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 text-sm">
                              {qv.file_name || `Version ${quotationVersions.length - idx}`}
                            </span>
                            {qv.is_active && (
                              <Badge className="bg-[#4F8EF7]/20 text-[#4F8EF7] border-[#4F8EF7]/30 text-xs">
                                <Star className="w-3 h-3 mr-1" /> Active
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {formatDate(qv.created_at)} · Total: {formatCurrency(qv.total_amount)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" className="text-xs h-7 gap-1"
                            onClick={() => setViewingQuotation(qv)}>
                            <Eye className="w-3 h-3" /> 查看
                          </Button>
                          <Button variant="outline" size="sm" className="text-xs h-7 gap-1"
                            onClick={() => printQuotation(qv)}>
                            <Printer className="w-3 h-3" /> {t.proj.print}
                          </Button>
                          {!qv.is_active && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-7"
                              onClick={async () => {
                                await supabase.from('project_quotations').update({ is_active: false }).eq('project_id', id);
                                await supabase.from('project_quotations').update({ is_active: true }).eq('id', qv.id);
                                const updated = quotationVersions.map(v => ({ ...v, is_active: v.id === qv.id }));
                                setQuotationVersions(updated);
                                toast({ title: '🔄 正在重新生成进度表…', description: '根据最新报价重新排程' });
                                await regenerateAndSaveGantt(qv.parsed_items, ganttStartDate || undefined, qv.analysis_result?.ganttParams);
                                toast({ title: '✅ 进度表已更新', description: `已根据「${qv.file_name || '新版报价'}」重新生成施工排程` });
                              }}
                            >
                              {t.proj.setActive}
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 text-red-500 hover:text-red-600 hover:border-red-200"
                            onClick={async () => {
                              const wasActive = qv.is_active;
                              await supabase.from('project_quotations').delete().eq('id', qv.id);
                              const remaining = quotationVersions.filter(v => v.id !== qv.id);
                              setQuotationVersions(remaining);
                              toast({ title: '报价单已删除' });
                              if (wasActive && remaining.length > 0) {
                                const nextActive = remaining[0];
                                await supabase.from('project_quotations').update({ is_active: true }).eq('id', nextActive.id);
                                setQuotationVersions(remaining.map((v, i) => ({ ...v, is_active: i === 0 })));
                                await regenerateAndSaveGantt(nextActive.parsed_items, ganttStartDate || undefined, nextActive.analysis_result?.ganttParams);
                                toast({ title: '✅ 进度表已切换至上一版报价' });
                              } else if (wasActive) {
                                await regenerateAndSaveGantt(undefined, ganttStartDate || undefined);
                              }
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Compare mode */}
              {compareMode && quotationVersions.length >= 2 && (
                <div className="mt-4 bg-white rounded-xl border border-gray-100 p-4">
                  <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2 text-sm">
                    <GitCompare className="w-4 h-4 text-[#4F8EF7]" /> 版本对比
                  </h3>
                  <table className="w-full text-sm">
                    <thead><tr className="bg-gray-50">
                      <th className="text-left px-3 py-2 text-gray-500 font-medium">版本</th>
                      <th className="text-right px-3 py-2 text-gray-500 font-medium">总额</th>
                      <th className="text-right px-3 py-2 text-gray-500 font-medium">与 Active 差额</th>
                    </tr></thead>
                    <tbody>
                      {quotationVersions.map(qv => {
                        const activeVersion = quotationVersions.find(v => v.is_active);
                        const diff = activeVersion ? qv.total_amount - activeVersion.total_amount : 0;
                        return (
                          <tr key={qv.id} className={`border-t border-gray-50 ${qv.is_active ? 'bg-[#4F8EF7]/5' : ''}`}>
                            <td className="px-3 py-2">{qv.file_name || 'Quotation'}{qv.is_active && <span className="ml-2 text-xs text-[#4F8EF7]">(Active)</span>}</td>
                            <td className="px-3 py-2 text-right font-medium">{formatCurrency(qv.total_amount)}</td>
                            <td className={`px-3 py-2 text-right font-medium ${diff > 0 ? 'text-red-500' : diff < 0 ? 'text-green-600' : 'text-gray-400'}`}>
                              {qv.is_active ? '—' : diff > 0 ? `+${formatCurrency(diff)}` : diff < 0 ? formatCurrency(diff) : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ── VO Section ─────────────────────────────────────────── */}
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                      <GitBranch className="w-4 h-4 text-[#4F8EF7]" /> {t.proj.voTitle}
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {variationOrders.filter(v => v.status === 'approved').length} {t.proj.approved} · {formatCurrency(variationOrders.filter(v => v.status === 'approved').reduce((s, v) => s + v.amount, 0))}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {/* VO doc upload */}
                    <input ref={voFileRef} type="file" accept="image/*,.pdf" className="hidden"
                      onChange={async e => { const f = e.target.files?.[0]; if (f) await handleVOFileUpload(f); e.target.value = ''; }} />
                    <button
                      onClick={() => voFileRef.current?.click()}
                      disabled={voScanState === 'scanning'}
                      className="text-xs px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {voScanState === 'scanning'
                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> 扫描中…</>
                        : <><Upload className="w-3.5 h-3.5" /> {t.proj.uploadVO}</>}
                    </button>
                    <Button variant="gold" size="sm" onClick={() => setShowAddVO(true)} className="gap-2">
                      <Plus className="w-4 h-4" /> {t.proj.newVO}
                    </Button>
                  </div>
                </div>

                {contractDirty && (
                  <div className="mb-4 flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>合同金额因VO批准已更改。<button className="underline font-medium" onClick={() => { setContractDirty(false); setActiveTab('gantt'); }}>重新生成进度表</button></span>
                  </div>
                )}

                {/* Add VO form */}
                {showAddVO && (
                  <div className="bg-white rounded-xl border border-[#4F8EF7]/30 p-5 mb-4 shadow-sm">
                    <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2 text-sm">
                      <GitBranch className="w-4 h-4 text-[#4F8EF7]" /> 新建变更单
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="text-xs text-gray-500 block mb-1">变更内容 *</label>
                        <Input value={voDescription} onChange={e => setVoDescription(e.target.value)}
                          placeholder="例：增加主卧隔断墙" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">金额 (RM) *</label>
                        <Input type="number" value={voAmount} onChange={e => setVoAmount(e.target.value)} placeholder="0.00" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">备注</label>
                        <Input value={voNotes} onChange={e => setVoNotes(e.target.value)} placeholder="可选备注…" />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" onClick={() => setShowAddVO(false)}>取消</Button>
                      <Button variant="gold" size="sm" onClick={handleAddVO} disabled={!voDescription.trim() || !voAmount}>
                        ✓ 确认添加
                      </Button>
                    </div>
                  </div>
                )}

                {variationOrders.length === 0 ? (
                  <div className="text-center py-10 bg-white rounded-xl border border-gray-100 border-dashed">
                    <GitBranch className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">{t.proj.noVO}</p>
                    <p className="text-xs text-gray-400 mt-1">{t.proj.noVOHint}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {variationOrders.map((vo) => {
                      const statusCfg = {
                        pending:  { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: '待审批' },
                        approved: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: t.proj.approved },
                        rejected: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', label: '已拒绝' },
                      }[vo.status] || { icon: Clock, color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200', label: vo.status };
                      const StatusIcon = statusCfg.icon;
                      return (
                        <div key={vo.id} className={`bg-white rounded-xl border-l-4 border border-gray-100 p-4 ${vo.status === 'approved' ? 'border-l-green-500' : vo.status === 'rejected' ? 'border-l-red-400' : 'border-l-amber-400'}`}>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-mono font-bold text-gray-500">{vo.vo_number}</span>
                                <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border} border`}>
                                  <StatusIcon className="w-3 h-3" />{statusCfg.label}
                                </span>
                              </div>
                              <p className="text-sm font-medium text-gray-900">{vo.description}</p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {formatDate(vo.created_at)}{vo.approved_at && ` · 批准 ${formatDate(vo.approved_at)}`}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className={`text-base font-bold ${vo.status === 'rejected' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                {vo.amount > 0 ? '+' : ''}{formatCurrency(vo.amount)}
                              </div>
                              {vo.status === 'pending' && (
                                <div className="flex gap-1.5 mt-1.5">
                                  <button onClick={() => handleVOStatusChange(vo.id, 'approved')}
                                    className="text-xs px-2.5 py-1 rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors">✓ 批准</button>
                                  <button onClick={() => handleVOStatusChange(vo.id, 'rejected')}
                                    className="text-xs px-2.5 py-1 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors">✗ 拒绝</button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* VO contract summary */}
                {variationOrders.some(v => v.status === 'approved') && (
                  <div className="mt-4 bg-white rounded-xl border border-gray-100 p-4 text-sm">
                    <div className="flex justify-between text-gray-500 mb-2">
                      <span>原合同金额</span>
                      <span className="font-medium text-gray-800">{formatCurrency((project?.contract_amount || 0) - variationOrders.filter(v => v.status === 'approved').reduce((s, v) => s + v.amount, 0))}</span>
                    </div>
                    {variationOrders.filter(v => v.status === 'approved').map(vo => (
                      <div key={vo.id} className="flex justify-between text-gray-500 mb-1.5">
                        <span>{vo.vo_number}: {vo.description}</span>
                        <span className="font-medium text-green-700">+{formatCurrency(vo.amount)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between mt-3 pt-3 border-t border-gray-100 font-semibold">
                      <span className="text-gray-900">合同修订总额</span>
                      <span className="text-[#4F8EF7] text-base">{formatCurrency(project?.contract_amount || 0)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Quotation view modal (with AI Audit tab) ── */}
            {viewingQuotation && (() => {
              const ar = viewingQuotation.analysis_result;
              const score = ar?.score?.total ?? null;
              const alerts = ar?.alerts || [];
              const missing = ar?.missing || [];
              const ALERT_CFG: Record<string, { bg: string; border: string; dot: string; label: string }> = {
                critical: { bg: 'bg-red-50',    border: 'border-red-200',    dot: 'bg-red-500',    label: '⚠ 严重' },
                warning:  { bg: 'bg-amber-50',  border: 'border-amber-200',  dot: 'bg-amber-400',  label: '⚡ 警告' },
                tip:      { bg: 'bg-blue-50',   border: 'border-blue-200',   dot: 'bg-blue-400',   label: '💡 建议' },
              };
              return (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                  onClick={e => { if (e.target === e.currentTarget) { setViewingQuotation(null); setQuotationViewTab('items'); } }}>
                  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col" style={{ maxHeight: '90vh' }}>
                    {/* Modal header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                      <div>
                        <h3 className="font-bold text-gray-900">📄 {viewingQuotation.file_name || '报价单'}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatDate(viewingQuotation.created_at)} · 合计 {formatCurrency(viewingQuotation.total_amount)}
                          {score !== null && <span className="ml-2 text-[#4F8EF7] font-semibold">· AI 评分 {score}/100</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => printQuotation(viewingQuotation)}
                          className="text-xs px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 flex items-center gap-1.5">
                          <Printer className="w-3.5 h-3.5" /> {t.proj.print}
                        </button>
                        <button onClick={() => { setViewingQuotation(null); setQuotationViewTab('items'); }}
                          className="p-2 rounded-xl hover:bg-gray-100">
                          <X className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </div>

                    {/* Tab switcher */}
                    <div className="flex border-b border-gray-100 px-5">
                      {[
                        { key: 'items', label: '📋 品项明细' },
                        { key: 'audit', label: `🤖 AI 审核报告${alerts.length > 0 ? ` (${alerts.length})` : ''}` },
                      ].map(({ key, label }) => (
                        <button key={key}
                          onClick={() => setQuotationViewTab(key as 'items' | 'audit')}
                          className={`text-xs font-medium px-4 py-2.5 border-b-2 transition-colors ${quotationViewTab === key ? 'border-[#4F8EF7] text-[#4F8EF7]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                          {label}
                        </button>
                      ))}
                    </div>

                    {/* Tab content */}
                    <div className="flex-1 overflow-y-auto">
                      {quotationViewTab === 'items' ? (
                        /* Items table */
                        (viewingQuotation.parsed_items || []).length === 0 ? (
                          <p className="text-sm text-gray-400 text-center py-12">暂无品项数据</p>
                        ) : (
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 sticky top-0">
                              <tr>
                                <th className="text-left px-3 py-2 text-xs text-gray-500 font-medium">类别</th>
                                <th className="text-left px-3 py-2 text-xs text-gray-500 font-medium">品项</th>
                                <th className="text-right px-3 py-2 text-xs text-gray-500 font-medium">数量</th>
                                <th className="text-right px-3 py-2 text-xs text-gray-500 font-medium">单价</th>
                                <th className="text-right px-3 py-2 text-xs text-gray-500 font-medium">小计</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {viewingQuotation.parsed_items!.map((item, i) => {
                                const statusColor = item.status === 'flag' ? 'bg-red-50' : item.status === 'warn' ? 'bg-amber-50' : '';
                                return (
                                  <tr key={i} className={`hover:bg-gray-50 ${statusColor}`}>
                                    <td className="px-3 py-2 text-xs text-gray-400">{item.section || '—'}</td>
                                    <td className="px-3 py-2 text-gray-800">
                                      {item.name}
                                      {item.note && <span className="ml-1.5 text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">{item.note}</span>}
                                    </td>
                                    <td className="px-3 py-2 text-right text-gray-600">{item.qty ?? '—'}</td>
                                    <td className="px-3 py-2 text-right text-gray-600">
                                      {item.unitPrice ? `RM ${item.unitPrice.toFixed(2)}` : '—'}
                                    </td>
                                    <td className="px-3 py-2 text-right font-medium text-gray-900">
                                      {item.total ? `RM ${item.total.toFixed(2)}` : '—'}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot className="bg-amber-50 border-t-2 border-amber-200">
                              <tr>
                                <td colSpan={4} className="px-3 py-3 font-bold text-gray-900">合计</td>
                                <td className="px-3 py-3 text-right font-bold text-[#4F8EF7] text-base">
                                  RM {(viewingQuotation.total_amount || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        )
                      ) : (
                        /* AI Audit tab */
                        <div className="p-5 space-y-5">
                          {!ar ? (
                            <div className="text-center py-12">
                              <p className="text-gray-400 text-sm">此报价单暂无 AI 审核数据</p>
                              <p className="text-xs text-gray-400 mt-1">请重新上传并运行 AI 分析以获取审核报告</p>
                            </div>
                          ) : (
                            <>
                              {/* Score cards */}
                              {ar.score && (
                                <div className="grid grid-cols-5 gap-2">
                                  {[
                                    { label: '综合评分', val: ar.score.total, max: 100, gold: true },
                                    { label: '完整度', val: ar.score.completeness, max: 100 },
                                    { label: '价格合理', val: ar.score.price, max: 100 },
                                    { label: '逻辑性', val: ar.score.logic, max: 100 },
                                    { label: '风险', val: ar.score.risk, max: 100 },
                                  ].map(({ label, val, gold }) => (
                                    <div key={label} className={`rounded-xl p-3 text-center ${gold ? 'bg-[#4F8EF7]/10 border-2 border-[#4F8EF7]/30' : 'bg-gray-50 border border-gray-100'}`}>
                                      <div className={`text-xl font-bold ${gold ? 'text-[#4F8EF7]' : val != null && val >= 70 ? 'text-green-600' : val != null && val >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                                        {val ?? '—'}
                                      </div>
                                      <div className="text-[10px] text-gray-500 mt-0.5">{label}</div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Summary */}
                              {ar.summary && (
                                <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 border border-gray-100">
                                  <span className="font-semibold text-gray-500 text-xs uppercase tracking-wide block mb-1">AI 总结</span>
                                  {ar.summary}
                                </div>
                              )}

                              {/* Alerts */}
                              {alerts.length > 0 && (
                                <div>
                                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">提示 & 警告</h4>
                                  <div className="space-y-2">
                                    {alerts.map((a, i) => {
                                      const cfg = ALERT_CFG[a.level] || ALERT_CFG.tip;
                                      return (
                                        <div key={i} className={`flex gap-3 p-3 rounded-xl border ${cfg.bg} ${cfg.border}`}>
                                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${cfg.dot}`} />
                                          <div>
                                            <div className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${cfg.bg} border ${cfg.border}`}>{cfg.label}</span>
                                              {a.title}
                                            </div>
                                            {a.desc && <p className="text-xs text-gray-500 mt-0.5">{a.desc}</p>}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Missing items */}
                              {missing.length > 0 && (
                                <div>
                                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">缺失项目</h4>
                                  <div className="bg-red-50 border border-red-100 rounded-xl p-3 space-y-1.5">
                                    {missing.map((m, i) => (
                                      <div key={i} className="flex items-start gap-2 text-xs text-red-700">
                                        <span className="flex-shrink-0 font-bold">✗</span>
                                        <span>{m}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {alerts.length === 0 && missing.length === 0 && (
                                <div className="text-center py-8">
                                  <div className="text-4xl mb-2">✅</div>
                                  <p className="text-sm text-gray-600 font-medium">报价单质量良好</p>
                                  <p className="text-xs text-gray-400 mt-1">AI 未发现重大问题</p>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </TabsContent>

          {/* Profit Tab */}
          <TabsContent value="profit" className="flex-1 p-6 overflow-y-auto mt-0">
            <div className="max-w-4xl space-y-6">

              {/* Header row */}
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">利润分析 — {project?.name}</h2>
                <Button size="sm" className="bg-[#4F8EF7] text-white hover:bg-[#3B7BE8] gap-2"
                  onClick={() => { setShowUploadModal(true); setUploadOcrState('idle'); setUploadOcrResult(null); setUploadOcrError(null); setUploadTrade(''); }}>
                  <Upload className="w-4 h-4" /> 上传单据
                </Button>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                  <p className="text-xs text-gray-500 mb-1">{t.proj.contractTotal}</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(revenue)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{t.proj.fromQuotation}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                  <p className="text-xs text-gray-500 mb-1">{t.proj.recordedCost}</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(totalCost)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{t.proj.fromReceipts}</p>
                </div>
                <div className={`rounded-xl border p-4 ${grossProfit >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                  <p className="text-xs text-gray-500 mb-1">{t.proj.grossProfit}</p>
                  <p className={`text-lg font-bold flex items-center gap-1 ${grossProfit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                    {grossProfit >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {formatCurrency(Math.abs(grossProfit))}
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                  <p className="text-xs text-gray-500 mb-1">{t.proj.profitMargin}</p>
                  <p className={`text-lg font-bold ${margin >= 20 ? 'text-green-600' : margin >= 10 ? 'text-yellow-600' : revenue === 0 ? 'text-gray-400' : 'text-red-500'}`}>
                    {revenue === 0 ? '—' : margin.toFixed(1) + '%'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">毛利 / 合同额</p>
                </div>
              </div>

              {/* Per-trade Cost vs Quotation table */}
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-50">
                  <h3 className="font-medium text-gray-800 text-sm">按工种成本 vs 报价对比</h3>
                  {!activeQ?.parsed_items && (
                    <p className="text-xs text-gray-400 mt-0.5">设为 Active 的报价单若含 parsed_items 则显示报价金额</p>
                  )}
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="w-full text-sm" style={{ minWidth: 480 }}>
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left px-5 py-2.5 text-gray-500 font-medium">工种</th>
                        <th className="text-right px-4 py-2.5 text-gray-500 font-medium">报价金额</th>
                        <th className="text-right px-4 py-2.5 text-gray-500 font-medium">{t.proj.recordedCost}</th>
                        <th className="text-right px-4 py-2.5 text-gray-500 font-medium">差额</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {allTrades.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-5 py-8 text-center text-gray-400 text-sm">
                            暂无数据。上传单据或分配工人任务后显示。
                          </td>
                        </tr>
                      ) : (
                        <>
                          {allTrades.map(trade => {
                            const tradeKey = trade.toLowerCase();
                            const cost   = costByTrade[tradeKey] || 0;
                            const quoted = quotedByTrade[tradeKey] || 0;
                            const diff   = quoted - cost;
                            const dotColor = TRADE_DOT_COLORS[tradeKey] || TRADE_DOT_COLORS[trade] || '#9CA3AF';
                            // Display label: prefer Chinese from gantt task, else capitalized key
                            const ganttMatch = ganttTasks.find(t => t.trade.toLowerCase() === tradeKey);
                            const displayLabel = ganttMatch?.name_zh
                              ? ganttMatch.name_zh.split(/[·\s]/)[0]
                              : trade.charAt(0).toUpperCase() + trade.slice(1);
                            return (
                              <tr key={trade} className="hover:bg-gray-50">
                                <td className="px-5 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: dotColor }} />
                                    <span className="font-medium text-gray-800">{displayLabel}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right text-gray-600">
                                  {quoted > 0 ? formatCurrency(quoted) : <span className="text-gray-300">—</span>}
                                </td>
                                <td className="px-4 py-3 text-right font-medium text-gray-900">
                                  {cost > 0 ? formatCurrency(cost) : <span className="text-gray-300">—</span>}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {quoted > 0 ? (
                                    <span className={`font-medium ${diff >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                                      {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
                                    </span>
                                  ) : <span className="text-gray-300">—</span>}
                                </td>
                              </tr>
                            );
                          })}
                          {/* Totals row */}
                          <tr className="bg-gray-50 font-semibold">
                            <td className="px-5 py-3 text-gray-900">合计</td>
                            <td className="px-4 py-3 text-right text-gray-700">
                              {Object.values(quotedByTrade).length > 0 ? formatCurrency(Object.values(quotedByTrade).reduce((a, b) => a + b, 0)) : <span className="text-gray-300">—</span>}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-900">{formatCurrency(totalCost)}</td>
                            <td className="px-4 py-3 text-right">
                              {Object.values(quotedByTrade).length > 0 ? (
                                <span className={grossProfit >= 0 ? 'text-blue-600' : 'text-red-500'}>
                                  {grossProfit >= 0 ? '+' : ''}{formatCurrency(grossProfit)}
                                </span>
                              ) : <span className="text-gray-300">—</span>}
                            </td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* All receipts list */}
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between">
                  <h3 className="font-medium text-gray-800 text-sm">全部单据 ({costRecords.length})</h3>
                  <Receipt className="w-4 h-4 text-gray-400" />
                </div>
                {costRecords.length === 0 ? (
                  <div className="py-10 text-center text-gray-400">
                    <Receipt className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">暂无单据</p>
                    <p className="text-xs mt-1">点击「上传单据」按钮录入成本，或由工人在 Task 卡片上传</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="w-full text-sm" style={{ minWidth: 560 }}>
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="text-left px-4 py-2.5 text-gray-500 font-medium">日期</th>
                          <th className="text-left px-4 py-2.5 text-gray-500 font-medium">供应商</th>
                          <th className="text-left px-4 py-2.5 text-gray-500 font-medium">描述</th>
                          <th className="text-left px-4 py-2.5 text-gray-500 font-medium">工种</th>
                          <th className="text-right px-4 py-2.5 text-gray-500 font-medium">金额</th>
                          <th className="text-center px-3 py-2.5 text-gray-500 font-medium"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {costRecords.map((r, i) => {
                          const dotColor = TRADE_DOT_COLORS[r.trade || catToTrade(r.category)] || '#9CA3AF';
                          return (
                            <tr key={r.id || i} className="hover:bg-gray-50">
                              <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap text-xs">
                                {r.receipt_date ? new Date(r.receipt_date).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                              </td>
                              <td className="px-4 py-2.5 text-gray-700 whitespace-nowrap max-w-[100px]">
                                <span className="truncate block">{r.supplier || '—'}</span>
                              </td>
                              <td className="px-4 py-2.5 text-gray-700 max-w-[160px]">
                                <span className="truncate block">{r.description || '—'}</span>
                              </td>
                              <td className="px-4 py-2.5">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: dotColor }} />
                                  <span className="text-xs text-gray-600 capitalize">{r.trade || catToTrade(r.category)}</span>
                                </div>
                              </td>
                              <td className="px-4 py-2.5 text-right font-medium text-gray-900 whitespace-nowrap">
                                {formatCurrency(r.total_amount)}
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                <button
                                  onClick={() => setViewingReceipt(r)}
                                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                                  title="查看"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* ── Designer Upload Modal ────────────────────────────────────────── */}
            {showUploadModal && (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div>
                      <h3 className="font-bold text-gray-900">📋 上传单据</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{project?.name}</p>
                    </div>
                    <button onClick={() => setShowUploadModal(false)} className="p-2 rounded-xl hover:bg-gray-100">
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                  <div className="p-5">
                    {/* Trade selector — always visible */}
                    {(uploadOcrState === 'idle' || uploadOcrState === 'review') && (
                      <div className="mb-4">
                        <label className="text-xs text-gray-500 block mb-1">工种 / 工序</label>
                        <select
                          value={uploadTrade}
                          onChange={e => setUploadTrade(e.target.value)}
                          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#4F8EF7]"
                        >
                          <option value="">— 请选择工种 —</option>
                          {projectTrades.map(pt => (
                            <option key={pt.trade} value={pt.trade}>{pt.label}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {uploadOcrState === 'idle' && (
                      <>
                        <input ref={uploadFileRef} type="file" accept="image/*,application/pdf" className="hidden"
                          onChange={e => { const f = e.target.files?.[0]; if (f) handleDesignerFileSelect(f); }} />
                        <button
                          onClick={() => { if (!uploadTrade) { setUploadOcrError('请先选择工种'); return; } uploadFileRef.current?.click(); }}
                          className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-8 flex flex-col items-center gap-3 hover:border-[#4F8EF7]/50 hover:bg-[#4F8EF7]/5 transition-colors"
                        >
                          <Upload className="w-8 h-8 text-gray-400" />
                          <div className="text-center">
                            <p className="font-medium text-gray-700 text-sm">选择图片或 PDF</p>
                            <p className="text-xs text-gray-400 mt-1">支持 JPG / PNG / PDF</p>
                          </div>
                        </button>
                        {uploadOcrError && <p className="mt-3 text-xs text-red-500 text-center">{uploadOcrError}</p>}
                      </>
                    )}

                    {uploadOcrState === 'scanning' && (
                      <div className="py-10 flex flex-col items-center gap-4">
                        <Loader2 className="w-10 h-10 text-[#4F8EF7] animate-spin" />
                        <p className="font-medium text-gray-700 text-sm">AI 正在识别单据...</p>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className="bg-[#4F8EF7] h-2 rounded-full animate-pulse" style={{ width: '65%' }} />
                        </div>
                      </div>
                    )}

                    {uploadOcrState === 'review' && uploadOcrResult && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-500">供应商</label>
                            <input value={uploadOcrResult.supplier || ''} onChange={e => setUploadOcrResult(p => p ? { ...p, supplier: e.target.value } : p)}
                              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 mt-1 focus:outline-none focus:border-[#4F8EF7]" placeholder="供应商" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">日期</label>
                            <input type="date" value={uploadOcrResult.date || ''} onChange={e => setUploadOcrResult(p => p ? { ...p, date: e.target.value } : p)}
                              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 mt-1 focus:outline-none focus:border-[#4F8EF7]" />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-2">品项明细</label>
                          <div className="border border-gray-100 rounded-xl overflow-hidden">
                            {uploadOcrResult.items.length === 0 ? (
                              <div className="p-3 text-xs text-gray-400 text-center">未识别到明细，将以总金额记录</div>
                            ) : uploadOcrResult.items.map((item, i) => (
                              <div key={i} className="flex items-center gap-2 p-3 border-b border-gray-50 last:border-0">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-gray-800 truncate">{item.description}</p>
                                  <p className="text-xs text-gray-400">{item.qty} {item.unit} × RM{item.unit_cost}</p>
                                </div>
                                <span className="text-xs font-bold text-gray-700 whitespace-nowrap">RM {item.total.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex justify-between items-center bg-gray-50 rounded-xl px-4 py-3">
                          <span className="text-sm text-gray-600">合计</span>
                          <span className="font-bold text-gray-900">RM {uploadOcrResult.total_amount.toFixed(2)}</span>
                        </div>
                        {uploadOcrError && <p className="text-xs text-red-500 text-center">{uploadOcrError}</p>}
                        <div className="flex gap-3">
                          <button onClick={() => setShowUploadModal(false)}
                            className="flex-1 py-3 border border-gray-200 rounded-2xl text-sm text-gray-600 font-medium hover:bg-gray-50">取消</button>
                          <button onClick={handleDesignerSave} disabled={!uploadTrade}
                            className="flex-1 py-3 bg-[#4F8EF7] text-white rounded-2xl text-sm font-bold hover:bg-[#3B7BE8] disabled:opacity-50">
                            ✓ 确认保存
                          </button>
                        </div>
                      </div>
                    )}

                    {uploadOcrState === 'saving' && (
                      <div className="py-10 flex flex-col items-center gap-4">
                        <Loader2 className="w-10 h-10 text-[#4F8EF7] animate-spin" />
                        <p className="font-medium text-gray-700 text-sm">正在保存...</p>
                      </div>
                    )}

                    {uploadOcrState === 'done' && (
                      <div className="py-10 flex flex-col items-center gap-4">
                        <CheckCircle2 className="w-14 h-14 text-green-500" />
                        <div className="text-center">
                          <p className="font-bold text-gray-900">保存成功！</p>
                          <p className="text-xs text-gray-500 mt-1">单据已录入成本记录</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Receipt Detail / Print Modal ─────────────────────────────────── */}
            {viewingReceipt && (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900">单据详情</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePrintReceipt(viewingReceipt)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 rounded-xl text-sm text-gray-700 hover:bg-gray-200"
                      >
                        <Printer className="w-4 h-4" /> {t.proj.print}
                      </button>
                      <button onClick={() => setViewingReceipt(null)} className="p-2 rounded-xl hover:bg-gray-100">
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                  <div className="p-5 space-y-4">
                    {/* Meta */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-xs text-gray-500 block">供应商</span><span className="font-medium text-gray-900">{viewingReceipt.supplier || '—'}</span></div>
                      <div><span className="text-xs text-gray-500 block">日期</span><span className="font-medium text-gray-900">{viewingReceipt.receipt_date || '—'}</span></div>
                      <div><span className="text-xs text-gray-500 block">工种</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: TRADE_DOT_COLORS[viewingReceipt.trade || catToTrade(viewingReceipt.category)] || '#9CA3AF' }} />
                          <span className="font-medium text-gray-900 capitalize">{viewingReceipt.trade || catToTrade(viewingReceipt.category)}</span>
                        </div>
                      </div>
                      <div><span className="text-xs text-gray-500 block">工序</span><span className="font-medium text-gray-900">{viewingReceipt.work_item || '—'}</span></div>
                      {viewingReceipt.receipt_number && (
                        <div className="col-span-2"><span className="text-xs text-gray-500 block">单据编号</span><span className="font-medium text-gray-900">{viewingReceipt.receipt_number}</span></div>
                      )}
                    </div>
                    {/* Items table */}
                    <div>
                      <span className="text-xs text-gray-500 block mb-2">品项明细</span>
                      <div className="border border-gray-100 rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="text-left px-3 py-2 text-xs text-gray-500 font-medium">描述</th>
                              <th className="text-center px-2 py-2 text-xs text-gray-500 font-medium">数量</th>
                              <th className="text-center px-2 py-2 text-xs text-gray-500 font-medium">单位</th>
                              <th className="text-right px-3 py-2 text-xs text-gray-500 font-medium">金额</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {parseReceiptItems(viewingReceipt).map((item, i) => (
                              <tr key={i}>
                                <td className="px-3 py-2 text-gray-700">{item.description || '—'}</td>
                                <td className="px-2 py-2 text-center text-gray-500">{item.qty ?? '—'}</td>
                                <td className="px-2 py-2 text-center text-gray-500">{item.unit ?? '—'}</td>
                                <td className="px-3 py-2 text-right font-medium text-gray-900">RM {Number(item.total || 0).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    {/* Total */}
                    <div className="flex justify-between items-center bg-gray-50 rounded-xl px-4 py-3">
                      <span className="font-semibold text-gray-700">合计</span>
                      <span className="font-bold text-gray-900 text-base">RM {Number(viewingReceipt.total_amount || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
