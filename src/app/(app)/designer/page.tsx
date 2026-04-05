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
  Hammer, CreditCard, ChevronRight, FileUp, Sparkles,
  ArrowLeft, Eye, ChevronLeft,
  Users as UsersIcon,
} from 'lucide-react';
import { MiniCalendar, CalendarEvent } from '@/components/designer/MiniCalendar';
import { useTeamContext } from '@/lib/team/TeamContext';
import { ReferralCard } from '@/components/designer/ReferralCard';

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
  ownerName,
  readOnly,
}: {
  project: Project;
  onClick: () => void;
  onDragStart: (id: string) => void;
  ownerName?: string;
  readOnly?: boolean;
}) {
  const { prices } = useI18n();

  const cfg: Record<string, { badge: string; border: string; labelZh: string; labelEn: string; glow: string }> = {
    pending:   { badge: 'bg-blue-50 text-blue-700 border-blue-100',   border: '#4F8EF7', labelZh: '待谈',  labelEn: 'Pending',   glow: 'rgba(79,142,247,0.06)' },
    active:    { badge: 'bg-purple-50 text-purple-700 border-purple-100', border: '#8B5CF6', labelZh: '施工中', labelEn: 'Confirmed', glow: 'rgba(139,92,246,0.05)' },
    completed: { badge: 'bg-green-50 text-green-700 border-green-100', border: 'var(--rs-green)', labelZh: '已完工', labelEn: 'Completed', glow: 'rgba(22,163,74,0.05)' },
  };
  const c = cfg[project.status] || cfg.pending;

  return (
    <div
      draggable={!readOnly}
      onDragStart={(e) => { if (readOnly) return; e.stopPropagation(); onDragStart(project.id); }}
      className={`bg-white rounded-2xl hover:shadow-lg transition-all group select-none ${readOnly ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'}`}
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
            <h3 className="font-bold text-gray-900 truncate text-sm leading-tight">{project.name}</h3>
            {project.address && (
              <div className="flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                <span className="text-xs text-gray-400 truncate">{project.address}</span>
              </div>
            )}
          </div>
          <GripVertical className="w-4 h-4 text-gray-200 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" aria-hidden="true" />
        </div>

        {/* Client + amount row */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0">
            <User className="w-3 h-3 text-gray-500" />
          </div>
          <span className="text-xs text-gray-600 truncate flex-1 font-medium">
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
              <span className="font-bold text-[#4F8EF7]">{project.progress}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-[#4F8EF7] to-[#8B5CF6] transition-all"
                style={{ width: `${project.progress}%` }} />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${c.badge}`}>
              {c.labelZh}
            </span>
            {ownerName && (
              <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[#4F8EF7] to-[#8B5CF6] flex items-center justify-center text-white text-[7px] font-bold">
                  {ownerName[0].toUpperCase()}
                </div>
                {ownerName.split(' ')[0]}
              </span>
            )}
          </div>
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
  readOnly, viewingAll: isViewingAll, getMemberName: getMName,
}: {
  colKey: string; label: string; sublabel: string; dot: string; count: number;
  projects: Project[];
  isDragOver: boolean;
  onDragOver: () => void; onDrop: () => void; onDragLeave: () => void;
  onCardClick: (id: string) => void;
  onCardDragStart: (id: string) => void;
  onAddProject?: () => void;
  readOnly?: boolean;
  viewingAll?: boolean;
  getMemberName?: (id: string) => string;
}) {
  const { t } = useI18n();
  return (
    <div style={{ minWidth: 0 }}
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
        <span className="text-xs font-bold min-w-[20px] text-center px-2 py-0.5 rounded-full"
          style={{ background: `${dot}20`, color: dot }}>
          {count}
        </span>
      </div>

      {/* Drop hint */}
      {isDragOver && (
        <div className="rounded-2xl border-2 border-dashed p-4 text-center mb-3 transition-all"
          style={{ borderColor: dot, background: `${dot}06` }}>
          <p className="text-xs font-semibold" style={{ color: dot }}>拖放至此列</p>
        </div>
      )}

      {/* Cards */}
      <div className="space-y-2.5">
        {projects.map(p => (
          <ProjectCard key={p.id} project={p}
            onClick={() => onCardClick(p.id)}
            onDragStart={onCardDragStart}
            readOnly={readOnly}
            ownerName={isViewingAll && getMName ? getMName(p.designer_id) : undefined}
          />
        ))}
        {projects.length === 0 && !isDragOver && (
          <div className="rounded-2xl border-2 border-dashed border-gray-100 p-8 text-center">
            <div className="text-2xl mb-2 opacity-30">📂</div>
            <p className="text-xs text-gray-300">{t.dash.noProjects}</p>
          </div>
        )}

        {/* Ghost add-project button (Pending + Confirmed only) */}
        {onAddProject && (
          <button
            onClick={onAddProject}
            className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 transition-all text-[12px] font-semibold hover:opacity-100"
            style={{
              border: `2px dashed ${dot}40`,
              color: `${dot}99`,
              background: 'transparent',
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            {t.dash.addProject}
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
        <div className="text-xs font-semibold text-gray-600 mt-0.5">{label}</div>
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
  const { t, lang } = useI18n();
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
        className={`relative p-2.5 rounded-xl transition-all ${open ? 'bg-[#4F8EF7]/15 text-[#4F8EF7]' : 'hover:bg-gray-100 text-gray-600'}`}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold text-white px-1 ${urgent > 0 ? 'bg-rs-red' : 'bg-[#4F8EF7]'}`}>
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
              <h4 className="text-sm font-bold text-gray-900">🔔 {lang === 'ZH' ? '提醒中心' : 'Notifications'}</h4>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {unread === 0
                  ? (lang === 'ZH' ? '暂无未读提醒' : 'No unread notifications')
                  : (lang === 'ZH' ? `${unread} 条未读，${urgent} 条紧急` : `${unread} unread, ${urgent} urgent`)}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button onClick={onMarkAllRead}
                  className="text-[10px] text-[#4F8EF7] hover:underline font-medium">
                  {lang === 'ZH' ? '全部已读' : 'Mark all read'}
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
                <p className="text-[12px] text-gray-500">{lang === 'ZH' ? '暂无即将到来的提醒' : 'No upcoming notifications'}</p>
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
                        {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-[#4F8EF7] flex-shrink-0 mt-1" />}
                      </div>
                      <p className="text-[10px] text-gray-400 truncate">{n.projectName}</p>
                      <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-1 ${
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
              className="w-full flex items-center justify-between text-xs text-gray-500 hover:text-[#4F8EF7] transition-colors">
              <span>{lang === 'ZH' ? '开启浏览器推送通知' : 'Enable browser notifications'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Team Performance Panel ───────────────────────────────────────────── */
function TeamPerformancePanel({ projects, teamMembers, currentUserId, perfMonth, setPerfMonth, currency, lang, t }: {
  projects: Project[];
  teamMembers: { user_id: string | null; name?: string; email: string; role: string }[];
  currentUserId: string | null;
  perfMonth: string;
  setPerfMonth: (m: string) => void;
  currency: string;
  lang: string;
  t: { team?: Record<string, string> } & Record<string, unknown>;
}) {
  const tt = t.team || {};

  // Filter projects by selected month (based on created_at)
  const monthStart = `${perfMonth}-01`;
  const [y, mo] = perfMonth.split('-').map(Number);
  const nextMonthStr = mo === 12 ? `${y + 1}-01-01` : `${y}-${String(mo + 1).padStart(2, '0')}-01`;

  const monthProjects = projects.filter(p => p.created_at >= monthStart && p.created_at < nextMonthStr);

  // Per-member stats
  const memberStats = teamMembers
    .filter(m => m.user_id)
    .map(member => {
      const mp = monthProjects.filter(p => p.designer_id === member.user_id);
      const pending = mp.filter(p => p.status === 'pending');
      const active = mp.filter(p => p.status === 'active');
      const completed = mp.filter(p => p.status === 'completed');
      return {
        userId: member.user_id!,
        name: member.name || member.email.split('@')[0],
        isOwner: member.role === 'owner',
        isYou: member.user_id === currentUserId,
        newCount: pending.length,
        newAmt: pending.reduce((s, p) => s + (p.contract_amount || 0), 0),
        confCount: active.length,
        confAmt: active.reduce((s, p) => s + (p.contract_amount || 0), 0),
        compCount: completed.length,
        compAmt: completed.reduce((s, p) => s + (p.contract_amount || 0), 0),
      };
    });

  const totals = {
    newCount: memberStats.reduce((s, m) => s + m.newCount, 0),
    newAmt: memberStats.reduce((s, m) => s + m.newAmt, 0),
    confCount: memberStats.reduce((s, m) => s + m.confCount, 0),
    confAmt: memberStats.reduce((s, m) => s + m.confAmt, 0),
    compCount: memberStats.reduce((s, m) => s + m.compCount, 0),
    compAmt: memberStats.reduce((s, m) => s + m.compAmt, 0),
  };
  const totalMonthAmt = totals.newAmt + totals.confAmt + totals.compAmt;

  // Status distribution for pie chart (use month-filtered projects)
  const allPending = monthProjects.filter(p => p.status === 'pending').length;
  const allActive = monthProjects.filter(p => p.status === 'active').length;
  const allCompleted = monthProjects.filter(p => p.status === 'completed').length;
  const totalP = allPending + allActive + allCompleted || 1;

  // Month nav
  const prevMonth = () => {
    const d = new Date(perfMonth + '-15');
    d.setMonth(d.getMonth() - 1);
    setPerfMonth(d.toISOString().slice(0, 7));
  };
  const nextMonthFn = () => {
    const d = new Date(perfMonth + '-15');
    d.setMonth(d.getMonth() + 1);
    setPerfMonth(d.toISOString().slice(0, 7));
  };

  const monthLabel = (() => {
    const d = new Date(perfMonth + '-15');
    return d.toLocaleDateString(lang === 'ZH' ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'long' });
  })();

  const pieData = [
    { value: allPending, color: '#4F8EF7', label: tt.newProjects || 'New' },
    { value: allActive, color: '#8B5CF6', label: tt.confirmed || 'Confirmed' },
    { value: allCompleted, color: '#22C55E', label: tt.completed || 'Completed' },
  ];

  const fmtAmt = (v: number) => v >= 1000 ? `${currency} ${(v / 1000).toFixed(0)}k` : `${currency} ${v}`;
  const maxBarAmt = Math.max(...memberStats.map(m => m.newAmt + m.confAmt + m.compAmt), 1);

  return (
    <div className="px-5 pb-2 flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <UsersIcon className="w-4 h-4 text-[#4F8EF7]" />
          {tt.performance || 'Team Performance'}
        </h2>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="p-1 rounded hover:bg-gray-100"><ChevronLeft className="w-4 h-4 text-gray-400" /></button>
          <span className="text-xs font-semibold text-gray-600 min-w-[120px] text-center">{monthLabel}</span>
          <button onClick={nextMonthFn} className="p-1 rounded hover:bg-gray-100"><ChevronRight className="w-4 h-4 text-gray-400" /></button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
        <div className="bg-white rounded-xl p-3 border border-gray-100">
          <div className="text-[10px] text-gray-400 font-semibold">{tt.totalMonthlyAmt || 'Monthly Amount'}</div>
          <div className="text-lg font-black text-[#1A1A2E]">{fmtAmt(totalMonthAmt)}</div>
        </div>
        <div className="bg-white rounded-xl p-3 border border-blue-100">
          <div className="text-[10px] text-blue-400 font-semibold">{tt.newProjects || 'New'}</div>
          <div className="text-lg font-black text-[#4F8EF7]">{totals.newCount}</div>
          <div className="text-[10px] text-gray-400">{fmtAmt(totals.newAmt)}</div>
        </div>
        <div className="bg-white rounded-xl p-3 border border-purple-100">
          <div className="text-[10px] text-purple-400 font-semibold">{tt.confirmed || 'Confirmed'}</div>
          <div className="text-lg font-black text-[#8B5CF6]">{totals.confCount}</div>
          <div className="text-[10px] text-gray-400">{fmtAmt(totals.confAmt)}</div>
        </div>
        <div className="bg-white rounded-xl p-3 border border-green-100">
          <div className="text-[10px] text-green-500 font-semibold">{tt.completed || 'Completed'}</div>
          <div className="text-lg font-black text-[#22C55E]">{totals.compCount}</div>
          <div className="text-[10px] text-gray-400">{fmtAmt(totals.compAmt)}</div>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-100">
          <div className="text-[10px] text-gray-400 font-semibold">{tt.members || 'Members'}</div>
          <div className="text-lg font-black text-gray-700">{teamMembers.length}</div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        {/* Pie chart */}
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <h3 className="text-[11px] font-semibold text-gray-500 mb-3">{tt.statusDist || 'Status Distribution'}</h3>
          <div className="flex items-center gap-6">
            <svg viewBox="0 0 100 100" className="w-24 h-24 flex-shrink-0">
              {(() => {
                let offset = 0;
                return pieData.map((d, i) => {
                  const pct = (d.value / totalP) * 100;
                  const dashArray = `${pct * 2.51327} ${251.327}`;
                  const el = (
                    <circle key={i} cx="50" cy="50" r="40" fill="none" stroke={d.color} strokeWidth="12"
                      strokeDasharray={dashArray} strokeDashoffset={-offset * 2.51327}
                      transform="rotate(-90 50 50)" strokeLinecap="round" />
                  );
                  offset += pct;
                  return el;
                });
              })()}
              <text x="50" y="48" textAnchor="middle" className="text-[14px] font-black" fill="#1A1A2E">{monthProjects.length}</text>
              <text x="50" y="60" textAnchor="middle" className="text-[7px]" fill="#8B8BA8">total</text>
            </svg>
            <div className="space-y-2 flex-1">
              {pieData.map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  <span className="text-[11px] text-gray-600 flex-1">{d.label}</span>
                  <span className="text-[11px] font-bold" style={{ color: d.color }}>{d.value}</span>
                  <span className="text-[10px] text-gray-400">{totalP > 0 ? Math.round((d.value / totalP) * 100) : 0}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bar chart */}
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <h3 className="text-[11px] font-semibold text-gray-500 mb-3">{tt.memberAmount || 'Per-Member Amount'}</h3>
          <div className="space-y-2">
            {memberStats.map(ms => {
              const total = ms.newAmt + ms.confAmt + ms.compAmt;
              return (
                <div key={ms.userId}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-gray-700 font-medium truncate max-w-[120px]">
                      {ms.name}{ms.isYou ? ` (${tt.you || 'You'})` : ''}
                    </span>
                    <span className="text-[10px] font-bold text-gray-500">{fmtAmt(total)}</span>
                  </div>
                  <div className="h-3 bg-gray-50 rounded-full overflow-hidden flex">
                    {ms.newAmt > 0 && <div className="h-full bg-[#4F8EF7]" style={{ width: `${(ms.newAmt / maxBarAmt) * 100}%` }} />}
                    {ms.confAmt > 0 && <div className="h-full bg-[#8B5CF6]" style={{ width: `${(ms.confAmt / maxBarAmt) * 100}%` }} />}
                    {ms.compAmt > 0 && <div className="h-full bg-[#22C55E]" style={{ width: `${(ms.compAmt / maxBarAmt) * 100}%` }} />}
                  </div>
                </div>
              );
            })}
            <div className="flex items-center gap-4 pt-1">
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#4F8EF7]" /><span className="text-[9px] text-gray-400">{tt.newAmt || 'New'}</span></div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#8B5CF6]" /><span className="text-[9px] text-gray-400">{tt.confAmt || 'Conf.'}</span></div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#22C55E]" /><span className="text-[9px] text-gray-400">{tt.compAmt || 'Comp.'}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Per-member table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-gray-50 text-gray-500">
              <th className="text-left px-3 py-2 font-semibold">{lang === 'ZH' ? '成员' : 'Member'}</th>
              <th className="text-center px-2 py-2 font-semibold text-[#4F8EF7]">{tt.newProjects || 'New'}</th>
              <th className="text-right px-2 py-2 font-semibold text-[#4F8EF7]">{tt.newAmt || 'New Amt'}</th>
              <th className="text-center px-2 py-2 font-semibold text-[#8B5CF6]">{tt.confirmed || 'Confirmed'}</th>
              <th className="text-right px-2 py-2 font-semibold text-[#8B5CF6]">{tt.confAmt || 'Conf. Amt'}</th>
              <th className="text-center px-2 py-2 font-semibold text-[#22C55E]">{tt.completed || 'Completed'}</th>
              <th className="text-right px-2 py-2 font-semibold text-[#22C55E]">{tt.compAmt || 'Comp. Amt'}</th>
            </tr>
          </thead>
          <tbody>
            {memberStats.map(ms => (
              <tr key={ms.userId} className="border-t border-gray-50 hover:bg-gray-50/50">
                <td className="px-3 py-2 font-medium text-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0"
                      style={{ background: ms.isOwner ? 'linear-gradient(135deg, #F0B90B, #D4A00A)' : 'linear-gradient(135deg, #4F8EF7, #8B5CF6)' }}>
                      {ms.name[0].toUpperCase()}
                    </div>
                    <span className="truncate">{ms.name}</span>
                    {ms.isYou && <span className="text-[9px] text-gray-400">({tt.you || 'You'})</span>}
                  </div>
                </td>
                <td className="text-center px-2 py-2 font-bold text-[#4F8EF7]">{ms.newCount}</td>
                <td className="text-right px-2 py-2 text-gray-600">{fmtAmt(ms.newAmt)}</td>
                <td className="text-center px-2 py-2 font-bold text-[#8B5CF6]">{ms.confCount}</td>
                <td className="text-right px-2 py-2 text-gray-600">{fmtAmt(ms.confAmt)}</td>
                <td className="text-center px-2 py-2 font-bold text-[#22C55E]">{ms.compCount}</td>
                <td className="text-right px-2 py-2 text-gray-600">{fmtAmt(ms.compAmt)}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-gray-200 bg-gray-50 font-bold">
              <td className="px-3 py-2 text-gray-800">TOTAL</td>
              <td className="text-center px-2 py-2 text-[#4F8EF7]">{totals.newCount}</td>
              <td className="text-right px-2 py-2 text-gray-800">{fmtAmt(totals.newAmt)}</td>
              <td className="text-center px-2 py-2 text-[#8B5CF6]">{totals.confCount}</td>
              <td className="text-right px-2 py-2 text-gray-800">{fmtAmt(totals.confAmt)}</td>
              <td className="text-center px-2 py-2 text-[#22C55E]">{totals.compCount}</td>
              <td className="text-right px-2 py-2 text-gray-800">{fmtAmt(totals.compAmt)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Main Dashboard ────────────────────────────────────────────────────── */
export default function DesignerDashboard() {
  const { t, prices, lang } = useI18n();
  const router = useRouter();
  const supabase = createClient();
  const { viewingMemberId, viewingAll, isReadOnly, isOwner, teamMembers, currentUserId, setViewingMember, setViewingAll, getMemberName } = useTeamContext();

  // Elite owner's dashboard shows Team Performance by default
  // When clicking own name (viewingMemberId === currentUserId), show own Kanban only
  const viewingSelf = viewingMemberId !== null && viewingMemberId === currentUserId;
  const showTeamPerformance = isOwner && !viewingMemberId;

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

  // Team performance month picker
  const [perfMonth, setPerfMonth] = useState(() => new Date().toISOString().slice(0, 7));

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadAll(); }, [viewingMemberId, viewingAll, isOwner]);

  const loadAll = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;
    const uid = authUser.id;

    // Load projects — Elite owner uses server API (bypasses RLS for cross-team reads)
    // Kanban filtering is done on the client side
    let projList: Project[] = [];
    if (isOwner && teamMembers.length > 0) {
      try {
        const res = await fetch('/api/team/projects');
        if (res.ok) {
          const data = await res.json();
          projList = data.projects || [];
        }
      } catch { /* fallback below */ }
    }
    if (projList.length === 0 && !(isOwner && teamMembers.length > 0)) {
      let query = supabase.from('projects').select('*');
      if (viewingMemberId) {
        query = query.eq('designer_id', viewingMemberId);
      } else {
        query = query.eq('designer_id', uid);
      }
      const { data: projs } = await query.order('updated_at', { ascending: false });
      projList = projs || [];
    }
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
            color: '#4F8EF7',
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
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    const { data, error } = await supabase.from('projects').insert({
      designer_id: authUser.id,
      user_id: authUser.id,
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
    if (viewingMemberId && !viewingSelf) return;
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
      const labels: Record<string, string> = { pending: t.status.pending, active: t.status.active, completed: t.status.completed };
      toast({ title: `→ ${labels[targetStatus]}` });
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
  // For Kanban: filter to specific user's projects when applicable
  const kanbanProjects = (() => {
    let base = projects;
    // Elite owner default: show only own projects in Kanban
    if (isOwner && !viewingMemberId && currentUserId) {
      base = projects.filter(p => p.designer_id === currentUserId);
    }
    // Viewing a specific member: show only their projects
    if (viewingMemberId) {
      base = projects.filter(p => p.designer_id === viewingMemberId);
    }
    return base;
  })();

  const searchFiltered = kanbanProjects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.client_name || '').toLowerCase().includes(search.toLowerCase())
  );

  // When showing team performance, filter Kanban cards by selected month
  const filtered = showTeamPerformance
    ? (() => {
        const mStart = `${perfMonth}-01`;
        const [yr, mo] = perfMonth.split('-').map(Number);
        const mEnd = mo === 12 ? `${yr + 1}-01-01` : `${yr}-${String(mo + 1).padStart(2, '0')}-01`;
        return searchFiltered.filter(p => p.created_at >= mStart && p.created_at < mEnd);
      })()
    : searchFiltered;

  const pending   = filtered.filter(p => p.status === 'pending');
  const active    = filtered.filter(p => p.status === 'active');
  const completed = filtered.filter(p => p.status === 'completed');

  const totalPendingVal = pending.reduce((s, p) => s + (p.contract_amount || 0), 0);
  const totalActiveVal  = active.reduce((s, p) => s + (p.contract_amount || 0), 0);
  const completionRate  = kanbanProjects.length > 0 ? Math.round((completed.length / kanbanProjects.length) * 100) : 0;

  const unreadCount = notifications.filter(n => !n.read).length;

  const COLUMNS = [
    { key: 'pending',   label: `🔵 ${t.status.pending}`,   sublabel: t.dash.negotiating,   dot: '#4F8EF7', projects: pending   },
    { key: 'active',    label: `🟣 ${t.status.active}`,    sublabel: t.dash.confirmed,     dot: '#8B5CF6', projects: active    },
    { key: 'completed', label: `✅ ${t.status.completed}`,  sublabel: t.dash.settled,       dot: '#22C55E', projects: completed },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-rs-bg">
      <Toaster />

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-rs-border px-6 py-3.5 flex items-center gap-4 flex-shrink-0"
        style={{ boxShadow: '0 1px 8px rgba(27,35,54,.06)' }}>
        <div className="flex-1 relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t.dash.searchPlaceholder} className="pl-9 border-gray-200 h-9 text-sm bg-gray-50" />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <NotifBell
            notifications={notifications}
            onMarkAllRead={handleMarkAllRead}
            onRequestPush={handleRequestPush}
          />
        </div>
      </div>

      {/* ── Team read-only banner (only when viewing another member) ── */}
      {viewingMemberId && !viewingSelf && (
        <div className="px-6 py-2.5 bg-gradient-to-r from-[#4F8EF7]/10 to-[#8B5CF6]/10 border-b border-[#4F8EF7]/20 flex items-center gap-3 flex-shrink-0">
          <Eye className="w-4 h-4 text-[#4F8EF7]" />
          <span className="text-xs font-semibold text-[#4F8EF7]">
            {((t as { team?: { viewingMember?: string } }).team?.viewingMember || "Viewing {name}'s projects").replace('{name}', getMemberName(viewingMemberId))}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#4F8EF7]/15 text-[#4F8EF7] font-bold">
            {(t as { team?: { readOnly?: string } }).team?.readOnly || 'Read-only'}
          </span>
          <button
            onClick={() => { setViewingMember(null); setViewingAll(false); }}
            className="ml-auto flex items-center gap-1 text-xs font-semibold text-[#4F8EF7] hover:text-[#3B7BE8] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {(t as { team?: { backToMine?: string } }).team?.backToMine || 'Back to my dashboard'}
          </button>
        </div>
      )}

      {/* ── KPI Stats (hidden when Team Performance panel is visible) ── */}
      {!loading && !showTeamPerformance && (
        <div className="px-5 py-3 flex-shrink-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <KpiCard icon={BarChart2}     color="#3B82F6" iconBg="rgba(59,130,246,0.1)"
              label={t.dash.pendingProjects}   value={pending.length}
              sub={`${t.dash.pipelineValue} ${prices.currency} ${(totalPendingVal/1000).toFixed(0)}k`} />
            <KpiCard icon={TrendingUp}    color="#F97316" iconBg="rgba(249,115,22,0.1)"
              label={t.dash.activeProjects}    value={active.length}
              sub={`${t.dash.contractValue} ${prices.currency} ${(totalActiveVal/1000).toFixed(0)}k`} />
            <KpiCard icon={CheckCircle2}  color="#22C55E" iconBg="rgba(34,197,94,0.1)"
              label={t.dash.completedProjects}   value={completed.length}
              sub={`${t.dash.completionRate} ${completionRate}%`} />
            <KpiCard icon={FolderOpen}    color="#8B5CF6" iconBg="rgba(139,92,246,0.1)"
              label={t.dash.allProjects}  value={kanbanProjects.length}
              sub={unreadCount > 0 ? `${unreadCount} ${t.dash.reminders}` : t.dash.noReminders} />
          </div>
        </div>
      )}

      {/* ── Team Performance Panel (Elite owner default + ALL view) ────── */}
      {showTeamPerformance && !loading && <TeamPerformancePanel
        projects={projects}
        teamMembers={teamMembers}
        currentUserId={currentUserId}
        perfMonth={perfMonth}
        setPerfMonth={setPerfMonth}
        currency={prices.currency}
        lang={lang}
        t={t as unknown as { team?: Record<string, string> } & Record<string, unknown>}
      />}

      {/* ── Drag hint ───────────────────────────────────────────────────── */}
      {draggingId && (
        <div className="px-6 py-1.5 bg-[#4F8EF7]/10 border-b border-[#4F8EF7]/20 flex-shrink-0">
          <p className="text-xs text-[#4F8EF7] font-semibold text-center">
            {t.dash.dragHint}
          </p>
        </div>
      )}

      {/* ── Main area: Kanban + Calendar — unified full-screen grid ──── */}
      <div className="flex-1 overflow-auto p-5"
        onDragEnd={() => { setDraggingId(null); setDragOverCol(null); }}>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-[#4F8EF7] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-400">加载项目...</p>
            </div>
          </div>
        ) : (
          /* Kanban columns + Calendar — always show calendar */
          <div className="dashboard-kanban-grid" style={{ display: 'grid', gridTemplateColumns: projects.length === 0 ? '1fr 280px' : '1fr 1fr 1fr 280px', gap: 16, alignItems: 'start', minHeight: 0 }}>
            {projects.length === 0 ? (
              /* Empty state in the main area */
              <div className="flex flex-col items-center justify-center py-16 px-8">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#4F8EF7] via-[#8B5CF6] to-[#EC4899] flex items-center justify-center mb-6 animate-pulse">
                  <Hammer className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#1A1A2E] mb-2">{t.dash.emptyTitle || '开始你的第一个装修项目'}</h3>
                <p className="text-sm text-[#8B8BA8] mb-8 text-center max-w-md">{t.dash.emptyDesc || '上传报价单，AI 将自动分析并生成甘特图'}</p>
                <div className="flex items-center gap-4 mb-8">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-xl bg-[#4F8EF7]/10 flex items-center justify-center"><FileUp className="w-6 h-6 text-[#4F8EF7]" /></div>
                    <span className="text-xs text-[#4A4A6A] font-medium">{t.dash.stepUpload || '上传报价单'}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#E2E4EE]" />
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-xl bg-[#8B5CF6]/10 flex items-center justify-center"><Sparkles className="w-6 h-6 text-[#8B5CF6]" /></div>
                    <span className="text-xs text-[#4A4A6A] font-medium">{t.dash.stepAnalysis || 'AI 智能分析'}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#E2E4EE]" />
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-xl bg-[#EC4899]/10 flex items-center justify-center"><BarChart2 className="w-6 h-6 text-[#EC4899]" /></div>
                    <span className="text-xs text-[#4A4A6A] font-medium">{t.dash.stepGantt || '生成甘特图'}</span>
                  </div>
                </div>
                <button onClick={() => router.push('/designer/quotation')}
                  className="px-6 py-2.5 rounded-xl text-white font-semibold text-sm transition-all hover:shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #4F8EF7, #8B5CF6, #EC4899)' }}>
                  {t.dash.startUpload || '上传报价单开始'}
                </button>
              </div>
            ) : (
              /* Kanban columns */
              COLUMNS.map(col => (
                <KanbanColumn key={col.key}
                  colKey={col.key}
                  label={col.label}
                  sublabel={col.sublabel}
                  dot={col.dot}
                  count={col.projects.length}
                  projects={col.projects}
                  isDragOver={(!viewingMemberId || viewingSelf) && dragOverCol === col.key && draggingId !== null}
                  onDragOver={() => (!viewingMemberId || viewingSelf) && setDragOverCol(col.key)}
                  onDrop={() => (!viewingMemberId || viewingSelf) && handleDrop(col.key)}
                  onDragLeave={() => setDragOverCol(null)}
                  onCardClick={id => !draggingId && router.push(`/designer/projects/${id}`)}
                  onCardDragStart={(viewingMemberId && !viewingSelf) ? () => {} : setDraggingId}
                  onAddProject={(!viewingMemberId || viewingSelf) && col.key !== 'completed' ? () => setShowNewProject(true) : undefined}
                  readOnly={!!viewingMemberId && !viewingSelf}
                  viewingAll={showTeamPerformance || viewingAll}
                  getMemberName={getMemberName}
                />
              ))
            )}
            {/* Calendar + Referral — always visible as last column */}
            <div className="space-y-4">
              <MiniCalendar
                events={calendarEvents}
                onAddEvent={ev => setCalendarEvents(prev => [...prev, { ...ev, id: `manual-${Date.now()}` }])}
                onDeleteEvent={id => setCalendarEvents(prev => prev.filter(e => e.id !== id))}
                onToggleReminder={handleToggleReminder}
              />
              <ReferralCard />
            </div>
          </div>
        )}
      </div>

      {/* ── New project modal ────────────────────────────────────────────── */}
      {showNewProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-[18px] font-bold text-gray-900">新建项目</h2>
                <p className="text-[12px] text-gray-400 mt-1 leading-relaxed">
                  创建后自动跳转至<span className="font-semibold text-[#4F8EF7]">报价单上传</span>，完成分析后生成 Gantt 图
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
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${s.active ? 'bg-[#4F8EF7] text-white' : 'bg-gray-200 text-gray-400'}`}>
                    {s.step}
                  </div>
                  <span className={`text-[10px] font-semibold truncate ${s.active ? 'text-[#4F8EF7]' : 'text-gray-400'}`}>{s.label}</span>
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
                className="text-sm"
                autoFocus
              />
              <p className="text-xs text-gray-400 mt-1.5">客户资料将在报价单分析后自动填入</p>
            </div>

            <div className="flex gap-3 mt-5">
              <Button variant="outline" onClick={() => setShowNewProject(false)} className="flex-1 h-10 text-sm">取消</Button>
              <Button
                className="flex-1 h-10 bg-[#4F8EF7] hover:bg-[#3B7BE8] text-white font-bold text-sm"
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
