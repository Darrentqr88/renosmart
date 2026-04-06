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
      className={`bg-white rounded-2xl hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 group select-none ${readOnly ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'}`}
      style={{
        border: `1px solid ${c.border}25`,
        borderLeft: `3px solid ${c.border}`,
        boxShadow: `0 2px 12px ${c.glow}`,
      }}
      onClick={onClick}
    >
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-extrabold text-gray-900 truncate text-[13px] leading-tight">{project.name}</h3>
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
          <span className="text-[12px] font-black tracking-tight flex-shrink-0" style={{ color: c.border }}>
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
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-[#4F8EF7] via-[#7C6BF7] to-[#8B5CF6] transition-all relative overflow-hidden"
                style={{ width: `${project.progress}%` }}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent" style={{ animation: 'shimmer 2s infinite' }} />
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${c.badge}`}
              style={{ boxShadow: `0 1px 4px ${c.border}15` }}>
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
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-2 ring-white" style={{ background: dot, boxShadow: `0 0 8px ${dot}90, 0 0 16px ${dot}40` }} />
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-gray-800 text-[12px]">{label}</h2>
          <p className="text-[10px] text-gray-400">{sublabel}</p>
        </div>
        <span className="text-[11px] font-black min-w-[20px] text-center px-2 py-0.5 rounded-full"
          style={{ background: `${dot}20`, color: dot, boxShadow: `inset 0 1px 2px ${dot}10` }}>
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
    <div className="relative overflow-hidden rounded-2xl p-4 group hover:-translate-y-0.5 transition-all duration-300 cursor-default"
      style={{
        background: `linear-gradient(135deg, ${color}08, ${color}15)`,
        border: `1px solid ${color}20`,
        boxShadow: `0 2px 12px ${color}12, 0 1px 3px rgba(0,0,0,0.04)`,
      }}>
      {/* Decorative orb */}
      <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-[0.12] blur-2xl group-hover:opacity-[0.25] transition-opacity duration-500" style={{ background: color }} />
      {/* Header: icon + label */}
      <div className="flex items-center gap-2 mb-2 relative">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm" style={{ background: iconBg }}>
          <Icon className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" style={{ color }} />
        </div>
        <span className="text-[11px] font-semibold text-gray-500">{label}</span>
      </div>
      {/* Value */}
      <div className="text-[26px] font-black leading-none tracking-tight tabular-nums relative" style={{ color }}>{value}</div>
      {/* Sub info */}
      {sub && <div className="text-[10px] text-gray-400 mt-1.5 truncate font-medium relative">{sub}</div>}
      {/* Bottom accent */}
      <div className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full opacity-30 group-hover:opacity-60 transition-opacity duration-300" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
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

  // Filter projects by selected month
  // - Pending (new): by created_at (when the project was created)
  // - Confirmed/Completed: by updated_at (when the status was changed)
  // This ensures a project created in March but confirmed in May appears in May's Confirmed
  const monthStart = `${perfMonth}-01`;
  const [y, mo] = perfMonth.split('-').map(Number);
  const nextMonthStr = mo === 12 ? `${y + 1}-01-01` : `${y}-${String(mo + 1).padStart(2, '0')}-01`;

  const inMonth = (dateStr: string) => dateStr >= monthStart && dateStr < nextMonthStr;

  const monthProjects = projects.filter(p => {
    if (p.status === 'pending') return inMonth(p.created_at);
    // For active/completed, use updated_at (status change timestamp)
    return inMonth(p.updated_at);
  });

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

  const fmtAmt = (v: number) => `${currency} ${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Rich amount display for summary cards
  const FmtAmtRich = ({ v, size = 'md' }: { v: number; size?: 'sm' | 'md' | 'lg' }) => {
    const textSize = size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-lg' : 'text-base';
    if (v >= 1000000) {
      return <span className={`${textSize} font-black tabular-nums`}><span className="text-[0.65em] font-semibold opacity-60">{currency}</span> {(v / 1000000).toFixed(1)}<span className="text-[0.6em] font-bold opacity-50">M</span></span>;
    }
    if (v >= 1000) {
      return <span className={`${textSize} font-black tabular-nums`}><span className="text-[0.65em] font-semibold opacity-60">{currency}</span> {(v / 1000).toFixed(0)}<span className="text-[0.6em] font-bold opacity-50">k</span></span>;
    }
    return <span className={`${textSize} font-black tabular-nums`}><span className="text-[0.65em] font-semibold opacity-60">{currency}</span> {v.toLocaleString()}</span>;
  };
  const maxBarAmt = Math.max(...memberStats.map(m => m.newAmt + m.confAmt + m.compAmt), 1);

  // Conversion rate: confirmed / (new + confirmed)
  const convRate = (totals.newCount + totals.confCount) > 0
    ? Math.round((totals.confCount / (totals.newCount + totals.confCount)) * 100) : 0;

  return (
    <div className="px-5 pb-3 flex-shrink-0">
      {/* ── Hero Header Bar ──────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl mb-4 p-5"
        style={{ background: 'linear-gradient(135deg, #0F1923 0%, #1A1A2E 40%, #2D2B55 100%)' }}>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #4F8EF7, transparent 70%)', transform: 'translate(30%, -50%)' }} />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full opacity-[0.03]"
          style={{ background: 'radial-gradient(circle, #8B5CF6, transparent 70%)', transform: 'translate(0, 60%)' }} />
        <div className="absolute top-3 right-4 w-1 h-1 rounded-full bg-[#F0B90B] opacity-40" />
        <div className="absolute top-8 right-12 w-0.5 h-0.5 rounded-full bg-[#4F8EF7] opacity-30" />

        {/* Top row: title + month nav */}
        <div className="flex items-center justify-between mb-5 relative">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #4F8EF7, #8B5CF6)', boxShadow: '0 4px 12px rgba(79,142,247,0.3)' }}>
              <UsersIcon className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-white tracking-tight">{tt.performance || 'Team Performance'}</h2>
              <p className="text-[10px] text-white/30 font-medium">{teamMembers.length} {lang === 'ZH' ? '位成员' : 'members'}</p>
            </div>
          </div>
          <div className="flex items-center gap-0.5 bg-white/[0.06] rounded-xl px-1 py-0.5 backdrop-blur-sm border border-white/[0.06]">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"><ChevronLeft className="w-3.5 h-3.5 text-white/50" /></button>
            <span className="text-[11px] font-semibold text-white/80 min-w-[110px] text-center tracking-wide">{monthLabel}</span>
            <button onClick={nextMonthFn} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"><ChevronRight className="w-3.5 h-3.5 text-white/50" /></button>
          </div>
        </div>

        {/* Metric cards row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 relative">
          {/* Total Amount — featured */}
          <div className="relative overflow-hidden rounded-xl p-4 md:col-span-1"
            style={{ background: 'linear-gradient(135deg, rgba(79,142,247,0.15), rgba(139,92,246,0.1))', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="absolute -bottom-3 -right-3 w-14 h-14 rounded-full opacity-20 blur-xl" style={{ background: '#F0B90B' }} />
            <div className="text-[9px] text-white/40 font-semibold uppercase tracking-widest mb-1">{tt.totalMonthlyAmt || 'Revenue'}</div>
            <div className="text-white text-[22px] font-black tabular-nums tracking-tight leading-none">
              <span className="text-[13px] font-semibold text-white/40 mr-0.5">{currency}</span>
              {totalMonthAmt >= 1000000 ? `${(totalMonthAmt / 1000000).toFixed(2)}M` : totalMonthAmt >= 1000 ? totalMonthAmt.toLocaleString('en-US') : totalMonthAmt}
            </div>
            <div className="flex items-center gap-1 mt-2">
              <div className="h-[3px] flex-1 rounded-full overflow-hidden flex gap-px" style={{ background: 'rgba(255,255,255,0.06)' }}>
                {totals.newAmt > 0 && <div className="h-full rounded-full bg-[#4F8EF7]" style={{ width: `${(totals.newAmt / (totalMonthAmt || 1)) * 100}%` }} />}
                {totals.confAmt > 0 && <div className="h-full rounded-full bg-[#8B5CF6]" style={{ width: `${(totals.confAmt / (totalMonthAmt || 1)) * 100}%` }} />}
                {totals.compAmt > 0 && <div className="h-full rounded-full bg-[#22C55E]" style={{ width: `${(totals.compAmt / (totalMonthAmt || 1)) * 100}%` }} />}
              </div>
            </div>
          </div>

          {/* New */}
          <div className="rounded-xl p-3.5 relative group" style={{ background: 'rgba(79,142,247,0.08)', border: '1px solid rgba(79,142,247,0.12)' }}>
            <div className="flex items-center justify-between mb-1">
              <div className="text-[9px] text-[#4F8EF7]/70 font-semibold uppercase tracking-widest">{tt.newProjects || 'Pipeline'}</div>
              <div className="w-5 h-5 rounded-md flex items-center justify-center bg-[#4F8EF7]/20"><BarChart2 className="w-2.5 h-2.5 text-[#4F8EF7]" /></div>
            </div>
            <div className="text-[28px] font-black text-white leading-none tabular-nums">{totals.newCount}</div>
            <div className="text-[10px] text-white/30 font-medium tabular-nums mt-1">{fmtAmt(totals.newAmt)}</div>
          </div>

          {/* Confirmed */}
          <div className="rounded-xl p-3.5 relative" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.12)' }}>
            <div className="flex items-center justify-between mb-1">
              <div className="text-[9px] text-[#8B5CF6]/70 font-semibold uppercase tracking-widest">{tt.confirmed || 'Confirmed'}</div>
              <div className="w-5 h-5 rounded-md flex items-center justify-center bg-[#8B5CF6]/20"><CheckCircle2 className="w-2.5 h-2.5 text-[#8B5CF6]" /></div>
            </div>
            <div className="text-[28px] font-black text-white leading-none tabular-nums">{totals.confCount}</div>
            <div className="text-[10px] text-white/30 font-medium tabular-nums mt-1">{fmtAmt(totals.confAmt)}</div>
          </div>

          {/* Completed */}
          <div className="rounded-xl p-3.5 relative" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.12)' }}>
            <div className="flex items-center justify-between mb-1">
              <div className="text-[9px] text-[#22C55E]/70 font-semibold uppercase tracking-widest">{tt.completed || 'Completed'}</div>
              <div className="w-5 h-5 rounded-md flex items-center justify-center bg-[#22C55E]/20"><CheckCircle2 className="w-2.5 h-2.5 text-[#22C55E]" /></div>
            </div>
            <div className="text-[28px] font-black text-white leading-none tabular-nums">{totals.compCount}</div>
            <div className="text-[10px] text-white/30 font-medium tabular-nums mt-1">{fmtAmt(totals.compAmt)}</div>
          </div>

          {/* Conversion Rate */}
          <div className="rounded-xl p-3.5 relative" style={{ background: 'rgba(240,185,11,0.06)', border: '1px solid rgba(240,185,11,0.1)' }}>
            <div className="flex items-center justify-between mb-1">
              <div className="text-[9px] text-[#F0B90B]/60 font-semibold uppercase tracking-widest">{lang === 'ZH' ? '转化率' : 'Conv. Rate'}</div>
              <div className="w-5 h-5 rounded-md flex items-center justify-center bg-[#F0B90B]/15"><TrendingUp className="w-2.5 h-2.5 text-[#F0B90B]" /></div>
            </div>
            <div className="text-[28px] font-black text-white leading-none tabular-nums">{convRate}<span className="text-[14px] text-white/30 font-bold">%</span></div>
            <div className="text-[10px] text-white/30 font-medium mt-1">{totals.confCount}/{totals.newCount + totals.confCount} {lang === 'ZH' ? '项目' : 'projects'}</div>
          </div>
        </div>
      </div>

      {/* ── Charts + Table Section ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-3">
        {/* Donut Chart — 4 cols */}
        <div className="lg:col-span-4 bg-white rounded-xl p-5 border border-gray-100/80 shadow-sm hover:shadow-md transition-shadow duration-300">
          <h3 className="text-[10px] font-bold text-gray-400 mb-4 uppercase tracking-[0.12em]">{tt.statusDist || 'Status Distribution'}</h3>
          <div className="flex flex-col items-center">
            <svg viewBox="0 0 120 120" className="w-32 h-32 mb-4">
              <defs>
                <filter id="donut-shadow"><feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.1" /></filter>
              </defs>
              <circle cx="60" cy="60" r="46" fill="none" stroke="#F0F1F5" strokeWidth="8" />
              {(() => {
                let offset = 0;
                const circumference = 2 * Math.PI * 46;
                const gapLen = 4 * circumference / 360;
                return pieData.map((d, i) => {
                  const pct = (d.value / totalP) * 100;
                  const arcLen = Math.max(0, (pct / 100) * circumference - gapLen);
                  const dashArray = `${arcLen} ${circumference}`;
                  const el = (
                    <circle key={i} cx="60" cy="60" r="46" fill="none" stroke={d.color} strokeWidth="8"
                      strokeDasharray={dashArray} strokeDashoffset={-(offset / 100) * circumference}
                      transform="rotate(-90 60 60)" strokeLinecap="round"
                      className="transition-all duration-700"
                      filter="url(#donut-shadow)" />
                  );
                  offset += pct;
                  return el;
                });
              })()}
              <text x="60" y="56" textAnchor="middle" className="text-[20px] font-black" fill="#1A1A2E">{monthProjects.length}</text>
              <text x="60" y="70" textAnchor="middle" className="text-[8px] font-bold" fill="#B0B3C6" letterSpacing="2">PROJECTS</text>
            </svg>
            <div className="w-full space-y-2.5">
              {pieData.map((d, i) => {
                const pct = totalP > 0 ? Math.round((d.value / totalP) * 100) : 0;
                return (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-[4px] flex-shrink-0 shadow-sm" style={{ background: d.color }} />
                    <span className="text-[12px] text-gray-700 flex-1 font-medium">{d.label}</span>
                    <span className="text-[13px] font-black tabular-nums min-w-[18px] text-right" style={{ color: d.color }}>{d.value}</span>
                    <div className="w-16 h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${d.color}, ${d.color}CC)` }} />
                    </div>
                    <span className="text-[10px] text-gray-400 tabular-nums min-w-[28px] text-right font-semibold">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 6-Month Trend — 8 cols: grouped bar chart comparing New/Confirmed/Completed over 6 months */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-gray-100/80 shadow-sm hover:shadow-md transition-shadow duration-300 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.12em]">{lang === 'ZH' ? '6个月趋势' : '6-Month Trend'}</h3>
            <div className="flex items-center gap-4">
              {[{ label: tt.newProjects || 'New', color: '#4F8EF7' }, { label: tt.confirmed || 'Confirmed', color: '#8B5CF6' }, { label: tt.completed || 'Completed', color: '#22C55E' }].map((l, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-sm" style={{ background: l.color }} />
                  <span className="text-[10px] font-medium text-gray-500">{l.label}</span>
                </div>
              ))}
            </div>
          </div>
          {(() => {
            // Build 6-month data: current month + 5 previous
            const months6: { key: string; label: string; newCount: number; newAmt: number; confCount: number; confAmt: number; compCount: number; compAmt: number }[] = [];
            for (let offset = 5; offset >= 0; offset--) {
              const d = new Date(Number(y), Number(mo) - 1 - offset, 15);
              const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
              const mStart = `${mk}-01`;
              const nxtMo = d.getMonth() + 1 === 12 ? `${d.getFullYear() + 1}-01-01` : `${d.getFullYear()}-${String(d.getMonth() + 2).padStart(2, '0')}-01`;
              const inMo = (ds: string) => ds >= mStart && ds < nxtMo;
              const mp = projects.filter(p => p.status === 'pending' ? inMo(p.created_at) : inMo(p.updated_at));
              const pend = mp.filter(p => p.status === 'pending');
              const act = mp.filter(p => p.status === 'active');
              const comp = mp.filter(p => p.status === 'completed');
              const mLabel = d.toLocaleDateString(lang === 'ZH' ? 'zh-CN' : 'en-US', { month: 'short' });
              months6.push({
                key: mk, label: mLabel,
                newCount: pend.length, newAmt: pend.reduce((s, p) => s + (p.contract_amount || 0), 0),
                confCount: act.length, confAmt: act.reduce((s, p) => s + (p.contract_amount || 0), 0),
                compCount: comp.length, compAmt: comp.reduce((s, p) => s + (p.contract_amount || 0), 0),
              });
            }
            // Amount-based comparison
            const maxAmt6 = Math.max(...months6.flatMap(m => [m.newAmt, m.confAmt, m.compAmt]), 1);
            const isCurrentMonth = (mk: string) => mk === perfMonth;
            // Compact amount label for bar tops
            const shortAmt = (v: number) => {
              if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
              if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
              return v.toLocaleString();
            };
            // Y-axis labels
            const yTop = shortAmt(maxAmt6);
            const yMid = shortAmt(maxAmt6 / 2);
            return (
              <div className="flex items-end gap-1 h-[200px]">
                {/* Y-axis labels */}
                <div className="flex flex-col justify-between h-[156px] pr-1 pb-[30px] flex-shrink-0">
                  <span className="text-[9px] text-gray-300 tabular-nums text-right min-w-[20px]">{yTop}</span>
                  <span className="text-[9px] text-gray-300 tabular-nums text-right min-w-[20px]">{yMid}</span>
                  <span className="text-[9px] text-gray-300 tabular-nums text-right min-w-[20px]">0</span>
                </div>
                {months6.map((m) => {
                  const isCurrent = isCurrentMonth(m.key);
                  const bars = [
                    { amt: m.newAmt, color: '#4F8EF7', grad: 'linear-gradient(180deg, #6BA3F9, #4F8EF7, #3B7BE8)' },
                    { amt: m.confAmt, color: '#8B5CF6', grad: 'linear-gradient(180deg, #A78BFA, #8B5CF6, #7C3AED)' },
                    { amt: m.compAmt, color: '#22C55E', grad: 'linear-gradient(180deg, #4ADE80, #22C55E, #16A34A)' },
                  ];
                  return (
                    <div key={m.key} className={`flex-1 min-w-0 flex flex-col items-center h-full rounded-lg px-0.5 py-1 ${isCurrent ? 'bg-gray-50/80' : ''}`}>
                      {/* Bar group area */}
                      <div className="flex-1 w-full flex items-end justify-center gap-[2px] relative">
                        {/* Gridlines */}
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                          <div className="border-t border-dashed border-gray-100" />
                          <div className="border-t border-dashed border-gray-100" />
                          <div />
                        </div>
                        {bars.map((b, bi) => (
                          <div key={bi} className="relative flex-1 min-w-0 h-full">
                            <div className="absolute bottom-0 left-0 right-0 rounded-t-md transition-all duration-700"
                              style={{
                                height: b.amt > 0 ? `${Math.max(6, (b.amt / maxAmt6) * 100)}%` : '3px',
                                background: b.amt > 0 ? b.grad : '#E5E7EB',
                                opacity: isCurrent ? 1 : 0.55,
                                boxShadow: b.amt > 0 ? `0 2px 8px ${b.color}25` : 'none',
                              }}>
                              {b.amt > 0 && (
                                <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[8px] font-bold tabular-nums whitespace-nowrap" style={{ color: b.color }}>{shortAmt(b.amt)}</div>
                              )}
                              {b.amt > 0 && <div className="absolute inset-0 rounded-t-md bg-gradient-to-t from-transparent via-white/10 to-white/25" />}
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* Month label */}
                      <div className={`mt-1.5 text-[9px] font-semibold tabular-nums px-1.5 py-0.5 rounded-md ${isCurrent ? 'bg-[#1A1A2E] text-white shadow-sm' : 'text-gray-400'}`}>{m.label}</div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>

      {/* ── Member Table (full amounts) ─────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-gradient-to-r from-[#1A1A2E] to-[#2D2B55] text-white/70">
              <th className="text-left px-4 py-3 font-semibold text-[11px] tracking-wide">{lang === 'ZH' ? '成员' : 'Member'}</th>
              <th className="text-center px-3 py-3 font-semibold text-[11px] tracking-wide">
                <div className="inline-flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#4F8EF7]" />{tt.newProjects || 'New'}</div>
              </th>
              <th className="text-right px-3 py-3 font-semibold text-[11px] tracking-wide text-blue-300">{lang === 'ZH' ? '新项目额' : 'New Amt'}</th>
              <th className="text-center px-3 py-3 font-semibold text-[11px] tracking-wide">
                <div className="inline-flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#8B5CF6]" />{tt.confirmed || 'Confirmed'}</div>
              </th>
              <th className="text-right px-3 py-3 font-semibold text-[11px] tracking-wide text-purple-300">{lang === 'ZH' ? '确认额' : 'Conf. Amt'}</th>
              <th className="text-center px-3 py-3 font-semibold text-[11px] tracking-wide">
                <div className="inline-flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#22C55E]" />{tt.completed || 'Completed'}</div>
              </th>
              <th className="text-right px-3 py-3 font-semibold text-[11px] tracking-wide text-green-300">{lang === 'ZH' ? '完工额' : 'Comp. Amt'}</th>
            </tr>
          </thead>
          <tbody>
            {memberStats.map((ms, i) => (
              <tr key={ms.userId} className={`border-t border-gray-100 hover:bg-blue-50/30 transition-colors ${i % 2 === 1 ? 'bg-gray-50/40' : 'bg-white'}`}>
                <td className="px-4 py-3 font-medium text-gray-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 shadow-sm"
                      style={{ background: ms.isOwner ? 'linear-gradient(135deg, #F0B90B, #D4A00A)' : 'linear-gradient(135deg, #4F8EF7, #8B5CF6)' }}>
                      {ms.name[0].toUpperCase()}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-800">{ms.name}</span>
                      {ms.isYou && <span className="ml-1.5 text-[9px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-500">{tt.you || 'You'}</span>}
                    </div>
                  </div>
                </td>
                <td className="text-center px-3 py-3 tabular-nums">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-50 font-bold text-[#4F8EF7]">{ms.newCount}</span>
                </td>
                <td className="text-right px-3 py-3 text-gray-700 tabular-nums font-medium">{fmtAmt(ms.newAmt)}</td>
                <td className="text-center px-3 py-3 tabular-nums">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-purple-50 font-bold text-[#8B5CF6]">{ms.confCount}</span>
                </td>
                <td className="text-right px-3 py-3 text-gray-700 tabular-nums font-medium">{fmtAmt(ms.confAmt)}</td>
                <td className="text-center px-3 py-3 tabular-nums">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-green-50 font-bold text-[#22C55E]">{ms.compCount}</span>
                </td>
                <td className="text-right px-3 py-3 text-gray-700 tabular-nums font-medium">{fmtAmt(ms.compAmt)}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
              <td className="px-4 py-3 font-black text-gray-900 uppercase tracking-wide text-[11px]">TOTAL</td>
              <td className="text-center px-3 py-3 tabular-nums">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-100 font-black text-[#4F8EF7]">{totals.newCount}</span>
              </td>
              <td className="text-right px-3 py-3 text-gray-900 tabular-nums font-bold">{fmtAmt(totals.newAmt)}</td>
              <td className="text-center px-3 py-3 tabular-nums">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-purple-100 font-black text-[#8B5CF6]">{totals.confCount}</span>
              </td>
              <td className="text-right px-3 py-3 text-gray-900 tabular-nums font-bold">{fmtAmt(totals.confAmt)}</td>
              <td className="text-center px-3 py-3 tabular-nums">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-green-100 font-black text-[#22C55E]">{totals.compCount}</span>
              </td>
              <td className="text-right px-3 py-3 text-gray-900 tabular-nums font-bold">{fmtAmt(totals.compAmt)}</td>
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
    // Elite owner default: show ALL team projects in Kanban (matches team stats)
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
  // Match the same logic as TeamPerformancePanel: pending by created_at, others by updated_at
  const filtered = showTeamPerformance
    ? (() => {
        const mStart = `${perfMonth}-01`;
        const [yr, mo] = perfMonth.split('-').map(Number);
        const mEnd = mo === 12 ? `${yr + 1}-01-01` : `${yr}-${String(mo + 1).padStart(2, '0')}-01`;
        const inMo = (d: string) => d >= mStart && d < mEnd;
        return searchFiltered.filter(p =>
          p.status === 'pending' ? inMo(p.created_at) : inMo(p.updated_at)
        );
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
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
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
              sub={`${t.dash.pipelineValue} ${prices.currency} ${totalPendingVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
            <KpiCard icon={TrendingUp}    color="#F97316" iconBg="rgba(249,115,22,0.1)"
              label={t.dash.activeProjects}    value={active.length}
              sub={`${t.dash.contractValue} ${prices.currency} ${totalActiveVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
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
