'use client';

import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isSameMonth, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface CalendarEvent {
  id: string;
  date: string;        // YYYY-MM-DD
  title: string;
  type: 'manual' | 'milestone';
  color?: string;
}

interface MiniCalendarProps {
  events?: CalendarEvent[];
  onAddEvent?: (event: Omit<CalendarEvent, 'id'>) => void;
  onDeleteEvent?: (id: string) => void;
}

const EVENT_TYPE_COLORS = {
  manual: '#F0B90B',
  milestone: '#8B5CF6',
};

export function MiniCalendar({ events = [], onAddEvent, onDeleteEvent }: MiniCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad start with empty days
  const startPad = getDay(monthStart); // 0=Sunday
  const paddedDays = [...Array(startPad).fill(null), ...days];

  const prevMonth = () => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const getEventsForDay = (day: Date) =>
    events.filter(e => e.date === format(day, 'yyyy-MM-dd'));

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setShowAddForm(true);
    setNewEventTitle('');
  };

  const handleAddEvent = () => {
    if (!selectedDate || !newEventTitle.trim()) return;
    onAddEvent?.({
      date: format(selectedDate, 'yyyy-MM-dd'),
      title: newEventTitle.trim(),
      type: 'manual',
      color: EVENT_TYPE_COLORS.manual,
    });
    setNewEventTitle('');
    setShowAddForm(false);
  };

  const selectedDateEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 text-sm">{format(currentMonth, 'MMMM yyyy')}</h3>
        <div className="flex gap-1">
          <button onClick={prevMonth} className="p-1 rounded hover:bg-gray-100">
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>
          <button onClick={nextMonth} className="p-1 rounded hover:bg-gray-100">
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-center text-xs text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {paddedDays.map((day, i) => {
          if (!day) return <div key={`pad-${i}`} />;
          const dayEvents = getEventsForDay(day);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, currentMonth);

          return (
            <button
              key={day.toISOString()}
              onClick={() => handleDayClick(day)}
              className={`
                relative flex flex-col items-center justify-start py-1 rounded-lg text-xs transition-colors
                ${!isCurrentMonth ? 'opacity-30' : ''}
                ${isToday(day) ? 'font-bold' : ''}
                ${isSelected ? 'bg-[#F0B90B]/20 ring-1 ring-[#F0B90B]' : 'hover:bg-gray-50'}
              `}
            >
              <span className={`w-6 h-6 flex items-center justify-center rounded-full ${isToday(day) ? 'bg-[#F0B90B] text-black' : 'text-gray-700'}`}>
                {format(day, 'd')}
              </span>
              {/* Event dots */}
              {dayEvents.length > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {dayEvents.slice(0, 3).map((e, j) => (
                    <div
                      key={j}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: e.color || EVENT_TYPE_COLORS[e.type] }}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected date panel */}
      {selectedDate && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-800">
              {format(selectedDate, 'EEE, d MMM yyyy')}
            </span>
            <button
              onClick={() => { setSelectedDate(null); setShowAddForm(false); }}
              className="p-0.5 rounded hover:bg-gray-100"
            >
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>

          {/* Existing events */}
          {selectedDateEvents.length > 0 && (
            <div className="space-y-1 mb-2">
              {selectedDateEvents.map(e => (
                <div key={e.id} className="flex items-center gap-2 text-xs py-1 px-2 rounded-lg bg-gray-50 group">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: e.color || EVENT_TYPE_COLORS[e.type] }} />
                  <span className="flex-1 text-gray-700">{e.title}</span>
                  {e.type === 'manual' && onDeleteEvent && (
                    <button
                      onClick={() => onDeleteEvent(e.id)}
                      className="hidden group-hover:block text-gray-400 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add event form */}
          {showAddForm ? (
            <div className="flex gap-2">
              <Input
                value={newEventTitle}
                onChange={e => setNewEventTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddEvent()}
                placeholder="Event title..."
                className="h-7 text-xs flex-1"
                autoFocus
              />
              <Button size="sm" onClick={handleAddEvent} disabled={!newEventTitle.trim()}
                className="h-7 px-2 bg-[#F0B90B] text-black hover:bg-[#d4a20a]">
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1 text-xs text-[#F0B90B] hover:text-[#d4a20a] mt-1"
            >
              <Plus className="w-3 h-3" /> Add event
            </button>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="mt-3 pt-3 border-t border-gray-50 flex gap-3">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <div className="w-2 h-2 rounded-full bg-[#F0B90B]" />
          Manual event
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <div className="w-2 h-2 rounded-full bg-purple-500" />
          Milestone
        </div>
      </div>
    </div>
  );
}
