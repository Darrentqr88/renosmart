'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useI18n } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, X, Loader2, CreditCard } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

type Interval = 'monthly' | 'quarterly' | 'yearly';

// Prices per plan/region/interval
const PRICES: Record<string, Record<string, Record<Interval, string>>> = {
  pro: {
    MY: { monthly: 'RM 99', quarterly: 'RM 269', yearly: 'RM 950' },
    SG: { monthly: 'SGD 39', quarterly: 'SGD 105', yearly: 'SGD 374' },
  },
  elite: {
    MY: { monthly: 'RM 299', quarterly: 'RM 809', yearly: 'RM 2,870' },
    SG: { monthly: 'SGD 99', quarterly: 'SGD 267', yearly: 'SGD 950' },
  },
};

const INTERVAL_LABELS: Record<Interval, string> = {
  monthly: '/month',
  quarterly: '/quarter',
  yearly: '/year',
};

const INTERVAL_SAVINGS: Record<Interval, string | null> = {
  monthly: null,
  quarterly: 'Save ~10%',
  yearly: 'Save ~20%',
};

function PricingPageContent() {
  const { t, region, lang } = useI18n();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [currentPlan, setCurrentPlan] = useState('free');
  const [billingInterval, setBillingInterval] = useState<Interval>('monthly');
  const [checkoutLoading, setCheckoutLoading] = useState('');
  const [portalLoading, setPortalLoading] = useState(false);
  const [isTeamMember, setIsTeamMember] = useState(false);
  const [ownerName, setOwnerName] = useState('');

  const r = region === 'SG' ? 'SG' : 'MY';
  const stackMode = searchParams.get('stack') === 'elite';
  const [teamSlots, setTeamSlots] = useState(1);

  useEffect(() => {
    (async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('plan, team_id')
          .eq('user_id', authUser.id)
          .single();
        if (profile) setCurrentPlan(profile.plan || 'free');

        // Check if user is a team MEMBER (not owner)
        if (profile?.team_id) {
          const { data: team } = await supabase
            .from('teams')
            .select('owner_user_id')
            .eq('id', profile.team_id)
            .single();
          if (team && team.owner_user_id !== authUser.id) {
            setIsTeamMember(true);
            // Get owner name
            const { data: ownerProfile } = await supabase
              .from('profiles')
              .select('name, email')
              .eq('user_id', team.owner_user_id)
              .single();
            setOwnerName(ownerProfile?.name || ownerProfile?.email || '');
          }
        }

        // If in stack mode, fetch current elite_slots (only relevant for owners)
        if (stackMode) {
          const { data: team } = await supabase
            .from('teams')
            .select('elite_slots')
            .eq('owner_user_id', authUser.id)
            .single();
          if (team) setTeamSlots(team.elite_slots ?? 1);
        }
      }
    })();

    if (searchParams.get('success') === '1') {
      const plan = searchParams.get('plan');
      if (plan) {
        setCurrentPlan(plan);
        toast({ title: 'Payment successful!', description: `Upgraded to ${plan.toUpperCase()} plan.` });
      }
    }
  }, []);

  const handleUpgrade = async (plan: string, isStack = false) => {
    setCheckoutLoading(plan);
    try {
      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, region: r, interval: billingInterval, stack: isStack }),
      });

      const data = await res.json();

      if (data.demo) {
        toast({ title: 'Demo Mode', description: 'Stripe not configured. Plan updated for demo.' });
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          await supabase.from('profiles').update({ plan }).eq('user_id', authUser.id);
          setCurrentPlan(plan);
        }
        return;
      }

      if (data.error) {
        toast({ variant: 'destructive', title: 'Error', description: data.error });
        return;
      }

      // Stack success: subscription quantity updated directly (no checkout page)
      if (data.success && data.newQuantity) {
        toast({
          title: lang === 'ZH' ? '配套已升级' : 'Bundle upgraded',
          description: lang === 'ZH'
            ? `已升级至 ${data.newQuantity} 个配套`
            : `Upgraded to ${data.newQuantity} bundle(s)`,
        });
        if (data.redirect_url) window.location.href = data.redirect_url;
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Payment failed. Please try again.' });
    } finally {
      setCheckoutLoading('');
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/stripe-portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error === 'No subscription found') {
        // Plan was activated manually (demo mode) — no Stripe customer
        toast({
          title: lang === 'ZH' ? '手动激活套餐' : 'Manually Activated Plan',
          description: lang === 'ZH'
            ? '您的套餐是手动激活的，无法通过 Stripe 管理。如需更改请联系客服。'
            : 'Your plan was activated manually. Contact support to make changes.',
        });
      } else {
        toast({ variant: 'destructive', title: 'Error', description: data.error || 'Could not open portal' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to open subscription portal' });
    } finally {
      setPortalLoading(false);
    }
  };

  const eliteDesc: Record<string, string> = {
    EN: '5 accounts share 1 plan · Stack bundles to expand',
    ZH: '5 账号共用 · 可购买多个配套扩充',
  };
  const eliteFeatures: Record<string, string[]> = {
    EN: ['👥 5 accounts · 250 AI audits/month (shared)', 'All Pro features', 'Unlimited projects', 'Team dashboard (invite/remove members)', 'Stack bundles: +5 accounts +250/month each', 'API access', 'Custom branding'],
    ZH: ['👥 5 账号共用 · 共享 250 次/月', 'Pro 全部功能', '无限项目', '团队管理面板（邀请/移除成员）', '可叠加购买：每个 +5 人 +250 次', 'API 访问', '自定义品牌'],
  };
  const eliteCta: Record<string, string> = {
    EN: 'Upgrade to Elite', ZH: '升级至 Elite',
  };

  const plans = [
    {
      id: 'free',
      name: t.landing.freePlan,
      price: `${r === 'SG' ? 'SGD' : 'RM'} 0`,
      period: '/forever',
      desc: lang === 'ZH' ? '免费开始使用' : 'Get started for free',
      features: lang === 'ZH'
        ? ['3 次终身 AI 分析', '1 个活跃项目', '基础甘特图', '邮件支持']
        : ['3 AI analyses lifetime', '1 active project', 'Basic Gantt chart', 'Email support'],
      cta: 'Current Plan',
      color: 'border-gray-200',
      badge: null,
    },
    {
      id: 'pro',
      name: t.landing.proPlan + ' \u2726',
      price: PRICES.pro[r][billingInterval],
      period: INTERVAL_LABELS[billingInterval],
      desc: lang === 'ZH' ? '适合成长中的设计公司' : 'For growing design firms',
      features: lang === 'ZH'
        ? ['每月 50 次 AI 分析', '无限项目', '智能甘特图 + 拖拽', '付款追踪', '业主门户', '工人管理', '优先支持']
        : ['50 AI analyses/month', 'Unlimited projects', 'Smart Gantt + drag & drop', 'Payment tracking', 'Owner portal access', 'Worker management', 'Priority support'],
      cta: lang === 'ZH' ? '升级至 Pro' : 'Upgrade to Pro',
      color: 'border-[#F0B90B]',
      badge: lang === 'ZH' ? '最受欢迎' : 'Most Popular',
    },
    {
      id: 'elite',
      name: t.landing.elitePlan + ' \u26A1',
      price: PRICES.elite[r][billingInterval],
      period: INTERVAL_LABELS[billingInterval],
      desc: eliteDesc[lang] || eliteDesc.EN,
      features: eliteFeatures[lang] || eliteFeatures.EN,
      cta: eliteCta[lang] || eliteCta.EN,
      color: 'border-purple-400',
      badge: null,
    },
  ];

  const intervals: Interval[] = ['monthly', 'quarterly', 'yearly'];

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <Toaster />

      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">{t.landing.pricingTitle}</h1>
          <p className="text-gray-500">
            {lang === 'ZH' ? '无合约束缚，随时可取消。' : 'No contracts. Cancel anytime.'}
          </p>
          {currentPlan !== 'free' && !isTeamMember && (
            <div className="flex items-center justify-center gap-3 mt-3">
              <Badge className="bg-[#F0B90B]/20 text-[#F0B90B] border-[#F0B90B]/30">
                Current plan: {currentPlan.toUpperCase()}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleManageSubscription}
                disabled={portalLoading}
                className="text-xs"
              >
                {portalLoading
                  ? <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  : <CreditCard className="w-3 h-3 mr-1" />}
                Manage Subscription
              </Button>
            </div>
          )}
          {isTeamMember && (
            <div className="mt-4 max-w-lg mx-auto bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm">
              <p className="font-medium text-blue-700 mb-1">
                {lang === 'ZH' ? '您的套餐由团队所有者管理' : 'Your plan is managed by the team owner'}
              </p>
              <p className="text-blue-600 text-xs">
                {lang === 'ZH'
                  ? '如需更改套餐或购买更多配套，请联系团队所有者。'
                  : 'Contact the team owner to change your plan or buy more bundles.'}
                {ownerName && ` (${ownerName})`}
              </p>
            </div>
          )}
        </div>

        {/* Billing interval toggle */}
        <div className="flex items-center justify-center mb-8">
          <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1 gap-1">
            {intervals.map((iv) => (
              <button
                key={iv}
                onClick={() => setBillingInterval(iv)}
                className={`relative px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                  billingInterval === iv
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {iv.charAt(0).toUpperCase() + iv.slice(1)}
                {INTERVAL_SAVINGS[iv] && (
                  <span className="ml-1.5 text-xs text-green-600 font-semibold">
                    {INTERVAL_SAVINGS[iv]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Stack mode: show only Elite card with upgrade info — NOT available for team members */}
        {stackMode && !isTeamMember ? (
          <div className="max-w-lg mx-auto">
            <div className="rounded-2xl border-2 border-purple-400 bg-white p-7">
              <div className="text-center mb-6">
                <Badge className="bg-purple-100 text-purple-700 border-purple-200 mb-3">
                  {lang === 'ZH' ? '叠加购买 Elite 配套' : 'Stack Elite Bundle'}
                </Badge>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {lang === 'ZH' ? '当前：' : 'Current: '}{teamSlots} {lang === 'ZH' ? '个配套' : 'bundle(s)'}
                  {' → '}
                  {lang === 'ZH' ? '购买后：' : 'After: '}{teamSlots + 1} {lang === 'ZH' ? '个配套' : 'bundle(s)'}
                </h2>
              </div>

              <div className="bg-purple-50 rounded-xl p-4 mb-6 text-sm">
                <div className="grid grid-cols-3 gap-y-3">
                  <span className="text-gray-500 text-xs"></span>
                  <span className="text-center text-xs text-gray-400">{lang === 'ZH' ? '当前' : 'Current'}</span>
                  <span className="text-center text-xs text-purple-600 font-medium">{lang === 'ZH' ? '升级后' : 'After'}</span>

                  <span className="text-gray-600">{lang === 'ZH' ? '成员上限' : 'Members'}</span>
                  <span className="text-center text-gray-400 line-through">{teamSlots * 5}</span>
                  <span className="text-center font-bold text-purple-700">{(teamSlots + 1) * 5}</span>

                  <span className="text-gray-600">{lang === 'ZH' ? 'AI 额度/月' : 'AI quota/mo'}</span>
                  <span className="text-center text-gray-400 line-through">{teamSlots * 250}</span>
                  <span className="text-center font-bold text-purple-700">{(teamSlots + 1) * 250}</span>
                </div>

                <div className="flex justify-between pt-3 mt-3 border-t border-purple-200">
                  <span className="text-gray-700 font-medium">{lang === 'ZH' ? '总费用' : 'Total cost'}</span>
                  <span className="font-bold text-purple-700">
                    {r === 'SG' ? 'SGD' : 'RM'} {r === 'SG' ? (99 * (teamSlots + 1)).toLocaleString() : (299 * (teamSlots + 1)).toLocaleString()}{INTERVAL_LABELS[billingInterval]}
                  </span>
                </div>
              </div>

              <Button
                onClick={() => handleUpgrade('elite', true)}
                disabled={!!checkoutLoading}
                className="w-full bg-purple-600 text-white hover:bg-purple-700 font-semibold"
              >
                {checkoutLoading === 'elite'
                  ? <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  : <Zap className="w-4 h-4 mr-2" />}
                {lang === 'ZH' ? `购买第 ${teamSlots + 1} 个配套 — ${r === 'SG' ? 'SGD 99' : 'RM 299'}${INTERVAL_LABELS[billingInterval]}`
                  : `Buy bundle #${teamSlots + 1} — ${r === 'SG' ? 'SGD 99' : 'RM 299'}${INTERVAL_LABELS[billingInterval]}`}
              </Button>

              <button
                onClick={() => window.history.back()}
                className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700 text-center"
              >
                {lang === 'ZH' ? '← 返回' : '← Back'}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-2xl border-2 ${plan.color} bg-white p-7 flex flex-col`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-[#F0B90B] text-black border-0 px-4 font-semibold">
                      {plan.badge}
                    </Badge>
                  </div>
                )}

                <div className="mb-5">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h2>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-3xl font-bold ${
                      plan.id === 'pro' ? 'text-[#F0B90B]'
                      : plan.id === 'elite' ? 'text-purple-600'
                      : 'text-gray-900'
                    }`}>
                      {plan.price}
                    </span>
                    <span className="text-sm text-gray-500">{plan.period}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{plan.desc}</p>
                </div>

                <ul className="space-y-3 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                      <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        plan.id === 'pro' ? 'text-[#F0B90B]'
                        : plan.id === 'elite' ? 'text-purple-500'
                        : 'text-green-500'
                      }`} />
                      {f}
                    </li>
                  ))}
                </ul>

                {isTeamMember ? (
                  /* Team members cannot upgrade — show current plan or disabled state */
                  currentPlan === plan.id ? (
                    <Button disabled className="w-full bg-gray-100 text-gray-500">
                      {'\u2713'} {lang === 'ZH' ? '当前套餐' : 'Current Plan'}
                    </Button>
                  ) : (
                    <Button disabled className="w-full bg-gray-100 text-gray-400">
                      {lang === 'ZH' ? '由团队管理' : 'Managed by team'}
                    </Button>
                  )
                ) : currentPlan === plan.id ? (
                  <Button disabled className="w-full bg-gray-100 text-gray-500">
                    {'\u2713'} {lang === 'ZH' ? '当前套餐' : 'Current Plan'}
                  </Button>
                ) : plan.id === 'free' ? (
                  <Button variant="outline" disabled className="w-full">
                    {lang === 'ZH' ? '免费版' : 'Free Plan'}
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={!!checkoutLoading}
                    className={`w-full font-semibold ${
                      plan.id === 'pro'
                        ? 'bg-[#F0B90B] text-black hover:bg-[#d4a20a]'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                    }`}
                  >
                    {checkoutLoading === plan.id
                      ? <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      : <Zap className="w-4 h-4 mr-2" />}
                    {plan.cta}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Feature comparison — hide in stack mode */}
        {!stackMode && <div className="mt-12 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">
              {lang === 'ZH' ? '功能对比' : 'Feature Comparison'}
            </h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-6 py-3 text-gray-600 font-medium">Feature</th>
                <th className="text-center px-4 py-3 text-gray-600 font-medium">Free</th>
                <th className="text-center px-4 py-3 text-[#F0B90B] font-medium">Pro</th>
                <th className="text-center px-4 py-3 text-purple-600 font-medium">Elite</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[
                ['AI Quotation Audit', '3 lifetime', '50/month', '250/month (shared)'],
                ['Projects', '1', 'Unlimited', 'Unlimited'],
                ['Gantt Chart', '\u2713', '\u2713 + Drag', '\u2713 + Drag'],
                ['Owner Portal', '\u2717', '\u2713', '\u2713'],
                ['Worker Management', '\u2717', '\u2713', '\u2713'],
                ['Payment Tracking', '\u2717', '\u2713', '\u2713'],
                ['API Access', '\u2717', '\u2717', '\u2713'],
                ['Custom Branding', '\u2717', '\u2717', '\u2713'],
              ].map(([feat, free, pro, elite]) => (
                <tr key={feat} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-gray-700">{feat}</td>
                  <td className="px-4 py-3 text-center text-gray-500">
                    {free === '\u2717' ? <X className="w-4 h-4 text-gray-300 mx-auto" /> : free}
                  </td>
                  <td className="px-4 py-3 text-center text-[#F0B90B] font-medium">
                    {pro === '\u2717' ? <X className="w-4 h-4 text-gray-300 mx-auto" /> : pro}
                  </td>
                  <td className="px-4 py-3 text-center text-purple-600 font-medium">{elite}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>}

        {/* Stripe badge */}
        <div className="mt-8 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          Secure payments powered by Stripe
        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    }>
      <PricingPageContent />
    </Suspense>
  );
}
