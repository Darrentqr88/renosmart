'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { GanttTask, GanttTaskStatus } from '@/types';
import { useI18n } from '@/lib/i18n/context';
import { getPhaseById } from '@/lib/utils/gantt-rules';
import { format, differenceInDays, addDays, parseISO, startOfWeek } from 'date-fns';
import { MY_HOLIDAY_NAMES, SG_HOLIDAY_NAMES, MY_HOLIDAYS } from '@/lib/utils/dates';

// Count workdays between two dates (inclusive)
function countWorkdays(start: Date, end: Date, workSat = false, workSun = false): number {
  let count = 0;
  const d = new Date(start);
  while (d <= end) {
    const day = d.getDay();
    const isWeekend = (day === 6 && !workSat) || (day === 0 && !workSun);
    if (!isWeekend && !MY_HOLIDAYS.has(format(d, 'yyyy-MM-dd'))) count++;
    d.setDate(d.getDate() + 1);
  }
  return Math.max(1, count);
}

export interface GanttWorkerInfo {
  id: string;           // designer_workers.id
  profile_id: string;
  name: string;
  trades: string[];
  phone?: string;
  rating?: number;
  completion_rate?: number;
}

interface GanttChartProps {
  tasks: GanttTask[];
  onTaskUpdate?: (taskId: string, updates: Partial<GanttTask>) => void;
  onTaskClick?: (taskId: string) => void;
  onStatusToggle?: (taskId: string) => void;
  onAssignWorker?: (taskId: string) => void;
  onRemoveWorker?: (taskId: string, workerId: string) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskReorder?: (taskId: string, newIndex: number, recalcDates: boolean) => void;
  onTaskAdd?: () => void;
  workers?: GanttWorkerInfo[];     // all designer workers (for avatar lookup)
  deadline?: string;
  projectId?: string;
  projectName?: string;
  workOnSaturday?: boolean;
  workOnSunday?: boolean;
  region?: 'MY' | 'SG';
  onPublish?: () => void;
}

const LABEL_WIDTH = 160;

function getHolName(date: Date, region: 'MY' | 'SG' = 'MY'): string | null {
  const s = format(date, 'yyyy-MM-dd');
  return (region === 'MY' ? MY_HOLIDAY_NAMES : SG_HOLIDAY_NAMES).get(s) ?? null;
}

function getChartRange(tasks: GanttTask[]) {
  if (!tasks.length) {
    const s = new Date();
    s.setHours(0, 0, 0, 0);
    return { start: s, totalDays: 70 };
  }
  const starts = tasks.map(t => parseISO(t.start_date).getTime());
  const ends   = tasks.map(t => parseISO(t.end_date).getTime());
  const start  = addDays(new Date(Math.min(...starts)), -3);
  const end    = new Date(Math.max(...ends));
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const totalDays = differenceInDays(end, start) + 12;
  return { start, totalDays };
}

const ASSIGN_WIDTH = 72; // px for right worker column

function workerInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = ['#4F8EF7','#3B82F6','#10B981','#8B5CF6','#F97316','#EC4899','#14B8A6','#EF4444'];
function avatarColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

/* Auto-generate vibrant colors for each task based on its name */
const TASK_PALETTE = [
  '#4F8EF7', '#8B5CF6', '#EC4899', '#F97316', '#FBBF24',
  '#10B981', '#06B6D4', '#EF4444', '#84CC16', '#6366F1',
  '#F472B6', '#14B8A6', '#E11D48', '#0EA5E9', '#A855F7',
  '#22C55E', '#FB923C', '#3B82F6', '#D946EF', '#F59E0B',
];
function autoTaskColor(name: string, index: number): string {
  // Use a combination of name hash and index for maximum variety
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 37 + name.charCodeAt(i)) & 0xffffffff;
  return TASK_PALETTE[(Math.abs(h) + index) % TASK_PALETTE.length];
}
/* Use trade color from task.color (TRADE_COLORS), fallback to auto-generated */
function resolveTaskColor(task: GanttTask, index: number): string {
  return task.color || autoTaskColor(task.name, index);
}

