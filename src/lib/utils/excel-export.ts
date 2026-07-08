import type { GanttTask } from '@/types';

interface ExportGanttOptions {
  tasks: GanttTask[];
  lang?: string;
  startDate?: string;
  siteType?: string;
  workSat?: boolean;
  workSun?: boolean;
  projectName?: string;
  includeSummary?: boolean;
}

export async function exportGanttToExcel(opts: ExportGanttOptions) {
  const { tasks, lang, startDate, siteType, workSat, workSun, projectName, includeSummary = true } = opts;
  if (tasks.length === 0) return;

  const XLSX = await import('xlsx');
  const { format, differenceInDays, parseISO, startOfWeek, addWeeks } = await import('date-fns');

  // ── Sort by start date so the sheet reads top-to-bottom in construction order ──
  const sorted = [...tasks].sort((a, b) =>
    a.start_date === b.start_date
      ? (a.sort_order ?? 0) - (b.sort_order ?? 0)
      : a.start_date.localeCompare(b.start_date));

  // Map task id → row number for readable dependency references
  const rowNo = new Map(sorted.map((t, i) => [t.id, i + 1]));

  // ── Weekly Gantt grid: one column per week across the project span ──
  const projStart = parseISO(sorted[0].start_date);
  const projEnd = sorted.reduce((m, t) => t.end_date > m ? t.end_date : m, sorted[0].end_date);
  const gridStart = startOfWeek(projStart, { weekStartsOn: 1 }); // Monday
  const weekCount = Math.min(60, Math.ceil((differenceInDays(parseISO(projEnd), gridStart) + 1) / 7));
  const weekCols: { key: string; start: Date; end: Date }[] = [];
  for (let w = 0; w < weekCount; w++) {
    const ws = addWeeks(gridStart, w);
    weekCols.push({ key: format(ws, 'dd MMM'), start: ws, end: addWeeks(ws, 1) });
  }

  const progressBar = (p: number) => {
    const filled = Math.round(Math.max(0, Math.min(100, p)) / 10);
    return `${'█'.repeat(filled)}${'░'.repeat(10 - filled)} ${p || 0}%`;
  };

  const rows = sorted.map((t, i) => {
    const base: Record<string, string | number> = {
      'No': i + 1,
      'Phase': t.phase_group === 'design' ? 'Design' : t.phase_group === 'preparation' ? 'Preparation' : 'Construction',
      'Task': lang === 'ZH' && t.name_zh ? t.name_zh : t.name,
      'Trade': t.trade,
      'Start Date': t.start_date,
      'End Date': t.end_date,
      'Duration (days)': t.duration,
      'Progress': progressBar(t.progress || 0),
      'Status': t.taskStatus === 'completed' ? 'Completed' : t.taskStatus === 'confirmed' ? 'Confirmed' : 'Pending',
      'Critical Path': t.is_critical ? '★ Yes' : '',
      'Depends On (No)': (t.dependencies || []).map(d => rowNo.get(d)).filter(Boolean).join(', '),
      'Material Lead Time': t.leadTimeDays ? `${t.leadTimeDays}d before start` : '',
      'Assigned Workers': (t.assigned_workers || []).join(', '),
    };
    // Gantt grid cells: block per overlapping day of the week (▓ = critical path)
    const ts = parseISO(t.start_date);
    const te = parseISO(t.end_date);
    for (const wc of weekCols) {
      const overlapStart = ts > wc.start ? ts : wc.start;
      const overlapEnd = te < wc.end ? te : wc.end;
      const days = differenceInDays(overlapEnd, overlapStart) + (te < wc.end ? 1 : 0);
      base[wc.key] = days > 0 ? (t.is_critical ? '▓' : '█').repeat(Math.min(7, Math.max(1, days))) : '';
    }
    return base;
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 4 },  { wch: 12 }, { wch: 36 }, { wch: 16 },
    { wch: 11 }, { wch: 11 }, { wch: 8 },  { wch: 16 },
    { wch: 10 }, { wch: 9 },  { wch: 12 }, { wch: 16 }, { wch: 20 },
    ...weekCols.map(() => ({ wch: 8 })),
  ];
  ws['!freeze'] = { xSplit: 3, ySplit: 1 };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Gantt Schedule');

  if (includeSummary && startDate) {
    const calDays = differenceInDays(parseISO(projEnd), projStart) + 1;
    const done = sorted.filter(t => t.taskStatus === 'completed').length;
    const overallProgress = Math.round(sorted.reduce((s, t) => s + (t.progress || 0), 0) / sorted.length);
    const summaryRows = [
      { 'Item': 'Project Start', 'Value': startDate },
      { 'Item': 'Project End', 'Value': projEnd },
      { 'Item': 'Calendar Days', 'Value': calDays },
      { 'Item': 'Calendar Weeks', 'Value': Math.ceil(calDays / 7) },
      { 'Item': 'Total Tasks', 'Value': sorted.length },
      { 'Item': 'Completed Tasks', 'Value': done },
      { 'Item': 'Overall Progress', 'Value': progressBar(overallProgress) },
      { 'Item': 'Critical Tasks', 'Value': sorted.filter(t => t.is_critical).length },
      ...(siteType ? [{ 'Item': 'Site Type', 'Value': siteType }] : []),
      ...(workSat !== undefined ? [{ 'Item': 'Work Saturday', 'Value': workSat ? 'Yes' : 'No' }] : []),
      ...(workSun !== undefined ? [{ 'Item': 'Work Sunday', 'Value': workSun ? 'Yes' : 'No' }] : []),
      { 'Item': 'Legend', 'Value': '█ task week · ▓ critical path · ★ zero float' },
      { 'Item': 'Generated', 'Value': format(new Date(), 'yyyy-MM-dd HH:mm') },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    wsSummary['!cols'] = [{ wch: 18 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Project Summary');
  }

  const dateStr = format(new Date(), 'yyyyMMdd');
  const safeName = projectName
    ? projectName.replace(/[^a-zA-Z0-9一-鿿]/g, '_').slice(0, 30)
    : 'Gantt';
  XLSX.writeFile(wb, `RenoSmart_${safeName}_${dateStr}.xlsx`);
}
