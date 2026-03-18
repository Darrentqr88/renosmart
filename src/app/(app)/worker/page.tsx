'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ClipboardList, CalendarDays, Images, User, Loader2, Sunrise, Sun, Moon, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

import WorkerProjectCard, { ProjectSummary } from '@/components/worker/WorkerProjectCard';
import WorkerScheduleTab from '@/components/worker/WorkerScheduleTab';
import WorkerPhotosTab from '@/components/worker/WorkerPhotosTab';
import WorkerProfileTab from '@/components/worker/WorkerProfileTab';
import { WorkerTask } from '@/components/worker/WorkerTaskCard';

type WorkerTab = 'tasks' | 'schedule' | 'photos' | 'profile';

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

const GREETING = () => {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good morning', Icon: Sunrise };
  if (h < 17) return { text: 'Good afternoon', Icon: Sun };
  return { text: 'Good evening', Icon: Moon };
};

const TABS: { id: WorkerTab; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'tasks',    label: 'Tasks',    Icon: ClipboardList },
  { id: 'schedule', label: 'Schedule', Icon: CalendarDays },
  { id: 'photos',   label: 'Photos',   Icon: Images },
  { id: 'profile',  label: 'Profile',  Icon: User },
];

export default function WorkerDashboard() {
  const supabase = createClient();

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
        .select('*, projects(id, name, address)')
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

  const tasksByProject = projects.map(proj => ({
    project: proj,
    tasks: todayTasks.filter(t => t.project_id === proj.id),
  })).filter(g => g.tasks.length > 0);

  // Projects with no active tasks today (for invoice upload access)
  const projectsWithNoTodayTasks = projects.filter(
    proj => !tasksByProject.find(g => g.project.id === proj.id)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1923] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-[#F0B90B] animate-spin" />
          <p className="text-white/50 text-sm">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#F7F8FA] flex flex-col max-w-sm mx-auto relative">
      {/* TAB CONTENT */}
      <div className="flex-1 flex flex-col pb-20 overflow-hidden">

        {/* ── TASKS TAB ── */}
        {activeTab === 'tasks' && (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="bg-[#0F1923] text-white px-5 pt-12 pb-6">
              {(() => { const { text, Icon } = GREETING(); return (
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className="w-3.5 h-3.5 text-white/50" />
                  <p className="text-white/50 text-xs">{text}</p>
                </div>
              ); })()}
              <h1 className="font-bold text-xl">{profile?.name || 'Worker'}</h1>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {((profile?.trades as string[]) || []).slice(0, 3).map(t => (
                  <span key={t} className="text-[10px] px-2 py-0.5 bg-[#F0B90B]/15 text-[#F0B90B] rounded-full font-semibold">
                    {t}
                  </span>
                ))}
              </div>
              <p className="text-white/30 text-xs mt-2">
                {format(new Date(), 'EEEE, d MMMM')} · {todayTasks.length} task{todayTasks.length !== 1 ? 's' : ''} today
              </p>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Today's tasks by project */}
              {tasksByProject.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-7 h-7 text-green-500" />
                  </div>
                  <p className="font-semibold text-gray-700">No tasks today!</p>
                  <p className="text-gray-400 text-xs mt-1">Check Schedule for upcoming work</p>
                </div>
              ) : (
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
              {upcomingTasks.length > 0 && (
                <div className="mt-5">
                  <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-3">
                    Upcoming ({upcomingTasks.length})
                  </h3>
                  <div className="space-y-2">
                    {upcomingTasks.slice(0, 5).map(task => (
                      <div
                        key={task.id}
                        className="flex items-center gap-3 bg-white rounded-xl px-3 py-3 shadow-sm"
                      >
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: task.color }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{task.name}</p>
                          <p className="text-[10px] text-gray-400">{task.project_name}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-[10px] font-semibold text-gray-500">{task.start_date}</p>
                          <span
                            className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                            style={{ background: `${task.color}15`, color: task.color }}
                          >
                            {task.trade}
                          </span>
                        </div>
                      </div>
                    ))}
                    {upcomingTasks.length > 5 && (
                      <button
                        onClick={() => setActiveTab('schedule')}
                        className="w-full py-2.5 text-xs text-[#F0B90B] font-semibold text-center hover:underline"
                      >
                        View all {upcomingTasks.length} upcoming tasks →
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SCHEDULE TAB ── */}
        {activeTab === 'schedule' && (
          <WorkerScheduleTab tasks={tasks} />
        )}

        {/* ── PHOTOS TAB ── */}
        {activeTab === 'photos' && sessionUserId && (
          <WorkerPhotosTab
            sessionUserId={sessionUserId}
            projects={projects}
            preselectedTaskId={preselectedPhotoTaskId}
          />
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
        className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 max-w-sm mx-auto"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id !== 'photos') setPreselectedPhotoTaskId(null);
                }}
                style={{ touchAction: 'manipulation' }}
                className="relative flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors active:opacity-70"
              >
                <tab.Icon
                  className={`w-5 h-5 transition-colors ${isActive ? 'text-[#F0B90B]' : 'text-gray-400'}`}
                />
                <span
                  className={`text-[10px] font-semibold transition-colors ${isActive ? 'text-[#F0B90B]' : 'text-gray-400'}`}
                >
                  {tab.label}
                </span>
                {isActive && (
                  <div className="absolute bottom-0 w-8 h-0.5 bg-[#F0B90B] rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
