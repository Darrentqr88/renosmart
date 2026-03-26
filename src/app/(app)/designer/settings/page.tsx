'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { Loader2, User, Building2, CreditCard, Crown, Users, UserPlus, UserMinus, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';

type SettingsTab = 'profile' | 'company' | 'plan' | 'team';

interface TeamMember {
  id: string;
  user_id: string | null;
  email: string;
  role: 'owner' | 'member';
  status: 'pending' | 'active' | 'removed';
  invited_at: string;
  joined_at: string | null;
}

interface TeamInfo {
  id: string;
  name: string;
  elite_slots: number;
  maxMembers: number;
  teamMonthlyLimit: number;
  teamUsage: number;
}

export default function SettingsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [loading, setLoading] = useState(false);

  // Profile fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Company fields
  const [company, setCompany] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');

  // Plan info
  const [currentPlan, setCurrentPlan] = useState('free');
  const [userId, setUserId] = useState('');

  // Team state
  const [teamInfo, setTeamInfo] = useState<TeamInfo | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [usageMap, setUsageMap] = useState<Record<string, number>>({});
  const [inviteEmail, setInviteEmail] = useState('');
  const [teamLoading, setTeamLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUserId(session.user.id);
      setEmail(session.user.email || '');

      const { data } = await supabase.from('profiles').select('*').eq('user_id', session.user.id).single();
      if (data) {
        setName(data.name || '');
        setPhone(data.phone || '');
        setCompany(data.company || '');
        setCompanyAddress(data.company_address || '');
        setCurrentPlan(data.plan || 'free');
        setAvatarUrl(data.avatar_url || '');
      }
    })();
  }, []);

  const loadTeam = useCallback(async () => {
    const res = await fetch('/api/team/members');
    if (res.ok) {
      const data = await res.json();
      setTeamInfo(data.team);
      setTeamMembers(data.members || []);
      setUsageMap(data.usageMap || {});
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'team' && currentPlan === 'elite') loadTeam();
  }, [activeTab, currentPlan, loadTeam]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setTeamLoading(true);
    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { toast({ title: '邀请失败', description: data.error, variant: 'destructive' }); return; }
      toast({ title: '邀请已发送', description: data.message });
      setInviteEmail('');
      loadTeam();
    } finally {
      setTeamLoading(false);
    }
  };

  const handleRemove = async (memberId: string) => {
    setTeamLoading(true);
    try {
      const res = await fetch('/api/team/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId }),
      });
      if (res.ok) { toast({ title: '成员已移除' }); loadTeam(); }
      else { const d = await res.json(); toast({ title: '操作失败', description: d.error, variant: 'destructive' }); }
    } finally {
      setTeamLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await supabase.from('profiles').update({
        name,
        phone,
        updated_at: new Date().toISOString(),
      }).eq('user_id', userId);
      toast({ title: 'Profile saved!', description: 'Your profile has been updated.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCompany = async () => {
    setLoading(true);
    try {
      await supabase.from('profiles').update({
        company,
        company_address: companyAddress,
        updated_at: new Date().toISOString(),
      }).eq('user_id', userId);
      toast({ title: 'Company info saved!' });
    } finally {
      setLoading(false);
    }
  };

  const PLAN_CONFIG = {
    free:  { label: 'Free', color: 'bg-gray-100 text-gray-600', border: 'border-gray-200' },
    pro:   { label: 'Pro ✦', color: 'bg-[#4F8EF7]/15 text-[#2563EB]', border: 'border-[#4F8EF7]/30' },
    elite: { label: 'Elite ⚡', color: 'bg-purple-50 text-purple-700', border: 'border-purple-200' },
  };
  const planCfg = PLAN_CONFIG[currentPlan as keyof typeof PLAN_CONFIG] || PLAN_CONFIG.free;

  const tabs: { id: SettingsTab; label: string; icon: typeof User; eliteOnly?: boolean }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'company', label: 'Company', icon: Building2 },
    { id: 'plan', label: 'Plan', icon: CreditCard },
    { id: 'team', label: '团队管理', icon: Users, eliteOnly: true },
  ];

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <Toaster />
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

        {/* Tab row */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit flex-wrap">
          {tabs.filter(t => !t.eliteOnly || currentPlan === 'elite').map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-5">Personal Information</h2>

            {/* Avatar placeholder */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-[#4F8EF7]/20 flex items-center justify-center">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-[#4F8EF7]">{name?.[0]?.toUpperCase() || 'U'}</span>
                )}
              </div>
              <div>
                <p className="font-medium text-gray-800">{name || 'Designer'}</p>
                <p className="text-sm text-gray-500">{email}</p>
                <Badge className={`${planCfg.color} border ${planCfg.border} text-xs mt-1`}>
                  <Crown className="w-3 h-3 mr-1" />
                  {planCfg.label}
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm text-gray-700">Full Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} className="mt-1" placeholder="Your full name" />
              </div>
              <div>
                <Label className="text-sm text-gray-700">Email</Label>
                <Input value={email} disabled className="mt-1 bg-gray-50 text-gray-500" />
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed here.</p>
              </div>
              <div>
                <Label className="text-sm text-gray-700">Phone Number</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} className="mt-1" placeholder="+60123456789" />
              </div>
            </div>

            <Button variant="gold" onClick={handleSaveProfile} disabled={loading} className="mt-6 w-full">
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Save Profile
            </Button>
          </div>
        )}

        {/* Company Tab */}
        {activeTab === 'company' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-5">Company Information</h2>
            <p className="text-sm text-gray-500 mb-5">
              This information appears on your quotations and client documents.
            </p>
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-gray-700">Company Name</Label>
                <Input value={company} onChange={e => setCompany(e.target.value)} className="mt-1" placeholder="Your Renovation Co." />
              </div>
              <div>
                <Label className="text-sm text-gray-700">Company Address</Label>
                <textarea
                  value={companyAddress}
                  onChange={e => setCompanyAddress(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F8EF7]/30 focus:border-[#4F8EF7] resize-none"
                  placeholder="Full business address"
                />
              </div>
            </div>
            <Button variant="gold" onClick={handleSaveCompany} disabled={loading} className="mt-6 w-full">
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Save Company Info
            </Button>
          </div>
        )}

        {/* Team Tab */}
        {activeTab === 'team' && currentPlan === 'elite' && (
          <div className="space-y-4">
            {/* Header card */}
            <div className="bg-white rounded-2xl border-2 border-purple-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">
                      Elite 团队 — {teamInfo?.elite_slots ?? 1} 个配套
                    </h2>
                    <p className="text-xs text-gray-500">
                      上限 {teamInfo?.maxMembers ?? 5} 人 · {teamInfo?.teamMonthlyLimit ?? 250} 次/月共享
                    </p>
                  </div>
                </div>
                <Badge className="bg-purple-50 text-purple-700 border border-purple-200">Elite ⚡</Badge>
              </div>

              {/* Usage bar */}
              {teamInfo && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>本月团队用量</span>
                    <span>{teamInfo.teamUsage} / {teamInfo.teamMonthlyLimit} 次</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (teamInfo.teamUsage / teamInfo.teamMonthlyLimit) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Buy more slots */}
              <Button
                variant="outline"
                size="sm"
                className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
                onClick={() => router.push('/designer/pricing')}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                购买更多配套 — RM299/月 = +5 人名额 +250 次
              </Button>
            </div>

            {/* Members list */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4" />
                成员列表
                <span className="text-xs font-normal text-gray-400 ml-1">
                  ({teamMembers.filter(m => m.status !== 'removed').length + 1} / {teamInfo?.maxMembers ?? 5} 人)
                </span>
              </h3>

              <div className="space-y-2">
                {/* Owner row */}
                <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-purple-50">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-medium text-gray-800">{email}</span>
                    <Badge className="text-xs bg-purple-100 text-purple-700 border-0">Owner</Badge>
                  </div>
                  <span className="text-xs text-gray-500">{usageMap[userId] ?? 0} 次/月</span>
                </div>

                {/* Member rows */}
                {teamMembers.map(member => (
                  <div key={member.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        member.status === 'active' ? 'bg-green-400' : 'bg-yellow-400'
                      }`} />
                      <span className="text-sm text-gray-700 truncate">{member.email}</span>
                      <Badge className={`text-xs border-0 flex-shrink-0 ${
                        member.status === 'active'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-yellow-50 text-yellow-700'
                      }`}>
                        {member.status === 'active' ? 'Active' : 'Pending'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 ml-2">
                      {member.status === 'active' && (
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {usageMap[member.user_id ?? ''] ?? 0} 次/月
                        </span>
                      )}
                      <button
                        onClick={() => handleRemove(member.id)}
                        disabled={teamLoading}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="移除成员"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {teamMembers.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">尚未邀请任何成员</p>
                )}
              </div>
            </div>

            {/* Invite form */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                邀请新成员
              </h3>
              {teamInfo && (teamMembers.filter(m => m.status !== 'removed').length + 1) >= teamInfo.maxMembers ? (
                <p className="text-sm text-amber-600 bg-amber-50 rounded-lg px-4 py-3">
                  团队已满员 ({teamInfo.maxMembers} 人)。
                  <button onClick={() => router.push('/designer/pricing')} className="underline ml-1">
                    购买更多配套
                  </button>
                  以扩充团队。
                </p>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="输入成员邮箱地址"
                    onKeyDown={e => e.key === 'Enter' && handleInvite()}
                    className="flex-1"
                  />
                  <Button variant="gold" onClick={handleInvite} disabled={teamLoading || !inviteEmail.trim()}>
                    {teamLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : '发送邀请'}
                  </Button>
                </div>
              )}
              <p className="text-xs text-gray-400 mt-2">
                受邀成员注册/登入后自动加入团队并获得 Elite AI 权限。
              </p>
            </div>
          </div>
        )}

        {/* Plan Tab */}
        {activeTab === 'plan' && (
          <div className="space-y-4">
            {/* Current plan card */}
            <div className={`bg-white rounded-2xl border-2 ${planCfg.border} p-6`}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900">Current Plan</h2>
                <Badge className={`${planCfg.color} border ${planCfg.border} text-sm px-3 py-1`}>
                  <Crown className="w-4 h-4 mr-1.5" />
                  {planCfg.label}
                </Badge>
              </div>
              {currentPlan === 'free' && (
                <p className="text-sm text-gray-500 mb-4">
                  You are on the free plan. Upgrade to unlock unlimited AI analyses, price database access, and more.
                </p>
              )}
              {currentPlan === 'pro' && (
                <p className="text-sm text-gray-500 mb-4">
                  50 AI analyses per month · Unlimited projects · Payment tracking · Owner portal
                </p>
              )}
              {currentPlan === 'elite' && (
                <p className="text-sm text-gray-500 mb-4">
                  Unlimited AI analyses · All Pro features · Team collaboration · API access · Custom branding
                </p>
              )}
              {currentPlan !== 'elite' && (
                <Button variant="gold" onClick={() => router.push('/designer/pricing')} className="w-full">
                  {currentPlan === 'free' ? 'Upgrade to Pro' : 'Upgrade to Elite'}
                </Button>
              )}
              {currentPlan === 'elite' && (
                <div className="text-center text-sm text-gray-500">You are on the highest plan. Thank you! ⚡</div>
              )}
            </div>

            {/* Plan features summary */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-medium text-gray-800 mb-4">What&apos;s Included</h3>
              <div className="space-y-2 text-sm">
                {[
                  { feature: 'AI Quotation Analysis', free: '3 lifetime', pro: '50/month', elite: 'Unlimited' },
                  { feature: 'Projects', free: '1', pro: 'Unlimited', elite: 'Unlimited' },
                  { feature: 'Price Database', free: '✗', pro: '✓', elite: '✓' },
                  { feature: 'Cost Database', free: '✗', pro: '✓', elite: '✓' },
                  { feature: 'Worker Management', free: '✗', pro: '✓', elite: '✓' },
                  { feature: 'Owner Portal', free: '✗', pro: '✓', elite: '✓' },
                ].map(row => (
                  <div key={row.feature} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-gray-700">{row.feature}</span>
                    <span className={`font-medium ${
                      currentPlan === 'elite' ? 'text-purple-600' :
                      currentPlan === 'pro' ? 'text-[#4F8EF7]' : 'text-gray-600'
                    }`}>
                      {currentPlan === 'elite' ? row.elite : currentPlan === 'pro' ? row.pro : row.free}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