export function GanttChart({
  tasks,
  onTaskUpdate,
  onTaskClick,
  onStatusToggle,
  onAssignWorker,
  onRemoveWorker,
  onTaskDelete,
  onTaskReorder,
  onTaskAdd,
  workers = [],
  deadline,
  projectId = 'temp',
  projectName,
  workOnSaturday = false,
  workOnSunday = false,
  region = 'MY',
  onPublish,
}: GanttChartProps) {
  const { lang } = useI18n();

  const [dragging, setDragging] = useState<{
    taskId: string;
    type: 'move' | 'resize';
    startX: number;
    origStart: string;
    origEnd: string;
    trackPx: number;
  } | null>(null);

  // Local preview state — used for visual-only feedback during drag (no BFS)
  const [previewDrag, setPreviewDrag] = useState<{
    taskId: string;
    start_date: string;
    end_date: string;
    duration: number;
  } | null>(null);

  const [hoveredTask, setHoveredTask] = useState<string | null>(null);
  const [hoveredWeek, setHoveredWeek] = useState<number | null>(null);
  const [reorderDragId, setReorderDragId] = useState<string | null>(null);
  const [reorderOverIdx, setReorderOverIdx] = useState<number | null>(null);
  const [pendingReorder, setPendingReorder] = useState<{ taskId: string; newIndex: number } | null>(null);
  const outerRef = useRef<HTMLDivElement>(null);

  // ─── date range ────────────────────────────────────────────────
  const { start: chartStart, totalDays } = useMemo(() => getChartRange(tasks), [tasks]);

  // ─── week columns ───────────────────────────────────────────────
  const weeks = useMemo(() => {
    const numWeeks = Math.ceil(totalDays / 7) + 1;
    return Array.from({ length: numWeeks }, (_, w) => {
      const mon = startOfWeek(addDays(chartStart, w * 7), { weekStartsOn: 1 });
      let workCount = 0;
      // Each day: { label, isWeekend, holidayName }
      const days: { label: string; dateStr: string; isWeekend: boolean; isWorkday: boolean; holidayName: string | null }[] = [];
      for (let i = 0; i < 7; i++) {
        const day = addDays(mon, i);
        const dow = day.getDay();
        const dateStr = format(day, 'yyyy-MM-dd');
        const isSat = dow === 6;
        const isSun = dow === 0;
        const isWeekend = (isSat && !workOnSaturday) || (isSun && !workOnSunday);
        const holName = getHolName(day, region);
        const isWD = !isWeekend && !holName;
        if (isWD) workCount++;
        days.push({
          label: format(day, 'dd EEE'),  // e.g. "09 Mon"
          dateStr,
          isWeekend: isSat || isSun,
          isWorkday: isWD,
          holidayName: holName,
        });
      }
      return { mon, workCount, days, hasHoliday: days.some(d => d.holidayName) };
    });
  }, [chartStart, totalDays, workOnSaturday, workOnSunday, region]);

  // ─── stripe map (shared across all rows) ───────────────────────
  const stripeMap = useMemo(() => {
    const items: { left: number; width: number; holiday: boolean }[] = [];
    for (let i = 0; i < totalDays; i++) {
      const d = addDays(chartStart, i);
      const dow = d.getDay();
      const holName = getHolName(d, region);
      const isSat = dow === 6 && !workOnSaturday;
      const isSun = dow === 0 && !workOnSunday;
      if (isSat || isSun || holName) {
        items.push({
          left:    (i / totalDays) * 100,
          width:   (1 / totalDays) * 100,
          holiday: !!holName,
        });
      }
    }
    return items;
  }, [chartStart, totalDays, workOnSaturday, workOnSunday, region]);

  // ─── today / deadline markers ───────────────────────────────────
  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);
  const todayOff = differenceInDays(today, chartStart);
  const todayPct = todayOff >= 0 && todayOff < totalDays ? (todayOff / totalDays) * 100 : -1;

  const deadlinePct = useMemo(() => {
    if (!deadline) return -1;
    const off = differenceInDays(parseISO(deadline), chartStart);
    return off >= 0 && off < totalDays ? (off / totalDays) * 100 : -1;
  }, [deadline, chartStart, totalDays]);

  // ─── bar position helpers (use preview during drag for visual feedback) ────
  const getEffTask = (t: GanttTask) =>
    (previewDrag && previewDrag.taskId === t.id)
      ? { ...t, start_date: previewDrag.start_date, end_date: previewDrag.end_date }
      : t;
  const barLeft  = (t: GanttTask) => { const e = getEffTask(t); return (differenceInDays(parseISO(e.start_date), chartStart) / totalDays) * 100; };
  const barWidth = (t: GanttTask) => { const e = getEffTask(t); return Math.max(((differenceInDays(parseISO(e.end_date), parseISO(e.start_date)) + 1) / totalDays) * 100, 0.8); };

  // ─── task status helpers ────────────────────────────────────────
  const isActive = (t: GanttTask) => parseISO(t.start_date) <= today && parseISO(t.end_date) >= today;
  const isPast   = (t: GanttTask) => parseISO(t.end_date) < today;
  const isUpcoming = (t: GanttTask) => parseISO(t.start_date) > today;

  // taskStatus-based opacity & color override
  const getBarStyle = (t: GanttTask): React.CSSProperties => {
    const ts = t.taskStatus;
    if (ts === 'pending')   return { opacity: 0.55 };
    if (ts === 'completed') return { opacity: 1, background: 'var(--rs-green, #16a34a)', boxShadow: 'inset 0 0 0 1.5px rgba(0,0,0,0.15)' };
    // confirmed or no status — normal color
    const past = isPast(t);
    const active = isActive(t);
    return { opacity: past ? 0.45 : active ? 1 : 0.75 };
  };

  const isParallelTask = (t: GanttTask) => {
    const ph = getPhaseById(t.id.replace(`${projectId}-`, ''));
    return !!(ph?.parallel?.length);
  };

  // ─── drag ───────────────────────────────────────────────────────
  const startDrag = useCallback((
    e: React.MouseEvent,
    taskId: string,
    type: 'move' | 'resize',
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const track = (e.currentTarget as HTMLElement).closest('.rs-gantt-track') as HTMLElement;
    const trackPx = track?.offsetWidth ?? 1000;
    setDragging({ taskId, type, startX: e.clientX, origStart: task.start_date, origEnd: task.end_date, trackPx });
  }, [tasks]);

  // During drag: update local preview only (no BFS cascade until mouseUp)
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    const deltaX    = e.clientX - dragging.startX;
    const daysPerPx = totalDays / dragging.trackPx;
    const delta     = Math.round(deltaX * daysPerPx);
    if (delta === 0) return;
    if (dragging.type === 'move') {
      const newStart = addDays(parseISO(dragging.origStart), delta);
      const newEnd = addDays(parseISO(dragging.origEnd), delta);
      setPreviewDrag({
        taskId: dragging.taskId,
        start_date: format(newStart, 'yyyy-MM-dd'),
        end_date:   format(newEnd, 'yyyy-MM-dd'),
        duration:   countWorkdays(newStart, newEnd, workOnSaturday, workOnSunday),
      });
    } else {
      const newEndDate = addDays(parseISO(dragging.origEnd), delta);
      const newEnd = format(newEndDate, 'yyyy-MM-dd');
      if (newEnd > dragging.origStart) {
        setPreviewDrag({
          taskId: dragging.taskId,
          start_date: dragging.origStart,
          end_date:   newEnd,
          duration:   countWorkdays(parseISO(dragging.origStart), newEndDate, workOnSaturday, workOnSunday),
        });
      }
    }
  }, [dragging, totalDays]);

  // On mouseUp: commit final position → triggers BFS cascade once
  const stopDrag = useCallback(() => {
    if (previewDrag && onTaskUpdate) {
      onTaskUpdate(previewDrag.taskId, {
        start_date: previewDrag.start_date,
        end_date:   previewDrag.end_date,
        duration:   previewDrag.duration,
      });
    }
    setDragging(null);
    setPreviewDrag(null);
  }, [previewDrag, onTaskUpdate]);

  // ─── computed summary ───────────────────────────────────────────
  const ganttStart = tasks.length > 0 ? tasks.reduce((m, t) => t.start_date < m ? t.start_date : m, tasks[0].start_date) : '';
  const ganttEnd   = tasks.length > 0 ? tasks.reduce((m, t) => t.end_date   > m ? t.end_date   : m, tasks[0].end_date)   : '';
  const assignedCount   = tasks.filter(t => (t.assigned_workers || []).length > 0).length;
  const uniqueWorkerIds = Array.from(new Set(tasks.flatMap(t => t.assigned_workers || [])));

  // ─── render ─────────────────────────────────────────────────────
  return (
    <div
      className="rs-gantt-wrap"
      onMouseMove={onMouseMove}
      onMouseUp={stopDrag}
      onMouseLeave={stopDrag}
      ref={outerRef}
      style={{ userSelect: dragging ? 'none' : undefined }}
    >
      <div className="rs-gantt-outer">

        {/* ── Project header bar ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '6px 8px 6px 0', borderBottom: '1px solid var(--rs-border2, #e5e7eb)', marginBottom: 2,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--rs-text2, #374151)', paddingLeft: LABEL_WIDTH + 4 }}>
            {projectName ? `${projectName} · ` : ''}<span style={{ color: 'var(--rs-text3)' }}>施工进度</span>
            {ganttStart && ganttEnd && (
              <span style={{ color: '#9CA3AF', fontWeight: 400, marginLeft: 8 }}>
                {format(parseISO(ganttStart), 'dd MMM')} – {format(parseISO(ganttEnd), 'dd MMM')}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: ASSIGN_WIDTH + 4 }}>
            <span style={{ fontSize: 10, color: '#9CA3AF' }}>
              点击任务查看详情 · 拖拽调整工期 · 拖拽添加工人
            </span>
            {onPublish && (
              <button
                onClick={onPublish}
                style={{
                  background: 'var(--accent)', color: '#000', border: 'none',
                  borderRadius: 8, padding: '4px 12px', fontSize: 11, fontWeight: 700,
                  cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                ✓ 确认并发布
              </button>
            )}
          </div>
        </div>

        {/* ── Calendar header ── */}
        <div style={{ display: 'flex', alignItems: 'stretch' }}>
          <div className="rs-gantt-cal-header" style={{ marginLeft: LABEL_WIDTH, flex: 1 }}>
            {weeks.map((wk, i) => {
              const holDays = wk.days.filter(d => d.holidayName);
              const maxWorkdays = workOnSaturday && workOnSunday ? 7 : workOnSaturday || workOnSunday ? 6 : 5;
              const isLowWork = wk.workCount < maxWorkdays && wk.workCount > 0;
              const workColor = wk.workCount < 3 ? 'var(--rs-red, #E53935)' : wk.workCount < maxWorkdays ? 'var(--rs-orange, #F97316)' : 'var(--rs-text3, #6B7A94)';
              const isHovered = hoveredWeek === i;
              return (
                <div
                  key={i}
                  className={`rs-gantt-col-week${wk.hasHoliday ? ' holiday-col' : ''}`}
                  style={{ position: 'relative' }}
                  onMouseEnter={() => setHoveredWeek(i)}
                  onMouseLeave={() => setHoveredWeek(null)}
                >
                  <div className="rs-gantt-week-date">{format(wk.mon, 'dd MMM')}</div>
                  <div className="rs-gantt-week-label">W{i + 1}</div>
                  <div className="rs-gantt-week-workdays" style={{ color: workColor }}>
                    {wk.workCount}{lang === 'ZH' ? '天' : 'd'}
                    {isLowWork ? <span style={{ marginLeft: 1 }}>⚠</span> : null}
                  </div>
                  {wk.hasHoliday && <div className="rs-gantt-holiday-badge">🎌</div>}

                  {/* ── Hover popup: dates + holidays ── */}
                  {isHovered && (
                    <div style={{
                      position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                      zIndex: 999, background: 'var(--rs-text, #1B2336)', color: '#fff',
                      borderRadius: 8, padding: '8px 10px', minWidth: 160,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.25)', fontSize: 11, lineHeight: 1.6,
                      pointerEvents: 'none',
                    }}>
                      <div style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: 4 }}>
                        W{i + 1} · {format(wk.mon, 'dd MMM')} – {format(addDays(wk.mon, 6), 'dd MMM')}
                      </div>
                      {wk.days.map((d, di) => (
                        <div key={di} style={{
                          display: 'flex', justifyContent: 'space-between', gap: 8,
                          opacity: d.isWorkday ? 1 : 0.45,
                        }}>
                          <span style={{ color: d.isWeekend ? '#94a3b8' : d.holidayName ? '#fbbf24' : '#e2e8f0' }}>
                            {d.label}
                          </span>
                          {d.holidayName && (
                            <span style={{ color: '#fbbf24', fontSize: 10, maxWidth: 120, textAlign: 'right' }}>
                              🎌 {d.holidayName}
                            </span>
                          )}
                          {!d.isWorkday && !d.holidayName && (
                            <span style={{ color: '#64748b', fontSize: 10 }}>
                              {d.isWeekend ? (workOnSaturday || workOnSunday ? '' : '休息') : ''}
                            </span>
                          )}
                        </div>
                      ))}
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 4, paddingTop: 4, color: '#94a3b8', fontSize: 10 }}>
                        工作日 {wk.workCount}/{maxWorkdays}
                        {holDays.length > 0 ? ` · ${holDays.length} 公假` : ''}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {/* Right column header */}
          <div style={{
            width: ASSIGN_WIDTH, flexShrink: 0, borderLeft: '1px solid var(--rs-border2, #e5e7eb)',
            fontSize: 10, fontWeight: 700, color: 'var(--rs-text3)', textAlign: 'center',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#fafafa',
          }}>
            分配工人
          </div>
        </div>

        {/* ── Gantt rows ── */}
        <div>
          {(() => {
            // Group tasks by phase_group (design > preparation > construction), fallback to old grouping
            const hasPhaseGroups = tasks.some(t => t.phase_group);
            let groups: { label: string; labelZh: string; icon: string; bg: string; items: GanttTask[] }[] = [];

            if (hasPhaseGroups) {
              const designTasks = tasks.filter(t => t.phase_group === 'design');
              const prepTasks = tasks.filter(t => t.phase_group === 'preparation');
              const constructionTasks = tasks.filter(t => !t.phase_group || t.phase_group === 'construction');
              if (designTasks.length > 0)       groups.push({ label: 'Design', labelZh: '🎨 设计确认', icon: '🎨', bg: '#f8f9fa', items: designTasks });
              if (prepTasks.length > 0)          groups.push({ label: 'Preparation', labelZh: '🔧 前期准备', icon: '🔧', bg: '#f0f7ff', items: prepTasks });
              if (constructionTasks.length > 0)  groups.push({ label: 'Construction', labelZh: '🏗️ 施工阶段', icon: '🏗️', bg: '#ffffff', items: constructionTasks });
            } else {
              const upcomingTasks = tasks.filter(t => isUpcoming(t));
              const startedTasks  = tasks.filter(t => !isUpcoming(t));
              if (startedTasks.length > 0)  groups.push({ label: 'In Progress / Completed', labelZh: '已开工', icon: '▶', bg: '#fff', items: startedTasks });
              if (upcomingTasks.length > 0) groups.push({ label: 'Upcoming', labelZh: '待开工', icon: '⏳', bg: '#fff', items: upcomingTasks });
            }

            return groups.map((group) => (
              <div key={group.label}>
                {/* Group header — same flex layout as task rows to maintain alignment */}
                <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(79,142,247,0.12)' }}>
                  <div style={{ width: LABEL_WIDTH, fontSize: 10, fontWeight: 700, color: '#4a5a6a', textTransform: 'uppercase', letterSpacing: 1.2, padding: '6px 0 6px 4px', flexShrink: 0 }}>
                    {lang === 'ZH' ? group.labelZh : group.label}
                  </div>
                  <div style={{ flex: 1 }} />
                </div>
                {group.items.map((task, taskIdx) => {
            const tColor   = resolveTaskColor(task, taskIdx);
            const active   = isActive(task);
            const parallel = isParallelTask(task);
            const bLeft    = barLeft(task);
            const bWidth   = barWidth(task);
            const barStyle = getBarStyle(task);
            const isHov    = hoveredTask === task.id;
            const ts       = task.taskStatus;

            const labelColor = ts === 'completed' ? 'var(--rs-green, #16a34a)' : tColor;
            const prefix     = ts === 'completed' ? '✓ ' : active ? '▶ ' : '';

            const assignedWorkerIds = task.assigned_workers || [];
            const assignedWorkerObjs = workers.filter(w =>
              assignedWorkerIds.includes(w.id) || assignedWorkerIds.includes(w.profile_id)
            );

            return (
              <div
                key={task.id}
                className={`rs-gantt-row${reorderDragId === task.id ? ' reorder-dragging' : ''}${reorderOverIdx === taskIdx ? ' reorder-over' : ''}`}
                style={{ display: 'flex', alignItems: 'stretch', opacity: reorderDragId === task.id ? 0.4 : 1 }}
                draggable={!!onTaskReorder}
                onDragStart={(e) => {
                  setReorderDragId(task.id);
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('text/plain', task.id);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (reorderDragId && reorderDragId !== task.id) {
                    setReorderOverIdx(taskIdx);
                  }
                }}
                onDragLeave={() => setReorderOverIdx(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  if (reorderDragId && reorderDragId !== task.id && onTaskReorder) {
                    setPendingReorder({ taskId: reorderDragId, newIndex: taskIdx });
                  }
                  setReorderDragId(null);
                  setReorderOverIdx(null);
                }}
                onDragEnd={() => { setReorderDragId(null); setReorderOverIdx(null); }}
              >

                {/* Label */}
                <div
                  className="rs-gantt-label"
                  style={{ width: LABEL_WIDTH, color: labelColor, flexShrink: 0, position: 'relative' }}
                  onClick={() => onTaskClick?.(task.id)}
                  title={lang === 'ZH' ? '点击查看细分内容和备料清单' : 'Click for details & prep checklist'}
                >
                  {/* Delete button — hover only */}
                  {onTaskDelete && (
                    <button
                      className="rs-gantt-delete-btn"
                      onClick={(e) => { e.stopPropagation(); onTaskDelete(task.id); }}
                      title={lang === 'ZH' ? '删除工序' : 'Delete task'}
                      style={{
                        position: 'absolute', top: 2, right: 2,
                        width: 16, height: 16, borderRadius: '50%',
                        background: '#EF4444', color: '#fff', border: 'none',
                        fontSize: 9, cursor: 'pointer', display: 'none',
                        alignItems: 'center', justifyContent: 'center', lineHeight: 1, zIndex: 5,
                      }}
                    >
                      ✕
                    </button>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, lineHeight: 1.3 }}>
                    {/* Status cycle button */}
                    {onStatusToggle && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onStatusToggle(task.id); }}
                        title={lang === 'ZH' ? '点击切换状态' : 'Click to cycle status'}
                        aria-label={`${lang === 'ZH' ? '切换状态' : 'Cycle status'}: ${task.name} (${ts || 'confirmed'})`}
                        style={{
                          flexShrink: 0,
                          width: 18, height: 18,
                          borderRadius: '50%',
                          border: ts === 'completed' ? '1.5px solid #16a34a'
                                : ts === 'pending'   ? '1.5px solid #9CA3AF'
                                : `1.5px solid ${tColor}`,
                          background: ts === 'completed' ? '#16a34a'
                                    : ts === 'pending'   ? 'transparent'
                                    : `${tColor}22`,
                          color: ts === 'completed' ? '#fff'
                               : ts === 'pending'   ? '#9CA3AF'
                               : tColor,
                          fontSize: 10, fontWeight: 700,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', transition: 'all 0.18s',
                        }}
                      >
                        {ts === 'completed' ? '✓' : ts === 'pending' ? '○' : '●'}
                      </button>
                    )}
                    <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {prefix}
                      {lang === 'ZH' && task.name_zh ? task.name_zh : task.name}
                      {parallel && (
                        <span className="rs-gantt-parallel-badge">
                          ⚡ {lang === 'ZH' ? '并行' : 'Parallel'}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="rs-gantt-label-sub">
                    {format(parseISO(task.start_date), 'dd MMM')}–{format(parseISO(task.end_date), 'dd MMM')} · {task.duration}{lang === 'ZH' ? '天' : 'd'}
                  </div>
                </div>

                {/* Track */}
                <div
                  className="rs-gantt-track"
                  style={{ flex: 1 }}
                  onMouseEnter={() => setHoveredTask(task.id)}
                  onMouseLeave={() => setHoveredTask(null)}
                >
                  {/* Weekend/holiday stripes */}
                  {stripeMap.map((s, si) => (
                    <div
                      key={si}
                      className={`rs-gantt-stripe${s.holiday ? ' stripe-holiday' : ' stripe-weekend'}`}
                      aria-hidden="true"
                      style={{ left: `${s.left.toFixed(3)}%`, width: `${s.width.toFixed(3)}%` }}
                    />
                  ))}

                  {/* Gantt bar */}
                  <div
                    className={`rs-gantt-bar${isHov ? ' hovered' : ''}`}
                    data-status={task.taskStatus || 'confirmed'}
                    style={{
                      left:       `${bLeft.toFixed(3)}%`,
                      width:      `${bWidth.toFixed(3)}%`,
                      background: barStyle.background || tColor,
                      opacity:    barStyle.opacity,
                      cursor:     dragging ? 'grabbing' : 'grab',
                      boxShadow:  barStyle.boxShadow || (task.is_critical ? 'inset 0 0 0 1.5px rgba(27,35,54,0.6)' : undefined),
                    }}
                    onMouseDown={(e) => startDrag(e, task.id, 'move')}
                    onClick={() => !dragging && onTaskClick?.(task.id)}
                    title={`${format(parseISO(task.start_date), 'dd MMM')} – ${format(parseISO(task.end_date), 'dd MMM')} · ${task.duration} ${lang === 'ZH' ? '工作日' : 'working days'}`}
                  >
                    <span className="rs-gantt-bar-label">
                      {bWidth > 7
                        ? (lang === 'ZH' && task.name_zh ? task.name_zh.slice(0, 8) : task.trade)
                        : ''}
                    </span>
                    {/* Resize handle */}
                    <div
                      className="rs-gantt-resize-handle"
                      onMouseDown={(e) => { e.stopPropagation(); startDrag(e, task.id, 'resize'); }}
                    />
                  </div>

                  {/* Today line */}
                  {todayPct >= 0 && (
                    <div
                      className="rs-gantt-today-line"
                      aria-hidden="true"
                      style={{ left: `${todayPct.toFixed(3)}%` }}
                      data-label={lang === 'ZH' ? '今天' : 'Today'}
                    />
                  )}

                  {/* Deadline line */}
                  {deadlinePct >= 0 && (
                    <div
                      className="rs-gantt-deadline-line"
                      aria-hidden="true"
                      style={{ left: `${deadlinePct.toFixed(3)}%` }}
                    />
                  )}
                </div>

                {/* ── Right: Assign worker column ── */}
                <div style={{
                  width: ASSIGN_WIDTH, flexShrink: 0,
                  borderLeft: '1px solid #f0f0f0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 2, padding: '2px 4px', background: '#fafafa',
                }}>
                  {assignedWorkerObjs.length > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                      {assignedWorkerObjs.slice(0, 2).map(w => (
                        <div key={w.id} style={{ position: 'relative' }}>
                          <div
                            title={w.name}
                            style={{
                              width: 24, height: 24, borderRadius: '50%',
                              background: avatarColor(w.id),
                              color: '#fff', fontSize: 9, fontWeight: 700,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'default',
                            }}
                          >
                            {workerInitials(w.name)}
                          </div>
                          {onRemoveWorker && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onRemoveWorker(task.id, w.id); }}
                              title="移除工人"
                              style={{
                                position: 'absolute', top: -4, right: -4,
                                width: 12, height: 12, borderRadius: '50%',
                                background: '#EF4444', color: '#fff', border: 'none',
                                fontSize: 8, cursor: 'pointer', display: 'none',
                                alignItems: 'center', justifyContent: 'center',
                                lineHeight: 1,
                              }}
                              className="remove-worker-btn"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      {assignedWorkerObjs.length > 2 && (
                        <div style={{
                          width: 20, height: 20, borderRadius: '50%',
                          background: '#e5e7eb', color: '#6B7A94', fontSize: 8, fontWeight: 700,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          +{assignedWorkerObjs.length - 2}
                        </div>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); onAssignWorker?.(task.id); }}
                        title="修改分配"
                        style={{
                          width: 18, height: 18, borderRadius: '50%',
                          border: '1.5px dashed #D1D5DB', background: 'transparent',
                          color: '#9CA3AF', fontSize: 10, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); onAssignWorker?.(task.id); }}
                      style={{
                        fontSize: 10, color: '#9CA3AF',
                        border: '1px dashed #D1D5DB', borderRadius: 6,
                        padding: '2px 6px', background: 'transparent',
                        cursor: 'pointer', whiteSpace: 'nowrap',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#4F8EF7'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#4F8EF7'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#9CA3AF'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#D1D5DB'; }}
                    >
                      + 分配
                    </button>
                  )}
                </div>
              </div>
            );
          })}
              </div>
            ))
          })()}
        </div>

        {/* ── Add task button ── */}
        {onTaskAdd && (
          <div
            onClick={onTaskAdd}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '8px 12px', borderTop: '1px dashed #e5e7eb',
              cursor: 'pointer', transition: 'all 0.15s',
              color: '#9CA3AF', fontSize: 12, fontWeight: 500,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.color = '#4F8EF7'; (e.currentTarget as HTMLDivElement).style.background = '#f0f7ff'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.color = '#9CA3AF'; (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
          >
            + {lang === 'ZH' ? '添加工序' : 'Add Task'}
          </div>
        )}

        {/* ── Bottom status bar ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '8px 12px', borderTop: '1px solid #e5e7eb',
          background: '#fafafa', fontSize: 11,
        }}>
          <span style={{ color: '#374151', fontWeight: 600 }}>
            {assignedCount}/{tasks.length} 个工序已分配
          </span>
          <span style={{ color: '#9CA3AF' }}>·</span>
          <span style={{ color: '#3B82F6', fontWeight: 500 }}>
            {uniqueWorkerIds.length} 位工人参与
          </span>
          <span style={{ color: '#9CA3AF' }}>·</span>
          <span style={{ color: '#F97316', fontWeight: 500 }}>
            {tasks.length - assignedCount} 个工序待分配
          </span>
        </div>
      </div>

      {/* ── Reorder confirmation dialog ── */}
      {pendingReorder && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setPendingReorder(null)}>
          <div style={{
            background: '#fff', borderRadius: 12, padding: '20px 24px', maxWidth: 400,
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1B2336', marginBottom: 8 }}>
              {lang === 'ZH' ? '调整工序顺序' : 'Reorder Tasks'}
            </div>
            <p style={{ fontSize: 13, color: '#6B7A94', marginBottom: 16 }}>
              {lang === 'ZH' ? '是否根据新顺序重新计算日期和依赖关系？' : 'Recalculate dates and dependencies based on new order?'}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => {
                  onTaskReorder?.(pendingReorder.taskId, pendingReorder.newIndex, true);
                  setPendingReorder(null);
                }}
                style={{ flex: 1, padding: '8px 16px', borderRadius: 8, background: '#4F8EF7', color: '#fff', border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
              >
                {lang === 'ZH' ? '是，重新计算' : 'Yes, Recalculate'}
              </button>
              <button
                onClick={() => {
                  onTaskReorder?.(pendingReorder.taskId, pendingReorder.newIndex, false);
                  setPendingReorder(null);
                }}
                style={{ flex: 1, padding: '8px 16px', borderRadius: 8, background: '#f5f5f5', color: '#374151', border: '1px solid #e5e7eb', fontWeight: 500, fontSize: 13, cursor: 'pointer' }}
              >
                {lang === 'ZH' ? '仅调整顺序' : 'Order Only'}
              </button>
            </div>
            <div style={{ marginTop: 12, fontSize: 11, color: '#9CA3AF', lineHeight: 1.6 }}>
              <div><strong style={{ color: '#4F8EF7' }}>{lang === 'ZH' ? '重新计算' : 'Recalculate'}</strong>{lang === 'ZH' ? '：按新顺序重排所有日期，后续任务自动顺延' : ': Reschedule all dates based on new order, subsequent tasks shift accordingly'}</div>
              <div><strong style={{ color: '#6B7280' }}>{lang === 'ZH' ? '仅调整顺序' : 'Order Only'}</strong>{lang === 'ZH' ? '：只移动行的显示位置，日期不变' : ': Only move the row position visually, dates stay unchanged'}</div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .rs-gantt-row:hover .remove-worker-btn { display: flex !important; }
        .rs-gantt-row:hover .rs-gantt-delete-btn { display: flex !important; }
        .rs-gantt-row.reorder-over { border-top: 2px solid #4F8EF7 !important; }
        .rs-gantt-row { cursor: ${onTaskReorder ? 'grab' : 'default'}; }
      `}</style>
    </div>
  );
}
