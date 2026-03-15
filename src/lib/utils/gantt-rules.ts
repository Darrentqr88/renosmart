import { GanttTask } from '@/types';
import { addDays, isWeekend, format } from 'date-fns';
import { MY_HOLIDAYS } from './dates';

export const CONSTRUCTION_PHASES = [
  { id: 'measurement', name: 'Site Measurement & Design Confirmation', name_zh: '现场测量与设计确认', trade: 'Measurement', baseDays: 3 },
  { id: 'approval', name: 'Quotation Approval', name_zh: '报价单确认', trade: 'Approval', baseDays: 2 },
  { id: 'demolition', name: 'Demolition / Hacking', name_zh: '拆除/凿破', trade: 'Demolition', baseDays: 5 },
  { id: 'electrical1', name: 'Electrical Phase 1 (Roughin)', name_zh: '电工第一阶段(布线)', trade: 'Electrical', baseDays: 4 },
  { id: 'plumbing1', name: 'Plumbing Phase 1 (Roughin)', name_zh: '水管第一阶段(布管)', trade: 'Plumbing', baseDays: 3 },
  { id: 'waterproofing', name: 'Waterproofing', name_zh: '防水工程', trade: 'Waterproofing', baseDays: 4 },
  { id: 'tiling', name: 'Tiling Works', name_zh: '铺砖工程', trade: 'Tiling', baseDays: 10 },
  { id: 'falseceiling', name: 'False Ceiling & Partition', name_zh: '吊顶与隔墙', trade: 'False Ceiling', baseDays: 7 },
  { id: 'painting1', name: 'Painting Phase 1 (Primer)', name_zh: '油漆第一阶段(底漆)', trade: 'Painting', baseDays: 4 },
  { id: 'carpentry_measure', name: 'Carpentry Measurement', name_zh: '木工测量', trade: 'Carpentry', baseDays: 2 },
  { id: 'carpentry_mfg', name: 'Carpentry Manufacturing', name_zh: '木工制作(工厂)', trade: 'Carpentry', baseDays: 28 },
  { id: 'electrical2', name: 'Electrical Phase 2 (Sockets)', name_zh: '电工第二阶段(插座)', trade: 'Electrical', baseDays: 3 },
  { id: 'carpentry_install', name: 'Carpentry Installation', name_zh: '木工安装', trade: 'Carpentry', baseDays: 7 },
  { id: 'lighting', name: 'Lighting & Accessories', name_zh: '灯光与配件安装', trade: 'Lighting', baseDays: 2 },
  { id: 'painting2', name: 'Painting Phase 2 (Topcoat)', name_zh: '油漆第二阶段(面漆)', trade: 'Painting', baseDays: 3 },
  { id: 'cleaning', name: 'Final Cleaning', name_zh: '竣工清洁', trade: 'Cleaning', baseDays: 2 },
  { id: 'curtains', name: 'Curtain Installation', name_zh: '窗帘安装', trade: 'Cleaning', baseDays: 1 },
  { id: 'delivery', name: 'Delivery (Appliances & Furniture)', name_zh: '交货(电器与家具)', trade: 'Measurement', baseDays: 1 },
  { id: 'handover', name: 'Handover', name_zh: '移交验收', trade: 'Handover', baseDays: 1 },
];

const TRADE_COLORS: Record<string, string> = {
  Measurement: '#64748B',
  Approval: '#94A3B8',
  Demolition: '#EF4444',
  Electrical: '#F59E0B',
  Plumbing: '#3B82F6',
  Waterproofing: '#8B5CF6',
  Tiling: '#10B981',
  'False Ceiling': '#6366F1',
  Painting: '#EC4899',
  Carpentry: '#D97706',
  Cleaning: '#14B8A6',
  Lighting: '#FBBF24',
  Handover: '#22C55E',
};

function nextWorkday(date: Date): Date {
  let d = addDays(date, 1);
  while (isWeekend(d) || MY_HOLIDAYS.has(format(d, 'yyyy-MM-dd'))) {
    d = addDays(d, 1);
  }
  return d;
}

function addWorkdays(startDate: Date, workdays: number): Date {
  let d = new Date(startDate);
  let count = 0;
  while (count < workdays) {
    d = addDays(d, 1);
    if (!isWeekend(d) && !MY_HOLIDAYS.has(format(d, 'yyyy-MM-dd'))) {
      count++;
    }
  }
  return d;
}

