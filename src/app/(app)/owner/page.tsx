'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useI18n } from '@/lib/i18n/context';
import { formatDate } from '@/lib/utils';
import {
  BarChart2, FileText, CreditCard, Camera, CheckSquare,
  LogOut, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp,
  Sparkles, MessageCircle, Shield, ClipboardList, ArrowRight, Home,
  Settings, User, Phone, MapPin, Building2, ChevronLeft, CameraIcon
} from 'lucide-react';
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

type OwnerTab = 'progress' | 'docs' | 'payments' | 'photos' | 'approvals';

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
  const [activeTab, setActiveTab] = useState<OwnerTab>('progress');
  const [showSettings, setShowSettings] = useState(false);
  const [profile, setProfile] = useState<{ name: string; phone: string; avatar_url: string; email: string; region?: string } | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [designerInfo, setDesignerInfo] = useState<{ name: string; company: string } | null>(null);
  const [invitedProjects, setInvitedProjects] = useState<{ id: string; name: string; address?: string; client_name?: string; contract_amount?: number; designer?: { name: string; company: string } | null }[]>([]);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('name, phone, avatar_url, email, region')
        .eq('user_id', authUser.id)
        .single();
      if (profileData) {
        setProfile(profileData as { name: string; phone: string; avatar_url: string; email: string; region?: string });
        setEditName(profileData.name || '');
        setEditPhone(profileData.phone || '');
      }

      const { data } = await supabase.from('projects').select('*').eq('owner_email', authUser.email).maybeSingle();
      setProject(data);

      // If no project found via RLS, check for invited projects via API
      if (!data) {
        try {
          const res = await fetch('/api/owner-project');
          if (res.ok) {
            const json = await res.json();
            if (json.projects?.length > 0) setInvitedProjects(json.projects);
          }
        } catch { /* non-critical */ }
      }

      if (data?.id) {
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

        // Fetch designer info
        if (data.designer_id) {
          const { data: dProfile } = await supabase
            .from('profiles')
            .select('name, company')
            .eq('user_id', data.designer_id)
            .single();
          if (dProfile) setDesignerInfo(dProfile as { name: string; company: string });
        }
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

  const handleImportProject = async (projectId: string) => {
    setImporting(true);
    try {
      // Re-query project — RLS policy should now allow it
      const { data } = await supabase.from('projects').select('*').eq('id', projectId).maybeSingle();
      if (data) {
        setProject(data);
        setInvitedProjects([]);
        // Load related data
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
        if (data.designer_id) {
          const { data: dProfile } = await supabase.from('profiles').select('name, company').eq('user_id', data.designer_id).single();
          if (dProfile) setDesignerInfo(dProfile as { name: string; company: string });
        }
      }
    } finally {
      setImporting(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('profiles').update({ name: editName, phone: editPhone, updated_at: new Date().toISOString() }).eq('user_id', user.id);
      setProfile(prev => prev ? { ...prev, name: editName, phone: editPhone } : prev);
    } finally { setSaving(false); }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/avatar', { method: 'POST', body: fd });
      const json = await res.json();
      if (json.url) setProfile(prev => prev ? { ...prev, avatar_url: json.url } : prev);
    } finally { setAvatarUploading(false); }
  };

  const detectRegion = (address?: string): 'MY' | 'SG' => {
    if (!address) return 'MY';
    const lower = address.toLowerCase();
    if (lower.includes('singapore') || /\b\d{6}\b/.test(lower)) return 'SG';
    return 'MY';
  };

  const pendingVOs = variationOrders.filter(v => v.status === 'pending');
  const historyVOs = variationOrders.filter(v => v.status !== 'pending');
  const nextPayment = paymentPhases.find(p => p.status === 'pending' || p.status === 'not_due');

  const progressPct = (project?.progress as number) || 0;
  const contractTotal = (project?.contract_amount as number) || 0;
  const totalPaid = paymentPhases.filter(p => p.status === 'collected').reduce((s, p) => s + p.amount, 0);
  const totalPending = paymentPhases.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
  const totalAll = paymentPhases.reduce((s, p) => s + p.amount, 0);

  const tabs: { id: OwnerTab; icon: typeof BarChart2; label: string; badge?: number }[] = [
    { id: 'progress', icon: BarChart2, label: t.owner.progress },
    { id: 'docs', icon: FileText, label: t.owner.docs },
    { id: 'payments', icon: CreditCard, label: t.owner.payments },
    { id: 'photos', icon: Camera, label: t.owner.photos },
    { id: 'approvals', icon: CheckSquare, label: t.owner.approvals, badge: pendingVOs.length },
  ];

  /* ── Amount formatter — splits currency and number for styling ── */
  const amt = (v: number, opts?: { sign?: boolean; decimals?: boolean }) => {
    const sign = opts?.sign && v > 0 ? '+' : opts?.sign && v < 0 ? '-' : '';
    const abs = Math.abs(v);
    const num = abs.toLocaleString('en-MY', {
      minimumFractionDigits: opts?.decimals !== false ? 2 : 0,
      maximumFractionDigits: opts?.decimals !== false ? 2 : 0,
    });
    return { sign, num };
  };

  return (
    <div className="owner-shell">
      <style jsx>{`
        .owner-shell {
          --ow-blue: #4F8EF7;
          --ow-purple: #8B5CF6;
          --ow-pink: #EC4899;
          --ow-orange: #F97316;
          --ow-yellow: #FBBF24;
          --ow-grad: linear-gradient(135deg, var(--ow-blue), var(--ow-purple), var(--ow-pink));
          --ow-grad-full: linear-gradient(90deg, var(--ow-blue), var(--ow-purple), var(--ow-pink), var(--ow-orange), var(--ow-yellow));
          --ow-bg: #F0F2F7;
          --ow-card: #FFFFFF;
          --ow-text: #1A1D26;
          --ow-text2: #6B7280;
          --ow-text3: #9CA3AF;
          --ow-border: #E5E7EB;
          min-height: 100dvh;
          background: var(--ow-bg);
          display: flex;
          flex-direction: column;
          max-width: 480px;
          margin: 0 auto;
          position: relative;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        @media (min-width: 640px) {
          .owner-shell { max-width: 480px; box-shadow: 0 0 80px rgba(0,0,0,0.08); }
        }

        /* Gradient accent top */
        .ow-accent-bar {
          height: 3px;
          background: var(--ow-grad-full);
          flex-shrink: 0;
        }

        /* Header */
        .ow-header {
          background: var(--ow-card);
          padding: 16px 20px 14px;
          flex-shrink: 0;
          border-bottom: 1px solid rgba(0,0,0,0.04);
        }
        .ow-header-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .ow-greeting {
          font-size: 11px;
          font-weight: 600;
          color: var(--ow-text3);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .ow-project-name {
          font-size: 20px;
          font-weight: 700;
          color: var(--ow-text);
          margin-top: 1px;
          line-height: 1.2;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .ow-signout {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--ow-text3);
          border: none;
          background: transparent;
          cursor: pointer;
          flex-shrink: 0;
        }
        .ow-signout:active { background: rgba(0,0,0,0.04); }

        /* Stats row */
        .ow-stats {
          display: flex;
          gap: 6px;
          margin-top: 10px;
          flex-wrap: wrap;
        }
        .ow-chip {
          font-size: 11px;
          font-weight: 500;
          padding: 4px 10px;
          border-radius: 20px;
          background: #F3F4F6;
          color: var(--ow-text2);
          white-space: nowrap;
        }
        .ow-chip--active {
          background: linear-gradient(135deg, rgba(79,142,247,0.1), rgba(139,92,246,0.1));
          color: var(--ow-blue);
          font-weight: 600;
        }
        .ow-chip b { font-weight: 600; color: var(--ow-text); }
        .ow-chip--active b { color: var(--ow-blue); }

        /* Scrollable content */
        .ow-content {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 16px 16px 100px;
          -webkit-overflow-scrolling: touch;
        }

        /* Bottom tab bar */
        .ow-tabbar {
          position: fixed;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: 480px;
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border-top: 1px solid rgba(0,0,0,0.06);
          display: flex;
          padding: 6px 8px calc(env(safe-area-inset-bottom, 8px) + 6px);
          z-index: 40;
        }
        .ow-tab {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          padding: 6px 0;
          border: none;
          background: none;
          cursor: pointer;
          position: relative;
          font-size: 10px;
          font-weight: 500;
          color: var(--ow-text3);
          transition: color 0.15s;
          -webkit-tap-highlight-color: transparent;
        }
        .ow-tab--active {
          color: var(--ow-blue);
          font-weight: 600;
        }
        .ow-tab--active::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 2px;
          border-radius: 2px;
          background: var(--ow-grad);
        }
        .ow-tab-badge {
          position: absolute;
          top: 2px;
          right: calc(50% - 16px);
          min-width: 16px;
          height: 16px;
          border-radius: 16px;
          background: #EF4444;
          color: #fff;
          font-size: 9px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
        }

        /* Cards */
        .ow-card {
          background: var(--ow-card);
          border-radius: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02);
        }
        .ow-card + .ow-card { margin-top: 12px; }

        /* Progress ring */
        .ow-ring-wrap {
          position: relative;
          width: 120px;
          height: 120px;
          margin: 0 auto;
        }
        .ow-ring-center {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .ow-ring-pct {
          font-size: 32px;
          font-weight: 800;
          color: var(--ow-text);
          line-height: 1;
          font-variant-numeric: tabular-nums;
        }
        .ow-ring-label {
          font-size: 10px;
          color: var(--ow-text3);
          margin-top: 2px;
          font-weight: 500;
        }

        /* Amount display */
        .ow-amount {
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.02em;
        }
        .ow-amount-currency {
          font-weight: 600;
          opacity: 0.45;
          margin-right: 1px;
        }
        .ow-amount-value {
          font-weight: 800;
        }

        /* Timeline */
        .ow-timeline {
          position: relative;
          padding-left: 28px;
        }
        .ow-timeline::before {
          content: '';
          position: absolute;
          left: 9px;
          top: 4px;
          bottom: 4px;
          width: 2px;
          background: #E5E7EB;
          border-radius: 1px;
        }
        .ow-tl-item {
          position: relative;
          padding: 0 0 16px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .ow-tl-item:last-child { padding-bottom: 0; }
        .ow-tl-dot {
          position: absolute;
          left: -28px;
          top: 1px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .ow-tl-dot--done { background: #22C55E; }
        .ow-tl-dot--active { background: var(--ow-grad); }
        .ow-tl-dot--pending { background: #E5E7EB; }

        /* Empty state */
        .ow-empty {
          padding: 48px 24px;
          text-align: center;
        }
        .ow-empty-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(79,142,247,0.08), rgba(139,92,246,0.08));
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }

        /* Photo grid */
        .ow-photo-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .ow-photo-card {
          border-radius: 14px;
          overflow: hidden;
          background: var(--ow-card);
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
          cursor: pointer;
          position: relative;
        }
        .ow-photo-card img {
          width: 100%;
          aspect-ratio: 1;
          object-fit: cover;
          display: block;
        }
        .ow-photo-meta {
          padding: 8px 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 4px;
        }

        /* VO buttons */
        .ow-btn {
          flex: 1;
          height: 44px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
          border: none;
          transition: all 0.15s;
          -webkit-tap-highlight-color: transparent;
        }
        .ow-btn:active { transform: scale(0.98); }
        .ow-btn:disabled { opacity: 0.5; pointer-events: none; }
        .ow-btn--approve {
          background: linear-gradient(135deg, #22C55E, #16A34A);
          color: #fff;
        }
        .ow-btn--reject {
          background: #F3F4F6;
          color: var(--ow-text2);
        }
        .ow-btn--reject:active { background: #E5E7EB; }

        /* Section title */
        .ow-section-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--ow-text);
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* Loading skeleton pulse */
        @keyframes ow-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.15; }
        }
        .ow-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 60px 0;
          color: var(--ow-text3);
          font-size: 14px;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Rich empty states ── */
        @keyframes ow-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes ow-shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .ow-welcome-hero {
          position: relative;
          overflow: hidden;
          border-radius: 16px;
          background: linear-gradient(135deg, #1A1D26 0%, #2D1B4E 50%, #1A2744 100%);
          padding: 32px 24px;
          text-align: center;
        }
        .ow-welcome-hero::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(ellipse at 30% 50%, rgba(79,142,247,0.15) 0%, transparent 50%),
                      radial-gradient(ellipse at 70% 50%, rgba(139,92,246,0.12) 0%, transparent 50%),
                      radial-gradient(ellipse at 50% 80%, rgba(236,72,153,0.08) 0%, transparent 50%);
          pointer-events: none;
        }
        .ow-hero-icon-ring {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          margin: 0 auto 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(79,142,247,0.2), rgba(139,92,246,0.2));
          border: 2px solid rgba(255,255,255,0.1);
          animation: ow-float 3s ease-in-out infinite;
          position: relative;
        }
        .ow-hero-title {
          font-size: 20px;
          font-weight: 700;
          color: #fff;
          margin-bottom: 6px;
          position: relative;
        }
        .ow-hero-subtitle {
          font-size: 13px;
          color: rgba(255,255,255,0.55);
          line-height: 1.5;
          position: relative;
          max-width: 280px;
          margin: 0 auto;
        }
        .ow-step-list {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .ow-step {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 16px 18px;
          position: relative;
        }
        .ow-step + .ow-step { border-top: 1px solid #F3F4F6; }
        .ow-step-num {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          flex-shrink: 0;
        }
        .ow-step-content { flex: 1; min-width: 0; }
        .ow-step-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--ow-text);
          margin-bottom: 2px;
        }
        .ow-step-desc {
          font-size: 12px;
          color: var(--ow-text3);
          line-height: 1.4;
        }
        .ow-feature-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .ow-feature-card {
          border-radius: 14px;
          padding: 16px 14px;
          text-align: center;
          background: var(--ow-card);
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .ow-feature-card-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 10px;
        }
        .ow-feature-card-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--ow-text);
          margin-bottom: 2px;
        }
        .ow-feature-card-desc {
          font-size: 11px;
          color: var(--ow-text3);
          line-height: 1.3;
        }
        .ow-tip-card {
          border-radius: 14px;
          padding: 14px 16px;
          background: var(--ow-card);
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .ow-tip-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
      `}</style>

      {/* ── Top gradient accent ── */}
      <div className="ow-accent-bar" />

      {/* ── Sticky header ── */}
      <div className="ow-header">
        <div className="ow-header-top">
          {showSettings ? (
            <>
              <button className="ow-signout" onClick={() => setShowSettings(false)} style={{ marginRight: 8 }}>
                <ChevronLeft size={18} />
              </button>
              <div style={{ flex: 1, fontSize: 17, fontWeight: 700, color: 'var(--ow-text)' }}>Settings</div>
            </>
          ) : (
            <>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="ow-greeting">Your Renovation</div>
                <div className="ow-project-name">{(project?.name as string) || 'My Home'}</div>
              </div>
              <button className="ow-signout" onClick={() => setShowSettings(true)} title="Settings">
                <Settings size={16} />
              </button>
            </>
          )}
        </div>
        {!showSettings && (
          <div className="ow-stats">
            {[
              { k: 'Start', v: project?.start_date ? formatDate(project.start_date as string) : 'TBD' },
              { k: 'Status', v: project?.status === 'active' ? t.status.active : project?.status === 'completed' ? t.status.completed : t.status.pending, active: project?.status === 'active' },
              { k: 'End', v: project?.end_date ? formatDate(project.end_date as string) : 'TBD' },
            ].map(({ k, v, active }) => (
              <span key={k} className={`ow-chip ${active ? 'ow-chip--active' : ''}`}>
                {k}: <b>{v}</b>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Scrollable content ── */}
      <div className="ow-content">

        {/* ═══════════ SETTINGS PANEL ═══════════ */}
        {showSettings && (
          <>
            {/* Avatar + Identity */}
            <div className="ow-card" style={{ padding: '28px 20px', textAlign: 'center' }}>
              <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 14px' }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', padding: 3, background: 'var(--ow-grad)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 74, height: 74, borderRadius: '50%', background: '#F0F2F7', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <User size={32} color="#9CA3AF" />
                    )}
                  </div>
                </div>
                <label style={{ position: 'absolute', bottom: -2, right: -2, width: 28, height: 28, borderRadius: '50%', background: 'var(--ow-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid #fff' }}>
                  <CameraIcon size={13} color="#fff" />
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                </label>
                {avatarUploading && (
                  <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 20, height: 20, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                  </div>
                )}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ow-text)' }}>{profile?.name || 'Owner'}</div>
              <div style={{ fontSize: 12, color: 'var(--ow-text3)', marginTop: 2 }}>{profile?.email || ''}</div>
            </div>

            {/* Personal Info */}
            <div className="ow-card" style={{ padding: '18px', marginTop: 12 }}>
              <div className="ow-section-title" style={{ marginBottom: 14 }}>
                <User size={15} color="var(--ow-blue)" /> Personal Info
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ow-text3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 14, color: 'var(--ow-text)', background: '#FAFBFC', outline: 'none', fontFamily: 'inherit' }}
                  placeholder="Your name"
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ow-text3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>Phone</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 14, color: 'var(--ow-text)', background: '#FAFBFC', outline: 'none', fontFamily: 'inherit' }}
                  placeholder="+60 12 345 6789"
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ow-text3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>Email</label>
                <div style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid #F0F1F3', fontSize: 14, color: 'var(--ow-text3)', background: '#F3F4F6' }}>
                  {profile?.email || '—'}
                </div>
                <div style={{ fontSize: 10, color: 'var(--ow-text3)', marginTop: 3 }}>Managed by login provider</div>
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={saving}
                style={{ width: '100%', height: 44, borderRadius: 12, border: 'none', background: 'var(--ow-grad)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            {/* Project Info */}
            <div className="ow-card" style={{ padding: '18px', marginTop: 12 }}>
              <div className="ow-section-title" style={{ marginBottom: 14 }}>
                <MapPin size={15} color="var(--ow-blue)" /> Project Info
              </div>
              {project ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { label: 'Project', value: (project.name as string) || '—', icon: Home },
                    { label: 'Address', value: (project.address as string) || '—', icon: MapPin },
                    { label: 'Designer', value: designerInfo?.name || '—', icon: User },
                    { label: 'Company', value: designerInfo?.company || '—', icon: Building2 },
                    { label: 'Region', value: detectRegion(project.address as string), icon: MapPin },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(79,142,247,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <row.icon size={14} color="var(--ow-blue)" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--ow-text3)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{row.label}</div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ow-text)', marginTop: 1, wordBreak: 'break-word' }}>{row.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <p style={{ fontSize: 13, color: 'var(--ow-text3)' }}>No project linked yet</p>
                </div>
              )}
            </div>

            {/* Sign out */}
            <div className="ow-card" style={{ padding: '4px', marginTop: 12 }}>
              <button
                onClick={handleSignOut}
                style={{ width: '100%', height: 48, borderRadius: 12, border: 'none', background: 'transparent', color: '#EF4444', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          </>
        )}

        {/* ═══════════ PROGRESS TAB ═══════════ */}
        {!showSettings && activeTab === 'progress' && (
          loading ? <div className="ow-loading">Loading...</div> : !project ? (
            <>
              {/* Welcome hero */}
              <div className="ow-welcome-hero">
                <div className="ow-hero-icon-ring">
                  <Home size={32} color="#fff" />
                </div>
                <div className="ow-hero-title">Welcome to RenoSmart</div>
                <div className="ow-hero-subtitle">Your renovation journey starts here. Once your designer connects your project, you&apos;ll track everything in real-time.</div>

                {/* One-click import for invited projects */}
                {invitedProjects.length > 0 && (
                  <div style={{ marginTop: 20 }}>
                    {invitedProjects.map(ip => (
                      <div key={ip.id} style={{
                        background: 'rgba(255,255,255,0.08)',
                        borderRadius: 14,
                        padding: '16px 18px',
                        marginBottom: 10,
                        border: '1px solid rgba(240,185,11,0.25)',
                        backdropFilter: 'blur(8px)',
                        textAlign: 'left',
                      }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                          Your Project
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                          {ip.name || ip.client_name || 'Renovation Project'}
                        </div>
                        {ip.address && (
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <MapPin size={12} /> {ip.address}
                          </div>
                        )}
                        {ip.designer && (
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Building2 size={12} /> {ip.designer.name}{ip.designer.company ? ` \u00B7 ${ip.designer.company}` : ''}
                          </div>
                        )}
                        {ip.contract_amount && ip.contract_amount > 0 && (
                          <div style={{ fontSize: 12, color: '#F0B90B', fontWeight: 600, marginTop: 6 }}>
                            RM {ip.contract_amount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                          </div>
                        )}
                        <button
                          onClick={() => handleImportProject(ip.id)}
                          disabled={importing}
                          style={{
                            marginTop: 14,
                            width: '100%',
                            height: 44,
                            borderRadius: 12,
                            border: 'none',
                            background: 'linear-gradient(135deg, #F0B90B, #F5D04E)',
                            color: '#1A1D26',
                            fontSize: 14,
                            fontWeight: 700,
                            cursor: importing ? 'wait' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            opacity: importing ? 0.7 : 1,
                            transition: 'opacity 0.2s',
                          }}
                        >
                          {importing ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ width: 16, height: 16, border: '2px solid rgba(26,29,38,0.3)', borderTopColor: '#1A1D26', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
                              Loading...
                            </span>
                          ) : (
                            <>
                              <ArrowRight size={16} />
                              Import Project
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* How it works */}
              <div className="ow-card" style={{ marginTop: 12, overflow: 'hidden' }}>
                <div style={{ padding: '16px 18px 0', fontSize: 13, fontWeight: 700, color: 'var(--ow-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={14} color="#8B5CF6" /> Getting Started
                </div>
                <div className="ow-step-list">
                  {[
                    { num: 1, title: 'Designer creates your project', desc: 'Your designer uploads quotation and sets up the project timeline', color: '#4F8EF7', bg: 'rgba(79,142,247,0.1)' },
                    { num: 2, title: 'You get connected', desc: 'Your designer links your email to the project for access', color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
                    { num: 3, title: 'Track in real-time', desc: 'View progress, photos, payments, and approve changes — all here', color: '#EC4899', bg: 'rgba(236,72,153,0.1)' },
                  ].map(s => (
                    <div key={s.num} className="ow-step">
                      <div className="ow-step-num" style={{ background: s.bg, color: s.color }}>{s.num}</div>
                      <div className="ow-step-content">
                        <div className="ow-step-title">{s.title}</div>
                        <div className="ow-step-desc">{s.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feature preview cards */}
              <div style={{ marginTop: 12 }}>
                <div className="ow-feature-grid">
                  {[
                    { icon: BarChart2, title: 'Live Progress', desc: 'Real-time milestones & completion tracking', color: '#4F8EF7', bg: 'rgba(79,142,247,0.08)' },
                    { icon: Camera, title: 'Site Photos', desc: 'Workers upload daily photos for you', color: '#22C55E', bg: 'rgba(34,197,94,0.08)' },
                    { icon: CreditCard, title: 'Payments', desc: 'Track every payment phase clearly', color: '#F97316', bg: 'rgba(249,115,22,0.08)' },
                    { icon: CheckSquare, title: 'Approvals', desc: 'Review & approve variation orders', color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)' },
                  ].map(f => (
                    <div key={f.title} className="ow-feature-card">
                      <div className="ow-feature-card-icon" style={{ background: f.bg }}>
                        <f.icon size={20} color={f.color} />
                      </div>
                      <div className="ow-feature-card-title">{f.title}</div>
                      <div className="ow-feature-card-desc">{f.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact tip */}
              <div className="ow-tip-card" style={{ marginTop: 12 }}>
                <div className="ow-tip-icon" style={{ background: 'rgba(79,142,247,0.08)' }}>
                  <MessageCircle size={18} color="#4F8EF7" />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ow-text)', marginBottom: 2 }}>{t.owner.noProjectHint}</div>
                  <div style={{ fontSize: 12, color: 'var(--ow-text3)', lineHeight: 1.4 }}>Share your email with your designer so they can connect you to your project.</div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Progress ring + contract value */}
              <div className="ow-card" style={{ padding: '28px 20px 24px' }}>
                <div className="ow-ring-wrap">
                  <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
                    <defs>
                      <linearGradient id="owGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#4F8EF7" />
                        <stop offset="45%" stopColor="#8B5CF6" />
                        <stop offset="80%" stopColor="#EC4899" />
                        <stop offset="100%" stopColor="#F97316" />
                      </linearGradient>
                    </defs>
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#F0F1F5" strokeWidth="8" />
                    <circle cx="60" cy="60" r="50" fill="none" stroke="url(#owGrad)" strokeWidth="8"
                      strokeDasharray={`${(progressPct / 100) * 314} 314`} strokeLinecap="round"
                      style={{ transition: 'stroke-dasharray 0.6s ease' }} />
                  </svg>
                  <div className="ow-ring-center">
                    <span className="ow-ring-pct">{progressPct}<span style={{ fontSize: 18, fontWeight: 700 }}>%</span></span>
                    <span className="ow-ring-label">Complete</span>
                  </div>
                </div>

                {contractTotal > 0 && (
                  <div style={{ textAlign: 'center', marginTop: 20 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--ow-text3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>Contract Value</div>
                    <div className="ow-amount" style={{ fontSize: 26, lineHeight: 1 }}>
                      <span className="ow-amount-currency" style={{ fontSize: 14 }}>RM</span>
                      <span className="ow-amount-value" style={{ color: 'var(--ow-text)' }}>
                        {contractTotal.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Milestone timeline */}
              <div className="ow-card" style={{ padding: '20px', marginTop: 12 }}>
                <div className="ow-section-title">{t.owner.milestoneTimeline}</div>
                {milestones.length > 0 ? (
                  <div className="ow-timeline">
                    {milestones.map((m, i) => {
                      const done = m.progress >= 100;
                      const active = !done && m.progress > 0;
                      return (
                        <div key={m.id} className="ow-tl-item">
                          <div className={`ow-tl-dot ${done ? 'ow-tl-dot--done' : active ? 'ow-tl-dot--active' : 'ow-tl-dot--pending'}`}>
                            {done ? <CheckCircle2 size={12} color="#fff" /> : active ? <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} /> : <span style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF' }}>{i + 1}</span>}
                          </div>
                          <span style={{ flex: 1, fontSize: 13, fontWeight: active ? 600 : 400, color: done ? '#9CA3AF' : active ? 'var(--ow-text)' : '#9CA3AF', textDecoration: done ? 'line-through' : 'none' }}>
                            {m.name}
                          </span>
                          {active && (
                            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ow-blue)', background: 'rgba(79,142,247,0.08)', padding: '2px 8px', borderRadius: 20, flexShrink: 0 }}>
                              {m.progress}%
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ fontSize: 13, color: 'var(--ow-text3)' }}>{t.owner.noProjectHint}</p>
                )}
              </div>
            </>
          )
        )}

        {/* ═══════════ DOCS TAB ═══════════ */}
        {!showSettings && activeTab === 'docs' && (
          <>
            <div className="ow-card" style={{ padding: '32px 24px', textAlign: 'center', overflow: 'hidden', position: 'relative' }}>
              {/* Decorative background */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--ow-grad-full)' }} />
              <div className="ow-empty-icon" style={{ margin: '0 auto 16px', width: 64, height: 64, borderRadius: 20 }}>
                <FileText size={30} color="#4F8EF7" />
              </div>
              <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--ow-text)', marginBottom: 4 }}>{t.owner.noDocs}</p>
              <p style={{ fontSize: 13, color: 'var(--ow-text3)', lineHeight: 1.5, maxWidth: 260, margin: '0 auto' }}>
                Your designer will share quotations, contracts, and project documents here for easy access.
              </p>
            </div>

            {/* Document types preview */}
            <div className="ow-card" style={{ marginTop: 12, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px 0', fontSize: 13, fontWeight: 700, color: 'var(--ow-text)' }}>Documents you&apos;ll receive</div>
              {[
                { icon: ClipboardList, title: 'Original Quotation', desc: 'Review the full quotation uploaded by your designer', color: '#4F8EF7', bg: 'rgba(79,142,247,0.08)' },
                { icon: FileText, title: 'Contract Agreement', desc: 'Terms, scope, and payment schedule', color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)' },
                { icon: Shield, title: 'Warranty Documents', desc: 'Workmanship and material warranties', color: '#22C55E', bg: 'rgba(34,197,94,0.08)' },
              ].map((d, i) => (
                <div key={d.title} style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, borderTop: i > 0 ? '1px solid #F3F4F6' : 'none', opacity: 0.65 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: d.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <d.icon size={18} color={d.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ow-text)' }}>{d.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--ow-text3)' }}>{d.desc}</div>
                  </div>
                  <ArrowRight size={14} color="#D1D5DB" />
                </div>
              ))}
            </div>
          </>
        )}

        {/* ═══════════ PAYMENTS TAB ═══════════ */}
        {!showSettings && activeTab === 'payments' && (
          <>
            {/* Summary strip */}
            {paymentPhases.length > 0 && (
              <div className="ow-card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Gradient header strip */}
                <div style={{ height: 3, background: 'var(--ow-grad-full)' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '14px 0' }}>
                  {[
                    { label: 'Total', value: totalAll, color: 'var(--ow-text)' },
                    { label: 'Paid', value: totalPaid, color: '#16A34A' },
                    { label: 'Due', value: totalPending, color: '#D97706' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ textAlign: 'center', borderRight: label !== 'Due' ? '1px solid #F3F4F6' : 'none' }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--ow-text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{label}</div>
                      <div className="ow-amount" style={{ fontSize: 18 }}>
                        <span className="ow-amount-currency" style={{ fontSize: 11 }}>RM</span>
                        <span className="ow-amount-value" style={{ color }}>{value.toLocaleString('en-MY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Next payment callout */}
            {nextPayment && (
              <div className="ow-card" style={{ padding: '16px 18px', marginTop: 12, borderLeft: '4px solid transparent', borderImage: 'linear-gradient(to bottom, #4F8EF7, #8B5CF6) 1' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--ow-text3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t.owner.nextPayment}</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ow-text2)', marginTop: 2 }}>{nextPayment.label}</div>
                  </div>
                  <div className="ow-amount" style={{ fontSize: 24, textAlign: 'right' }}>
                    <span className="ow-amount-currency" style={{ fontSize: 13 }}>RM</span>
                    <span className="ow-amount-value" style={{ color: 'var(--ow-text)' }}>
                      {nextPayment.amount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {!nextPayment && paymentPhases.length > 0 && (
              <div className="ow-card" style={{ padding: '14px 18px', marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle2 size={18} color="#22C55E" />
                <span style={{ fontSize: 14, fontWeight: 600, color: '#16A34A' }}>{t.pay.collected}</span>
              </div>
            )}

            {/* Phase breakdown */}
            {paymentPhases.length > 0 ? (
              <div className="ow-card" style={{ marginTop: 12, overflow: 'hidden' }}>
                {paymentPhases.map((phase, i) => (
                  <div key={phase.id} style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderTop: i > 0 ? '1px solid #F3F4F6' : 'none' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ow-text)' }}>{phase.label}</div>
                      {phase.due_date && <div style={{ fontSize: 11, color: 'var(--ow-text3)', marginTop: 2 }}>{formatDate(phase.due_date)}</div>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <div className="ow-amount" style={{ fontSize: 16, textAlign: 'right' }}>
                        <span className="ow-amount-currency" style={{ fontSize: 11 }}>RM</span>
                        <span className="ow-amount-value" style={{ color: 'var(--ow-text)' }}>
                          {phase.amount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
                        ...(phase.status === 'collected' ? { background: 'rgba(34,197,94,0.1)', color: '#16A34A' } :
                           phase.status === 'pending' ? { background: 'linear-gradient(135deg, rgba(79,142,247,0.1), rgba(139,92,246,0.1))', color: '#4F8EF7' } :
                           { background: '#F3F4F6', color: '#9CA3AF' })
                      }}>
                        {phase.status === 'collected' ? t.pay.statusCollected :
                         phase.status === 'pending' ? t.pay.statusPending :
                         t.pay.statusNotDue}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* Empty payment state — rich */}
                <div className="ow-card" style={{ padding: '28px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--ow-grad-full)' }} />
                  <div className="ow-empty-icon" style={{ margin: '0 auto 16px', width: 64, height: 64, borderRadius: 20, background: 'rgba(249,115,22,0.08)' }}>
                    <CreditCard size={30} color="#F97316" />
                  </div>
                  <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--ow-text)', marginBottom: 4 }}>No payment schedule yet</p>
                  <p style={{ fontSize: 13, color: 'var(--ow-text3)', lineHeight: 1.5, maxWidth: 260, margin: '0 auto' }}>
                    {t.owner.contactDesigner}
                  </p>
                </div>

                {/* How payments work */}
                <div className="ow-card" style={{ marginTop: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 18px 0', fontSize: 13, fontWeight: 700, color: 'var(--ow-text)' }}>How payment works</div>
                  {[
                    { num: '1', title: 'Phase-based schedule', desc: 'Payments split into 3-5 phases tied to project milestones', color: '#4F8EF7', bg: 'rgba(79,142,247,0.1)' },
                    { num: '2', title: 'Clear due dates', desc: 'Each phase shows amount due and payment deadline', color: '#F97316', bg: 'rgba(249,115,22,0.1)' },
                    { num: '3', title: 'Status tracking', desc: 'Track what\'s been paid, what\'s pending, and what\'s upcoming', color: '#22C55E', bg: 'rgba(34,197,94,0.1)' },
                  ].map((s, i) => (
                    <div key={s.num} style={{ padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 12, borderTop: i > 0 ? '1px solid #F3F4F6' : 'none' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{s.num}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ow-text)' }}>{s.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--ow-text3)' }}>{s.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* ═══════════ PHOTOS TAB ═══════════ */}
        {!showSettings && activeTab === 'photos' && (
          sitePhotos.length === 0 ? (
            <>
              <div className="ow-card" style={{ padding: '32px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--ow-grad-full)' }} />
                <div className="ow-empty-icon" style={{ margin: '0 auto 16px', width: 64, height: 64, borderRadius: 20, background: 'rgba(34,197,94,0.08)' }}>
                  <Camera size={30} color="#22C55E" />
                </div>
                <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--ow-text)', marginBottom: 4 }}>{t.owner.noPhotos}</p>
                <p style={{ fontSize: 13, color: 'var(--ow-text3)', lineHeight: 1.5, maxWidth: 260, margin: '0 auto' }}>
                  Workers will upload daily progress photos. Your designer reviews and approves them for you.
                </p>
              </div>

              {/* Sample photo placeholders */}
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ow-text)', marginBottom: 10 }}>What you&apos;ll see</div>
                <div className="ow-photo-grid">
                  {[
                    { trade: 'Tiling', color: '#4F8EF7' },
                    { trade: 'Electrical', color: '#F97316' },
                    { trade: 'Carpentry', color: '#8B5CF6' },
                    { trade: 'Painting', color: '#22C55E' },
                  ].map(p => (
                    <div key={p.trade} className="ow-photo-card" style={{ opacity: 0.5, pointerEvents: 'none' }}>
                      <div style={{ width: '100%', aspectRatio: '1', background: `linear-gradient(135deg, ${p.color}15, ${p.color}08)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Camera size={24} color={p.color} style={{ opacity: 0.4 }} />
                      </div>
                      <div className="ow-photo-meta">
                        <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 6px', background: '#F3F4F6', borderRadius: 10, color: 'var(--ow-text2)' }}>{p.trade}</span>
                        <span style={{ fontSize: 10, color: 'var(--ow-text3)' }}>Pending</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ow-text3)', marginBottom: 12 }}>
                {sitePhotos.length} {t.owner.approvedPhotos}
              </div>
              <div className="ow-photo-grid">
                {sitePhotos.map(photo => (
                  <div key={photo.id} className="ow-photo-card" onClick={() => setOwnerLightbox(photo.url)}>
                    <img src={photo.url} alt={photo.caption || 'Site photo'} />
                    <div className="ow-photo-meta">
                      {photo.trade
                        ? <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 6px', background: '#F3F4F6', borderRadius: 10, color: 'var(--ow-text2)' }}>{photo.trade}</span>
                        : <span />}
                      <span style={{ fontSize: 10, color: 'var(--ow-text3)' }}>{new Date(photo.created_at).toLocaleDateString('en-MY')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )
        )}

        {/* ═══════════ APPROVALS TAB ═══════════ */}
        {!showSettings && activeTab === 'approvals' && (
          loading ? <div className="ow-loading">Loading...</div> : (
            <>
              {/* Pending VOs */}
              <div className="ow-section-title">
                <Clock size={16} color="#D97706" />
                {t.owner.pendingApproval} ({pendingVOs.length})
              </div>
              {pendingVOs.length === 0 ? (
                <div className="ow-card" style={{ padding: '28px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--ow-grad-full)' }} />
                  <div className="ow-empty-icon" style={{ margin: '0 auto 14px', width: 56, height: 56, borderRadius: 16, background: 'rgba(34,197,94,0.08)' }}>
                    <CheckCircle2 size={26} color="#22C55E" />
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--ow-text)', marginBottom: 4 }}>{t.owner.noPendingVO}</p>
                  <p style={{ fontSize: 12, color: 'var(--ow-text3)', lineHeight: 1.5, maxWidth: 240, margin: '0 auto' }}>
                    When your designer submits a variation order (scope change), it will appear here for your review.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {pendingVOs.map(vo => {
                    const voItems: VOItem[] = (vo.items as VOItem[] | undefined) || [];
                    const isExpanded = expandedVOId === vo.id;
                    return (
                      <div key={vo.id} className="ow-card" style={{ padding: '18px', borderLeft: '4px solid transparent', borderImage: 'linear-gradient(to bottom, #4F8EF7, #8B5CF6, #EC4899) 1' }}>
                        {/* Top row */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                              <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, background: '#F3F4F6', padding: '2px 7px', borderRadius: 4, color: 'var(--ow-text2)' }}>{vo.vo_number}</span>
                              <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: 'linear-gradient(135deg, rgba(79,142,247,0.1), rgba(139,92,246,0.1))', color: '#4F8EF7' }}>{t.owner.pendingApproval}</span>
                            </div>
                            <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--ow-text)', lineHeight: 1.4 }}>{vo.description}</p>
                            <p style={{ fontSize: 11, color: 'var(--ow-text3)', marginTop: 4 }}>{formatDate(vo.created_at)}</p>
                          </div>
                          <div className="ow-amount" style={{ fontSize: 22, textAlign: 'right', flexShrink: 0 }}>
                            {vo.amount > 0 && <span style={{ color: '#22C55E', fontSize: 14, fontWeight: 700 }}>+</span>}
                            {vo.amount < 0 && <span style={{ color: '#EF4444', fontSize: 14, fontWeight: 700 }}>-</span>}
                            <span className="ow-amount-currency" style={{ fontSize: 12 }}>RM</span>
                            <span className="ow-amount-value" style={{ color: vo.amount >= 0 ? 'var(--ow-text)' : '#EF4444' }}>
                              {Math.abs(vo.amount).toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>

                        {/* Expandable items */}
                        {voItems.length > 0 && (
                          <div style={{ marginBottom: 14 }}>
                            <button
                              onClick={() => setExpandedVOId(isExpanded ? null : vo.id)}
                              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: 'var(--ow-blue)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            >
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              {isExpanded ? t.owner.collapseDetails : `${t.owner.viewDetails} (${voItems.length})`}
                            </button>
                            {isExpanded && (
                              <div style={{ marginTop: 10, background: '#F9FAFB', borderRadius: 12, overflow: 'hidden' }}>
                                <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                                  <thead>
                                    <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                                      <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--ow-text3)', width: 28 }}>#</th>
                                      <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--ow-text3)' }}>{t.owner.description}</th>
                                      <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--ow-text3)' }}>{t.owner.subtotal}</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {voItems.map((item, idx) => (
                                      <tr key={idx} style={{ borderTop: idx > 0 ? '1px solid #F0F1F3' : 'none' }}>
                                        <td style={{ padding: '8px 12px', color: 'var(--ow-text3)' }}>{item.no || idx + 1}</td>
                                        <td style={{ padding: '8px 12px', color: 'var(--ow-text)' }}>{item.description}</td>
                                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--ow-text)' }}>
                                          <span style={{ opacity: 0.4 }}>RM </span>{Number(item.total || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: 10 }}>
                          <button className="ow-btn ow-btn--approve" onClick={() => handleVOAction(vo.id, 'approved')} disabled={voLoading}>
                            <CheckCircle2 size={16} /> {t.owner.acceptChange}
                          </button>
                          <button className="ow-btn ow-btn--reject" onClick={() => handleVOAction(vo.id, 'rejected')} disabled={voLoading}>
                            <XCircle size={16} /> {t.owner.reject}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* History */}
              {historyVOs.length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <div className="ow-section-title">{t.owner.approvalHistory}</div>
                  <div className="ow-card" style={{ overflow: 'hidden' }}>
                    {historyVOs.map((vo, i) => (
                      <div key={vo.id} style={{
                        padding: '14px 18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        borderTop: i > 0 ? '1px solid #F3F4F6' : 'none',
                        borderLeft: `3px solid ${vo.status === 'approved' ? '#22C55E' : '#D1D5DB'}`,
                      }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                            <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--ow-text3)' }}>{vo.vo_number}</span>
                            {vo.status === 'approved'
                              ? <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 20, background: 'rgba(34,197,94,0.1)', color: '#16A34A' }}>{t.owner.accepted}</span>
                              : <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 20, background: '#F3F4F6', color: '#9CA3AF' }}>{t.owner.rejected}</span>
                            }
                          </div>
                          <p style={{ fontSize: 13, color: 'var(--ow-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{vo.description}</p>
                          {vo.approved_at && <p style={{ fontSize: 11, color: 'var(--ow-text3)', marginTop: 2 }}>{formatDate(vo.approved_at)}</p>}
                        </div>
                        <div className="ow-amount" style={{ fontSize: 15, flexShrink: 0, textDecoration: vo.status === 'rejected' ? 'line-through' : 'none', color: vo.status === 'rejected' ? 'var(--ow-text3)' : 'var(--ow-text)' }}>
                          +<span className="ow-amount-currency" style={{ fontSize: 10 }}>RM</span>
                          <span className="ow-amount-value">{vo.amount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )
        )}
      </div>

      {/* ── Fixed bottom tab bar ── */}
      {!showSettings && <nav className="ow-tabbar">
        {tabs.map(({ id, icon: Icon, label, badge }) => (
          <button key={id} className={`ow-tab ${activeTab === id ? 'ow-tab--active' : ''}`} onClick={() => setActiveTab(id)}>
            <Icon size={20} />
            <span>{label}</span>
            {badge != null && badge > 0 && <span className="ow-tab-badge">{badge}</span>}
          </button>
        ))}
      </nav>}

      {/* Lightbox */}
      {ownerLightbox && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, cursor: 'pointer' }} onClick={() => setOwnerLightbox(null)}>
          <img src={ownerLightbox} alt="Photo" style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }} />
        </div>
      )}
    </div>
  );
}
