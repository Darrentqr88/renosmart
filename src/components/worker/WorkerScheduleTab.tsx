'use client';

import { useState, useRef, useMemo } from 'react';
import {
  format, addDays, addMonths, subMonths, startOfWeek, startOfMonth, endOfMonth,
  isSameDay, isSameMonth, isToday, parseISO, getDay,
} from 'date-fns';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Clock, Calendar } from 'lucide-react';
import { WorkerTask } from './WorkerTaskCard';
import { useI18n } from '@/lib/i18n/context';
import { MY_HOLIDAY_NAMES, SG_HOLIDAY_NAMES } from '@/lib/utils/dates';

interface WorkerScheduleTabProps {
  tasks: WorkerTask[];
}

const DAY_LABELS_SHORT = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DAY_LABELS_FULL = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function WorkerScheduleTab({ tasks }: WorkerScheduleTabProps) {
  const { lang, t } = useI18n();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today, { weekStartsOn: 1 }));
  const [selectedDate, setSelectedDate] = useState(today);
  const [expanded, setExpanded] = useState(false); // week vs month view
  const touchStartX = useRef(0);

  // Holiday map (MY default, could be per-user region)
  const holidays = MY_HOLIDAY_NAMES;

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Build month grid (6 rows x 7 cols, starting Monday)
  const monthGrid = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const rows: Date[][] = [];
    let day = gridStart;
    for (let r = 0; r < 6; r++) {
      const week: Date[] = [];
      for (let c = 0; c < 7; c++) {
        week.push(day);
        day = addDays(day, 1);
      }
      // Skip rows entirely outside the month
      if (week.some(d => isSameMonth(d, currentMonth))) {
        rows.push(week);
      }
    }
    return rows;
  }, [currentMonth]);

  const tasksForDay = (date: Date) =>
    tasks.filter(t => {
      const start = parseISO(t.start_date);
      const end = parseISO(t.end_date);
      return date >= start && date <= end;
    });

  const selectedDayTasks = tasksForDay(selectedDate);

  const getHoliday = (date: Date): string | null => {
    const key = format(date, 'yyyy-MM-dd');
    return holidays.get(key) || null;
  };

  const isWeekend = (date: Date) => {
    const d = getDay(date);
    return d === 0 || d === 6;
  };

  // Navigation
  const prevPeriod = () => {
    if (expanded) {
      setCurrentMonth(m => subMonths(m, 1));
    } else {
      setWeekStart(d => addDays(d, -7));
    }
  };
  const nextPeriod = () => {
    if (expanded) {
      setCurrentMonth(m => addMonths(m, 1));
    } else {
      setWeekStart(d => addDays(d, 7));
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 50) {
      if (delta < 0) nextPeriod();
      else prevPeriod();
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    // Sync week view to selected date's week
    setWeekStart(startOfWeek(date, { weekStartsOn: 1 }));
    // Sync month to selected date
    if (!isSameMonth(date, currentMonth)) {
      setCurrentMonth(date);
    }
  };

  const monthLabel = expanded
    ? format(currentMonth, 'MMMM yyyy')
    : format(weekStart, 'MMMM yyyy');

  // Render a day cell (shared between week and month view)
  const renderDayCell = (day: Date, compact = false) => {
    const dayTasks = tasksForDay(day);
    const isSelected = isSameDay(day, selectedDate);
    const isDayToday = isToday(day);
    const holiday = getHoliday(day);
    const weekend = isWeekend(day);
    const isCurrentMonth = isSameMonth(day, currentMonth);
    const dimmed = expanded && !isCurrentMonth;

    return (
      <button
        key={day.toISOString()}
        onClick={() => handleDateSelect(day)}
        className={`flex flex-col items-center rounded-xl transition-all ${
          compact ? 'py-2 px-1' : 'py-1.5 px-0.5'
        } ${dimmed ? 'opacity-30' : ''}`}
        style={
          isSelected
            ? { background: '#4F8EF7', color: 'white' }
            : isDayToday
              ? { background: '#FEF9EC' }
              : holiday
                ? { background: '#FEF2F2' }
                : {}
        }
      >
        {compact && (
          <span className={`text-[10px] font-medium mb-1 ${
            isSelected ? 'text-white/70' : isDayToday ? 'text-[#4F8EF7]' : 'text-gray-400'
          }`}>
            {DAY_LABELS_SHORT[(getDay(day) + 6) % 7]}
          </span>
        )}
        <span className={`text-[${compact ? '15' : '13'}px] font-bold leading-none ${
          isSelected ? 'text-white' : holiday ? 'text-red-500' : weekend && !isSelected ? 'text-gray-400' : isDayToday ? 'text-gray-900' : 'text-gray-700'
        }`}>
          {format(day, 'd')}
        </span>
        {/* Task dots */}
        <div className={`flex gap-0.5 ${compact ? 'mt-1' : 'mt-0.5'} h-1.5`}>
          {dayTasks.slice(0, 3).map((t, ti) => (
            <div
              key={ti}
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: isSelected ? 'rgba(255,255,255,0.5)' : t.color }}
            />
          ))}
          {holiday && dayTasks.length === 0 && (
            <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Calendar header */}
      <div
        className="bg-white border-b border-gray-100 px-2 py-3 select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Month nav + expand toggle */}
        <div className="flex items-center justify-between mb-3 px-2">
          <button onClick={prevPeriod} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm font-semibold text-gray-700">{monthLabel}</span>
            {expanded
              ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
              : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            }
          </button>
          <button onClick={nextPeriod} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Week view (default) */}
        {!expanded && (
          <div className="grid grid-cols-7 gap-0.5">
            {weekDays.map(day => renderDayCell(day, true))}
          </div>
        )}

        {/* Month view (expanded) */}
        {expanded && (
          <>
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {DAY_LABELS_FULL.map(label => (
                <div key={label} className="text-center text-[9px] font-semibold text-gray-400 uppercase">
                  {label}
                </div>
              ))}
            </div>
            {/* Month grid */}
            <div className="space-y-0.5">
              {monthGrid.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 gap-0.5">
                  {week.map(day => renderDayCell(day, false))}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Holiday indicator for selected date */}
      {getHoliday(selectedDate) && (
        <div className="mx-4 mt-2 flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-xl">
          <div className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
          <span className="text-[11px] font-medium text-red-600">{getHoliday(selectedDate)}</span>
        </div>
      )}

      {/* Day content */}
      <div className="flex-1 overflow-y-auto bg-rs-bg p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-gray-900 text-sm">
              {isToday(selectedDate) ? (t.worker.today || 'Today') : format(selectedDate, 'EEEE')}
            </h2>
            <p className="text-[11px] text-gray-400">{format(selectedDate, 'd MMMM yyyy')}</p>
          </div>
          {selectedDayTasks.length > 0 && (
            <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
              {selectedDayTasks.length} {t.worker.totalTasks?.toLowerCase() || 'tasks'}
            </span>
          )}
        </div>

        {selectedDayTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-gray-500 text-sm font-medium">
              {getHoliday(selectedDate)
                ? (lang === 'ZH' ? '公共假期' : lang === 'BM' ? 'Cuti umum' : 'Public Holiday')
                : (t.worker.noTasksScheduled || 'No tasks scheduled')}
            </p>
            <p className="text-gray-400 text-xs mt-1">
              {getHoliday(selectedDate)
                ? getHoliday(selectedDate)
                : (t.worker.freeDayHint || 'Free day or check another date')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedDayTasks.map(task => (
              <div
                key={task.id}
                className="bg-white rounded-2xl p-4 shadow-sm"
                style={{ borderLeft: `4px solid ${task.color}` }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">{task.project_name}</p>
                    <h3 className="font-semibold text-gray-900 text-sm mt-0.5">
                      {lang === 'ZH' && task.name_zh ? task.name_zh : task.name}
                    </h3>
                  </div>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                    style={{ backgroundColor: `${task.color}15`, color: task.color }}
                  >
                    {task.trade}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-3">
                  <Clock className="w-3 h-3" />
                  <span>{format(parseISO(task.start_date), 'dd MMM')} → {format(parseISO(task.end_date), 'dd MMM')}</span>
                </div>

                {/* Mini progress bar */}
                <div>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-gray-400">{t.worker.progress || 'Progress'}</span>
                    <span className={`font-semibold ${task.progress === 100 ? 'text-green-600' : 'text-gray-700'}`}>
                      {task.progress}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${task.progress}%`,
                        background: task.progress === 100 ? '#22C55E' : task.color,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upcoming preview */}
        {(() => {
          const futureTasks = tasks.filter(t => parseISO(t.start_date) > selectedDate);
          if (futureTasks.length === 0) return null;
          const uniqueUpcoming = futureTasks.slice(0, 4);
          return (
            <div className="mt-6">
              <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-3">{t.worker.upcoming}</h3>
              <div className="space-y-2">
                {uniqueUpcoming.map(task => (
                  <button
                    key={task.id}
                    className="w-full flex items-center gap-3 bg-white rounded-xl px-3 py-2.5 shadow-sm text-left"
                    onClick={() => handleDateSelect(parseISO(task.start_date))}
                  >
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: task.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-gray-800 truncate">
                        {lang === 'ZH' && task.name_zh ? task.name_zh : task.name}
                      </p>
                      <p className="text-[10px] text-gray-400">{task.project_name}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap">{format(parseISO(task.start_date), 'dd MMM')}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
