'use client';

import { useState, useEffect } from 'react';
import { LogOut, Edit3, Check, X, User, Building2, Phone, Mail, Briefcase, ChevronRight, Star, MapPin, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { WorkerTask } from './WorkerTaskCard';
import { calculateWorkerRating, WorkerRating } from '@/lib/utils/worker-rating';
import { useI18n } from '@/lib/i18n/context';

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
  company_bio?: string;
  service_regions?: string[];
}

const SERVICE_REGIONS = ['KL', 'JB', 'PG', 'SG', 'Ipoh', 'Melaka', 'Kota Kinabalu', 'Kuching'];
const EMPLOYEE_RANGES = ['1-5', '6-15', '16-30', '30+'];

interface WorkerProfileTabProps {
  profile: WorkerProfile | null;
  sessionUserId: string;
  tasks: WorkerTask[];
}

const WORKER_TRADES = [
  'Plumbing', 'Electrical', 'Tiling', 'False Ceiling', 'Carpentry',
  'Painting', 'Demolition', 'Glass Work', 'Aluminium Work', 'Metal Work',
  'Flooring', 'Stone/Marble', 'Waterproofing', 'Air Conditioning', 'Cleaning',
  'Alarm & CCTV', 'Landscaping', 'Other',
];

const TRADE_COLORS: Record<string, string> = {
  Plumbing: '#3B82F6', Electrical: '#F59E0B', Tiling: '#10B981',
  'False Ceiling': '#8B5CF6', Carpentry: '#60A5FA', Painting: '#A855F7',
  Demolition: '#EF4444', Waterproofing: '#0EA5E9', 'Air Conditioning': '#6EE7B7',
  Cleaning: '#94A3B8', Flooring: '#14B8A6', 'Stone/Marble': '#D97706',
};

