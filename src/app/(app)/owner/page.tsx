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
    <div className="min-h-screen bg-[#E8ECF0] flex items-center justify-center p-4">
      <div className="mobile-frame">
        <div className="mobile-notch"><div className="mobile-notch-pill" /></div>
        {/* Header */}
        <div className="mobile-header">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="mobile-greeting">Your Renovation</div>
              <div className="mobile-name">{(project?.name as string) || 'My Home'}</div>
            </div>
            <button onClick={handleSignOut} className="p-2 rounded-xl hover:bg-white/10">
              <LogOut className="w-4 h-4 text-white/50" />
            </button>
          </div>

          <div className="mobile-project-card">
            <div className="big-progress">
              <svg width="110" height="110" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="55" cy="55" r="46" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                <circle cx="55" cy="55" r="46" fill="none" stroke="var(--accent, #4F8EF7)" strokeWidth="8"
                  strokeDasharray={`${((project?.progress as number || 0) / 100) * 289} 289`}
                  strokeLinecap="round" />
              </svg>
              <div className="big-pct">
                <span style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>{(project?.progress as number) || 0}%</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Complete</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 12 }}>
              {[
                { label: 'Start', value: project?.start_date ? formatDate(project.start_date as string) : 'TBD' },
                { label: 'Status', value: project?.status === 'active' ? '在施工' : project?.status === 'completed' ? '已完工' : '待开工' },
                { label: 'End', value: project?.end_date ? formatDate(project.end_date as string) : 'TBD' },
              ].map(({ label, value }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{label}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginTop: 2 }}>{value}</div>
                </div>
              ))}
            </div>
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
                  className="flex flex-col items-center gap-0.5 rounded-none text-xs data-[state=active]:text-[#4F8EF7] data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#4F8EF7] h-full">
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
                            i < 2 ? 'bg-green-500 text-white' : i === 2 ? 'bg-[#4F8EF7] text-white' : 'bg-gray-200 text-gray-400'
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
