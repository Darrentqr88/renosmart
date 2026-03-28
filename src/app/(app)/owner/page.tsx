'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useI18n } from '@/lib/i18n/context';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { formatCurrency, formatDate } from '@/lib/utils';
import { BarChart2, FileText, CreditCard, Camera, CheckSquare, LogOut, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { VariationOrder, VOItem } from '@/types';

export default function OwnerDashboard() {
  const { t } = useI18n();
  const router = useRouter();
  const supabase = createClient();
  const [project, setProject] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [variationOrders, setVariationOrders] = useState<VariationOrder[]>([]);
  const [sitePhotos, setSitePhotos] = useState<{ id: string; url: string; caption?: string; trade?: string; created_at: string }[]>([]);
  const [voLoading, setVoLoading] = useState(false);
  const [expandedVOId, setExpandedVOId] = useState<string | null>(null);
  const [ownerLightbox, setOwnerLightbox] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase.from('projects').select('*').eq('owner_email', session.user.email).single();
      setProject(data);
      if (data?.id) {
        const { data: vos } = await supabase
          .from('variation_orders')
          .select('*')
          .eq('project_id', data.id)
          .order('created_at', { ascending: false });
        if (vos) setVariationOrders(vos as VariationOrder[]);
        // Load approved site photos
        const { data: photos } = await supabase
          .from('site_photos')
          .select('id, url, caption, trade, created_at')
          .eq('project_id', data.id)
          .eq('approved', true)
          .order('created_at', { ascending: false });
        if (photos) setSitePhotos(photos);
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
                { value: 'approvals', icon: CheckSquare, label: '审批', badge: pendingVOs.length },
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
              {sitePhotos.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  <Camera className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                  No site photos yet.
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500 font-medium">{sitePhotos.length} approved photos</p>
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
                      待审批 ({pendingVOs.length})
                    </h3>
                    {pendingVOs.length === 0 ? (
                      <div className="text-center py-6 bg-gray-50 rounded-xl text-gray-400 text-sm">
                        <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-gray-200" />
                        暂无待审批变更单
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
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">待审批</span>
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
                                    {isExpanded ? '收起明细' : `查看明细 (${voItemList.length} 项)`}
                                  </button>
                                  {isExpanded && (
                                    <div className="mt-2 overflow-x-auto rounded-lg border border-gray-100">
                                      <table className="w-full text-xs">
                                        <thead>
                                          <tr className="bg-gray-50 text-gray-500">
                                            <th className="px-2 py-1.5 text-left w-6">#</th>
                                            <th className="px-2 py-1.5 text-left">说明</th>
                                            <th className="px-2 py-1.5 text-right">小计</th>
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
                                  <CheckCircle2 className="w-4 h-4" /> 接受变更
                                </button>
                                <button
                                  onClick={() => handleVOAction(vo.id, 'rejected')}
                                  disabled={voLoading}
                                  className="flex-1 py-2 rounded-lg bg-red-50 text-red-600 border border-red-200 text-sm font-semibold hover:bg-red-100 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors"
                                >
                                  <XCircle className="w-4 h-4" /> 拒绝
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
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">审批记录</h3>
                      <div className="space-y-2">
                        {historyVOs.map(vo => (
                          <div key={vo.id} className={`bg-white rounded-xl border p-3 border-l-4 ${vo.status === 'approved' ? 'border-l-green-500 border-green-100' : 'border-l-red-400 border-red-100'}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-xs font-mono text-gray-500">{vo.vo_number}</span>
                                  {vo.status === 'approved'
                                    ? <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-50 text-green-600">✓ 已接受</span>
                                    : <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-50 text-red-500">✗ 已拒绝</span>
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
