'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useI18n } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { Loader2, User, Building2, CreditCard, Crown, Users, UserPlus, UserMinus, Star, Shield } from 'lucide-react';
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

// i18n strings for settings page
const settingsI18n = {
  EN: {
    settings: 'Settings',
    profile: 'Profile',
    company: 'Company',
    plan: 'Plan',
    teamTab: 'Team',
    personalInfo: 'Personal Information',
    fullName: 'Full Name',
    email: 'Email',
    emailNote: 'Email cannot be changed here.',
    phoneNumber: 'Phone Number',
    saveProfile: 'Save Profile',
    profileSaved: 'Profile saved!',
    profileSavedDesc: 'Your profile has been updated.',
    companyInfo: 'Company Information',
    companyInfoDesc: 'This information appears on your quotations and client documents.',
    companyName: 'Company Name',
    companyAddress: 'Company Address',
    saveCompany: 'Save Company Info',
    companySaved: 'Company info saved!',
    currentPlan: 'Current Plan',
    freePlanDesc: 'You are on the free plan. Upgrade to unlock unlimited AI analyses, price database access, and more.',
    proPlanDesc: '50 AI analyses per month · Unlimited projects · Payment tracking · Owner portal',
    elitePlanDesc: '250 AI analyses/month (team shared) · 5 accounts · All Pro features · Team collaboration',
    upgradeToPro: 'Upgrade to Pro',
    upgradeToElite: 'Upgrade to Elite',
    highestPlan: 'You are on the highest plan. Thank you!',
    whatsIncluded: "What's Included",
    aiAnalysis: 'AI Quotation Analysis',
    projects: 'Projects',
    priceDB: 'Price Database',
    costDB: 'Cost Database',
    workerMgmt: 'Worker Management',
    ownerPortal: 'Owner Portal',
    eliteTeam: 'Elite Team',
    bundles: 'bundle(s)',
    maxMembers: 'members',
    perMonthShared: '/month shared',
    monthlyUsage: 'Monthly team usage',
    times: 'uses',
    buyMore: 'Buy more bundles',
    buyMoreDesc: '/month = +5 members +250 uses',
    memberList: 'Members',
    of: 'of',
    people: 'members',
    usesPerMonth: 'uses/mo',
    noMembers: 'No members invited yet',
    inviteNew: 'Invite New Member',
    emailPlaceholder: 'Enter member email',
    sendInvite: 'Send Invite',
    inviteNote: 'Invited members will join your team and gain Elite AI access after signing up/in.',
    teamFull: 'Team is full',
    buyMoreToExpand: 'Buy more bundles',
    toExpand: 'to expand.',
    inviteFailed: 'Invite failed',
    linkGenerated: 'Join link generated',
    linkGenDesc: 'This email already has an account. Copy and share the link below.',
    inviteSent: 'Invite sent',
    memberRemoved: 'Member removed',
    opFailed: 'Operation failed',
    copied: 'Copied',
    existingAcctNote: 'This email already has an account. Share the link below:',
    copy: 'Copy',
    // New member-facing strings
    yourRole: 'Your Role',
    member: 'Member',
    owner: 'Owner',
    teamOwner: 'Team Owner',
    sharedQuota: 'Shared AI Quota',
    planManagedByOwner: 'Your plan is managed by the team owner.',
    contactOwnerToChange: 'Contact the team owner to change your plan or buy more bundles.',
    managedByTeam: 'Managed by Team',
  },
  BM: {
    settings: 'Tetapan',
    profile: 'Profil',
    company: 'Syarikat',
    plan: 'Pelan',
    teamTab: 'Pasukan',
    personalInfo: 'Maklumat Peribadi',
    fullName: 'Nama Penuh',
    email: 'E-mel',
    emailNote: 'E-mel tidak boleh diubah di sini.',
    phoneNumber: 'Nombor Telefon',
    saveProfile: 'Simpan Profil',
    profileSaved: 'Profil disimpan!',
    profileSavedDesc: 'Profil anda telah dikemas kini.',
    companyInfo: 'Maklumat Syarikat',
    companyInfoDesc: 'Maklumat ini muncul pada sebut harga dan dokumen pelanggan anda.',
    companyName: 'Nama Syarikat',
    companyAddress: 'Alamat Syarikat',
    saveCompany: 'Simpan Maklumat Syarikat',
    companySaved: 'Maklumat syarikat disimpan!',
    currentPlan: 'Pelan Semasa',
    freePlanDesc: 'Anda menggunakan pelan percuma. Naik taraf untuk membuka analisis AI tanpa had dan banyak lagi.',
    proPlanDesc: '50 analisis AI sebulan · Projek tanpa had · Penjejakan pembayaran · Portal pemilik',
    elitePlanDesc: '250 analisis AI/bulan (dikongsi) · 5 akaun · Semua ciri Pro · Kerjasama pasukan',
    upgradeToPro: 'Naik taraf ke Pro',
    upgradeToElite: 'Naik taraf ke Elite',
    highestPlan: 'Anda menggunakan pelan tertinggi. Terima kasih!',
    whatsIncluded: 'Apa Yang Disertakan',
    aiAnalysis: 'Audit Sebut Harga AI',
    projects: 'Projek',
    priceDB: 'Pangkalan Data Harga',
    costDB: 'Pangkalan Data Kos',
    workerMgmt: 'Pengurusan Pekerja',
    ownerPortal: 'Portal Pemilik',
    eliteTeam: 'Pasukan Elite',
    bundles: 'bundle',
    maxMembers: 'ahli',
    perMonthShared: '/bulan dikongsi',
    monthlyUsage: 'Penggunaan pasukan bulan ini',
    times: 'kali',
    buyMore: 'Beli lagi bundle',
    buyMoreDesc: '/bulan = +5 ahli +250 kali',
    memberList: 'Senarai Ahli',
    of: 'daripada',
    people: 'orang',
    usesPerMonth: 'kali/bln',
    noMembers: 'Belum menjemput ahli',
    inviteNew: 'Jemput Ahli Baru',
    emailPlaceholder: 'Masukkan e-mel ahli',
    sendInvite: 'Hantar Jemputan',
    inviteNote: 'Ahli yang dijemput akan menyertai pasukan dan mendapat akses Elite AI selepas mendaftar/log masuk.',
    teamFull: 'Pasukan penuh',
    buyMoreToExpand: 'Beli lagi bundle',
    toExpand: 'untuk kembang.',
    inviteFailed: 'Jemputan gagal',
    linkGenerated: 'Pautan penyertaan dijana',
    linkGenDesc: 'E-mel ini sudah mempunyai akaun. Salin dan kongsi pautan di bawah.',
    inviteSent: 'Jemputan dihantar',
    memberRemoved: 'Ahli dibuang',
    opFailed: 'Operasi gagal',
    copied: 'Disalin',
    existingAcctNote: 'E-mel ini sudah mempunyai akaun. Kongsi pautan di bawah:',
    copy: 'Salin',
    yourRole: 'Peranan Anda',
    member: 'Ahli',
    owner: 'Pemilik',
    teamOwner: 'Pemilik Pasukan',
    sharedQuota: 'Kuota AI Dikongsi',
    planManagedByOwner: 'Pelan anda diuruskan oleh pemilik pasukan.',
    contactOwnerToChange: 'Hubungi pemilik pasukan untuk menukar pelan atau membeli lebih banyak bundle.',
    managedByTeam: 'Diurus oleh Pasukan',
  },
  ZH: {
    settings: '设置',
    profile: '个人资料',
    company: '公司',
    plan: '套餐',
    teamTab: '团队管理',
    personalInfo: '个人信息',
    fullName: '姓名',
    email: '邮箱',
    emailNote: '邮箱无法在此处更改。',
    phoneNumber: '手机号码',
    saveProfile: '保存资料',
    profileSaved: '资料已保存！',
    profileSavedDesc: '您的资料已更新。',
    companyInfo: '公司信息',
    companyInfoDesc: '此信息会显示在您的报价单和客户文档中。',
    companyName: '公司名称',
    companyAddress: '公司地址',
    saveCompany: '保存公司信息',
    companySaved: '公司信息已保存！',
    currentPlan: '当前套餐',
    freePlanDesc: '您正在使用免费版。升级可解锁无限 AI 分析、价格数据库等功能。',
    proPlanDesc: '每月 50 次 AI 分析 · 无限项目 · 付款追踪 · 业主门户',
    elitePlanDesc: '250 次 AI 分析/月（团队共享） · 5 个账号 · Pro 全部功能 · 团队协作',
    upgradeToPro: '升级至 Pro',
    upgradeToElite: '升级至 Elite',
    highestPlan: '您正在使用最高套餐，感谢支持！',
    whatsIncluded: '包含功能',
    aiAnalysis: 'AI 报价审计',
    projects: '项目',
    priceDB: '价格数据库',
    costDB: '成本数据库',
    workerMgmt: '工人管理',
    ownerPortal: '业主门户',
    eliteTeam: 'Elite 团队',
    bundles: '个配套',
    maxMembers: '人',
    perMonthShared: '次/月共享',
    monthlyUsage: '本月团队用量',
    times: '次',
    buyMore: '购买更多配套',
    buyMoreDesc: '/月 = +5 人名额 +250 次',
    memberList: '成员列表',
    of: '/',
    people: '人',
    usesPerMonth: '次/月',
    noMembers: '尚未邀请任何成员',
    inviteNew: '邀请新成员',
    emailPlaceholder: '输入成员邮箱地址',
    sendInvite: '发送邀请',
    inviteNote: '受邀成员注册/登入后自动加入团队并获得 Elite AI 权限。',
    teamFull: '团队已满员',
    buyMoreToExpand: '购买更多配套',
    toExpand: '以扩充团队。',
    inviteFailed: '邀请失败',
    linkGenerated: '已生成加入链接',
    linkGenDesc: '该邮箱已有账号，请复制下方链接发送给对方',
    inviteSent: '邀请已发送',
    memberRemoved: '成员已移除',
    opFailed: '操作失败',
    copied: '已复制',
    existingAcctNote: '该邮箱已有账号，请将以下链接发送给对方：',
    copy: '复制',
    yourRole: '您的角色',
    member: '成员',
    owner: '所有者',
    teamOwner: '团队所有者',
    sharedQuota: '共享 AI 额度',
    planManagedByOwner: '您的套餐由团队所有者管理。',
    contactOwnerToChange: '如需更改套餐或购买更多配套，请联系团队所有者。',
    managedByTeam: '由团队管理',
  },
};

