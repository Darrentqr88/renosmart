'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n/context';
import { Project, ProjectStatus } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { addDays, format, differenceInDays, startOfDay, parseISO } from 'date-fns';
import {
  Search, Bell, Plus, MapPin, User, Clock, GripVertical,
  TrendingUp, BarChart2, CheckCircle2, FolderOpen, X,
  Hammer, CreditCard, ChevronRight,
} from 'lucide-react';
import { MiniCalendar, CalendarEvent } from '@/components/designer/MiniCalendar';

/* ─── Notification types ────────────────────────────────────────────────── */
interface Notif {
  id: string;
  type: 'gantt' | 'payment' | 'reminder';
  title: string;
  desc: string;
  date: string;
  projectName: string;
  projectId: string;
  daysUntil: number;
  read: boolean;
}

/* ─── Project Card ──────────────────────────────────────────────────────── */
function ProjectCard({
  project,
  onClick,
  onDragStart,
}: {
  project: Project;
  onClick: () => void;
  onDragStart: (id: string) => void;
}) {
  const { prices } = useI18n();

  const cfg: Record<string, { badge: string; border: string; labelZh: string; labelEn: string; glow: string }> = {
    pending:   { badge: 'bg-blue-50 text-blue-700 border-blue-100',   border: '#2E6BE6', labelZh: '待谈',  labelEn: 'Pending',   glow: 'rgba(46,107,230,0.06)' },
    active:    { badge: 'bg-amber-50 text-amber-700 border-amber-100', border: '#F0B90B', labelZh: '施工中', labelEn: 'Confirmed', glow: 'rgba(240,185,11,0.05)' },
    completed: { badge: 'bg-green-50 text-green-700 border-green-100', border: '#16A34A', labelZh: '已完工', labelEn: 'Completed', glow: 'rgba(22,163,74,0.05)' },
  };
  const c = cfg[project.status] || cfg.pending;

  return (
    <div
      draggable
      onDragStart={(e) => { e.stopPropagation(); onDragStart(project.id); }}
      className="bg-white rounded-2xl hover:shadow-lg transition-all cursor-grab active:cursor-grabbing group select-none"
      style={{
        border: `1px solid ${c.border}25`,
        borderLeft: `3px solid ${c.border}`,
        boxShadow: `0 1px 8px ${c.glow}`,
      }}
      onClick={onClick}
    >
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 truncate text-[13px] leading-tight">{project.name}</h3>
            {project.address && (
              <div className="flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                <span className="text-[11px] text-gray-400 truncate">{project.address}</span>
              </div>
            )}
          </div>
          <GripVertical className="w-4 h-4 text-gray-200 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
        </div>

        {/* Client + amount row */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0">
            <User className="w-3 h-3 text-gray-500" />
          </div>
          <span className="text-[11px] text-gray-600 truncate flex-1 font-medium">
            {project.client_name || '—'}
          </span>
          <span className="text-[12px] font-bold flex-shrink-0" style={{ color: c.border }}>
            {project.contract_amount > 0 ? formatCurrency(project.contract_amount, prices.currency) : <span className="text-gray-300 font-normal">未设定</span>}
          </span>
        </div>

        {/* Progress bar (active only) */}
        {project.status === 'active' && (
          <div className="mb-3">
            <div className="flex justify-between items-center text-[10px] mb-1">
              <span className="text-gray-400">施工进度</span>
              <span className="font-bold text-[#F0B90B]">{project.progress}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-[#F0B90B] to-[#d9a50a] transition-all"
                style={{ width: `${project.progress}%` }} />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${c.badge}`}>
            {c.labelZh}
          </span>
          <div className="flex items-center gap-1 text-[10px] text-gray-300">
            <Clock className="w-2.5 h-2.5" />
            {formatDate(project.updated_at)}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Kanban Column ─────────────────────────────────────────────────────── */
function KanbanColumn({
  colKey, label, sublabel, dot, count,
  projects, isDragOver,
  onDragOver, onDrop, onDragLeave,
  onCardClick, onCardDragStart,
  onAddProject,
}: {
  colKey: string; label: string; sublabel: string; dot: string; count: number;
  projects: Project[];
  isDragOver: boolean;
  onDragOver: () => void; onDrop: () => void; onDragLeave: () => void;
  onCardClick: (id: string) => void;
  onCardDragStart: (id: string) => void;
  onAddProject?: () => void;
}) {
  return (
    <div style={{ width: 280, flexShrink: 0 }}
      onDragOver={e => { e.preventDefault(); onDragOver(); }}
      onDrop={e => { e.preventDefault(); onDrop(); }}
      onDragLeave={onDragLeave}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-2xl transition-all"
        style={{
          background: isDragOver ? `${dot}14` : `${dot}08`,
          border: isDragOver ? `2px dashed ${dot}80` : `1px solid ${dot}25`,
          boxShadow: isDragOver ? `0 0 0 4px ${dot}10` : 'none',
        }}>
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: dot, boxShadow: `0 0 6px ${dot}80` }} />
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-gray-800 text-[12px]">{label}</h2>
          <p className="text-[10px] text-gray-400">{sublabel}</p>
        </div>
        <span className="text-[11px] font-bold min-w-[20px] text-center px-2 py-0.5 rounded-full"
          style={{ background: `${dot}20`, color: dot }}>
          {count}
        </span>
      </div>

      {/* Drop hint */}
      {isDragOver && (
        <div className="rounded-2xl border-2 border-dashed p-4 text-center mb-3 transition-all"
          style={{ borderColor: dot, background: `${dot}06` }}>
          <p className="text-[11px] font-semibold" style={{ color: dot }}>拖放至此列</p>
        </div>
      )}

      {/* Cards */}
      <div className="space-y-2.5">
        {projects.map(p => (
          <ProjectCard key={p.id} project={p}
            onClick={() => onCardClick(p.id)}
            onDragStart={onCardDragStart}
          />
        ))}
        {projects.length === 0 && !isDragOver && (
          <div className="rounded-2xl border-2 border-dashed border-gray-100 p-8 text-center">
            <div className="text-2xl mb-2 opacity-30">📂</div>
            <p className="text-[11px] text-gray-300">暂无项目</p>
          </div>
        )}

        {/* Ghost add-project button (Pending + Confirmed only) */}
        {onAddProject && (
          <button
            onClick={onAddProject}
            className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 transition-all text-[12px] font-semibold group"
            style={{
              border: `2px dashed ${dot}40`,
              color: `${dot}99`,
              background: 'transparent',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = dot;
              (e.currentTarget as HTMLButtonElement).style.color = dot;
              (e.currentTarget as HTMLButtonElement).style.background = `${dot}08`;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = `${dot}40`;
              (e.currentTarget as HTMLButtonElement).style.color = `${dot}99`;
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            添加项目
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── KPI Card ──────────────────────────────────────────────────────────── */
function KpiCard({ icon: Icon, label, value, sub, color, iconBg }: {
  icon: React.ElementType; label: string; value: string | number;
  sub?: string; color: string; iconBg: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-4 flex items-center gap-3"
      style={{ border: `1px solid ${color}15`, boxShadow: `0 1px 8px rgba(27,35,54,.04)` }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[18px] font-black leading-tight" style={{ color }}>{value}</div>
        <div className="text-[11px] font-semibold text-gray-600 mt-0.5">{label}</div>
        {sub && <div className="text-[10px] text-gray-400 truncate">{sub}</div>}
      </div>
    </div>
  );
}

/* ─── Notification Bell ─────────────────────────────────────────────────── */
function NotifBell({ notifications, onMarkAllRead, onRequestPush }: {
  notifications: Notif[];
  onMarkAllRead: () => void;
  onRequestPush: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = notifications.filter(n => !n.read).length;
  const urgent = notifications.filter(n => n.daysUntil <= 1).length;

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const ICONS: Record<string, React.ElementType> = { gantt: Hammer, payment: CreditCard, reminder: Bell };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(o => !o); }}
        className={`relative p-2.5 rounded-xl transition-all ${open ? 'bg-[#F0B90B]/15 text-[#F0B90B]' : 'hover:bg-gray-100 text-gray-600'}`}
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold text-white px-1"
            style={{ background: urgent > 0 ? '#E53935' : '#F0B90B' }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
          style={{ border: '1px solid rgba(27,35,54,.1)', boxShadow: '0 8px 40px rgba(27,35,54,.12)' }}>
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <div>
              <h4 className="text-[13px] font-bold text-gray-900">🔔 提醒中心</h4>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {unread === 0 ? '暂无未读提醒' : `${unread} 条未读，${urgent} 条紧急`}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button onClick={onMarkAllRead}
                  className="text-[10px] text-[#F0B90B] hover:underline font-medium">
                  全部已读
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-gray-100 ml-2">
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Notifications list */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="text-3xl mb-2">✅</div>
                <p className="text-[12px] text-gray-500">暂无即将到来的提醒</p>
              </div>
            ) : (
              notifications.map(n => {
                const Icon = ICONS[n.type] || Bell;
                const isUrgent = n.daysUntil <= 1;
                const isToday = n.daysUntil === 0;
                return (
                  <div key={n.id}
                    className={`flex gap-3 px-4 py-3 transition-colors hover:bg-gray-50 ${!n.read ? 'bg-[#FAFBFC]' : ''}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isUrgent ? 'bg-red-50' : n.type === 'payment' ? 'bg-green-50' : 'bg-blue-50'
                    }`}>
                      <Icon className={`w-4 h-4 ${isUrgent ? 'text-red-500' : n.type === 'payment' ? 'text-green-600' : 'text-blue-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <p className={`text-[12px] font-semibold ${n.read ? 'text-gray-600' : 'text-gray-900'} truncate`}>{n.title}</p>
                        {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-[#F0B90B] flex-shrink-0 mt-1" />}
                      </div>
                      <p className="text-[10px] text-gray-400 truncate">{n.projectName}</p>
                      <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-1 ${
                        isToday ? 'bg-red-100 text-red-600' :
                        isUrgent ? 'bg-orange-100 text-orange-600' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {isToday ? '今天' : n.daysUntil === 1 ? '明天' : `${n.daysUntil}天后`}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Push notification option */}
          <div className="px-4 py-3 border-t border-gray-50 bg-[#FAFBFC]">
            <button onClick={onRequestPush}
              className="w-full flex items-center justify-between text-[11px] text-gray-500 hover:text-[#F0B90B] transition-colors">
              <span>🔔 开启浏览器推送通知</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main Dashboard ────────────────────────────────────────────────────── */
export default function DesignerDashboard() {
  const { t, prices } = useI18n();
  const router = useRouter();
  const supabase = createClient();

  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [notifications, setNotifications] = useState<Notif[]>([]);

  // New project modal
  const [showNewProject, setShowNewProject] = useState(false);
  const [newName, setNewName] = useState('');

  // Drag
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const uid = session.user.id;

    // Load projects
    const { data: projs } = await supabase
      .from('projects').select('*').eq('designer_id', uid).order('updated_at', { ascending: false });
    const projList: Project[] = projs || [];
    setProjects(projList);

    // Load gantt tasks for calendar (next 30 days)
    const today = new Date().toISOString().split('T')[0];
    const cutoff = addDays(new Date(), 30).toISOString().split('T')[0];
    const projectIds = projList.map(p => p.id);

    const ganttEvents: CalendarEvent[] = [];
    const paymentEvents: CalendarEvent[] = [];
    const notifs: Notif[] = [];

    if (projectIds.length > 0) {
      // Gantt tasks
      const { data: tasks } = await supabase
        .from('gantt_tasks').select('*')
        .in('project_id', projectIds)
        .gte('start_date', today)
        .lte('start_date', cutoff)
        .order('start_date')
        .limit(60);

      if (tasks) {
        for (const task of tasks) {
          const proj = projList.find(p => p.id === task.project_id);
          const ev: CalendarEvent = {
            id: `gantt-${task.id}`,
            date: task.start_date,
            title: task.name || task.name_zh || '工程任务',
            type: 'gantt',
            color: '#2E6BE6',
            projectId: task.project_id,
            projectName: proj?.name,
            endDate: task.end_date,
            trade: task.trade,
          };
          ganttEvents.push(ev);

          const daysUntil = differenceInDays(
            startOfDay(parseISO(task.start_date)),
            startOfDay(new Date())
          );
          if (daysUntil <= 7) {
            notifs.push({
              id: `gantt-${task.id}`,
              type: 'gantt',
              title: task.name || '工程任务开始',
              desc: `工程任务即将开始`,
              date: task.start_date,
              projectName: proj?.name || '',
              projectId: task.project_id,
              daysUntil,
              read: false,
            });
          }
        }
      }

      // Payment phases
      const { data: payments } = await supabase
        .from('payment_phases').select('*')
        .in('project_id', projectIds)
        .eq('status', 'pending');

      if (payments) {
        for (const pay of payments) {
          if (!pay.due_date) continue;
          const proj = projList.find(p => p.id === pay.project_id);
          const ev: CalendarEvent = {
            id: `pay-${pay.id}`,
            date: pay.due_date,
            title: `💰 ${pay.label || `第${pay.phase_number}期`} 到期`,
            type: 'payment',
            color: '#16A34A',
            projectId: pay.project_id,
            projectName: proj?.name,
          };
          paymentEvents.push(ev);

          const daysUntil = differenceInDays(
            startOfDay(parseISO(pay.due_date)),
            startOfDay(new Date())
          );
          if (daysUntil >= 0 && daysUntil <= 14) {
            notifs.push({
              id: `pay-${pay.id}`,
              type: 'payment',
              title: `收款提醒 — ${pay.label || `第${pay.phase_number}期`}`,
              desc: `${formatCurrency(pay.amount)} 即将到期`,
              date: pay.due_date,
              projectName: proj?.name || '',
              projectId: pay.project_id,
              daysUntil,
              read: false,
            });
          }
        }
      }
    }

    // Merge calendar events (manual events stay)
    setCalendarEvents(prev => {
      const manual = prev.filter(e => e.type === 'manual');
      return [...manual, ...ganttEvents, ...paymentEvents];
    });

    // Sort notifications by daysUntil
    notifs.sort((a, b) => a.daysUntil - b.daysUntil);
    setNotifications(notifs);
    setLoading(false);
  };

  const handleCreateProject = async () => {
    if (!newName.trim()) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase.from('projects').insert({
      designer_id: session.user.id,
      user_id: session.user.id,
      name: newName,
      address: '',
      client_name: '',
      contract_amount: 0,
      status: 'pending',
      progress: 0,
    }).select().single();

    if (!error && data) {
      setShowNewProject(false);
      setNewName('');
      // Redirect to quotation upload page, pre-linked to the new project
      router.push(`/designer/quotation?projectId=${data.id}`);
    }
  };

  /* ─── Drag handlers ─────────────────────────────────────────────────── */
  const handleDrop = async (targetStatus: string) => {
    if (!draggingId) { setDragOverCol(null); return; }
    const proj = projects.find(p => p.id === draggingId);
    if (!proj || proj.status === targetStatus) { setDraggingId(null); setDragOverCol(null); return; }

    setProjects(prev => prev.map(p => p.id === draggingId ? { ...p, status: targetStatus as ProjectStatus } : p));
    setDraggingId(null); setDragOverCol(null);

    const { error } = await supabase.from('projects').update({ status: targetStatus }).eq('id', draggingId);
    if (error) {
      setProjects(prev => prev.map(p => p.id === proj.id ? { ...p, status: proj.status } : p));
      toast({ variant: 'destructive', title: '更新失败', description: '请重试' });
    } else {
      const labels: Record<string, string> = { pending: '待谈 Pending', active: '施工中 Confirmed', completed: '已完工 Completed' };
      toast({ title: `已移至 ${labels[targetStatus]}` });
    }
  };

  const handleMarkAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  const handleRequestPush = async () => {
    if (!('Notification' in window)) {
      toast({ title: '您的浏览器不支持推送通知' }); return;
    }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      new Notification('RenoSmart 提醒已开启', { body: '您将收到工程和收款提醒', icon: '/favicon.ico' });
      toast({ title: '✅ 浏览器推送通知已开启' });
    } else {
      toast({ title: '已拒绝通知权限', description: '请在浏览器设置中开启' });
    }
  };

  const handleToggleReminder = (eventId: string, enabled: boolean) => {
    setCalendarEvents(prev => prev.map(e => e.id === eventId ? { ...e, reminder: enabled } : e));
    toast({ title: enabled ? '🔔 提醒已设置' : '提醒已取消' });
  };

  /* ─── Derived data ──────────────────────────────────────────────────── */
  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.client_name || '').toLowerCase().includes(search.toLowerCase())
  );
  const pending   = filtered.filter(p => p.status === 'pending');
  const active    = filtered.filter(p => p.status === 'active');
  const completed = filtered.filter(p => p.status === 'completed');

  const totalPendingVal = pending.reduce((s, p) => s + (p.contract_amount || 0), 0);
  const totalActiveVal  = active.reduce((s, p) => s + (p.contract_amount || 0), 0);
  const completionRate  = projects.length > 0 ? Math.round((completed.length / projects.length) * 100) : 0;

  const unreadCount = notifications.filter(n => !n.read).length;

  const COLUMNS = [
    { key: 'pending',   label: '🔵 Pending',   sublabel: '待谈 — 洽谈中',   dot: '#2E6BE6', projects: pending   },
    { key: 'active',    label: '🟡 Confirmed',  sublabel: '施工中 — 已成交',  dot: '#F0B90B', projects: active    },
    { key: 'completed', label: '✅ Completed',  sublabel: '已完工 — 已结清',  dot: '#16A34A', projects: completed },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F7F8FA]">
      <Toaster />

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#E8EBF0] px-6 py-3.5 flex items-center gap-4 flex-shrink-0"
        style={{ boxShadow: '0 1px 8px rgba(27,35,54,.06)' }}>
        <div className="flex-1 relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="搜索项目或客户..." className="pl-9 border-gray-200 h-9 text-[13px] bg-gray-50" />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <NotifBell
            notifications={notifications}
            onMarkAllRead={handleMarkAllRead}
            onRequestPush={handleRequestPush}
          />
        </div>
      </div>

      {/* ── KPI Stats ───────────────────────────────────────────────────── */}
      {!loading && (
        <div className="px-6 py-3 flex-shrink-0">
          <div className="grid grid-cols-4 gap-3">
            <KpiCard icon={BarChart2}     color="#2E6BE6" iconBg="rgba(46,107,230,0.1)"
              label="待谈项目"   value={pending.length}
              sub={`管道价值 ${prices.currency} ${(totalPendingVal/1000).toFixed(0)}k`} />
            <KpiCard icon={TrendingUp}    color="#F0B90B" iconBg="rgba(240,185,11,0.1)"
              label="施工中"    value={active.length}
              sub={`合同额 ${prices.currency} ${(totalActiveVal/1000).toFixed(0)}k`} />
            <KpiCard icon={CheckCircle2}  color="#16A34A" iconBg="rgba(22,163,74,0.1)"
              label="已完工"   value={completed.length}
              sub={`完工率 ${completionRate}%`} />
            <KpiCard icon={FolderOpen}    color="#6B7A94" iconBg="rgba(107,122,148,0.1)"
              label="全部项目"  value={projects.length}
              sub={unreadCount > 0 ? `${unreadCount} 个提醒待处理` : '无待处理提醒'} />
          </div>
        </div>
      )}

      {/* ── Drag hint ───────────────────────────────────────────────────── */}
      {draggingId && (
        <div className="px-6 py-1.5 bg-[#F0B90B]/10 border-b border-[#F0B90B]/20 flex-shrink-0">
          <p className="text-[11px] text-[#F0B90B] font-semibold text-center">
            拖放到目标列以更改项目状态 — 可拖至「施工中」确认成交
          </p>
        </div>
      )}

      {/* ── Main area: Kanban + Calendar ────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex"
        onDragEnd={() => { setDraggingId(null); setDragOverCol(null); }}>

        {/* Kanban board */}
        <div className="flex-1 min-w-0 overflow-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-[#F0B90B] border-t-transparent rounded-full animate-spin" />
                <p className="text-[13px] text-gray-400">加载项目...</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 16, minWidth: 'max-content', alignItems: 'flex-start' }}>
              {COLUMNS.map(col => (
                <KanbanColumn key={col.key}
                  colKey={col.key}
                  label={col.label}
                  sublabel={col.sublabel}
                  dot={col.dot}
                  count={col.projects.length}
                  projects={col.projects}
                  isDragOver={dragOverCol === col.key && draggingId !== null}
                  onDragOver={() => setDragOverCol(col.key)}
                  onDrop={() => handleDrop(col.key)}
                  onDragLeave={() => setDragOverCol(null)}
                  onCardClick={id => !draggingId && router.push(`/designer/projects/${id}`)}
                  onCardDragStart={setDraggingId}
                  onAddProject={col.key !== 'completed' ? () => setShowNewProject(true) : undefined}
                />
              ))}
            </div>
          )}
        </div>

        {/* Calendar + Upcoming panel */}
        <div className="flex-shrink-0 overflow-y-auto p-4 space-y-0"
          style={{ width: 308, borderLeft: '1px solid #E8EBF0', background: '#F7F8FA' }}>
          <MiniCalendar
            events={calendarEvents}
            onAddEvent={ev => setCalendarEvents(prev => [...prev, { ...ev, id: `manual-${Date.now()}` }])}
            onDeleteEvent={id => setCalendarEvents(prev => prev.filter(e => e.id !== id))}
            onToggleReminder={handleToggleReminder}
          />
        </div>
      </div>

      {/* ── New project modal ────────────────────────────────────────────── */}
      {showNewProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-[18px] font-bold text-gray-900">新建项目</h2>
                <p className="text-[12px] text-gray-400 mt-1 leading-relaxed">
                  创建后自动跳转至<span className="font-semibold text-[#F0B90B]">报价单上传</span>，完成分析后生成 Gantt 图
                </p>
              </div>
              <button onClick={() => setShowNewProject(false)} className="p-2 rounded-xl hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Flow steps */}
            <div className="flex items-center gap-1.5 mb-5 bg-gray-50 rounded-2xl p-3">
              {[
                { step: '1', label: '新建', active: true },
                { step: '2', label: '上传报价单', active: false },
                { step: '3', label: 'AI 分析', active: false },
                { step: '4', label: 'Gantt 图', active: false },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-1.5 flex-1 min-w-0">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${s.active ? 'bg-[#F0B90B] text-[#1B2336]' : 'bg-gray-200 text-gray-400'}`}>
                    {s.step}
                  </div>
                  <span className={`text-[10px] font-semibold truncate ${s.active ? 'text-[#F0B90B]' : 'text-gray-400'}`}>{s.label}</span>
                  {i < 3 && <div className="flex-1 h-px bg-gray-200 mx-0.5" />}
                </div>
              ))}
            </div>

            <div>
              <label className="text-[12px] font-semibold text-gray-700 mb-1.5 block">项目名称 *</label>
              <Input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && newName.trim() && handleCreateProject()}
                placeholder="例：Bangsar Condo 翻新工程"
                className="text-[13px]"
                autoFocus
              />
              <p className="text-[11px] text-gray-400 mt-1.5">客户资料将在报价单分析后自动填入</p>
            </div>

            <div className="flex gap-3 mt-5">
              <Button variant="outline" onClick={() => setShowNewProject(false)} className="flex-1 h-10 text-[13px]">取消</Button>
              <Button
                className="flex-1 h-10 bg-[#F0B90B] hover:bg-[#d9a50a] text-[#1B2336] font-bold text-[13px]"
                onClick={handleCreateProject}
                disabled={!newName.trim()}
              >
                创建并上传报价单 →
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
