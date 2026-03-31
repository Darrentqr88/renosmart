'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { LogOut, Check, User, Building2, Phone, Mail, Briefcase, Star, MapPin, Users, ChevronDown, Pencil, Shield, Wrench, Hash, DollarSign, FileText, Globe, Camera } from 'lucide-react';
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
  avatar_url?: string;
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
  'Glass Work': '#06B6D4', 'Aluminium Work': '#64748B', 'Metal Work': '#78716C',
  'Alarm & CCTV': '#EC4899', Landscaping: '#22C55E', Other: '#9CA3AF',
};

function getInitials(name?: string): string {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// Auto-save field component — edits inline, saves on blur
function EditableField({
  icon, label, value, placeholder, onSave, type = 'text', suffix, readOnly = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  placeholder: string;
  onSave: (val: string) => void;
  type?: string;
  suffix?: string;
  readOnly?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saved, setSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(value); }, [value]);

  const handleSave = () => {
    setEditing(false);
    if (draft !== value) {
      onSave(draft);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }
  };

  return (
    <div
      className={`group flex items-center gap-3.5 px-4 py-3.5 transition-all cursor-pointer ${
        editing ? 'bg-blue-50/60' : readOnly ? '' : 'hover:bg-gray-50/80'
      }`}
      onClick={() => {
        if (!readOnly && !editing) {
          setEditing(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }
      }}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
        editing ? 'bg-blue-100' : 'bg-gray-50 group-hover:bg-gray-100'
      }`}>
        <div className={`${editing ? 'text-blue-500' : 'text-gray-400'}`}>{icon}</div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
        {editing ? (
          <input
            ref={inputRef}
            type={type}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={handleSave}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
            placeholder={placeholder}
            className="w-full text-sm font-medium text-gray-900 bg-transparent outline-none border-none p-0 placeholder:text-gray-300"
          />
        ) : (
          <p className="text-sm font-medium text-gray-800 truncate">
            {value ? (
              <>{value}{suffix && <span className="text-gray-400 text-xs ml-1">{suffix}</span>}</>
            ) : (
              <span className="text-gray-300 text-xs">{placeholder}</span>
            )}
          </p>
        )}
      </div>
      {saved && (
        <div className="flex items-center gap-1 text-emerald-500 animate-fade-in">
          <Check className="w-3.5 h-3.5" />
          <span className="text-[10px] font-semibold">Saved</span>
        </div>
      )}
      {!editing && !readOnly && !saved && (
        <Pencil className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      )}
    </div>
  );
}

// Team Size dropdown with auto-save
function TeamSizeField({ label, value, onSave }: { label: string; value?: number; onSave: (val: number | null) => void }) {
  // Map stored integer to range string for display
  const intToRange = (n?: number): string => {
    if (!n) return '';
    if (n <= 5) return '1-5';
    if (n <= 15) return '6-15';
    if (n <= 30) return '16-30';
    return '30+';
  };
  // Map range string to representative integer for storage
  const rangeToInt = (r: string): number | null => {
    if (r === '1-5') return 5;
    if (r === '6-15') return 15;
    if (r === '16-30') return 30;
    if (r === '30+') return 31;
    return null;
  };

  const [saved, setSaved] = useState(false);
  const [selected, setSelected] = useState(intToRange(value));

  return (
    <div className="group flex items-center gap-3.5 px-4 py-3.5 hover:bg-gray-50/80">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-gray-50 group-hover:bg-gray-100 transition-colors">
        <Users className="w-4 h-4 text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
        <select
          value={selected}
          onChange={e => {
            const val = e.target.value;
            setSelected(val);
            onSave(rangeToInt(val));
            setSaved(true);
            setTimeout(() => setSaved(false), 1500);
          }}
          className="w-full text-sm font-medium text-gray-800 bg-transparent outline-none border-none p-0 cursor-pointer appearance-none"
        >
          <option value="">Select team size</option>
          {EMPLOYEE_RANGES.map(r => <option key={r} value={r}>{r} pax</option>)}
        </select>
      </div>
      {saved ? (
        <div className="flex items-center gap-1 text-emerald-500">
          <Check className="w-3.5 h-3.5" />
          <span className="text-[10px] font-semibold">Saved</span>
        </div>
      ) : (
        <ChevronDown className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
      )}
    </div>
  );
}

// Format number with commas: 100000 → 100,000
function formatNumber(n: number): string {
  return n.toLocaleString('en-MY');
}

// Project Range with comma formatting
function ProjectRangeField({ label, minValue, maxValue, onSaveMin, onSaveMax }: {
  label: string;
  minValue?: number;
  maxValue?: number;
  onSaveMin: (val: number | null) => void;
  onSaveMax: (val: number | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [minDraft, setMinDraft] = useState(minValue ? String(minValue) : '');
  const [maxDraft, setMaxDraft] = useState(maxValue ? String(maxValue) : '');
  const [saved, setSaved] = useState(false);
  const minRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const doSave = useCallback((minD: string, maxD: string) => {
    const minNum = minD ? parseFloat(minD.replace(/,/g, '')) : null;
    const maxNum = maxD ? parseFloat(maxD.replace(/,/g, '')) : null;
    if (minNum !== (minValue || null) || maxNum !== (maxValue || null)) {
      onSaveMin(minNum);
      onSaveMax(maxNum);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }
  }, [minValue, maxValue, onSaveMin, onSaveMax]);

  // Close editing only when focus leaves BOTH inputs (clicks outside the container)
  const handleBlur = useCallback((e: React.FocusEvent) => {
    // Check if the new focus target is still inside the container
    setTimeout(() => {
      if (containerRef.current && !containerRef.current.contains(document.activeElement)) {
        setEditing(false);
        doSave(minDraft, maxDraft);
      }
    }, 0);
  }, [minDraft, maxDraft, doSave]);

  // Display formatted values when not editing
  const displayValue = (minValue || maxValue)
    ? `RM ${minValue ? formatNumber(minValue) : '0'} — RM ${maxValue ? formatNumber(maxValue) : '0'}`
    : '';

  return (
    <div
      ref={containerRef}
      className={`group flex items-center gap-3.5 px-4 py-3.5 transition-all cursor-pointer ${
        editing ? 'bg-blue-50/60' : 'hover:bg-gray-50/80'
      }`}
      onClick={() => {
        if (!editing) {
          setEditing(true);
          setTimeout(() => minRef.current?.focus(), 50);
        }
      }}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
        editing ? 'bg-blue-100' : 'bg-gray-50 group-hover:bg-gray-100'
      }`}>
        <DollarSign className={`w-4 h-4 ${editing ? 'text-blue-500' : 'text-gray-400'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
        {editing ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 flex-1">
              <span className="text-[10px] text-gray-400">RM</span>
              <input
                ref={minRef}
                type="text"
                inputMode="numeric"
                value={minDraft}
                onChange={e => setMinDraft(e.target.value.replace(/[^0-9]/g, ''))}
                onBlur={handleBlur}
                onKeyDown={e => { if (e.key === 'Enter') { setEditing(false); doSave(minDraft, maxDraft); } }}
                placeholder="Min"
                className="w-full text-sm font-medium text-gray-900 bg-transparent outline-none border-none p-0 placeholder:text-gray-300"
              />
            </div>
            <span className="text-gray-300 text-xs">—</span>
            <div className="flex items-center gap-1 flex-1">
              <span className="text-[10px] text-gray-400">RM</span>
              <input
                type="text"
                inputMode="numeric"
                value={maxDraft}
                onChange={e => setMaxDraft(e.target.value.replace(/[^0-9]/g, ''))}
                onBlur={handleBlur}
                onKeyDown={e => { if (e.key === 'Enter') { setEditing(false); doSave(minDraft, maxDraft); } }}
                placeholder="Max"
                className="w-full text-sm font-medium text-gray-900 bg-transparent outline-none border-none p-0 placeholder:text-gray-300"
              />
            </div>
          </div>
        ) : (
          <p className="text-sm font-medium text-gray-800 truncate">
            {displayValue || <span className="text-gray-300 text-xs">Set project value range</span>}
          </p>
        )}
      </div>
      {saved && (
        <div className="flex items-center gap-1 text-emerald-500">
          <Check className="w-3.5 h-3.5" />
          <span className="text-[10px] font-semibold">Saved</span>
        </div>
      )}
      {!editing && !saved && (
        <Pencil className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      )}
    </div>
  );
}

export default function WorkerProfileTab({ profile, sessionUserId, tasks }: WorkerProfileTabProps) {
  const supabase = createClient();
  const router = useRouter();
  const { t } = useI18n();

  const [receiptCount, setReceiptCount] = useState(0);
  const [rating, setRating] = useState<WorkerRating | null>(null);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [showTradesEditor, setShowTradesEditor] = useState(false);
  const [showRegionsEditor, setShowRegionsEditor] = useState(false);
  const [selectedTrades, setSelectedTrades] = useState<string[]>(profile?.trades || []);
  const [selectedRegions, setSelectedRegions] = useState<string[]>(profile?.service_regions || []);
  const [tradesSaved, setTradesSaved] = useState(false);
  const [regionsSaved, setRegionsSaved] = useState(false);

  // Local profile state for instant UI updates
  const [localProfile, setLocalProfile] = useState(profile);
  useEffect(() => {
    setLocalProfile(profile);
    if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);
  }, [profile]);

  useEffect(() => {
    const firstDay = new Date();
    firstDay.setDate(1);
    const firstDayStr = firstDay.toISOString().split('T')[0];

    supabase
      .from('cost_records')
      .select('id', { count: 'exact', head: true })
      .eq('uploaded_by', sessionUserId)
      .gte('receipt_date', firstDayStr)
      .then(({ count }) => setReceiptCount(count || 0));

    calculateWorkerRating(supabase, sessionUserId).then(setRating);
  }, [sessionUserId]);

  const completedTasks = tasks.filter(t => t.progress === 100).length;

  // Auto-save a single field
  const saveField = useCallback(async (field: string, value: unknown) => {
    await supabase.from('profiles').update({
      [field]: value,
      updated_at: new Date().toISOString(),
    }).eq('user_id', sessionUserId);
    setLocalProfile(prev => prev ? { ...prev, [field]: value } : prev);
  }, [sessionUserId, supabase]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/avatar', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setAvatarUrl(data.url);
      setLocalProfile(prev => prev ? { ...prev, avatar_url: data.url } : prev);
    } catch (err) {
      console.error('Avatar upload error:', err);
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const toggleTrade = (trade: string) => {
    setSelectedTrades(prev => {
      const next = prev.includes(trade) ? prev.filter(t => t !== trade) : [...prev, trade];
      return next;
    });
  };

  const saveTrades = async () => {
    await saveField('trades', selectedTrades);
    setTradesSaved(true);
    setTimeout(() => { setTradesSaved(false); setShowTradesEditor(false); }, 800);
  };

  const toggleRegion = (region: string) => {
    setSelectedRegions(prev =>
      prev.includes(region) ? prev.filter(r => r !== region) : [...prev, region]
    );
  };

  const saveRegions = async () => {
    await saveField('service_regions', selectedRegions.length > 0 ? selectedRegions : null);
    setRegionsSaved(true);
    setTimeout(() => { setRegionsSaved(false); setShowRegionsEditor(false); }, 800);
  };

  const p = localProfile;

  return (
    <div className="flex flex-col h-full">
      {/* Header — gradient hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F1923] via-[#162435] to-[#1a3049]" />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h40v40H0z\' fill=\'none\'/%3E%3Cpath d=\'M20 0v40M0 20h40\' stroke=\'%23fff\' stroke-width=\'.5\'/%3E%3C/svg%3E")', backgroundSize: '40px 40px' }} />

        <div className="relative px-5 pt-10 pb-7">
          {/* Avatar + Info */}
          <div className="flex items-start gap-4">
            <div className="relative">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20 overflow-hidden relative group"
                style={{ background: 'linear-gradient(135deg, #4F8EF7 0%, #2563EB 100%)' }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt={p?.name || 'Avatar'} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-bold text-2xl tracking-tight">{getInitials(p?.name)}</span>
                )}
                {/* Camera overlay on hover/tap */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
                  {uploadingAvatar ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-5 h-5 text-white" />
                  )}
                </div>
              </button>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-[#0F1923] flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <h1 className="font-bold text-xl text-white truncate">{p?.name || 'Worker'}</h1>
              {p?.company && (
                <p className="text-white/40 text-xs truncate mt-0.5">{p.company}</p>
              )}
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {(p?.trades || []).slice(0, 4).map(trade => (
                  <span
                    key={trade}
                    className="text-[10px] px-2 py-0.5 rounded-md font-semibold backdrop-blur-sm"
                    style={{
                      background: `${TRADE_COLORS[trade] || '#64748B'}20`,
                      color: TRADE_COLORS[trade] || '#94A3B8',
                      border: `1px solid ${TRADE_COLORS[trade] || '#64748B'}30`,
                    }}
                  >
                    {trade}
                  </span>
                ))}
                {(p?.trades || []).length > 4 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/8 text-white/50 font-medium">
                    +{(p?.trades || []).length - 4}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2.5 mt-5">
            <div className="bg-white/[0.06] backdrop-blur-sm rounded-xl px-3 py-2.5 border border-white/[0.05]">
              <p className="text-[9px] text-white/30 font-semibold uppercase tracking-wider">Tasks</p>
              <p className="text-xl font-bold text-white mt-0.5">{completedTasks}</p>
              <p className="text-[9px] text-white/25">this month</p>
            </div>
            <div className="bg-white/[0.06] backdrop-blur-sm rounded-xl px-3 py-2.5 border border-white/[0.05]">
              <p className="text-[9px] text-white/30 font-semibold uppercase tracking-wider">Receipts</p>
              <p className="text-xl font-bold text-white mt-0.5">{receiptCount}</p>
              <p className="text-[9px] text-white/25">submitted</p>
            </div>
            <div className="bg-white/[0.06] backdrop-blur-sm rounded-xl px-3 py-2.5 border border-white/[0.05]">
              <p className="text-[9px] text-white/30 font-semibold uppercase tracking-wider">Rating</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <p className="text-xl font-bold text-amber-400">{rating ? rating.overall.toFixed(1) : '—'}</p>
                {rating && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
              </div>
              <p className="text-[9px] text-white/25">/ 5.0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-[#F3F4F8] p-4 space-y-3">

        {/* Performance Rating */}
        {rating && rating.totalTasks > 0 && (
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm shadow-gray-200/80">
            <div className="px-4 py-3 border-b border-gray-100/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-amber-500" />
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t.worker.rating}</p>
              </div>
              <p className="text-[10px] text-gray-400">
                {rating.completedTasks}/{rating.totalTasks} {t.worker.tasksCompleted}
              </p>
            </div>
            <div className="p-4 space-y-3">
              {([
                { key: 'attendance', label: t.worker.attendance, color: '#3B82F6', icon: '📍' },
                { key: 'completion', label: t.worker.onTimeCompletion, color: '#10B981', icon: '⏱' },
                { key: 'quality', label: t.worker.photoQuality, color: '#8B5CF6', icon: '📸' },
                { key: 'documentation', label: t.worker.documentation, color: '#F59E0B', icon: '📄' },
                { key: 'reliability', label: t.worker.reliability, color: '#EF4444', icon: '🔒' },
              ] as const).map(dim => (
                <div key={dim.key} className="flex items-center gap-3">
                  <span className="text-xs w-6 text-center flex-shrink-0">{dim.icon}</span>
                  <span className="text-[11px] text-gray-500 w-24 flex-shrink-0 font-medium">{dim.label}</span>
                  <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${(rating[dim.key] / 5) * 100}%`, background: `linear-gradient(90deg, ${dim.color}90, ${dim.color})` }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-gray-600 w-8 text-right tabular-nums">{rating[dim.key].toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Personal Info — Name is editable, phone/email read-only */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm shadow-gray-200/80">
          <div className="px-4 py-3 border-b border-gray-100/80">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t.worker.personal}</p>
          </div>
          <div className="divide-y divide-gray-50">
            <EditableField
              icon={<User className="w-4 h-4" />}
              label={t.worker.name}
              value={p?.name || ''}
              placeholder="Enter your name"
              onSave={val => saveField('name', val)}
            />
            <EditableField
              icon={<Phone className="w-4 h-4" />}
              label={t.worker.phone}
              value={p?.phone || ''}
              placeholder="—"
              onSave={() => {}}
              readOnly
            />
            <EditableField
              icon={<Mail className="w-4 h-4" />}
              label={t.worker.email}
              value={p?.email || ''}
              placeholder="—"
              onSave={() => {}}
              readOnly
            />
          </div>
        </div>

        {/* Company Info — all editable with auto-save */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm shadow-gray-200/80">
          <div className="px-4 py-3 border-b border-gray-100/80">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t.worker.companyInfo}</p>
          </div>
          <div className="divide-y divide-gray-50">
            <EditableField
              icon={<Building2 className="w-4 h-4" />}
              label={t.worker.company}
              value={p?.company || ''}
              placeholder="Your company name"
              onSave={val => saveField('company', val)}
            />
            <EditableField
              icon={<MapPin className="w-4 h-4" />}
              label={t.worker.address}
              value={p?.company_address || ''}
              placeholder="Company address"
              onSave={val => saveField('company_address', val)}
            />
            <EditableField
              icon={<Hash className="w-4 h-4" />}
              label={t.worker.ssm}
              value={p?.ssm_no || ''}
              placeholder="e.g. 202301234567"
              onSave={val => saveField('ssm_no', val || null)}
            />

            {/* Team Size — dropdown */}
            <TeamSizeField
              label={t.worker.teamSize}
              value={p?.employee_count}
              onSave={val => saveField('employee_count', val)}
            />

            {/* Project Range */}
            <ProjectRangeField
              label={t.worker.projectRange}
              minValue={p?.min_project_value}
              maxValue={p?.max_project_value}
              onSaveMin={val => saveField('min_project_value', val)}
              onSaveMax={val => saveField('max_project_value', val)}
            />

            {/* About / Bio */}
            <EditableField
              icon={<FileText className="w-4 h-4" />}
              label={t.worker.about}
              value={p?.company_bio || ''}
              placeholder="e.g. 10+ years in high-end tiling"
              onSave={val => saveField('company_bio', val || null)}
            />
          </div>
        </div>

        {/* Trades */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm shadow-gray-200/80">
          <div
            className="flex items-center justify-between px-4 py-3 border-b border-gray-100/80 cursor-pointer hover:bg-gray-50/50 transition-colors"
            onClick={() => setShowTradesEditor(!showTradesEditor)}
          >
            <div className="flex items-center gap-2">
              <Wrench className="w-3.5 h-3.5 text-gray-400" />
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t.worker.trades}</p>
            </div>
            <div className="flex items-center gap-2">
              {tradesSaved && (
                <div className="flex items-center gap-1 text-emerald-500">
                  <Check className="w-3 h-3" />
                  <span className="text-[10px] font-semibold">Saved</span>
                </div>
              )}
              <span className="text-[10px] text-gray-400 font-medium">{selectedTrades.length} selected</span>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showTradesEditor ? 'rotate-180' : ''}`} />
            </div>
          </div>

          {/* Trade badges (always visible) */}
          {selectedTrades.length > 0 && !showTradesEditor && (
            <div className="px-4 py-3 flex flex-wrap gap-1.5">
              {selectedTrades.map(trade => (
                <span
                  key={trade}
                  className="text-[10px] px-2.5 py-1 rounded-lg font-semibold"
                  style={{
                    background: `${TRADE_COLORS[trade] || '#64748B'}12`,
                    color: TRADE_COLORS[trade] || '#64748B',
                    border: `1px solid ${TRADE_COLORS[trade] || '#64748B'}20`,
                  }}
                >
                  {trade}
                </span>
              ))}
            </div>
          )}

          {/* Trade picker (expanded) */}
          {showTradesEditor && (
            <div className="p-4">
              <div className="flex flex-wrap gap-2">
                {WORKER_TRADES.map(trade => {
                  const active = selectedTrades.includes(trade);
                  const color = TRADE_COLORS[trade] || '#64748B';
                  return (
                    <button
                      key={trade}
                      onClick={() => toggleTrade(trade)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                      style={active ? {
                        background: `${color}18`,
                        color: color,
                        border: `1.5px solid ${color}40`,
                        boxShadow: `0 0 0 1px ${color}10`,
                      } : {
                        background: '#F8F9FA',
                        color: '#9CA3AF',
                        border: '1.5px solid transparent',
                      }}
                    >
                      {active && <Check className="w-2.5 h-2.5 inline mr-1" />}
                      {trade}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={saveTrades}
                className="mt-3 w-full py-2 bg-[#4F8EF7] text-white text-xs font-bold rounded-xl hover:bg-[#3B7AE8] transition-colors"
              >
                Save Trades
              </button>
            </div>
          )}
        </div>

        {/* Service Regions */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm shadow-gray-200/80">
          <div
            className="flex items-center justify-between px-4 py-3 border-b border-gray-100/80 cursor-pointer hover:bg-gray-50/50 transition-colors"
            onClick={() => setShowRegionsEditor(!showRegionsEditor)}
          >
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-gray-400" />
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t.worker.serviceRegions}</p>
            </div>
            <div className="flex items-center gap-2">
              {regionsSaved && (
                <div className="flex items-center gap-1 text-emerald-500">
                  <Check className="w-3 h-3" />
                  <span className="text-[10px] font-semibold">Saved</span>
                </div>
              )}
              <span className="text-[10px] text-gray-400 font-medium">
                {selectedRegions.length > 0 ? selectedRegions.join(', ') : 'None'}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showRegionsEditor ? 'rotate-180' : ''}`} />
            </div>
          </div>

          {showRegionsEditor && (
            <div className="p-4">
              <div className="flex flex-wrap gap-2">
                {SERVICE_REGIONS.map(region => {
                  const active = selectedRegions.includes(region);
                  return (
                    <button
                      key={region}
                      onClick={() => toggleRegion(region)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        active
                          ? 'bg-blue-50 text-blue-600 border-[1.5px] border-blue-200'
                          : 'bg-gray-50 text-gray-400 border-[1.5px] border-transparent'
                      }`}
                    >
                      {active && <Check className="w-2.5 h-2.5 inline mr-1" />}
                      <MapPin className="w-2.5 h-2.5 inline mr-0.5" />{region}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={saveRegions}
                className="mt-3 w-full py-2 bg-[#4F8EF7] text-white text-xs font-bold rounded-xl hover:bg-[#3B7AE8] transition-colors"
              >
                Save Regions
              </button>
            </div>
          )}
        </div>

        {/* Team Management — Coming Soon */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm shadow-gray-200/80 opacity-50">
          <div className="flex items-center gap-3.5 px-4 py-4">
            <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-600">{t.worker.teamManagement}</p>
              <p className="text-[10px] text-gray-400">Manage your workers and subcontractors</p>
            </div>
            <span className="text-[9px] px-2 py-0.5 bg-purple-50 text-purple-400 rounded-full font-bold uppercase tracking-wider">{t.worker.comingSoon}</span>
          </div>
        </div>

        {/* Sign Out */}
        <div className="pb-8">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3.5 bg-white rounded-2xl shadow-sm shadow-gray-200/80 hover:bg-red-50 transition-colors group"
          >
            <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-red-100 transition-colors">
              <LogOut className="w-4 h-4 text-red-500" />
            </div>
            <span className="text-sm font-semibold text-red-500">{t.worker.signOut}</span>
          </button>

          <p className="text-center text-[10px] text-gray-300 mt-4 mb-2">RenoSmart Contractor v2.0</p>
        </div>
      </div>
    </div>
  );
}
