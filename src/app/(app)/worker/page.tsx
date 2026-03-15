'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { CheckCircle2, Clock, Camera, LogOut, Wrench, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Task {
  id: string;
  name: string;
  project_name: string;
  trade: string;
  start_date: string;
  end_date: string;
  progress: number;
  color: string;
}

export default function WorkerDashboard() {
  const router = useRouter();
  const supabase = createClient();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkedIn, setCheckedIn] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: p } = await supabase.from('profiles').select('*').eq('user_id', session.user.id).single();
      setProfile(p);

      // Get assigned tasks
      const { data: t } = await supabase
        .from('gantt_tasks')
        .select('*, projects(name)')
        .contains('assigned_workers', [session.user.id])
        .gte('end_date', new Date().toISOString().split('T')[0])
        .order('start_date');

      setTasks((t || []).map((task: Record<string, unknown>) => ({
        ...task,
        project_name: (task.projects as Record<string, unknown>)?.name || 'Unknown Project',
      })) as Task[]);

      setLoading(false);
    })();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const today = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(t => t.start_date <= today && t.end_date >= today);
  const upcomingTasks = tasks.filter(t => t.start_date > today);

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden min-h-[780px] flex flex-col">
        {/* Header */}
        <div className="bg-[#0F1923] text-white px-5 pt-12 pb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white/50 text-xs">Good morning,</p>
              <h1 className="font-bold text-lg">{(profile?.name as string) || 'Worker'}</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex flex-wrap gap-1 justify-end">
                {((profile?.trades as string[]) || []).slice(0, 2).map(t => (
                  <Badge key={t} className="bg-[#F0B90B]/20 text-[#F0B90B] text-xs border-0">{t}</Badge>
                ))}
              </div>
              <button onClick={handleSignOut} className="p-2 rounded-xl hover:bg-white/10">
                <LogOut className="w-4 h-4 text-white/50" />
              </button>
            </div>
          </div>

          {/* Check in/out */}
          <button
            onClick={() => setCheckedIn(!checkedIn)}
            className={`w-full py-3 rounded-2xl font-semibold text-sm transition-all ${
              checkedIn
                ? 'bg-green-500 text-white'
                : 'bg-[#F0B90B] text-black'
            }`}
          >
            {checkedIn ? '✓ Checked In — Tap to Check Out' : '⏰ Tap to Check In'}
          </button>
        </div>

        {/* Today's tasks */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-[#F0B90B]" />
            <h2 className="font-semibold text-gray-900 text-sm">Today&apos;s Tasks ({todayTasks.length})</h2>
          </div>

          {loading ? (
            <div className="text-center text-gray-400 text-sm py-6">Loading tasks...</div>
          ) : todayTasks.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-10 h-10 text-green-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No tasks today!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayTasks.map(task => (
                <div key={task.id} className="bg-gray-50 rounded-xl p-4 border-l-4" style={{ borderColor: task.color }}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-xs text-gray-500">{task.project_name}</div>
                      <div className="font-medium text-gray-900 text-sm">{task.name}</div>
                    </div>
                    <Badge className="bg-amber-100 text-amber-700 text-xs">{task.trade}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(task.start_date)} — {formatDate(task.end_date)}</span>
                  </div>
                  {/* Progress slider */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">Progress</span>
                      <span className="font-medium text-gray-700">{task.progress}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={10}
                      value={task.progress}
                      onChange={(e) => setTasks(prev => prev.map(t => t.id === task.id ? { ...t, progress: parseInt(e.target.value) } : t))}
                      className="w-full accent-[#F0B90B]"
                    />
                  </div>
                  {/* Actions */}
                  <div className="flex gap-2 mt-3">
                    <button className="flex-1 flex items-center justify-center gap-1 text-xs py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                      <Camera className="w-3 h-3" /> Upload Photo
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-1 text-xs py-2 bg-[#F0B90B] text-black rounded-lg font-medium">
                      <CheckCircle2 className="w-3 h-3" /> Mark Done
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {upcomingTasks.length > 0 && (
            <div className="mt-5">
              <div className="flex items-center gap-2 mb-3">
                <Wrench className="w-4 h-4 text-gray-400" />
                <h2 className="font-semibold text-gray-700 text-sm">Upcoming ({upcomingTasks.length})</h2>
              </div>
              <div className="space-y-2">
                {upcomingTasks.slice(0, 3).map(task => (
                  <div key={task.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: task.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{task.name}</div>
                      <div className="text-xs text-gray-400">{formatDate(task.start_date)}</div>
                    </div>
                    <Badge className="bg-gray-100 text-gray-500 text-xs">{task.trade}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
