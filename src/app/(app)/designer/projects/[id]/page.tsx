'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatDate } from '@/lib/utils';
import { GanttChart } from '@/components/gantt/GanttChart';
import { generateGanttTasks } from '@/lib/utils/gantt-rules';
import { Project, PaymentPhase, GanttTask } from '@/types';
import {
  ArrowLeft, BarChart2, CreditCard, User, Camera, FileText, GitBranch,
  Plus, Check, Clock, AlertCircle, Trash2, Edit3,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

type PaymentStatus = 'pending' | 'collected' | 'overdue';

const STATUS_CYCLE: Record<PaymentStatus, PaymentStatus> = {
  pending: 'collected',
  collected: 'overdue',
  overdue: 'pending',
};

const STATUS_LABELS: Record<PaymentStatus, { label: string; color: string }> = {
  pending: { label: '未到期', color: 'bg-gray-100 text-gray-600' },
  collected: { label: '已收款', color: 'bg-green-100 text-green-700' },
  overdue: { label: '待收款', color: 'bg-amber-100 text-amber-700' },
};

export default function ProjectDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [project, setProject] = useState<Project | null>(null);
  const [ganttTasks, setGanttTasks] = useState<GanttTask[]>([]);
  const [payments, setPayments] = useState<PaymentPhase[]>([]);
  const [photos, setPhotos] = useState<{ id: string; url: string; caption?: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('gantt');

  useEffect(() => {
    loadProject();
  }, [id]);

  const loadProject = async () => {
    const { data: p } = await supabase.from('projects').select('*').eq('id', id).single();
    setProject(p);

    const { data: g } = await supabase.from('gantt_tasks').select('*').eq('project_id', id).order('start_date');
    if (g && g.length > 0) {
      setGanttTasks(g);
    } else {
      // Generate default tasks
      const tasks = generateGanttTasks(id as string, new Date(), 1000, true);
      setGanttTasks(tasks);
    }

    const { data: pay } = await supabase.from('payment_phases').select('*').eq('project_id', id).order('phase_number');
    if (pay) setPayments(pay);
    else {
      // Default payment phases
      const contractAmount = p?.contract_amount || 0;
      setPayments([
        { id: '1', project_id: id as string, phase_number: 1, label: 'Deposit (20%)', amount: contractAmount * 0.2, percentage: 20, status: 'pending' },
        { id: '2', project_id: id as string, phase_number: 2, label: 'Second Payment (30%)', amount: contractAmount * 0.3, percentage: 30, status: 'pending' },
        { id: '3', project_id: id as string, phase_number: 3, label: 'Third Payment (30%)', amount: contractAmount * 0.3, percentage: 30, status: 'pending' },
        { id: '4', project_id: id as string, phase_number: 4, label: 'Final Payment (20%)', amount: contractAmount * 0.2, percentage: 20, status: 'pending' },
      ] as PaymentPhase[]);
    }

    const { data: ph } = await supabase.from('site_photos').select('*').eq('project_id', id).order('created_at', { ascending: false });
    if (ph) setPhotos(ph);

    setLoading(false);
  };

  const handleTaskUpdate = (taskId: string, updates: Partial<GanttTask>) => {
    setGanttTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
  };

  const cyclePaymentStatus = async (payId: string) => {
    setPayments(prev => prev.map(p => {
      if (p.id !== payId) return p;
      const next = STATUS_CYCLE[p.status as PaymentStatus];
      return { ...p, status: next };
    }));
    const payment = payments.find(p => p.id === payId);
    if (payment) {
      const next = STATUS_CYCLE[payment.status as PaymentStatus];
      await supabase.from('payment_phases').update({ status: next, updated_at: new Date().toISOString() }).eq('id', payId);
    }
  };

  const totalCollected = payments.filter(p => p.status === 'collected').reduce((s, p) => s + p.amount, 0);
  const totalOutstanding = payments.filter(p => p.status !== 'collected').reduce((s, p) => s + p.amount, 0);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-400">Loading project...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <Toaster />
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{project?.name || 'Project'}</h1>
            <p className="text-sm text-gray-500">{project?.address}</p>
          </div>
          <Badge className={
            project?.status === 'active' ? 'bg-amber-100 text-amber-700' :
            project?.status === 'completed' ? 'bg-green-100 text-green-700' :
            'bg-blue-100 text-blue-700'
          }>
            {project?.status === 'pending' ? '待开工' : project?.status === 'active' ? '在施工' : '已完工'}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="bg-white border-b border-gray-100 px-6">
            <TabsList className="bg-transparent h-auto p-0 gap-1">
              {[
                { value: 'gantt', label: '进度表', icon: BarChart2 },
                { value: 'payments', label: '分阶段付款', icon: CreditCard },
                { value: 'client', label: '客户资料', icon: User },
                { value: 'photos', label: '工地照片', icon: Camera },
                { value: 'quotations', label: '报价单', icon: FileText },
                { value: 'vo', label: 'VO变更', icon: GitBranch },
              ].map(({ value, label, icon: Icon }) => (
                <TabsTrigger key={value} value={value}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#F0B90B] data-[state=active]:bg-transparent data-[state=active]:text-[#F0B90B] px-4 py-3 text-sm">
                  <Icon className="w-4 h-4 mr-2" />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Gantt Tab */}
          <TabsContent value="gantt" className="flex-1 p-6 overflow-y-auto mt-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Construction Schedule</h2>
              <Button variant="gold" size="sm" onClick={async () => {
                await supabase.from('gantt_tasks').upsert(ganttTasks);
                toast({ title: 'Gantt saved!', description: 'Schedule updated successfully.' });
              }}>
                Save Schedule
              </Button>
            </div>
            <GanttChart tasks={ganttTasks} onTaskUpdate={handleTaskUpdate} />
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="flex-1 p-6 overflow-y-auto mt-0">
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="text-sm text-gray-500 mb-1">Total Contract</div>
                <div className="text-xl font-bold text-gray-900">{formatCurrency(project?.contract_amount || 0)}</div>
              </div>
              <div className="bg-green-50 rounded-xl border border-green-100 p-4">
                <div className="text-sm text-green-600 mb-1">Collected</div>
                <div className="text-xl font-bold text-green-700">{formatCurrency(totalCollected)}</div>
              </div>
              <div className="bg-amber-50 rounded-xl border border-amber-100 p-4">
                <div className="text-sm text-amber-600 mb-1">Outstanding</div>
                <div className="text-xl font-bold text-amber-700">{formatCurrency(totalOutstanding)}</div>
              </div>
            </div>

            {/* Payment phases */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Phase</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Description</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Amount</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Due Date</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {payments.map((pay) => {
                    const cfg = STATUS_LABELS[pay.status as PaymentStatus] || STATUS_LABELS.pending;
                    return (
                      <tr key={pay.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{pay.phase_number}</td>
                        <td className="px-4 py-3 text-gray-700">{pay.label}</td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-gray-900">{formatCurrency(pay.amount)}</td>
                        <td className="px-4 py-3 text-gray-500">
                          {pay.due_date ? formatDate(pay.due_date) : (
                            <input type="date" className="text-xs border border-gray-200 rounded px-2 py-1"
                              onChange={(e) => setPayments(prev => prev.map(p => p.id === pay.id ? { ...p, due_date: e.target.value } : p))} />
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => cyclePaymentStatus(pay.id)}
                            className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer ${cfg.color} hover:opacity-80`}>
                            {cfg.label}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Client Info Tab */}
          <TabsContent value="client" className="flex-1 p-6 overflow-y-auto mt-0">
            <div className="max-w-md">
              <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
                <h2 className="font-semibold text-gray-900">Client Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Client Name</label>
                    <div className="text-sm font-medium text-gray-900">{project?.client_name || '—'}</div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Email</label>
                    <div className="text-sm text-gray-700">{project?.client_email || '—'}</div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Phone</label>
                    <div className="text-sm text-gray-700">{project?.client_phone || '—'}</div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Contract Amount</label>
                    <div className="text-sm font-semibold text-gray-900">{formatCurrency(project?.contract_amount || 0)}</div>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-gray-500 block mb-1">Project Address</label>
                    <div className="text-sm text-gray-700">{project?.address || '—'}</div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Photos Tab */}
          <TabsContent value="photos" className="flex-1 p-6 overflow-y-auto mt-0">
            {photos.length === 0 ? (
              <div className="text-center py-16">
                <Camera className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500">No site photos yet</p>
                <p className="text-sm text-gray-400 mt-1">Workers can upload progress photos from their dashboard</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo) => (
                  <div key={photo.id} className="rounded-xl overflow-hidden border border-gray-100 group">
                    <img src={photo.url} alt={photo.caption || 'Site photo'} className="w-full aspect-square object-cover" />
                    {photo.caption && (
                      <div className="p-2 text-xs text-gray-600">{photo.caption}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Quotations Tab */}
          <TabsContent value="quotations" className="flex-1 p-6 overflow-y-auto mt-0">
            <div className="text-center py-16">
              <FileText className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500">No quotations attached</p>
              <Button variant="gold" className="mt-4 gap-2" onClick={() => router.push('/designer/quotation')}>
                <Plus className="w-4 h-4" /> Upload Quotation
              </Button>
            </div>
          </TabsContent>

          {/* VO Tab */}
          <TabsContent value="vo" className="flex-1 p-6 overflow-y-auto mt-0">
            <div className="text-center py-16">
              <GitBranch className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500">No variation orders</p>
              <Button variant="gold" className="mt-4 gap-2">
                <Plus className="w-4 h-4" /> Add Variation Order
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
