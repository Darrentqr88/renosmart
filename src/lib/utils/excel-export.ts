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
  const { format, differenceInDays, parseISO } = await import('date-fns');

  const rows = tasks.map((t, i) => ({
    'No': i + 1,
    'Phase': t.phase_group === 'design' ? 'Design' : t.phase_group === 'preparation' ? 'Preparation' : 'Construction',
    'Task': lang === 'ZH' && t.name_zh ? t.name_zh : t.name,
    'Trade': t.trade,
    'Start Date': t.start_date,
    'End Date': t.end_date,
    'Duration (days)': t.duration,
    'Status': t.taskStatus === 'completed' ? 'Completed' : t.taskStatus === 'confirmed' ? 'Confirmed' : 'Pending',
    'Critical Path': t.is_critical ? 'Yes' : '',
    'Dependencies': t.dependencies?.join(', ') || '',
    'Assigned Workers': (t.assigned_workers || []).join(', '),
    'Progress (%)': t.progress || 0,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 4 }, { wch: 14 }, { wch: 36 }, { wch: 16 },
    { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 12 },
    { wch: 13 }, { wch: 24 }, { wch: 20 }, { wch: 12 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Gantt Schedule');

  if (includeSummary && startDate) {
    const projectEnd = tasks[tasks.length - 1].end_date;
    const calDays = differenceInDays(parseISO(projectEnd), parseISO(tasks[0].start_date)) + 1;
    const summaryRows = [
      { 'Item': 'Project Start', 'Value': startDate },
      { 'Item': 'Project End', 'Value': projectEnd },
      { 'Item': 'Calendar Days', 'Value': calDays },
      { 'Item': 'Calendar Weeks', 'Value': Math.ceil(calDays / 7) },
      { 'Item': 'Total Tasks', 'Value': tasks.length },
      { 'Item': 'Critical Tasks', 'Value': tasks.filter(t => t.is_critical).length },
      ...(siteType ? [{ 'Item': 'Site Type', 'Value': siteType }] : []),
      ...(workSat !== undefined ? [{ 'Item': 'Work Saturday', 'Value': workSat ? 'Yes' : 'No' }] : []),
      ...(workSun !== undefined ? [{ 'Item': 'Work Sunday', 'Value': workSun ? 'Yes' : 'No' }] : []),
      { 'Item': 'Generated', 'Value': format(new Date(), 'yyyy-MM-dd HH:mm') },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    wsSummary['!cols'] = [{ wch: 18 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Project Summary');
  }

  const dateStr = format(new Date(), 'yyyyMMdd');
  const safeName = projectName
    ? projectName.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '_').slice(0, 30)
    : 'Gantt';
  XLSX.writeFile(wb, `RenoSmart_${safeName}_${dateStr}.xlsx`);
}