export default function SettingsPage() {
  const supabase = createClient();
  const router = useRouter();
  const { lang } = useI18n();
  const s = settingsI18n[lang as keyof typeof settingsI18n] || settingsI18n.EN;
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
  const [teamId, setTeamId] = useState<string | null>(null);

  // Team state
  const [teamInfo, setTeamInfo] = useState<TeamInfo | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [usageMap, setUsageMap] = useState<Record<string, number>>({});
  const [inviteEmail, setInviteEmail] = useState('');
  const [teamLoading, setTeamLoading] = useState(false);
  const [joinLink, setJoinLink] = useState<string | null>(null);
  const [isTeamOwner, setIsTeamOwner] = useState(false);
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerName, setOwnerName] = useState('');

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
        setTeamId(data.team_id || null);
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
      setIsTeamOwner(data.isOwner ?? false);
      setOwnerEmail(data.ownerEmail || '');
      setOwnerName(data.ownerName || '');
    }
  }, []);

  // Load team when Team tab is active AND user is elite (either owner or member)
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
      if (!res.ok) { toast({ title: s.inviteFailed, description: data.error, variant: 'destructive' }); return; }
      if (data.existingUser) {
        toast({ title: s.inviteSent, description: data.message });
      } else {
        toast({ title: s.inviteSent, description: data.message });
      }
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
      if (res.ok) { toast({ title: s.memberRemoved }); loadTeam(); }
      else { const d = await res.json(); toast({ title: s.opFailed, description: d.error, variant: 'destructive' }); }
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
      toast({ title: s.profileSaved, description: s.profileSavedDesc });
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
      toast({ title: s.companySaved });
    } finally {
      setLoading(false);
    }
  };

  // Determine if user is a team member (not owner) — has team_id but is not the team owner
  const isTeamMember = currentPlan === 'elite' && teamId && !isTeamOwner && teamInfo !== null;

  const PLAN_CONFIG = {
    free:  { label: 'Free', color: 'bg-gray-100 text-gray-600', border: 'border-gray-200' },
    pro:   { label: 'Pro \u2726', color: 'bg-[#4F8EF7]/15 text-[#2563EB]', border: 'border-[#4F8EF7]/30' },
    elite: { label: 'Elite \u26A1', color: 'bg-purple-50 text-purple-700', border: 'border-purple-200' },
  };
  const planCfg = PLAN_CONFIG[currentPlan as keyof typeof PLAN_CONFIG] || PLAN_CONFIG.free;

  const tabs: { id: SettingsTab; label: string; icon: typeof User; eliteOnly?: boolean }[] = [
    { id: 'profile', label: s.profile, icon: User },
    { id: 'company', label: s.company, icon: Building2 },
    { id: 'plan', label: s.plan, icon: CreditCard },
    { id: 'team', label: s.teamTab, icon: Users, eliteOnly: true },
  ];

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <Toaster />
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{s.settings}</h1>

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
            <h2 className="font-semibold text-gray-900 mb-5">{s.personalInfo}</h2>

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
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={`${planCfg.color} border ${planCfg.border} text-xs`}>
                    <Crown className="w-3 h-3 mr-1" />
                    {planCfg.label}
                  </Badge>
                  {/* Show Member badge for team members instead of letting them think they're the owner */}
                  {isTeamMember && (
                    <Badge className="bg-blue-50 text-blue-600 border border-blue-200 text-xs">
                      <Users className="w-3 h-3 mr-1" />
                      {s.member}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm text-gray-700">{s.fullName}</Label>
                <Input value={name} onChange={e => setName(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-sm text-gray-700">{s.email}</Label>
                <Input value={email} disabled className="mt-1 bg-gray-50 text-gray-500" />
                <p className="text-xs text-gray-400 mt-1">{s.emailNote}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-700">{s.phoneNumber}</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} className="mt-1" placeholder="+60123456789" />
              </div>
            </div>

            <Button variant="gold" onClick={handleSaveProfile} disabled={loading} className="mt-6 w-full">
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {s.saveProfile}
            </Button>
          </div>
        )}

        {/* Company Tab */}
        {activeTab === 'company' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-5">{s.companyInfo}</h2>
            <p className="text-sm text-gray-500 mb-5">{s.companyInfoDesc}</p>
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-gray-700">{s.companyName}</Label>
                <Input value={company} onChange={e => setCompany(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-sm text-gray-700">{s.companyAddress}</Label>
                <textarea
                  value={companyAddress}
                  onChange={e => setCompanyAddress(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F8EF7]/30 focus:border-[#4F8EF7] resize-none"
                />
              </div>
            </div>
            <Button variant="gold" onClick={handleSaveCompany} disabled={loading} className="mt-6 w-full">
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {s.saveCompany}
            </Button>
          </div>
        )}

        {/* Team Tab — OWNER VIEW */}
        {activeTab === 'team' && currentPlan === 'elite' && isTeamOwner && (
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
                      {s.eliteTeam} — {teamInfo?.elite_slots ?? 1} {s.bundles}
                    </h2>
                    <p className="text-xs text-gray-500">
                      {teamInfo?.maxMembers ?? 5} {s.maxMembers} · {teamInfo?.teamMonthlyLimit ?? 250} {s.perMonthShared}
                    </p>
                  </div>
                </div>
                <Badge className="bg-purple-50 text-purple-700 border border-purple-200">
                  <Crown className="w-3 h-3 mr-1" />
                  {s.owner}
                </Badge>
              </div>

              {/* Usage bar */}
              {teamInfo && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{s.monthlyUsage}</span>
                    <span>{teamInfo.teamUsage} / {teamInfo.teamMonthlyLimit} {s.times}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (teamInfo.teamUsage / teamInfo.teamMonthlyLimit) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Buy more slots — OWNER ONLY */}
              <Button
                variant="outline"
                size="sm"
                className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
                onClick={() => router.push('/designer/pricing?stack=elite')}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {s.buyMore} — RM299{s.buyMoreDesc}
              </Button>
            </div>

            {/* Members list */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4" />
                {s.memberList}
                <span className="text-xs font-normal text-gray-400 ml-1">
                  ({teamMembers.filter(m => m.status !== 'removed').length + 1} {s.of} {teamInfo?.maxMembers ?? 5} {s.people})
                </span>
              </h3>

              <div className="space-y-2">
                {/* Owner row */}
                <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-purple-50">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-medium text-gray-800">{email}</span>
                    <Badge className="text-xs bg-purple-100 text-purple-700 border-0">{s.owner}</Badge>
                  </div>
                  <span className="text-xs text-gray-500">{usageMap[userId] ?? 0} {s.usesPerMonth}</span>
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
                          {usageMap[member.user_id ?? ''] ?? 0} {s.usesPerMonth}
                        </span>
                      )}
                      <button
                        onClick={() => handleRemove(member.id)}
                        disabled={teamLoading}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove member"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {teamMembers.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">{s.noMembers}</p>
                )}
              </div>
            </div>

            {/* Invite form — OWNER ONLY */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                {s.inviteNew}
              </h3>
              {teamInfo && (teamMembers.filter(m => m.status !== 'removed').length + 1) >= teamInfo.maxMembers ? (
                <p className="text-sm text-amber-600 bg-amber-50 rounded-lg px-4 py-3">
                  {s.teamFull} ({teamInfo.maxMembers} {s.people}).{' '}
                  <button onClick={() => router.push('/designer/pricing?stack=elite')} className="underline ml-1">
                    {s.buyMoreToExpand}
                  </button>
                  {' '}{s.toExpand}
                </p>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder={s.emailPlaceholder}
                    onKeyDown={e => e.key === 'Enter' && handleInvite()}
                    className="flex-1"
                  />
                  <Button variant="gold" onClick={handleInvite} disabled={teamLoading || !inviteEmail.trim()}>
                    {teamLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : s.sendInvite}
                  </Button>
                </div>
              )}
              <p className="text-xs text-gray-400 mt-2">{s.inviteNote}</p>
              {joinLink && (
                <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-xs text-yellow-600 mb-1 font-medium">{s.existingAcctNote}</p>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={joinLink}
                      className="flex-1 text-xs bg-gray-100 border border-gray-300 rounded px-2 py-1 text-gray-700 truncate"
                    />
                    <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(joinLink); toast({ title: s.copied }); }}>
                      {s.copy}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setJoinLink(null)}>X</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Team Tab — MEMBER VIEW (read-only) */}
        {activeTab === 'team' && currentPlan === 'elite' && !isTeamOwner && teamInfo && (
          <div className="space-y-4">
            {/* Team info card */}
            <div className="bg-white rounded-2xl border-2 border-blue-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">
                      {teamInfo.name || s.eliteTeam}
                    </h2>
                    <p className="text-xs text-gray-500">
                      {teamInfo.maxMembers} {s.maxMembers} · {teamInfo.teamMonthlyLimit} {s.perMonthShared}
                    </p>
                  </div>
                </div>
                <Badge className="bg-blue-50 text-blue-600 border border-blue-200">
                  <Shield className="w-3 h-3 mr-1" />
                  {s.member}
                </Badge>
              </div>

              {/* Your role */}
              <div className="bg-blue-50/50 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{s.yourRole}</span>
                  <span className="font-medium text-blue-600">{s.member}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-600">{s.teamOwner}</span>
                  <span className="font-medium text-gray-800">{ownerName || ownerEmail}</span>
                </div>
              </div>

              {/* Shared usage bar */}
              <div className="mb-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{s.sharedQuota}</span>
                  <span>{teamInfo.teamUsage} / {teamInfo.teamMonthlyLimit} {s.times}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (teamInfo.teamUsage / teamInfo.teamMonthlyLimit) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Members list — read-only for members */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4" />
                {s.memberList}
              </h3>

              <div className="space-y-2">
                {/* Owner row */}
                <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-purple-50">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-medium text-gray-800">{ownerEmail}</span>
                    <Badge className="text-xs bg-purple-100 text-purple-700 border-0">{s.owner}</Badge>
                  </div>
                </div>

                {/* Member rows — no remove button */}
                {teamMembers.map(member => (
                  <div key={member.id} className={`flex items-center justify-between py-2.5 px-3 rounded-lg ${
                    member.email === email ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        member.status === 'active' ? 'bg-green-400' : 'bg-yellow-400'
                      }`} />
                      <span className="text-sm text-gray-700 truncate">{member.email}</span>
                      {member.email === email && (
                        <Badge className="text-xs bg-blue-100 text-blue-600 border-0">
                          {lang === 'ZH' ? '你' : lang === 'BM' ? 'Anda' : 'You'}
                        </Badge>
                      )}
                      <Badge className={`text-xs border-0 flex-shrink-0 ${
                        member.status === 'active'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-yellow-50 text-yellow-700'
                      }`}>
                        {member.status === 'active' ? 'Active' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* No invite form for members */}
          </div>
        )}

        {/* Team Tab — loading state when team data hasn't loaded yet for members */}
        {activeTab === 'team' && currentPlan === 'elite' && !isTeamOwner && !teamInfo && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400 mr-2" />
            <span className="text-sm text-gray-500">Loading team...</span>
          </div>
        )}

        {/* Plan Tab */}
        {activeTab === 'plan' && (
          <div className="space-y-4">
            {/* Current plan card */}
            <div className={`bg-white rounded-2xl border-2 ${planCfg.border} p-6`}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900">{s.currentPlan}</h2>
                <div className="flex items-center gap-2">
                  <Badge className={`${planCfg.color} border ${planCfg.border} text-sm px-3 py-1`}>
                    <Crown className="w-4 h-4 mr-1.5" />
                    {planCfg.label}
                  </Badge>
                  {isTeamMember && (
                    <Badge className="bg-blue-50 text-blue-600 border border-blue-200 text-sm px-3 py-1">
                      <Users className="w-4 h-4 mr-1.5" />
                      {s.member}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Team MEMBER: show "managed by owner" message */}
              {isTeamMember ? (
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-sm text-blue-700 font-medium mb-1">{s.planManagedByOwner}</p>
                  <p className="text-xs text-blue-600">{s.contactOwnerToChange}</p>
                  {(ownerName || ownerEmail) && (
                    <p className="text-xs text-gray-500 mt-2">
                      {s.teamOwner}: <span className="font-medium text-gray-700">{ownerName || ownerEmail}</span>
                    </p>
                  )}
                </div>
              ) : (
                <>
                  {currentPlan === 'free' && (
                    <p className="text-sm text-gray-500 mb-4">{s.freePlanDesc}</p>
                  )}
                  {currentPlan === 'pro' && (
                    <p className="text-sm text-gray-500 mb-4">{s.proPlanDesc}</p>
                  )}
                  {currentPlan === 'elite' && (
                    <p className="text-sm text-gray-500 mb-4">{s.elitePlanDesc}</p>
                  )}
                  {currentPlan !== 'elite' && (
                    <Button variant="gold" onClick={() => router.push('/designer/pricing')} className="w-full">
                      {currentPlan === 'free' ? s.upgradeToPro : s.upgradeToElite}
                    </Button>
                  )}
                  {currentPlan === 'elite' && (
                    <div className="text-center text-sm text-gray-500 mt-2">{s.highestPlan}</div>
                  )}
                </>
              )}
            </div>

            {/* Plan features summary */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-medium text-gray-800 mb-4">{s.whatsIncluded}</h3>
              <div className="space-y-2 text-sm">
                {[
                  { feature: s.aiAnalysis, free: '3', pro: '50/' + (lang === 'ZH' ? '月' : lang === 'BM' ? 'bulan' : 'month'), elite: '250/' + (lang === 'ZH' ? '月 (共享)' : lang === 'BM' ? 'bulan (dikongsi)' : 'month (shared)') },
                  { feature: s.projects, free: '1', pro: lang === 'ZH' ? '无限' : lang === 'BM' ? 'Tanpa had' : 'Unlimited', elite: lang === 'ZH' ? '无限' : lang === 'BM' ? 'Tanpa had' : 'Unlimited' },
                  { feature: s.priceDB, free: '\u2717', pro: '\u2713', elite: '\u2713' },
                  { feature: s.costDB, free: '\u2717', pro: '\u2713', elite: '\u2713' },
                  { feature: s.workerMgmt, free: '\u2717', pro: '\u2713', elite: '\u2713' },
                  { feature: s.ownerPortal, free: '\u2717', pro: '\u2713', elite: '\u2713' },
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
