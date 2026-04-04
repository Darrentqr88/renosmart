'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useI18n } from '@/lib/i18n/context';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { formatCurrency, formatDate } from '@/lib/utils';
import { BarChart2, FileText, CreditCard, Camera, CheckSquare, LogOut, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { VariationOrder, VOItem } from '@/types';

interface GanttMilestone {
  id: string;
  name: string;
  progress: number;
  sort_order: number;
}

interface PaymentPhase {
  id: string;
  phase_number: number;
  label: string;
  amount: number;
  status: string;
  due_date?: string;
}

export default function OwnerDashboard() {
  const { t } = useI18n();
  const router = useRouter();
  const supabase = createClient();
  const [project, setProject] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [variationOrders, setVariationOrders] = useState<VariationOrder[]>([]);
  const [sitePhotos, setSitePhotos] = useState<{ id: string; url: string; caption?: string; trade?: string; created_at: string }[]>([]);
  const [milestones, setMilestones] = useState<GanttMilestone[]>([]);
  const [paymentPhases, setPaymentPhases] = useState<PaymentPhase[]>([]);
  const [voLoading, setVoLoading] = useState(false);
  const [expandedVOId, setExpandedVOId] = useState<string | null>(null);
  const [ownerLightbox, setOwnerLightbox] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      const { data } = await supabase.from('projects').select('*').eq('owner_email', authUser.email).single();
      setProject(data);
      if (data?.id) {
        // Load VOs, photos, milestones, and payments in parallel
        const [vosResult, photosResult, tasksResult, phasesResult] = await Promise.all([
          supabase.from('variation_orders').select('*').eq('project_id', data.id).order('created_at', { ascending: false }),
          supabase.from('site_photos').select('id, url, caption, trade, created_at').eq('project_id', data.id).eq('approved', true).order('created_at', { ascending: false }),
          supabase.from('gantt_tasks').select('id, name, progress, sort_order').eq('project_id', data.id).order('sort_order', { ascending: true }),
          supabase.from('payment_phases').select('*').eq('project_id', data.id).order('phase_number', { ascending: true }),
        ]);
        if (vosResult.data) setVariationOrders(vosResult.data as VariationOrder[]);
        if (photosResult.data) setSitePhotos(photosResult.data);
        if (tasksResult.data) setMilestones(tasksResult.data as GanttMilestone[]);
        if (phasesResult.data) setPaymentPhases(phasesResult.data as PaymentPhase[]);
      }
      setLoading(false);
    })();
  }, []);

  const handleVOAction = async (voId: string, action: 'approved' | 'rejected') => {
    setVoLoading(true);
    try {
      const updates = {
        status: action,
        ...(action === 'approved' ? { approved_at: new Date().toISOString() } : {}),
      };
      let { error } = await supabase
        .from('variation_orders')
        .update(updates)
        .eq('id', voId);
      // Fallback: approved_at column may not exist yet (migration pending)
      if (error?.message?.includes('approved_at')) {
        const { error: retryErr } = await supabase
          .from('variation_orders')
          .update({ status: action })
          .eq('id', voId);
        error = retryErr ?? null;
      }
      if (error) {
        console.error('VO action error:', error);
        return;
      }
      setVariationOrders(prev => prev.map(v => v.id === voId ? { ...v, ...updates } : v));
    } finally {
      setVoLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const pendingVOs = variationOrders.filter(v => v.status === 'pending');
  const historyVOs = variationOrders.filter(v => v.status !== 'pending');

  // Find next pending payment phase
  const nextPayment = paymentPhases.find(p => p.status === 'pending' || p.status === 'not_due');

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
                { label: 'Status', value: project?.status === 'active' ? t.status.active : project?.status === 'completed' ? t.status.completed : t.status.pending },
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
                { value: 'progress', icon: BarChart2, label: t.owner.progress },
                { value: 'docs', icon: FileText, label: t.owner.docs },
                { value: 'payments', icon: CreditCard, label: t.owner.payments },
                { value: 'photos', icon: Camera, label: t.owner.photos },
                { value: 'approvals', icon: CheckSquare, label: t.owner.approvals, badge: pendingVOs.length },
              ].map(({ value, icon: Icon, label, badge }) => (
                <TabsTrigger key={value} value={value}
                  className="flex flex-col items-center gap-0.5 rounded-none text-xs data-[state=active]:text-[#4F8EF7] data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#4F8EF7] h-full relative">
                  <Icon className="w-4 h-4" />
                  {label}
                  {badge != null && badge > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">
                      {badge}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="progress" className="flex-1 p-4 overflow-y-auto mt-0">
              {loading ? (
                <div className="text-center text-gray-400 py-8">Loading...</div>
              ) : !project ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">{t.owner.noProject}</p>
                  <p className="text-xs text-gray-400 mt-1">{t.owner.noProjectHint}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-medium text-gray-900 text-sm mb-3">{t.owner.milestoneTimeline}</h3>
                    <div className="space-y-3">
                      {milestones.length > 0 ? milestones.map((m, i) => {
                        const isComplete = m.progress >= 100;
                        const isActive = !isComplete && m.progress > 0;
                        return (
                          <div key={m.id} className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                              isComplete ? 'bg-green-500 text-white' : isActive ? 'bg-[#4F8EF7] text-white' : 'bg-gray-200 text-gray-400'
                            }`}>
                              {isComplete ? '✓' : i + 1}
                            </div>
                            <span className={`text-sm ${isComplete ? 'text-gray-400 line-through' : isActive ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                              {m.name}
                            </span>
                            {isActive && (
                              <span className="text-xs text-[#4F8EF7] ml-auto">{m.progress}%</span>
                            )}
                          </div>
                        );
                      }) : (
                        <p className="text-sm text-gray-400">{t.owner.noProjectHint}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="docs" className="flex-1 p-4 overflow-y-auto mt-0">
              <div className="text-center py-8 text-gray-400 text-sm">
                <FileText className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                {t.owner.noDocs}
              </div>
            </TabsContent>

            <TabsContent value="payments" className="flex-1 p-4 overflow-y-auto mt-0">
              <div className="space-y-3">
                {nextPayment ? (
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                    <div className="text-xs text-amber-600 mb-1">{t.owner.nextPayment}</div>
                    <div className="font-bold text-amber-900 text-lg">
                      {formatCurrency(nextPayment.amount)}
                    </div>
                    <div className="text-xs text-amber-600 mt-1">{nextPayment.label}</div>
                  </div>
                ) : paymentPhases.length > 0 ? (
                  <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                    <div className="text-xs text-green-600">✅ {t.pay.collected}</div>
                  </div>
                ) : null}
                {paymentPhases.length > 0 ? (
                  <div className="space-y-2">
                    {paymentPhases.map(phase => (
                      <div key={phase.id} className="bg-white rounded-lg p-3 border border-gray-100 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{phase.label}</p>
                          {phase.due_date && <p className="text-xs text-gray-400">{formatDate(phase.due_date)}</p>}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">{formatCurrency(phase.amount)}</p>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                            phase.status === 'collected' ? 'bg-green-50 text-green-600' :
                            phase.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                            'bg-gray-100 text-gray-500'
                          }`}>
                            {phase.status === 'collected' ? t.pay.statusCollected :
                             phase.status === 'pending' ? t.pay.statusPending :
                             t.pay.statusNotDue}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 text-center">{t.owner.contactDesigner}</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="photos" className="flex-1 p-4 overflow-y-auto mt-0">
              {sitePhotos.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  <Camera className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                  {t.owner.noPhotos}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500 font-medium">{sitePhotos.length} {t.owner.approvedPhotos}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {sitePhotos.map(photo => (
                      <div key={photo.id} className="rounded-xl overflow-hidden border border-gray-100 bg-white shadow-sm cursor-pointer" onClick={() => setOwnerLightbox(photo.url)}>
                        <img src={photo.url} alt={photo.caption || 'Site photo'} className="w-full aspect-square object-cover" />
                        <div className="p-2">
                          {photo.caption && <p className="text-[11px] text-gray-600 line-clamp-1">{photo.caption}</p>}
                          <div className="flex items-center justify-between mt-1">
                            {photo.trade && <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">{photo.trade}</span>}
                            <span className="text-[10px] text-gray-400">{new Date(photo.created_at).toLocaleDateString('en-MY')}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Owner lightbox */}
              {ownerLightbox && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 cursor-pointer" onClick={() => setOwnerLightbox(null)}>
                  <img src={ownerLightbox} alt="Photo" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
                </div>
              )}
            </TabsContent>

            {/* ── Approvals Tab ── */}
            <TabsContent value="approvals" className="flex-1 p-4 overflow-y-auto mt-0">
              {loading ? (
                <div className="text-center text-gray-400 py-8">Loading...</div>
              ) : (
                <div className="space-y-4">
                  {/* Pending VOs */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-500" />
                      {t.owner.pendingApproval} ({pendingVOs.length})
                    </h3>
                    {pendingVOs.length === 0 ? (
                      <div className="text-center py-6 bg-gray-50 rounded-xl text-gray-400 text-sm">
                        <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-gray-200" />
                        {t.owner.noPendingVO}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {pendingVOs.map(vo => {
                          const voItemList: VOItem[] = (vo.items as VOItem[] | undefined) || [];
                          const isExpanded = expandedVOId === vo.id;
                          return (
                            <div key={vo.id} className="bg-white rounded-xl border border-amber-200 border-l-4 border-l-amber-400 p-4 shadow-sm">
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-mono font-bold text-gray-500">{vo.vo_number}</span>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">{t.owner.pendingApproval}</span>
                                  </div>
                                  <p className="text-sm font-medium text-gray-900">{vo.description}</p>
                                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(vo.created_at)}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <div className="text-base font-bold text-gray-900">
                                    {vo.amount > 0 ? '+' : ''}{formatCurrency(vo.amount)}
                                  </div>
                                </div>
                              </div>

                              {/* Items expand */}
                              {voItemList.length > 0 && (
                                <div className="mb-3">
                                  <button
                                    onClick={() => setExpandedVOId(isExpanded ? null : vo.id)}
                                    className="flex items-center gap-1 text-xs text-[#4F8EF7] hover:underline"
                                  >
                                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                    {isExpanded ? t.owner.collapseDetails : `${t.owner.viewDetails} (${voItemList.length})`}
                                  </button>
                                  {isExpanded && (
                                    <div className="mt-2 overflow-x-auto rounded-lg border border-gray-100">
                                      <table className="w-full text-xs">
                                        <thead>
                                          <tr className="bg-gray-50 text-gray-500">
                                            <th className="px-2 py-1.5 text-left w-6">#</th>
                                            <th className="px-2 py-1.5 text-left">{t.owner.description}</th>
                                            <th className="px-2 py-1.5 text-right">{t.owner.subtotal}</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {voItemList.map((item, idx) => (
                                            <tr key={idx} className="border-t border-gray-100">
                                              <td className="px-2 py-1.5 text-gray-400">{item.no || idx + 1}</td>
                                              <td className="px-2 py-1.5 text-gray-700">{item.description}</td>
                                              <td className="px-2 py-1.5 text-right font-medium">RM {Number(item.total || 0).toFixed(2)}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Action buttons */}
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleVOAction(vo.id, 'approved')}
                                  disabled={voLoading}
                                  className="flex-1 py-2 rounded-lg bg-green-500 text-white text-sm font-semibold hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors"
                                >
                                  <CheckCircle2 className="w-4 h-4" /> {t.owner.acceptChange}
                                </button>
                                <button
                                  onClick={() => handleVOAction(vo.id, 'rejected')}
                                  disabled={voLoading}
                                  className="flex-1 py-2 rounded-lg bg-red-50 text-red-600 border border-red-200 text-sm font-semibold hover:bg-red-100 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors"
                                >
                                  <XCircle className="w-4 h-4" /> {t.owner.reject}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* History VOs */}
                  {historyVOs.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">{t.owner.approvalHistory}</h3>
                      <div className="space-y-2">
                        {historyVOs.map(vo => (
                          <div key={vo.id} className={`bg-white rounded-xl border p-3 border-l-4 ${vo.status === 'approved' ? 'border-l-green-500 border-green-100' : 'border-l-red-400 border-red-100'}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-xs font-mono text-gray-500">{vo.vo_number}</span>
                                  {vo.status === 'approved'
                                    ? <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-50 text-green-600">✓ {t.owner.accepted}</span>
                                    : <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-50 text-red-500">✗ {t.owner.rejected}</span>
                                  }
                                </div>
                                <p className="text-xs text-gray-700 truncate">{vo.description}</p>
                                {vo.approved_at && (
                                  <p className="text-xs text-gray-400">{formatDate(vo.approved_at)}</p>
                                )}
                              </div>
                              <div className={`text-sm font-bold flex-shrink-0 ${vo.status === 'rejected' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                +{formatCurrency(vo.amount)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
