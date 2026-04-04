'use client';

import { useState, useMemo } from 'react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, getDay,
  isSameDay, isSameMonth, isToday, addDays, parseISO, isAfter,
  isBefore, startOfDay, differenceInDays,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, X, Hammer, CreditCard, FileText, Bell, BellOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n/context';

/* ─── Types ──────────────────────────────────────────────────────────────── */
export interface CalendarEvent {
  id: string;
  date: string;          // YYYY-MM-DD
  title: string;
  type: 'manual' | 'milestone' | 'gantt' | 'payment';
  color?: string;
  projectId?: string;
  projectName?: string;
  endDate?: string;      // for gantt tasks
  trade?: string;
  reminder?: boolean;
}

interface MiniCalendarProps {
  events?: CalendarEvent[];
  onAddEvent?: (event: Omit<CalendarEvent, 'id'>) => void;
  onDeleteEvent?: (id: string) => void;
  onToggleReminder?: (id: string, enabled: boolean) => void;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const TYPE_CONFIG = {
  manual:    { icon: FileText,   color: '#4F8EF7', label: '手动事项' },
  milestone: { icon: Bell,       color: '#8B5CF6', label: '里程碑' },
  gantt:     { icon: Hammer,     color: '#2E6BE6', label: '工程任务' },
  payment:   { icon: CreditCard, color: '#16A34A', label: '收款提醒' },
};

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

function diffLabelI18n(dateStr: string): string {
  const today = startOfDay(new Date());
  const target = startOfDay(parseISO(dateStr));
  const diff = differenceInDays(target, today);
  if (diff === 0) return '今天';
  if (diff === 1) return '明天';
  if (diff === -1) return '昨天';
  if (diff > 0) return `${diff}天后`;
  return `${Math.abs(diff)}天前`;
}

/* ─── Component ──────────────────────────────────────────────────────────── */
export function MiniCalendar({ events = [], onAddEvent, onDeleteEvent, onToggleReminder }: MiniCalendarProps) {
  const { t, lang: language } = useI18n();

  const WEEKDAYS_I18N = language === 'ZH' ? ['日', '一', '二', '三', '四', '五', '六']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const TYPE_LABELS: Record<string, string> = {
    manual: t.dash.manualEvent, milestone: t.dash.milestone,
    gantt: t.dash.task, payment: t.dash.payment,
  };

  function diffLabelI18n(dateStr: string): string {
    const today = startOfDay(new Date());
    const target = startOfDay(parseISO(dateStr));
    const diff = differenceInDays(target, today);
    if (language === 'ZH') {
      if (diff === 0) return '今天';
      if (diff === 1) return '明天';
      if (diff === -1) return '昨天';
      return diff > 0 ? `${diff}天后` : `${Math.abs(diff)}天前`;
    }
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff === -1) return 'Yesterday';
    return diff > 0 ? `in ${diff}d` : `${Math.abs(diff)}d ago`;
  }

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventType, setNewEventType] = useState<'manual' | 'milestone'>('manual');

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart);
  const paddedDays = [...Array(startPad).fill(null), ...days];

  /* upcoming events: next 21 days, sorted by date */
  const upcomingEvents = useMemo(() => {
    const today = startOfDay(new Date());
    const cutoff = addDays(today, 21);
    return events
      .filter(e => {
        const d = startOfDay(parseISO(e.date));
        return !isBefore(d, addDays(today, -1)) && isBefore(d, cutoff);
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [events]);

  /* group upcoming by date */
  const upcomingByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of upcomingEvents) {
      if (!map.has(e.date)) map.set(e.date, []);
      map.get(e.date)!.push(e);
    }
    return map;
  }, [upcomingEvents]);

  const getEventsForDay = (day: Date) =>
    events.filter(e => e.date === format(day, 'yyyy-MM-dd'));

  const selectedDateEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  const handleAddEvent = () => {
    if (!selectedDate || !newEventTitle.trim()) return;
    const color = TYPE_CONFIG[newEventType].color;
    onAddEvent?.({
      date: format(selectedDate, 'yyyy-MM-dd'),
      title: newEventTitle.trim(),
      type: newEventType,
      color,
    });
    setNewEventTitle('');
    setShowAddForm(false);
  };

  const remindersCount = events.filter(e => e.reminder).length;

  return (
    <div className="flex flex-col gap-3">
      {/* ── Calendar grid ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: '0 1px 12px rgba(27,35,54,.06)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">{language === 'ZH' ? format(currentMonth, 'yyyy年M月') : format(currentMonth, 'MMMM yyyy')}</h3>
            {remindersCount > 0 && (
              <p className="text-[10px] text-[#4F8EF7] mt-0.5">🔔 {remindersCount} 个提醒已设置</p>
            )}
          </div>
          <div className="flex gap-0.5">
            <button onClick={() => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            </button>
            <button onClick={() => setCurrentMonth(new Date())}
              className="px-2 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-[10px] text-gray-500 font-medium">
              {language === 'ZH' ? '今天' : 'Today'}
            </button>
            <button onClick={() => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Weekday row */}
        <div className="grid grid-cols-7 px-2 pt-2 pb-1">
          {WEEKDAYS_I18N.map((d, i) => (
            <div key={d} className={`text-center text-[10px] font-semibold py-1 ${i === 0 || i === 6 ? 'text-red-400' : 'text-gray-400'}`}>{d}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 px-2 pb-2 gap-0.5">
          {paddedDays.map((day, i) => {
            if (!day) return <div key={`pad-${i}`} />;
            const dayEvents = getEventsForDay(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isWeekend = getDay(day) === 0 || getDay(day) === 6;
            const hasReminder = dayEvents.some(e => e.reminder);

            return (
              <button
                key={day.toISOString()}
                onClick={() => { setSelectedDate(day); setShowAddForm(false); }}
                className={`relative flex flex-col items-center py-1.5 rounded-lg text-xs transition-all
                  ${!isCurrentMonth ? 'opacity-25' : ''}
                  ${isSelected ? 'bg-[#4F8EF7]/15 ring-1 ring-[#4F8EF7]' : 'hover:bg-gray-50'}
                `}
              >
                <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium
                  ${isToday(day) ? 'bg-[#4F8EF7] text-white font-bold' : isWeekend && isCurrentMonth ? 'text-red-400' : 'text-gray-700'}
                `}>
                  {format(day, 'd')}
                </span>
                {/* Event dots */}
                {dayEvents.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dayEvents.slice(0, 3).map((e, j) => (
                      <div key={j} className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: e.color || TYPE_CONFIG[e.type]?.color || '#9CA3AF' }} />
                    ))}
                    {dayEvents.length > 3 && <div className="w-1 h-1 rounded-full bg-gray-300" />}
                  </div>
                )}
                {/* Reminder indicator */}
                {hasReminder && (
                  <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-[#4F8EF7]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Selected date panel */}
        {selectedDate && (
          <div className="border-t border-gray-100 px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-xs font-semibold text-gray-800">
                  {language === 'ZH'
                    ? format(selectedDate, 'M月d日')
                    : format(selectedDate, 'EEE, d MMM')}
                </span>
                <span className="text-[10px] text-gray-400 ml-2">{diffLabelI18n(format(selectedDate, 'yyyy-MM-dd'))}</span>
              </div>
              <button onClick={() => { setSelectedDate(null); setShowAddForm(false); }}
                className="p-0.5 rounded hover:bg-gray-100">
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>

            {selectedDateEvents.length > 0 ? (
              <div className="space-y-1.5 mb-2">
                {selectedDateEvents.map(e => {
                  const cfg = TYPE_CONFIG[e.type];
                  const Icon = cfg.icon;
                  return (
                    <div key={e.id} className="flex items-center gap-2 py-1.5 px-2.5 rounded-xl group"
                      style={{ background: `${cfg.color}10`, border: `1px solid ${cfg.color}20` }}>
                      <Icon className="w-3 h-3 flex-shrink-0" style={{ color: cfg.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate">{e.title}</p>
                        {e.projectName && <p className="text-[10px] text-gray-400 truncate">{e.projectName}</p>}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {onToggleReminder && (
                          <button onClick={() => onToggleReminder(e.id, !e.reminder)}
                            title={e.reminder ? '取消提醒' : '设置提醒'}
                            className="p-0.5 rounded hover:bg-white/60">
                            {e.reminder
                              ? <Bell className="w-3 h-3 text-[#4F8EF7]" />
                              : <BellOff className="w-3 h-3 text-gray-400" />}
                          </button>
                        )}
                        {e.type === 'manual' && onDeleteEvent && (
                          <button onClick={() => onDeleteEvent(e.id)}
                            className="p-0.5 rounded hover:bg-white/60">
                            <X className="w-3 h-3 text-gray-400 hover:text-red-400" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-400 mb-2">{t.cal.noEvents}</p>
            )}

            {/* Add event */}
            {showAddForm ? (
              <div className="space-y-2">
                <div className="flex gap-1">
                  {(['manual', 'milestone'] as const).map(et => (
                    <button key={et} onClick={() => setNewEventType(et)}
                      className={`flex-1 text-[10px] font-medium py-1 rounded-lg transition-colors ${newEventType === et ? 'text-white' : 'text-gray-500 bg-gray-100 hover:bg-gray-200'}`}
                      style={newEventType === et ? { background: TYPE_CONFIG[et].color } : {}}>
                      {et === 'manual' ? `📝 ${t.cal.meetingVisit}` : `🏁 ${t.cal.milestoneMark}`}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <Input value={newEventTitle} onChange={e => setNewEventTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddEvent()}
                    placeholder="事项标题..." className="h-7 text-xs flex-1" autoFocus />
                  <Button size="sm" onClick={handleAddEvent} disabled={!newEventTitle.trim()}
                    className="h-7 px-2 bg-[#4F8EF7] text-white hover:bg-[#4F8EF7]-hover">
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowAddForm(true)}
                className="flex items-center gap-1 text-xs text-[#4F8EF7] hover:text-[#4F8EF7]-dark mt-1 font-medium">
                <Plus className="w-3 h-3" /> {t.cal.addEvent}
              </button>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="px-4 py-2 border-t border-gray-50 flex flex-wrap gap-x-3 gap-y-1">
          {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1 text-[10px] text-gray-400">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
              {TYPE_LABELS[key] || cfg.label}
            </div>
          ))}
        </div>
      </div>

      {/* ── Upcoming events list ──────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: '0 1px 12px rgba(27,35,54,.06)' }}>
        <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
          <h4 className="text-xs font-bold text-gray-800">📅 {t.dash.upcoming}</h4>
          <span className="text-[10px] text-gray-400">{language === 'ZH' ? '未来 21 天' : 'Next 21 days'}</span>
        </div>
        {upcomingByDate.size === 0 ? (
          <div className="px-4 py-5 text-center">
            <p className="text-xs text-gray-400">{t.dash.noUpcoming}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
            {Array.from(upcomingByDate.entries()).map(([dateStr, dayEvents]) => (
              <div key={dateStr} className="px-4 py-2.5">
                {/* Date header */}
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-bold text-gray-500">{format(parseISO(dateStr), 'dd MMM')}</span>
                  {(() => {
                    const diff = differenceInDays(startOfDay(parseISO(dateStr)), startOfDay(new Date()));
                    const cls = diff === 0 ? 'bg-[#4F8EF7] text-white' : diff === 1 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500';
                    return <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cls}`}>{diffLabelI18n(dateStr)}</span>;
                  })()}
                </div>
                {/* Events */}
                <div className="space-y-1">
                  {dayEvents.map(e => {
                    const cfg = TYPE_CONFIG[e.type];
                    const Icon = cfg.icon;
                    return (
                      <div key={e.id} className="flex items-start gap-2">
                        <div className="w-4 h-4 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: `${cfg.color}20` }}>
                          <Icon className="w-2.5 h-2.5" style={{ color: cfg.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-800 font-medium truncate">{e.title}</p>
                          {e.projectName && <p className="text-[10px] text-gray-400 truncate">{e.projectName}</p>}
                        </div>
                        {e.reminder && <Bell className="w-3 h-3 text-[#4F8EF7] flex-shrink-0 mt-1" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