function getInitials(name?: string): string {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function WorkerProfileTab({ profile, sessionUserId, tasks }: WorkerProfileTabProps) {
  const supabase = createClient();
  const router = useRouter();
  const { t } = useI18n();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [receiptCount, setReceiptCount] = useState(0);
  const [rating, setRating] = useState<WorkerRating | null>(null);

  // Editable fields
  const [company, setCompany] = useState(profile?.company || '');
  const [companyAddress, setCompanyAddress] = useState(profile?.company_address || '');
  const [ssmNo, setSsmNo] = useState(profile?.ssm_no || '');
  const [employeeCount, setEmployeeCount] = useState(String(profile?.employee_count || ''));
  const [minValue, setMinValue] = useState(String(profile?.min_project_value || ''));
  const [maxValue, setMaxValue] = useState(String(profile?.max_project_value || ''));
  const [companyBio, setCompanyBio] = useState(profile?.company_bio || '');
  const [serviceRegions, setServiceRegions] = useState<string[]>(profile?.service_regions || []);
  const [selectedTrades, setSelectedTrades] = useState<string[]>(profile?.trades || []);

  useEffect(() => {
    // Fetch receipt count this month
    const firstDay = new Date();
    firstDay.setDate(1);
    const firstDayStr = firstDay.toISOString().split('T')[0];

    supabase
      .from('cost_records')
      .select('id', { count: 'exact', head: true })
      .eq('uploaded_by', sessionUserId)
      .gte('receipt_date', firstDayStr)
      .then(({ count }) => setReceiptCount(count || 0));

    // Calculate worker rating
    calculateWorkerRating(supabase, sessionUserId).then(setRating);
  }, [sessionUserId]);

  // Stats
  const thisMonth = new Date().getMonth();
  const completedTasks = tasks.filter(t => t.progress === 100).length;

  const handleSave = async () => {
    setSaving(true);
    await supabase.from('profiles').update({
      company,
      company_address: companyAddress,
      ssm_no: ssmNo,
      employee_count: employeeCount ? parseInt(employeeCount) : null,
      min_project_value: minValue ? parseFloat(minValue) : null,
      max_project_value: maxValue ? parseFloat(maxValue) : null,
      trades: selectedTrades,
      company_bio: companyBio || null,
      service_regions: serviceRegions.length > 0 ? serviceRegions : null,
      updated_at: new Date().toISOString(),
    }).eq('user_id', sessionUserId);
    setSaving(false);
    setEditing(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const toggleTrade = (trade: string) => {
    setSelectedTrades(prev =>
      prev.includes(trade) ? prev.filter(t => t !== trade) : [...prev, trade]
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-sidebar text-white px-5 pt-12 pb-8">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#4F8EF7] flex items-center justify-center flex-shrink-0">
            <span className="text-black font-bold text-xl">{getInitials(profile?.name)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-xl truncate">{profile?.name || 'Worker'}</h1>
            <div className="flex flex-wrap gap-1 mt-1">
              {(profile?.trades || []).slice(0, 3).map(t => (
                <span
                  key={t}
                  className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: `${TRADE_COLORS[t] || '#64748B'}25`, color: TRADE_COLORS[t] || '#94A3B8' }}
                >
                  {t}
                </span>
              ))}
              {(profile?.trades || []).length > 3 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/60">
                  +{(profile?.trades || []).length - 3}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors flex-shrink-0"
          >
            <Edit3 className="w-4 h-4 text-white/70" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="bg-white/8 rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <p className="text-[10px] text-white/40 font-medium">Tasks Done (This Month)</p>
            <p className="text-2xl font-bold text-[#4F8EF7] mt-0.5">{completedTasks}</p>
          </div>
          <div className="bg-white/8 rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <p className="text-[10px] text-white/40 font-medium">Receipts Submitted</p>
            <p className="text-2xl font-bold text-[#4F8EF7] mt-0.5">{receiptCount}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-rs-bg p-4 space-y-4">

        {/* Rating card */}
        {rating && rating.totalTasks > 0 && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{t.worker.rating}</p>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-sm font-bold text-gray-900">{rating.overall.toFixed(1)}</span>
                <span className="text-[10px] text-gray-400">/ 5</span>
              </div>
            </div>
            <div className="p-4 space-y-2.5">
              {([
                { key: 'attendance', label: t.worker.attendance, color: '#3B82F6' },
                { key: 'completion', label: t.worker.onTimeCompletion, color: '#10B981' },
                { key: 'quality', label: t.worker.photoQuality, color: '#8B5CF6' },
                { key: 'documentation', label: t.worker.documentation, color: '#F59E0B' },
                { key: 'reliability', label: t.worker.reliability, color: '#EF4444' },
              ] as const).map(dim => (
                <div key={dim.key} className="flex items-center gap-3">
                  <span className="text-[11px] text-gray-500 w-28 flex-shrink-0">{dim.label}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${(rating[dim.key] / 5) * 100}%`, background: dim.color }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-gray-600 w-8 text-right">{rating[dim.key].toFixed(1)}</span>
                </div>
              ))}
              <p className="text-[10px] text-gray-400 mt-1 pt-2 border-t border-gray-50">
                {t.worker.basedOnTasks} {rating.completedTasks}/{rating.totalTasks} {t.worker.tasksCompleted}
              </p>
            </div>
          </div>
        )}

        {/* Personal info (read-only) */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{t.worker.personal}</p>
          </div>
          <div className="divide-y divide-gray-50">
            {[
              { icon: <User className="w-4 h-4" />, label: t.worker.name, value: profile?.name },
              { icon: <Phone className="w-4 h-4" />, label: t.worker.phone, value: profile?.phone },
              { icon: <Mail className="w-4 h-4" />, label: t.worker.email, value: profile?.email },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3 px-4 py-3">
                <div className="text-gray-400 flex-shrink-0">{item.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-400">{item.label}</p>
                  <p className="text-sm font-medium text-gray-800 truncate">{item.value || '—'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Company info */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{t.worker.companyInfo}</p>
            {editing && (
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)} className="p-1 rounded-lg hover:bg-gray-100">
                  <X className="w-3.5 h-3.5 text-gray-400" />
                </button>
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 px-2.5 py-1 bg-[#4F8EF7] text-white rounded-lg text-xs font-semibold">
                  {saving ? '...' : <><Check className="w-3 h-3" /> Save</>}
                </button>
              </div>
            )}
          </div>

          <div className="divide-y divide-gray-50">
            {editing ? (
              <div className="p-4 space-y-3">
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1">Company Name</label>
                  <input value={company} onChange={e => setCompany(e.target.value)} placeholder="Your company name" className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#4F8EF7]" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1">Company Address</label>
                  <input value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} placeholder="Company address" className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#4F8EF7]" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 font-medium block mb-1">SSM No.</label>
                    <input value={ssmNo} onChange={e => setSsmNo(e.target.value)} placeholder="e.g. 202301234567" className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#4F8EF7]" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium block mb-1">Team Size</label>
                    <select value={employeeCount} onChange={e => setEmployeeCount(e.target.value)} className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#4F8EF7] bg-white">
                      <option value="">Select</option>
                      {EMPLOYEE_RANGES.map(r => <option key={r} value={r}>{r} pax</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1">Project Value Range (RM)</label>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="number" value={minValue} onChange={e => setMinValue(e.target.value)} placeholder="Min e.g. 5000" className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#4F8EF7]" />
                    <input type="number" value={maxValue} onChange={e => setMaxValue(e.target.value)} placeholder="Max e.g. 500000" className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#4F8EF7]" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-2">Trades (select all that apply)</label>
                  <div className="flex flex-wrap gap-2">
                    {WORKER_TRADES.map(trade => (
                      <button
                        key={trade}
                        onClick={() => toggleTrade(trade)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
                          selectedTrades.includes(trade)
                            ? 'text-black'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                        style={selectedTrades.includes(trade) ? { background: `${TRADE_COLORS[trade] || '#4F8EF7'}25`, color: TRADE_COLORS[trade] || '#4F8EF7', border: `1px solid ${TRADE_COLORS[trade] || '#4F8EF7'}50` } : {}}
                      >
                        {trade}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1">Company Bio (one line)</label>
                  <input value={companyBio} onChange={e => setCompanyBio(e.target.value)} placeholder="e.g. Specialist in high-end tiling for 10+ years" maxLength={120} className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#4F8EF7]" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-2">Service Regions</label>
                  <div className="flex flex-wrap gap-2">
                    {SERVICE_REGIONS.map(region => (
                      <button
                        key={region}
                        onClick={() => setServiceRegions(prev => prev.includes(region) ? prev.filter(r => r !== region) : [...prev, region])}
                        className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
                          serviceRegions.includes(region) ? 'bg-[#4F8EF7]/15 text-[#4F8EF7] border border-[#4F8EF7]/30' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        <MapPin className="w-2.5 h-2.5 inline mr-0.5" />{region}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {[
                  { icon: <Building2 className="w-4 h-4" />, label: t.worker.company, value: profile?.company },
                  { icon: <Building2 className="w-4 h-4" />, label: t.worker.address, value: profile?.company_address },
                  { icon: <Briefcase className="w-4 h-4" />, label: t.worker.ssm, value: profile?.ssm_no },
                  { icon: <User className="w-4 h-4" />, label: t.worker.teamSize, value: profile?.employee_count ? `${profile.employee_count} pax` : null },
                  { icon: <Briefcase className="w-4 h-4" />, label: t.worker.projectRange, value: (profile?.min_project_value || profile?.max_project_value) ? `RM ${(profile?.min_project_value || 0).toLocaleString()} – RM ${(profile?.max_project_value || 0).toLocaleString()}` : null },
                  { icon: <Briefcase className="w-4 h-4" />, label: t.worker.about, value: profile?.company_bio },
                  { icon: <MapPin className="w-4 h-4" />, label: t.worker.serviceRegions, value: profile?.service_regions?.join(', ') },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3 px-4 py-3">
                    <div className="text-gray-400 flex-shrink-0">{item.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-gray-400">{item.label}</p>
                      <p className="text-sm font-medium text-gray-800 truncate">{item.value || <span className="text-gray-300 italic text-xs">{t.worker.notSet} — {t.worker.tapEdit}</span>}</p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Team Management — Coming Soon */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden opacity-60">
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-700">{t.worker.teamManagement}</p>
              <p className="text-[10px] text-gray-400">Manage your workers and subcontractors</p>
            </div>
            <span className="text-[9px] px-2 py-0.5 bg-purple-50 text-purple-500 rounded-full font-semibold">{t.worker.comingSoon}</span>
          </div>
        </div>

        {/* Sign out */}
        <div className="space-y-2 pb-8">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-between px-4 py-3.5 bg-white rounded-2xl shadow-sm hover:bg-red-50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center group-hover:bg-red-100 transition-colors">
                <LogOut className="w-4 h-4 text-red-500" />
              </div>
              <span className="text-sm font-semibold text-red-500">{t.worker.signOut}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </button>

          <p className="text-center text-[10px] text-gray-300 mt-3">RenoSmart Contractor v2.0</p>
        </div>
      </div>
    </div>
  );
}
