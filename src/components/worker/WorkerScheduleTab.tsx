'use client';

import { useState, useRef } from 'react';
import { format, addDays, startOfWeek, isSameDay, isToday, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, Calendar } from 'lucide-react';
import { WorkerTask } from './WorkerTaskCard';

interface WorkerScheduleTabProps {
  tasks: WorkerTask[];
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function WorkerScheduleTab({ tasks }: WorkerScheduleTabProps) {
  const today = new Date();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today, { weekStartsOn: 1 }));
  const [selectedDate, setSelectedDate] = useState(today);
  const touchStartX = useRef(0);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const tasksForDay = (date: Date) =>
    tasks.filter(t => {
      const start = parseISO(t.start_date);
      const end = parseISO(t.end_date);
      return date >= start && date <= end;
    });

  const selectedDayTasks = tasksForDay(selectedDate);

  const prevWeek = () => setWeekStart(d => addDays(d, -7));
  const nextWeek = () => setWeekStart(d => addDays(d, 7));

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 50) {
      if (delta < 0) nextWeek();
      else prevWeek();
    }
  };

  const monthLabel = format(weekStart, 'MMMM yyyy');

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-[#0F1923] text-white px-5 pt-12 pb-5">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#F0B90B]" />
          <h1 className="font-bold text-lg">Schedule</h1>
        </div>
        <p className="text-white/50 text-xs mt-1">{tasks.length} assigned tasks</p>
      </div>

      {/* Week strip */}
      <div
        className="bg-white border-b border-gray-100 px-2 py-3 select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items-center justify-between mb-3 px-2">
          <button onClick={prevWeek} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>
          <span className="text-sm font-semibold text-gray-700">{monthLabel}</span>
          <button onClick={nextWeek} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {weekDays.map((day, i) => {
            const dayTasks = tasksForDay(day);
            const isSelected = isSameDay(day, selectedDate);
            const isDayToday = isToday(day);

            return (
              <button
                key={i}
                onClick={() => setSelectedDate(day)}
                className="flex flex-col items-center py-2 px-1 rounded-xl transition-all"
                style={isSelected ? { background: '#F0B90B' } : isDayToday ? { background: '#FEF9EC' } : {}}
              >
                <span className={`text-[10px] font-medium mb-1 ${
                  isSelected ? 'text-black' : isDayToday ? 'text-[#F0B90B]' : 'text-gray-400'
                }`}>
                  {DAY_LABELS[i]}
                </span>
                <span className={`text-[15px] font-bold ${
                  isSelected ? 'text-black' : isDayToday ? 'text-gray-900' : 'text-gray-700'
                }`}>
                  {format(day, 'd')}
                </span>
                {/* Trade color dots */}
                <div className="flex gap-0.5 mt-1 h-1.5">
                  {dayTasks.slice(0, 3).map((t, ti) => (
                    <div
                      key={ti}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: isSelected ? 'rgba(0,0,0,0.3)' : t.color }}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Day content */}
      <div className="flex-1 overflow-y-auto bg-[#F7F8FA] p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-gray-900 text-sm">
              {isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEEE')}
            </h2>
            <p className="text-[11px] text-gray-400">{format(selectedDate, 'd MMMM yyyy')}</p>
          </div>
          {selectedDayTasks.length > 0 && (
            <span className="text-[11px] font-semibold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
              {selectedDayTasks.length} task{selectedDayTasks.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {selectedDayTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-gray-500 text-sm font-medium">No tasks scheduled</p>
            <p className="text-gray-400 text-xs mt-1">Free day or check another date</p>
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
                    <h3 className="font-semibold text-gray-900 text-sm mt-0.5">{task.name}</h3>
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
                  <span>{task.start_date} → {task.end_date}</span>
                </div>

                {/* Mini progress bar */}
                <div>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-gray-400">Progress</span>
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
              <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-3">Upcoming</h3>
              <div className="space-y-2">
                {uniqueUpcoming.map(task => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 bg-white rounded-xl px-3 py-2.5 shadow-sm"
                    onClick={() => setSelectedDate(parseISO(task.start_date))}
                  >
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: task.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-gray-800 truncate">{task.name}</p>
                      <p className="text-[10px] text-gray-400">{task.project_name}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap">{format(parseISO(task.start_date), 'dd MMM')}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