export function generateGanttTasks(
  projectId: string,
  startDate: Date,
  sqft: number = 1000,
  hasDemolition: boolean = true
): GanttTask[] {
  const tasks: GanttTask[] = [];
  let currentDate = new Date(startDate);

  // Ensure start on workday
  while (isWeekend(currentDate) || MY_HOLIDAYS.has(format(currentDate, 'yyyy-MM-dd'))) {
    currentDate = addDays(currentDate, 1);
  }

  const phases = CONSTRUCTION_PHASES.filter(p => hasDemolition || p.id !== 'demolition');

  // Track parallel tasks
  let tilingEnd: Date | null = null;
  let falsecelingEnd: Date | null = null;

  for (const phase of phases) {
    let duration = phase.baseDays;

    // Scale duration by sqft
    if (phase.id === 'tiling') duration = Math.max(5, Math.ceil(sqft / 100));
    if (phase.id === 'painting1' || phase.id === 'painting2') duration = Math.max(3, Math.ceil(sqft / 250));
    if (phase.id === 'falseceiling') duration = Math.max(4, Math.ceil(sqft / 120));
    if (phase.id === 'carpentry_mfg') duration = Math.max(21, Math.min(42, 28));

    const taskStart = new Date(currentDate);
    const taskEnd = addWorkdays(taskStart, duration - 1);

    tasks.push({
      id: `${projectId}-${phase.id}`,
      project_id: projectId,
      name: phase.name,
      name_zh: phase.name_zh,
      trade: phase.trade,
      start_date: format(taskStart, 'yyyy-MM-dd'),
      end_date: format(taskEnd, 'yyyy-MM-dd'),
      duration,
      progress: 0,
      dependencies: [],
      color: TRADE_COLORS[phase.trade] || '#64748B',
      is_critical: ['demolition', 'tiling', 'carpentry_mfg', 'carpentry_install', 'handover'].includes(phase.id),
      subtasks: [],
      assigned_workers: [],
    });

    // Handle parallel tasks
    if (phase.id === 'electrical1') {
      // Plumbing runs parallel with Electrical Phase 1
      // Don't advance date - next iteration (plumbing1) starts same date
      continue;
    }
    if (phase.id === 'plumbing1') {
      // Both electrical1 and plumbing1 started on same day, advance by max
      const electricalTask = tasks.find(t => t.id === `${projectId}-electrical1`);
      if (electricalTask) {
        const elEnd = new Date(electricalTask.end_date);
        const plEnd = taskEnd;
        currentDate = nextWorkday(elEnd > plEnd ? elEnd : plEnd);
      } else {
        currentDate = nextWorkday(taskEnd);
      }
      continue;
    }
    if (phase.id === 'tiling') {
      tilingEnd = taskEnd;
    }
    if (phase.id === 'falseceiling') {
      falsecelingEnd = taskEnd;
    }
    // Carpentry manufacturing starts after carpentry_measure and runs parallel
    if (phase.id === 'carpentry_measure') {
      currentDate = nextWorkday(taskEnd);
      // carpentry_mfg starts next, but tiling/ceiling can proceed
      continue;
    }
    if (phase.id === 'carpentry_mfg') {
      // carpentry_mfg runs parallel — don't block next sequential tasks
      // After carpentry_mfg starts, next sequential task is electrical2 (after tiling/ceiling done)
      const afterParallel = tilingEnd && falsecelingEnd
        ? (tilingEnd > falsecelingEnd ? tilingEnd : falsecelingEnd)
        : tilingEnd || falsecelingEnd || taskEnd;
      currentDate = nextWorkday(afterParallel || taskEnd);
      continue;
    }
    // Curtains parallel with cleaning
    if (phase.id === 'cleaning') {
      currentDate = nextWorkday(taskEnd);
      continue;
    }
    if (phase.id === 'curtains') {
      // Same start as cleaning
      const cleaningTask = tasks.find(t => t.id === `${projectId}-cleaning`);
      if (cleaningTask) {
        tasks[tasks.length - 1] = {
          ...tasks[tasks.length - 1],
          start_date: cleaningTask.start_date,
          end_date: cleaningTask.end_date,
        };
      }
      continue;
    }

    currentDate = nextWorkday(taskEnd);
  }

  return tasks;
}
