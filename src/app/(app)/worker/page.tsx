'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ClipboardList, CalendarDays, Images, User, Sunrise, Sun, Moon, CheckCircle2, Receipt, HardHat, Clock, MapPin, ArrowRight, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import { useI18n } from '@/lib/i18n/context';

import WorkerProjectCard, { ProjectSummary } from '@/components/worker/WorkerProjectCard';
import WorkerScheduleTab from '@/components/worker/WorkerScheduleTab';
import WorkerPhotosTab from '@/components/worker/WorkerPhotosTab';
import WorkerProfileTab from '@/components/worker/WorkerProfileTab';
import WorkerReceiptsTab from '@/components/worker/WorkerReceiptsTab';
import { WorkerTask } from '@/components/worker/WorkerTaskCard';

type WorkerTab = 'tasks' | 'schedule' | 'photos' | 'receipts' | 'profile';

interface WorkerProfile {
  id: string;
  user_id: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  company_address?: string;
  trades?: string[];
  ssm_no?: string;
  employee_count?: number;
  min_project_value?: number;
  max_project_value?: number;
}

const TRADE_COLORS: Record<string, string> = {
  Plumbing: '#3B82F6', Electrical: '#F59E0B', Tiling: '#10B981',
  'False Ceiling': '#8B5CF6', Carpentry: '#60A5FA', Painting: '#A855F7',
  Demolition: '#EF4444', Waterproofing: '#0EA5E9', 'Air Conditioning': '#6EE7B7',
  Cleaning: '#94A3B8', Flooring: '#14B8A6', 'Stone/Marble': '#D97706',
  'Glass Work': '#06B6D4', 'Aluminium Work': '#64748B', 'Metal Work': '#78716C',
  'Alarm & CCTV': '#EC4899', Landscaping: '#22C55E', Other: '#9CA3AF',
};

const TAB_ICONS: Record<WorkerTab, React.ComponentType<{ className?: string }>> = {
  tasks: ClipboardList,
  schedule: CalendarDays,
  photos: Images,
  receipts: Receipt,
  profile: User,
};

const TAB_IDS: WorkerTab[] = ['tasks', 'schedule', 'photos', 'receipts', 'profile'];

