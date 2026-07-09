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

// ── Brand palette (mirrors CLAUDE.md design tokens) ───────────────────────────
const NAVY = 'FF0F1923';
const GOLD = 'FFF0B90B';
const GRAY_BAND = 'FFEEF1F6';
const WHITE_BAND = 'FFF7F8FA';
const BORDER_GRAY = 'FFD8DEE8';
const TEXT_DARK = 'FF1A1A2E';
const RED = 'FFE53935';

function argb(hex6: string) {
  return `FF${hex6.replace('#', '').toUpperCase()}`;
}

// Mix a brand color with white to make a lighter tint (for lead-time segments)
function tint(hex6: string, amount: number): string {
  const h = hex6.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return `FF${[mix(r), mix(g), mix(b)].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

// WCAG-ish luminance check to decide black vs white bar text
function readableTextColor(hex6: string): string {
  const h = hex6.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? TEXT_DARK : 'FFFFFFFF';
}

/**
 * Builds the ExcelJS workbook in memory (no browser APIs — safe to unit-test
 * in Node). exportGanttToExcel() below wraps this with the browser download.
 */
export async function buildGanttWorkbook(opts: ExportGanttOptions) {
  const { tasks, lang, startDate, siteType, workSat, workSun, projectName, includeSummary = true } = opts;
  if (tasks.length === 0) return null;

  const ExcelJS = (await import('exceljs')).default;
  const { format, differenceInDays, parseISO, startOfWeek, addWeeks, isWithinInterval, addDays } = await import('date-fns');
  const zh = lang === 'ZH';

  // ── Sort by start date, grouped by trade (mirrors on-screen Gantt trade coloring) ──
  const sorted = [...tasks].sort((a, b) =>
    a.start_date === b.start_date
      ? (a.sort_order ?? 0) - (b.sort_order ?? 0)
      : a.start_date.localeCompare(b.start_date));
  const rowNo = new Map(sorted.map((t, i) => [t.id, i + 1]));

  const tradeOrder: string[] = [];
  for (const t of sorted) if (!tradeOrder.includes(t.trade)) tradeOrder.push(t.trade);
  const tradeGroups = tradeOrder.map(trade => ({ trade, tasks: sorted.filter(t => t.trade === trade) }));

  // ── Weekly grid spanning the whole project ────────────────────────────────
  const projStart = parseISO(sorted[0].start_date);
  const projEnd = sorted.reduce((m, t) => t.end_date > m ? t.end_date : m, sorted[0].end_date);
  const gridStart = startOfWeek(projStart, { weekStartsOn: 1 });
  const weekCount = Math.min(60, Math.ceil((differenceInDays(parseISO(projEnd), gridStart) + 1) / 7));
  const weekCols = Array.from({ length: weekCount }, (_, w) => {
    const start = addWeeks(gridStart, w);
    return { start, end: addWeeks(start, 1), quarter: Math.floor(start.getMonth() / 3), month: start.getMonth(), year: start.getFullYear() };
  });
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayWeekIdx = weekCols.findIndex(w => isWithinInterval(today, { start: w.start, end: addDays(w.end, -1) }));

  // ── Fixed left columns, then one column per week ──────────────────────────
  const FIXED_COLS = ['band', 'desc', 'task', 'dur', 'prog', 'crit'] as const;
  const FIXED_WIDTHS = [3, 20, 34, 7, 8, 4];
  const WEEK_START_COL = FIXED_COLS.length + 1; // 1-based
  const totalCols = FIXED_COLS.length + weekCount;

  const wb = new ExcelJS.Workbook();
  wb.creator = 'RenoSmart';
  wb.created = new Date();
  const ws = wb.addWorksheet(zh ? '施工进度表' : 'Gantt Schedule', {
    views: [{ showGridLines: false, state: 'frozen', xSplit: FIXED_COLS.length, ySplit: 5 }],
  });
  ws.columns = [...FIXED_WIDTHS, ...weekCols.map(() => 8)].map(w => ({ width: w }));

  const thinBorder = { style: 'thin' as const, color: { argb: BORDER_GRAY } };
  const cellBorder = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };

  // ── Row 1: Title ────────────────────────────────────────────────────────
  ws.mergeCells(1, 1, 1, totalCols);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = `${projectName ? projectName + ' — ' : ''}${zh ? '施工进度表' : 'CONSTRUCTION SCHEDULE'}`;
  titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  ws.getRow(1).height = 30;
  for (let c = 1; c <= totalCols; c++) ws.getCell(1, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };

  // ── Row 2: subtitle (date range + generated timestamp) ────────────────────
  ws.mergeCells(2, 1, 2, totalCols);
  const subCell = ws.getCell(2, 1);
  subCell.value = `${format(projStart, 'dd MMM yyyy')} – ${format(parseISO(projEnd), 'dd MMM yyyy')}    ·    ${zh ? '生成于' : 'Generated'} ${format(new Date(), 'dd MMM yyyy HH:mm')}`;
  subCell.font = { italic: true, size: 9, color: { argb: 'FF6B7A94' } };
  subCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  ws.getRow(2).height = 16;

  // ── Row 3: Quarter band (alternating; current quarter highlighted gold) ───
  const QROW = 3, MROW = 4, WROW = 5;
  ws.getRow(QROW).height = 16;
  ws.getRow(MROW).height = 16;
  ws.getRow(WROW).height = 18;
  for (const col of FIXED_COLS.keys()) { ws.getCell(QROW, col + 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } }; }
  {
    let c = WEEK_START_COL;
    let i = 0;
    while (i < weekCols.length) {
      const q = weekCols[i].quarter, y = weekCols[i].year;
      let span = 0;
      while (i + span < weekCols.length && weekCols[i + span].quarter === q && weekCols[i + span].year === y) span++;
      const startCol = c, endCol = c + span - 1;
      const isCurrentQ = todayWeekIdx >= i && todayWeekIdx < i + span;
      if (span > 1) ws.mergeCells(QROW, startCol, QROW, endCol);
      const cell = ws.getCell(QROW, startCol);
      cell.value = `Q${q + 1} ${y}`;
      cell.font = { bold: true, size: 9, color: { argb: isCurrentQ ? TEXT_DARK : 'FFFFFFFF' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      for (let cc = startCol; cc <= endCol; cc++) {
        ws.getCell(QROW, cc).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isCurrentQ ? GOLD : NAVY } };
      }
      c += span; i += span;
    }
  }

  // ── Row 4: Month band ──────────────────────────────────────────────────
  {
    let c = WEEK_START_COL, i = 0;
    while (i < weekCols.length) {
      const m = weekCols[i].month, y = weekCols[i].year;
      let span = 0;
      while (i + span < weekCols.length && weekCols[i + span].month === m && weekCols[i + span].year === y) span++;
      const startCol = c, endCol = c + span - 1;
      if (span > 1) ws.mergeCells(MROW, startCol, MROW, endCol);
      const cell = ws.getCell(MROW, startCol);
      cell.value = format(weekCols[i].start, 'MMMM').toUpperCase();
      cell.font = { bold: true, size: 9, color: { argb: TEXT_DARK } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      for (let cc = startCol; cc <= endCol; cc++) {
        ws.getCell(MROW, cc).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: (i % 2 === 0) ? WHITE_BAND : GRAY_BAND } };
        ws.getCell(MROW, cc).border = { bottom: thinBorder };
      }
      c += span; i += span;
    }
  }

  // ── Row 5: Week header (date labels; TODAY column called out in gold) ────
  weekCols.forEach((wc, i) => {
    const col = WEEK_START_COL + i;
    const cell = ws.getCell(WROW, col);
    const isToday = i === todayWeekIdx;
    cell.value = isToday ? (zh ? '今天' : 'TODAY') : format(wc.start, 'dd MMM');
    cell.font = { bold: isToday, size: isToday ? 8 : 7.5, color: { argb: isToday ? TEXT_DARK : 'FF6B7A94' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', textRotation: isToday ? 0 : 0 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isToday ? GOLD : WHITE_BAND } };
    cell.border = cellBorder;
  });
  // Fixed-column headers on row 5
  const fixedHeaderLabels = zh
    ? ['', '', '工程项目', '工期', '进度', '关']
    : ['', '', 'Task', 'Days', 'Prog.', '!'];
  fixedHeaderLabels.forEach((label, idx) => {
    const cell = ws.getCell(WROW, idx + 1);
    cell.value = label;
    cell.font = { bold: true, size: 9, color: { argb: TEXT_DARK } };
    cell.alignment = { vertical: 'middle', horizontal: idx >= 3 ? 'center' : 'left', indent: idx >= 3 ? 0 : 1 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GRAY_BAND } };
    cell.border = cellBorder;
  });

  // ── Task rows, grouped by trade with a colored side band ──────────────────
  let r = WROW + 1;
  const progressBarText = (p: number) => {
    const filled = Math.round(Math.max(0, Math.min(100, p)) / 10);
    return `${'█'.repeat(filled)}${'░'.repeat(10 - filled)} ${p || 0}%`;
  };

  for (const group of tradeGroups) {
    const groupStartRow = r;
    const tradeColor = (group.tasks[0].color || '#94A3B8').replace('#', '');
    const tradeText = readableTextColor(tradeColor);
    const groupStart = group.tasks.reduce((m, t) => t.start_date < m ? t.start_date : m, group.tasks[0].start_date);
    const groupEnd = group.tasks.reduce((m, t) => t.end_date > m ? t.end_date : m, group.tasks[0].end_date);

    for (const t of group.tasks) {
      ws.getRow(r).height = 20;
      const taskName = zh && t.name_zh ? t.name_zh : t.name;

      // Task name + duration + progress + critical marker
      const nameCell = ws.getCell(r, 3);
      nameCell.value = taskName;
      nameCell.font = { size: 9.5, color: { argb: TEXT_DARK }, bold: t.is_critical };
      nameCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      nameCell.border = cellBorder;

      const durCell = ws.getCell(r, 4);
      durCell.value = t.duration;
      durCell.font = { size: 9, color: { argb: 'FF6B7A94' } };
      durCell.alignment = { vertical: 'middle', horizontal: 'center' };
      durCell.border = cellBorder;

      const progCell = ws.getCell(r, 5);
      progCell.value = progressBarText(t.progress || 0);
      progCell.font = { size: 7.5, color: { argb: 'FF6B7A94' } };
      progCell.alignment = { vertical: 'middle', horizontal: 'center' };
      progCell.border = cellBorder;

      const critCell = ws.getCell(r, 6);
      critCell.value = t.is_critical ? '★' : '';
      critCell.font = { size: 10, bold: true, color: { argb: RED } };
      critCell.alignment = { vertical: 'middle', horizontal: 'center' };
      critCell.border = cellBorder;

      // Week grid: lead-time tint segment + solid task bar
      const ts = parseISO(t.start_date);
      const te = parseISO(t.end_date);
      const leadStart = t.leadTimeDays ? addDays(ts, -t.leadTimeDays) : null;
      weekCols.forEach((wc, i) => {
        const col = WEEK_START_COL + i;
        const cell = ws.getCell(r, col);
        cell.border = cellBorder;
        const overlapsTask = ts < wc.end && te >= wc.start;
        const overlapsLead = leadStart && leadStart < wc.end && ts >= wc.start && !overlapsTask;
        if (overlapsTask) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(tradeColor) } };
          if (t.is_critical) {
            cell.border = { top: { style: 'medium', color: { argb: RED } }, bottom: { style: 'medium', color: { argb: RED } }, left: thinBorder, right: thinBorder };
          }
          // Trade abbreviation label roughly centered in the bar span
          const barStartIdx = weekCols.findIndex(w => ts < w.end && te >= w.start);
          if (i === barStartIdx) {
            cell.value = t.trade;
            cell.font = { size: 7.5, bold: true, color: { argb: tradeText } };
            cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
          }
        } else if (overlapsLead) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: tint(tradeColor, 0.65) } };
          cell.border = { ...cellBorder, top: { style: 'dotted', color: { argb: argb(tradeColor) } }, bottom: { style: 'dotted', color: { argb: argb(tradeColor) } } };
        } else {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: (i % 2 === 0) ? 'FFFFFFFF' : WHITE_BAND } };
        }
        // Today column: thick gold right border through the whole grid
        if (i === todayWeekIdx) {
          cell.border = { ...cell.border, right: { style: 'medium', color: { argb: GOLD } } };
        }
      });
      r++;
    }

    const groupEndRow = r - 1;
    // ── Trade side-band (col A): merged, colored, vertical text ──
    ws.mergeCells(groupStartRow, 1, groupEndRow, 1);
    const bandCell = ws.getCell(groupStartRow, 1);
    bandCell.value = group.trade;
    bandCell.font = { bold: true, size: 9, color: { argb: tradeText } };
    bandCell.alignment = { vertical: 'middle', horizontal: 'center', textRotation: 90, wrapText: true };
    bandCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(tradeColor) } };

    // ── Trade description (col B): merged, light tint, summary text ──
    ws.mergeCells(groupStartRow, 2, groupEndRow, 2);
    const descCell = ws.getCell(groupStartRow, 2);
    const n = group.tasks.length;
    descCell.value = zh
      ? `${n} 项任务\n${format(parseISO(groupStart), 'dd MMM')} – ${format(parseISO(groupEnd), 'dd MMM')}`
      : `${n} task${n > 1 ? 's' : ''}\n${format(parseISO(groupStart), 'dd MMM')} – ${format(parseISO(groupEnd), 'dd MMM')}`;
    descCell.font = { italic: true, size: 8, color: { argb: 'FF6B7A94' } };
    descCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    descCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: tint(tradeColor, 0.85) } };
  }

  // ── Legend row ──────────────────────────────────────────────────────────
  r += 1;
  ws.mergeCells(r, 1, r, totalCols);
  const legendCell = ws.getCell(r, 1);
  legendCell.value = zh
    ? '图例：彩色条 = 工种施工期  ·  虚线浅色段 = 材料交期  ·  ★ 红框 = 关键路径  ·  金色列 = 今天'
    : 'Legend:  Solid bar = work period   ·   Dotted light segment = material lead time   ·   ★ red border = critical path   ·   Gold column = today';
  legendCell.font = { italic: true, size: 8.5, color: { argb: 'FF6B7A94' } };
  legendCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  ws.getRow(r).height = 18;

  // ── Optional: Project Summary sheet ────────────────────────────────────
  if (includeSummary && startDate) {
    const wsSummary = wb.addWorksheet(zh ? '项目摘要' : 'Project Summary');
    wsSummary.columns = [{ width: 22 }, { width: 40 }];
    const calDays = differenceInDays(parseISO(projEnd), projStart) + 1;
    const done = sorted.filter(t => t.taskStatus === 'completed').length;
    const overallProgress = Math.round(sorted.reduce((s, t) => s + (t.progress || 0), 0) / sorted.length);

    wsSummary.mergeCells(1, 1, 1, 2);
    const stitle = wsSummary.getCell(1, 1);
    stitle.value = zh ? '项目摘要' : 'Project Summary';
    stitle.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    stitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
    stitle.alignment = { vertical: 'middle', indent: 1 };
    wsSummary.getRow(1).height = 26;

    const summaryRows: [string, string | number][] = [
      [zh ? '开始日期' : 'Project Start', startDate],
      [zh ? '结束日期' : 'Project End', projEnd],
      [zh ? '日历天数' : 'Calendar Days', calDays],
      [zh ? '日历周数' : 'Calendar Weeks', Math.ceil(calDays / 7)],
      [zh ? '任务总数' : 'Total Tasks', sorted.length],
      [zh ? '已完成' : 'Completed Tasks', done],
      [zh ? '整体进度' : 'Overall Progress', progressBarText(overallProgress)],
      [zh ? '关键任务数' : 'Critical Tasks', sorted.filter(t => t.is_critical).length],
      ...(siteType ? [[zh ? '项目类型' : 'Site Type', siteType] as [string, string]] : []),
      ...(workSat !== undefined ? [[zh ? '周六施工' : 'Work Saturday', workSat ? (zh ? '是' : 'Yes') : (zh ? '否' : 'No')] as [string, string]] : []),
      ...(workSun !== undefined ? [[zh ? '周日施工' : 'Work Sunday', workSun ? (zh ? '是' : 'Yes') : (zh ? '否' : 'No')] as [string, string]] : []),
    ];
    summaryRows.forEach(([label, value], i) => {
      const rowIdx = i + 2;
      const lc = wsSummary.getCell(rowIdx, 1);
      lc.value = label;
      lc.font = { bold: true, size: 10, color: { argb: TEXT_DARK } };
      lc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: i % 2 === 0 ? WHITE_BAND : GRAY_BAND } };
      lc.border = cellBorder;
      const vc = wsSummary.getCell(rowIdx, 2);
      vc.value = value;
      vc.font = { size: 10, color: { argb: 'FF3B4A63' } };
      vc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: i % 2 === 0 ? WHITE_BAND : GRAY_BAND } };
      vc.border = cellBorder;
    });

    // Trade color legend
    const legendStartRow = summaryRows.length + 4;
    const lTitle = wsSummary.getCell(legendStartRow, 1);
    lTitle.value = zh ? '工种颜色图例' : 'Trade Color Legend';
    lTitle.font = { bold: true, size: 11, color: { argb: TEXT_DARK } };
    tradeGroups.forEach((group, i) => {
      const rowIdx = legendStartRow + 1 + i;
      const swatch = wsSummary.getCell(rowIdx, 1);
      swatch.value = '  ';
      swatch.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb((group.tasks[0].color || '#94A3B8').replace('#', '')) } };
      const label = wsSummary.getCell(rowIdx, 2);
      label.value = `${group.trade} (${group.tasks.length})`;
      label.font = { size: 9.5, color: { argb: TEXT_DARK } };
    });

    const genRow = legendStartRow + tradeGroups.length + 2;
    const genCell = wsSummary.getCell(genRow, 1);
    genCell.value = zh ? '生成时间' : 'Generated';
    genCell.font = { italic: true, size: 9, color: { argb: 'FF9CA3AF' } };
    wsSummary.getCell(genRow, 2).value = format(new Date(), 'yyyy-MM-dd HH:mm');
    wsSummary.getCell(genRow, 2).font = { italic: true, size: 9, color: { argb: 'FF9CA3AF' } };
  }

  return { workbook: wb, projectName, generatedAt: new Date() };
}

export async function exportGanttToExcel(opts: ExportGanttOptions) {
  const built = await buildGanttWorkbook(opts);
  if (!built) return;
  const { workbook, projectName } = built;
  const { format } = await import('date-fns');

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const dateStr = format(new Date(), 'yyyyMMdd');
  const safeName = projectName
    ? projectName.replace(/[^a-zA-Z0-9一-鿿]/g, '_').slice(0, 30)
    : 'Gantt';
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `RenoSmart_${safeName}_${dateStr}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
