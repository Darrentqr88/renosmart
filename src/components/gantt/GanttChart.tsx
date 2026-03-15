'use client';

import { useState, useRef, useCallback } from 'react';
import { GanttTask } from '@/types';
import { useI18n } from '@/lib/i18n/context';
import { format, differenceInDays, addDays, parseISO } from 'date-fns';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface GanttChartProps {
  tasks: GanttTask[];
  onTaskUpdate?: (taskId: string, updates: Partial<GanttTask>) => void;
}

const ROW_HEIGHT = 40;
const HEADER_HEIGHT = 60;
const LABEL_WIDTH = 220;
const DAY_WIDTH = 28;

function getDateRange(tasks: GanttTask[]) {
  if (!tasks.length) {
    const start = new Date();
    return { start, end: addDays(start, 60), totalDays: 60 };
  }
  const starts = tasks.map(t => parseISO(t.start_date));
  const ends = tasks.map(t => parseISO(t.end_date));
  const start = new Date(Math.min(...starts.map(d => d.getTime())));
  const end = new Date(Math.max(...ends.map(d => d.getTime())));
  const totalDays = differenceInDays(end, start) + 4;
  return { start, end, totalDays };
}

export function GanttChart({ tasks, onTaskUpdate }: GanttChartProps) {
  const { lang } = useI18n();
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [dragging, setDragging] = useState<{ taskId: string; type: 'move' | 'resize-left' | 'resize-right'; startX: number; originalStart: string; originalEnd: string } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const { start: chartStart, totalDays } = getDateRange(tasks);
  const totalWidth = LABEL_WIDTH + totalDays * DAY_WIDTH;
  const totalHeight = HEADER_HEIGHT + tasks.length * ROW_HEIGHT;

  // Generate month labels
  const months: { label: string; x: number; days: number }[] = [];
  let currentMonth = new Date(chartStart);
  currentMonth.setDate(1);
  while (differenceInDays(currentMonth, chartStart) < totalDays) {
    const monthStart = differenceInDays(currentMonth, chartStart);
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    months.push({
      label: format(currentMonth, 'MMM yyyy'),
      x: LABEL_WIDTH + Math.max(0, monthStart) * DAY_WIDTH,
      days: daysInMonth,
    });
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
  }

  const getTaskX = (task: GanttTask) => {
    const dayOffset = differenceInDays(parseISO(task.start_date), chartStart);
    return LABEL_WIDTH + dayOffset * DAY_WIDTH;
  };

  const getTaskWidth = (task: GanttTask) => {
    const days = differenceInDays(parseISO(task.end_date), parseISO(task.start_date)) + 1;
    return Math.max(days * DAY_WIDTH, 4);
  };

  const handleMouseDown = useCallback((e: React.MouseEvent, taskId: string, type: 'move' | 'resize-left' | 'resize-right') => {
    e.preventDefault();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    setDragging({ taskId, type, startX: e.clientX, originalStart: task.start_date, originalEnd: task.end_date });
  }, [tasks]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging || !onTaskUpdate) return;
    const deltaX = e.clientX - dragging.startX;
    const deltaDays = Math.round(deltaX / DAY_WIDTH);
    if (deltaDays === 0) return;

    const task = tasks.find(t => t.id === dragging.taskId);
    if (!task) return;

    if (dragging.type === 'move') {
      const newStart = format(addDays(parseISO(dragging.originalStart), deltaDays), 'yyyy-MM-dd');
      const newEnd = format(addDays(parseISO(dragging.originalEnd), deltaDays), 'yyyy-MM-dd');
      onTaskUpdate(dragging.taskId, { start_date: newStart, end_date: newEnd });
    } else if (dragging.type === 'resize-right') {
      const newEnd = format(addDays(parseISO(dragging.originalEnd), deltaDays), 'yyyy-MM-dd');
      if (newEnd > dragging.originalStart) {
        onTaskUpdate(dragging.taskId, { end_date: newEnd });
      }
    } else if (dragging.type === 'resize-left') {
      const newStart = format(addDays(parseISO(dragging.originalStart), deltaDays), 'yyyy-MM-dd');
      if (newStart < dragging.originalEnd) {
        onTaskUpdate(dragging.taskId, { start_date: newStart });
      }
    }
  }, [dragging, tasks, onTaskUpdate]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  const toggleExpand = (taskId: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  // Today marker
  const todayOffset = differenceInDays(new Date(), chartStart);
  const todayX = LABEL_WIDTH + todayOffset * DAY_WIDTH;

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
      <svg
        ref={svgRef}
        width={totalWidth}
        height={totalHeight}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="select-none"
      >
        {/* Grid background */}
        <rect width={totalWidth} height={totalHeight} fill="white" />

        {/* Month headers */}
        {months.map((month, i) => (
          <g key={i}>
            <rect x={month.x} y={0} width={month.days * DAY_WIDTH} height={HEADER_HEIGHT / 2} fill={i % 2 === 0 ? '#F8FAFC' : '#F1F5F9'} />
            <text x={month.x + 8} y={18} fontSize="11" fontWeight="600" fill="#64748B">{month.label}</text>
          </g>
        ))}

        {/* Day headers */}
        {Array.from({ length: totalDays }).map((_, i) => {
          const date = addDays(chartStart, i);
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
          const x = LABEL_WIDTH + i * DAY_WIDTH;
          return (
            <g key={i}>
              <rect x={x} y={HEADER_HEIGHT / 2} width={DAY_WIDTH} height={HEADER_HEIGHT / 2}
                fill={isWeekend ? '#F1F5F9' : 'white'} />
              {DAY_WIDTH >= 20 && (
                <text x={x + DAY_WIDTH / 2} y={HEADER_HEIGHT - 8} fontSize="9" textAnchor="middle" fill="#94A3B8">
                  {format(date, 'd')}
                </text>
              )}
              <line x1={x} y1={HEADER_HEIGHT} x2={x} y2={totalHeight} stroke="#F1F5F9" strokeWidth="0.5" />
            </g>
          );
        })}

        {/* Label column background */}
        <rect x={0} y={0} width={LABEL_WIDTH} height={totalHeight} fill="#FAFAFA" />
        <line x1={LABEL_WIDTH} y1={0} x2={LABEL_WIDTH} y2={totalHeight} stroke="#E2E8F0" strokeWidth="1" />

        {/* Today marker */}
        {todayOffset >= 0 && todayOffset < totalDays && (
          <g>
            <line x1={todayX} y1={HEADER_HEIGHT} x2={todayX} y2={totalHeight} stroke="#F0B90B" strokeWidth="2" strokeDasharray="4 2" />
            <polygon points={`${todayX - 5},${HEADER_HEIGHT} ${todayX + 5},${HEADER_HEIGHT} ${todayX},${HEADER_HEIGHT + 8}`} fill="#F0B90B" />
          </g>
        )}

        {/* Tasks */}
        {tasks.map((task, rowIndex) => {
          const y = HEADER_HEIGHT + rowIndex * ROW_HEIGHT;
          const taskX = getTaskX(task);
          const taskW = getTaskWidth(task);
          const isExpanded = expandedTasks.has(task.id);

          return (
            <g key={task.id}>
              {/* Row background */}
              <rect x={0} y={y} width={totalWidth} height={ROW_HEIGHT}
                fill={rowIndex % 2 === 0 ? 'white' : '#FAFAFA'} />
              <line x1={0} y1={y + ROW_HEIGHT} x2={totalWidth} y2={y + ROW_HEIGHT} stroke="#F1F5F9" strokeWidth="0.5" />

              {/* Task label */}
              <foreignObject x={4} y={y + 4} width={LABEL_WIDTH - 8} height={ROW_HEIGHT - 8}>
                <div className="flex items-center gap-1 h-full">
                  <button
                    onClick={() => toggleExpand(task.id)}
                    className="w-4 h-4 flex items-center justify-center text-gray-400 flex-shrink-0"
                  >
                    {task.subtasks.length > 0 ? (
                      isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />
                    ) : <span className="w-2 h-2 rounded-full inline-block" style={{ background: task.color }} />}
                  </button>
                  <span className="text-xs text-gray-700 truncate font-medium">
                    {lang === 'ZH' && task.name_zh ? task.name_zh : task.name}
                  </span>
                </div>
              </foreignObject>

              {/* Gantt bar */}
              <g className="cursor-grab active:cursor-grabbing">
                {/* Main bar */}
                <rect
                  x={taskX}
                  y={y + 8}
                  width={taskW}
                  height={ROW_HEIGHT - 16}
                  rx="4"
                  fill={task.color}
                  opacity={0.85}
                  stroke={task.is_critical ? '#1E293B' : 'none'}
                  strokeWidth={task.is_critical ? 2 : 0}
                  onMouseDown={(e) => handleMouseDown(e, task.id, 'move')}
                />

                {/* Progress bar */}
                {task.progress > 0 && (
                  <rect
                    x={taskX}
                    y={y + 8}
                    width={(taskW * task.progress) / 100}
                    height={ROW_HEIGHT - 16}
                    rx="4"
                    fill={task.color}
                    opacity={1}
                  />
                )}

                {/* Task name on bar (if wide enough) */}
                {taskW > 60 && (
                  <text
                    x={taskX + 6}
                    y={y + ROW_HEIGHT / 2 + 4}
                    fontSize="10"
                    fill="white"
                    fontWeight="500"
                  >
                    {task.trade}
                  </text>
                )}

                {/* Resize handles */}
                <rect
                  x={taskX}
                  y={y + 8}
                  width={6}
                  height={ROW_HEIGHT - 16}
                  rx="4"
                  fill="rgba(0,0,0,0.2)"
                  className="cursor-ew-resize"
                  onMouseDown={(e) => handleMouseDown(e, task.id, 'resize-left')}
                />
                <rect
                  x={taskX + taskW - 6}
                  y={y + 8}
                  width={6}
                  height={ROW_HEIGHT - 16}
                  rx="4"
                  fill="rgba(0,0,0,0.2)"
                  className="cursor-ew-resize"
                  onMouseDown={(e) => handleMouseDown(e, task.id, 'resize-right')}
                />
              </g>

              {/* Date labels */}
              <text x={taskX + taskW + 4} y={y + ROW_HEIGHT / 2 + 4} fontSize="9" fill="#94A3B8">
                {format(parseISO(task.end_date), 'dd/MM')}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