function getInitials(name?: string): string {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function WorkerDashboard() {
  const supabase = createClient();
  const { t } = useI18n();

  const [activeTab, setActiveTab] = useState<WorkerTab>('tasks');
  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [tasks, setTasks] = useState<WorkerTask[]>([]);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Cross-tab context
  const [preselectedPhotoTaskId, setPreselectedPhotoTaskId] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const uid = session.user.id;
      setSessionUserId(uid);

      // Fetch profile
      const { data: p } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', uid)
        .single();
      setProfile(p);

      // Fetch assigned tasks (active + future)
      const { data: t } = await supabase
        .from('gantt_tasks')
        .select('*, projects(id, name, address, site_lat, site_lng)')
        .filter('assigned_workers', 'cs', JSON.stringify([uid]))
        .gte('end_date', today)
        .order('start_date');

      const taskList: WorkerTask[] = (t || []).map((task: Record<string, unknown>) => {
        const proj = task.projects as Record<string, unknown> | null;
        return {
          id: task.id as string,
          name: task.name as string,
          name_zh: task.name_zh as string | undefined,
          project_id: task.project_id as string,
          project_name: (proj?.name as string) || 'Unknown Project',
          trade: (task.trade as string) || 'General',
          start_date: task.start_date as string,
          end_date: task.end_date as string,
          progress: (task.progress as number) || 0,
          color: (task.color as string) || '#64748B',
          subtasks: (task.subtasks as WorkerTask['subtasks']) || [],
          quotation_items: (task.quotation_items as WorkerTask['quotation_items']) || [],
        };
      });
      setTasks(taskList);

      // Derive unique projects from tasks
      const projectMap = new Map<string, ProjectSummary>();
      taskList.forEach(task => {
        if (!projectMap.has(task.project_id)) {
          const raw = t?.find((tt: Record<string, unknown>) => tt.project_id === task.project_id);
          const proj = raw?.projects as Record<string, unknown> | null;
          projectMap.set(task.project_id, {
            id: task.project_id,
            name: task.project_name,
            address: (proj?.address as string) || undefined,
            site_lat: (proj?.site_lat as number) || null,
            site_lng: (proj?.site_lng as number) || null,
          });
        }
      });
      setProjects(Array.from(projectMap.values()));

      setLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handlers that persist to Supabase
  const handleProgressChange = async (taskId: string, progress: number) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, progress } : t));
    await supabase.from('gantt_tasks').update({ progress, updated_at: new Date().toISOString() }).eq('id', taskId);
  };

  const handleSubtaskToggle = async (taskId: string, subtaskId: string) => {
    let updatedSubtasks: WorkerTask['subtasks'] = [];
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      updatedSubtasks = (t.subtasks || []).map(s =>
        s.id === subtaskId ? { ...s, completed: !s.completed } : s
      );
      return { ...t, subtasks: updatedSubtasks };
    }));
    await supabase.from('gantt_tasks').update({ subtasks: updatedSubtasks }).eq('id', taskId);
  };

  const handleComplete = async (taskId: string) => {
    let updatedSubtasks: WorkerTask['subtasks'] = [];
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      updatedSubtasks = (t.subtasks || []).map(s => ({ ...s, completed: true }));
      return { ...t, progress: 100, subtasks: updatedSubtasks };
    }));
    await supabase.from('gantt_tasks').update({
      progress: 100,
      subtasks: updatedSubtasks,
      updated_at: new Date().toISOString(),
    }).eq('id', taskId);
  };

  const handlePhotoClick = (task: WorkerTask) => {
    setPreselectedPhotoTaskId(task.id);
    setActiveTab('photos');
  };

  // Group today's tasks by project
  const todayTasks = tasks.filter(t => t.start_date <= today && t.end_date >= today);
  const upcomingTasks = tasks.filter(t => t.start_date > today);
  const completedToday = todayTasks.filter(t => t.progress === 100).length;

  const tasksByProject = projects.map(proj => ({
    project: proj,
    tasks: todayTasks.filter(t => t.project_id === proj.id),
  })).filter(g => g.tasks.length > 0);

  // Projects with no active tasks today (for invoice upload access)
  const projectsWithNoTodayTasks = projects.filter(
    proj => !tasksByProject.find(g => g.project.id === proj.id)
  );

  // Greeting
  const hour = new Date().getHours();
  const greetText = hour < 12 ? t.worker.goodMorning : hour < 17 ? t.worker.goodAfternoon : t.worker.goodEvening;
  const GIcon = hour < 12 ? Sunrise : hour < 17 ? Sun : Moon;

  if (loading) {
    return (
      <div className="min-h-dvh bg-[#F5F6FA] flex flex-col max-w-sm mx-auto">
        <div className="bg-gradient-to-br from-[#0F1923] to-[#1A2A3A] text-white px-5 pt-14 pb-8 rounded-b-[28px]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 animate-pulse" />
            <div className="flex-1">
              <div className="h-3 w-20 bg-white/10 rounded-full mb-2 animate-pulse" />
              <div className="h-5 w-36 bg-white/15 rounded-lg animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white/6 rounded-2xl p-3 animate-pulse">
                <div className="h-6 w-8 bg-white/10 rounded mb-1" />
                <div className="h-2.5 w-14 bg-white/8 rounded-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gray-100 rounded-xl" />
                <div className="flex-1">
                  <div className="h-4 w-28 bg-gray-100 rounded mb-1.5" />
                  <div className="h-2.5 w-40 bg-gray-50 rounded-full" />
                </div>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full mb-3" />
              <div className="flex gap-2">
                <div className="h-9 flex-1 bg-gray-50 rounded-xl" />
                <div className="h-9 flex-1 bg-gray-50 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Check if worker has NO projects at all (truly empty state)
  const hasNoProjects = projects.length === 0 && tasks.length === 0;

  return (
    <div className="min-h-dvh bg-[#F5F6FA] flex flex-col max-w-sm mx-auto relative">
      <div className="flex-1 flex flex-col pb-[72px] overflow-hidden">

        {/* ── TASKS TAB ── */}
        {activeTab === 'tasks' && (
          <div className="flex flex-col h-full">
            {/* Enhanced Header */}
            <div className="bg-gradient-to-br from-[#0F1923] to-[#1A2A3A] text-white px-5 pt-14 pb-6 rounded-b-[28px] relative overflow-hidden">
              {/* Subtle pattern overlay */}
              <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />

              <div className="relative">
                {/* Profile row */}
                <div className="flex items-center gap-3.5">
                  <div className="w-13 h-13 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg" style={{ width: 52, height: 52, background: 'linear-gradient(135deg, #4F8EF7 0%, #3B6FD9 100%)' }}>
                    <span className="text-white font-bold text-lg">{getInitials(profile?.name)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <GIcon className="w-3 h-3 text-white/40" />
                      <p className="text-white/40 text-[11px] font-medium">{greetText}</p>
                    </div>
                    <h1 className="font-bold text-lg leading-tight truncate">{profile?.name || 'Worker'}</h1>
                    {profile?.company && (
                      <p className="text-white/30 text-[11px] truncate mt-0.5">{profile.company}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-white/25 text-[10px] font-medium">{format(new Date(), 'EEE')}</p>
                    <p className="text-white/60 text-lg font-bold leading-none">{format(new Date(), 'd')}</p>
                    <p className="text-white/25 text-[10px] font-medium">{format(new Date(), 'MMM')}</p>
                  </div>
                </div>

                {/* Trade badges */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {((profile?.trades as string[]) || []).slice(0, 4).map(trade => (
                    <span
                      key={trade}
                      className="text-[10px] px-2.5 py-1 rounded-full font-semibold backdrop-blur-sm"
                      style={{
                        background: `${TRADE_COLORS[trade] || '#4F8EF7'}20`,
                        color: TRADE_COLORS[trade] || '#4F8EF7',
                        border: `1px solid ${TRADE_COLORS[trade] || '#4F8EF7'}25`,
                      }}
                    >
                      {trade}
                    </span>
                  ))}
                  {((profile?.trades as string[]) || []).length > 4 && (
                    <span className="text-[10px] px-2 py-1 rounded-full bg-white/8 text-white/40 font-medium">
                      +{((profile?.trades as string[]) || []).length - 4}
                    </span>
                  )}
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2.5 mt-4">
                  <div className="bg-white/[0.06] backdrop-blur-sm rounded-xl px-3 py-2.5 border border-white/[0.06]">
                    <p className="text-xl font-bold text-[#4F8EF7]">{todayTasks.length}</p>
                    <p className="text-[9px] text-white/35 font-medium mt-0.5 uppercase tracking-wider">{t.worker.tasks}</p>
                  </div>
                  <div className="bg-white/[0.06] backdrop-blur-sm rounded-xl px-3 py-2.5 border border-white/[0.06]">
                    <p className="text-xl font-bold text-emerald-400">{completedToday}</p>
                    <p className="text-[9px] text-white/35 font-medium mt-0.5 uppercase tracking-wider">{t.worker.complete}</p>
                  </div>
                  <div className="bg-white/[0.06] backdrop-blur-sm rounded-xl px-3 py-2.5 border border-white/[0.06]">
                    <p className="text-xl font-bold text-amber-400">{upcomingTasks.length}</p>
                    <p className="text-[9px] text-white/35 font-medium mt-0.5 uppercase tracking-wider">{t.worker.upcoming}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-4 pt-5 pb-4">

              {/* ── EMPTY STATE: No projects at all ── */}
              {hasNoProjects ? (
                <div className="flex flex-col items-center justify-center py-8">
                  {/* Illustration */}
                  <div className="relative mb-6">
                    <div className="w-28 h-28 rounded-[32px] bg-gradient-to-br from-[#4F8EF7]/10 to-[#4F8EF7]/5 flex items-center justify-center">
                      <HardHat className="w-14 h-14 text-[#4F8EF7]/40" strokeWidth={1.5} />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center shadow-sm">
                      <Clock className="w-5 h-5 text-amber-500" />
                    </div>
                  </div>

                  <h2 className="text-lg font-bold text-gray-800 mb-1.5 text-center">
                    {t.worker.noTasksToday}
                  </h2>
                  <p className="text-sm text-gray-400 text-center max-w-[260px] leading-relaxed mb-6">
                    {t.worker.checkSchedule}
                  </p>

                  {/* Guide cards */}
                  <div className="w-full space-y-3">
                    {[
                      { icon: <Briefcase className="w-5 h-5" />, color: '#4F8EF7', title: 'Waiting for assignment', desc: 'Your designer will assign tasks to you from their project Gantt chart' },
                      { icon: <User className="w-5 h-5" />, color: '#10B981', title: 'Complete your profile', desc: 'Add company info, trades, and service regions to get discovered', action: () => setActiveTab('profile') },
                      { icon: <Receipt className="w-5 h-5" />, color: '#F59E0B', title: 'Upload past receipts', desc: 'Already have material receipts? Upload them to start building your cost records', action: () => setActiveTab('receipts') },
                    ].map((card, i) => (
                      <button
                        key={i}
                        onClick={card.action}
                        disabled={!card.action}
                        className="w-full flex items-start gap-3.5 bg-white rounded-2xl p-4 shadow-sm text-left transition-all active:scale-[0.98] disabled:active:scale-100"
                      >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${card.color}12`, color: card.color }}>
                          {card.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800">{card.title}</p>
                          <p className="text-[11px] text-gray-400 leading-relaxed mt-0.5">{card.desc}</p>
                        </div>
                        {card.action && (
                          <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-2.5" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

              ) : (
                <>
                  {/* ── Today's tasks (has tasks but none today) ── */}
                  {tasksByProject.length === 0 && !hasNoProjects ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-[20px] flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                      </div>
                      <p className="font-bold text-gray-800 text-base">{t.worker.noTasksToday}</p>
                      <p className="text-gray-400 text-xs mt-1.5 max-w-[220px] mx-auto leading-relaxed">
                        {t.worker.checkSchedule}
                      </p>
                      {upcomingTasks.length > 0 && (
                        <button
                          onClick={() => setActiveTab('schedule')}
                          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#4F8EF7]/10 text-[#4F8EF7] rounded-xl text-xs font-semibold transition-all active:scale-95"
                        >
                          <CalendarDays className="w-3.5 h-3.5" />
                          {t.worker.viewAll} ({upcomingTasks.length})
                        </button>
                      )}
                    </div>
                  ) : (
                    /* ── Active task cards ── */
                    <div className="space-y-0">
                      {tasksByProject.map(({ project, tasks: projTasks }) => (
                        <WorkerProjectCard
                          key={project.id}
                          project={project}
                          tasks={projTasks}
                          sessionUserId={sessionUserId || ''}
                          profileName={profile?.name || 'Worker'}
                          onProgressChange={handleProgressChange}
                          onSubtaskToggle={handleSubtaskToggle}
                          onComplete={handleComplete}
                          onPhotoClick={handlePhotoClick}
                        />
                      ))}
                    </div>
                  )}

                  {/* Projects with no today tasks — show invoice upload only */}
                  {projectsWithNoTodayTasks.map(proj => (
                    <WorkerProjectCard
                      key={proj.id}
                      project={proj}
                      tasks={[]}
                      sessionUserId={sessionUserId || ''}
                      profileName={profile?.name || 'Worker'}
                      onProgressChange={handleProgressChange}
                      onSubtaskToggle={handleSubtaskToggle}
                      onComplete={handleComplete}
                      onPhotoClick={handlePhotoClick}
                    />
                  ))}

                  {/* Upcoming tasks */}
                  {upcomingTasks.length > 0 && tasksByProject.length > 0 && (
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                          {t.worker.upcoming}
                        </h3>
                        <span className="text-[10px] font-semibold text-[#4F8EF7] bg-[#4F8EF7]/8 px-2 py-0.5 rounded-full">
                          {upcomingTasks.length}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {upcomingTasks.slice(0, 5).map(task => (
                          <div
                            key={task.id}
                            className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 shadow-sm"
                          >
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ background: `${task.color}12` }}
                            >
                              <div className="w-2.5 h-2.5 rounded-full" style={{ background: task.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-semibold text-gray-800 truncate">{task.name}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <MapPin className="w-2.5 h-2.5 text-gray-300" />
                                <p className="text-[10px] text-gray-400 truncate">{task.project_name}</p>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-[11px] font-semibold text-gray-600">
                                {format(new Date(task.start_date), 'd MMM')}
                              </p>
                              <span
                                className="text-[9px] px-2 py-0.5 rounded-full font-semibold mt-0.5 inline-block"
                                style={{ background: `${task.color}12`, color: task.color }}
                              >
                                {task.trade}
                              </span>
                            </div>
                          </div>
                        ))}
                        {upcomingTasks.length > 5 && (
                          <button
                            onClick={() => setActiveTab('schedule')}
                            className="w-full py-3 text-xs text-[#4F8EF7] font-semibold text-center rounded-2xl bg-[#4F8EF7]/5 transition-all active:scale-[0.98]"
                          >
                            {t.worker.viewAll} ({upcomingTasks.length}) <ArrowRight className="w-3 h-3 inline ml-1" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ── SCHEDULE TAB ── */}
        {activeTab === 'schedule' && (
          <div className="flex flex-col h-full">
            <div className="bg-gradient-to-br from-[#0F1923] to-[#1A2A3A] text-white px-5 pt-14 pb-5 rounded-b-[28px]">
              <h1 className="font-bold text-xl">{t.worker.schedule}</h1>
              <p className="text-white/30 text-xs mt-1">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              <WorkerScheduleTab tasks={tasks} />
            </div>
          </div>
        )}

        {/* ── PHOTOS TAB ── */}
        {activeTab === 'photos' && sessionUserId && (
          <div className="flex flex-col h-full">
            <div className="bg-gradient-to-br from-[#0F1923] to-[#1A2A3A] text-white px-5 pt-14 pb-5 rounded-b-[28px]">
              <h1 className="font-bold text-xl">{t.worker.photos}</h1>
              <p className="text-white/30 text-xs mt-1">{projects.length} {t.worker.allProjects.toLowerCase()}</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              <WorkerPhotosTab
                sessionUserId={sessionUserId}
                projects={projects}
                preselectedTaskId={preselectedPhotoTaskId}
              />
            </div>
          </div>
        )}

        {/* ── RECEIPTS TAB ── */}
        {activeTab === 'receipts' && sessionUserId && (
          <div className="flex flex-col h-full">
            <div className="bg-gradient-to-br from-[#0F1923] to-[#1A2A3A] text-white px-5 pt-14 pb-5 rounded-b-[28px]">
              <h1 className="font-bold text-xl">{t.worker.receipts}</h1>
              <p className="text-white/30 text-xs mt-1">{t.worker.receiptsThisMonth}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <WorkerReceiptsTab userId={sessionUserId} />
            </div>
          </div>
        )}

        {/* ── PROFILE TAB ── */}
        {activeTab === 'profile' && (
          <WorkerProfileTab
            profile={profile}
            sessionUserId={sessionUserId || ''}
            tasks={tasks}
          />
        )}
      </div>

      {/* ── BOTTOM NAVIGATION ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-gray-100/80 max-w-sm mx-auto"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex">
          {TAB_IDS.map(tabId => {
            const isActive = activeTab === tabId;
            const TabIcon = TAB_ICONS[tabId];
            const label = t.worker[tabId];
            return (
              <button
                key={tabId}
                onClick={() => {
                  setActiveTab(tabId);
                  if (tabId !== 'photos') setPreselectedPhotoTaskId(null);
                }}
                style={{ touchAction: 'manipulation', minHeight: 52 }}
                className={`relative flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-all active:scale-95 ${isActive ? '' : 'opacity-50'}`}
              >
                <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-[#4F8EF7]/10' : ''}`}>
                  <TabIcon
                    className={`w-5 h-5 transition-colors ${isActive ? 'text-[#4F8EF7]' : 'text-gray-500'}`}
                  />
                </div>
                <span
                  className={`text-[10px] font-semibold transition-colors ${isActive ? 'text-[#4F8EF7]' : 'text-gray-500'}`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
