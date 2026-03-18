'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { Loader2, User, Building2, CreditCard, Crown } from 'lucide-react';
import { useRouter } from 'next/navigation';

type SettingsTab = 'profile' | 'company' | 'plan';

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

  const tabs: { id: SettingsTab; label: string; icon: typeof User }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'company', label: 'Company', icon: Building2 },
    { id: 'plan', label: 'Plan', icon: CreditCard },
  ];

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <Toaster />
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

        {/* Tab row */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
          {tabs.map(({ id, label, icon: Icon }) => (
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
