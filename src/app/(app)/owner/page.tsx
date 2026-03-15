'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useI18n } from '@/lib/i18n/context';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, formatDate } from '@/lib/utils';
import { BarChart2, FileText, CreditCard, Camera, Bell, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function OwnerDashboard() {
  const { t } = useI18n();
  const router = useRouter();
  const supabase = createClient();
  const [project, setProject] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      // Owner sees project linked to them
      const { data } = await supabase.from('projects').select('*').eq('owner_email', session.user.email).single();
      setProject(data);
      setLoading(false);
    })();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
      {/* Mobile frame */}
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden min-h-[780px] flex flex-col">
        {/* Header */}
        <div className="bg-[#0F1923] text-white px-5 pt-12 pb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white/50 text-xs">Your Renovation</p>
              <h1 className="font-bold text-lg">{(project?.name as string) || 'My Home'}</h1>
            </div>
            <button onClick={handleSignOut} className="p-2 rounded-xl hover:bg-white/10">
              <LogOut className="w-4 h-4 text-white/50" />
            </button>
          </div>

          {/* Progress circle */}
          <div className="flex items-center justify-center py-4">
            <div className="relative w-28 h-28">
              <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke="#F0B90B" strokeWidth="8"
                  strokeDasharray={`${((project?.progress as number || 0) / 100) * 264} 264`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-white">{project?.progress as number || 0}%</span>
                <span className="text-xs text-white/50">Complete</span>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mt-2">
            {[
              { label: 'Start', value: project?.start_date ? formatDate(project.start_date as string) : 'TBD' },
              { label: 'Status', value: (project?.status as string) === 'active' ? '在施工' : '待开工' },
              { label: 'End', value: project?.end_date ? formatDate(project.end_date as string) : 'TBD' },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <div className="text-xs text-white/40">{label}</div>
                <div className="text-sm font-medium text-white mt-0.5">{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="progress" className="flex flex-col h-full">
            <TabsList className="grid grid-cols-5 bg-white border-b border-gray-100 rounded-none h-14 gap-0 p-0">
              {[
                { value: 'progress', icon: BarChart2, label: '进度' },
                { value: 'docs', icon: FileText, label: '文件' },
                { value: 'payments', icon: CreditCard, label: '付款' },
                { value: 'photos', icon: Camera, label: '照片' },
                { value: 'notifications', icon: Bell, label: '通知' },
              ].map(({ value, icon: Icon, label }) => (
                <TabsTrigger key={value} value={value}
                  className="flex flex-col items-center gap-0.5 rounded-none text-xs data-[state=active]:text-[#F0B90B] data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#F0B90B] h-full">
                  <Icon className="w-4 h-4" />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="progress" className="flex-1 p-4 overflow-y-auto mt-0">
              {loading ? (
                <div className="text-center text-gray-400 py-8">Loading...</div>
              ) : !project ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">No active project found.</p>
                  <p className="text-xs text-gray-400 mt-1">Ask your designer to connect you to your project.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-medium text-gray-900 text-sm mb-3">Milestone Timeline</h3>
                    <div className="space-y-3">
                      {['Site Measurement', 'Demolition', 'Tiling Works', 'Carpentry', 'Final Touch'].map((m, i) => (
                        <div key={m} className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                            i < 2 ? 'bg-green-500 text-white' : i === 2 ? 'bg-[#F0B90B] text-black' : 'bg-gray-200 text-gray-400'
                          }`}>
                            {i < 2 ? '✓' : i + 1}
                          </div>
                          <span className={`text-sm ${i < 2 ? 'text-gray-400 line-through' : i === 2 ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                            {m}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="docs" className="flex-1 p-4 overflow-y-auto mt-0">
              <div className="text-center py-8 text-gray-400 text-sm">
                <FileText className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                No documents shared yet.
              </div>
            </TabsContent>

            <TabsContent value="payments" className="flex-1 p-4 overflow-y-auto mt-0">
              <div className="space-y-3">
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                  <div className="text-xs text-amber-600 mb-1">Next Payment Due</div>
                  <div className="font-bold text-amber-900 text-lg">
                    {project ? formatCurrency((project.contract_amount as number || 0) * 0.3) : 'RM 0'}
                  </div>
                  <div className="text-xs text-amber-600 mt-1">2nd Installment (30%)</div>
                </div>
                <p className="text-xs text-gray-400 text-center">Contact your designer for payment details</p>
              </div>
            </TabsContent>

            <TabsContent value="photos" className="flex-1 p-4 overflow-y-auto mt-0">
              <div className="text-center py-8 text-gray-400 text-sm">
                <Camera className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                No site photos yet.
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="flex-1 p-4 overflow-y-auto mt-0">
              <div className="text-center py-8 text-gray-400 text-sm">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                No notifications yet.
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
