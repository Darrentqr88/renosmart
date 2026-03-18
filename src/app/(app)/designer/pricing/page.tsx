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

function PricingPageContent() {
  const { t, prices, region } = useI18n();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [currentPlan, setCurrentPlan] = useState('free');
  const [checkoutLoading, setCheckoutLoading] = useState('');
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase.from('profiles').select('plan').eq('user_id', session.user.id).single();
        if (profile) setCurrentPlan(profile.plan || 'free');
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

  const handleUpgrade = async (plan: string) => {
    setCheckoutLoading(plan);
    try {
      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, region }),
      });

      const data = await res.json();

      if (data.demo) {
        toast({ title: 'Demo Mode', description: 'Stripe not configured. Plan updated for demo.' });
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await supabase.from('profiles').update({ plan }).eq('user_id', session.user.id);
          setCurrentPlan(plan);
        }
        return;
      }

      if (data.error) {
        toast({ variant: 'destructive', title: 'Error', description: data.error });
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
      } else {
        toast({ variant: 'destructive', title: 'Error', description: data.error || 'Could not open portal' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to open subscription portal' });
    } finally {
      setPortalLoading(false);
    }
  };

  const plans = [
    {
      id: 'free',
      name: t.landing.freePlan,
      price: `${prices.currency} 0`,
      period: '/forever',
      desc: 'Get started for free',
      features: ['3 AI analyses lifetime', '1 active project', 'Basic Gantt chart', 'Email support'],
      cta: 'Current Plan',
      color: 'border-gray-200',
      badge: null,
    },
    {
      id: 'pro',
      name: t.landing.proPlan + ' \u2726',
      price: prices.pro,
      period: '/month',
      desc: 'For growing design firms',
      features: [
        '50 AI analyses/month', 'Unlimited projects', 'Smart Gantt + drag & drop',
        'Payment tracking', 'Owner portal access', 'Worker management',
        'Priority support',
      ],
      cta: 'Upgrade to Pro',
      color: 'border-[#4F8EF7]',
      badge: 'Most Popular',
    },
    {
      id: 'elite',
      name: t.landing.elitePlan + ' \u26A1',
      price: prices.elite,
      period: '/month',
      desc: 'For large design studios',
      features: [
        'Unlimited AI analyses', 'Unlimited projects', 'All Pro features',
        'Team collaboration', 'API access', 'Custom branding',
        'Dedicated account manager',
      ],
      cta: 'Upgrade to Elite',
      color: 'border-purple-400',
      badge: null,
    },
  ];

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <Toaster />

      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">{t.landing.pricingTitle}</h1>
          <p className="text-gray-500">No contracts. Cancel anytime.</p>
          {currentPlan !== 'free' && (
            <div className="flex items-center justify-center gap-3 mt-3">
              <Badge className="bg-[#4F8EF7]/20 text-[#4F8EF7] border-[#4F8EF7]/30">
                Current plan: {currentPlan.toUpperCase()}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleManageSubscription}
                disabled={portalLoading}
                className="text-xs"
              >
                {portalLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CreditCard className="w-3 h-3 mr-1" />}
                Manage Subscription
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className={`relative rounded-2xl border-2 ${plan.color} bg-white p-7 flex flex-col`}>
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-[#4F8EF7] text-white border-0 px-4 font-semibold">{plan.badge}</Badge>
                </div>
              )}

              <div className="mb-5">
                <h2 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h2>
                <div className="flex items-baseline gap-1">
                  <span className={`text-3xl font-bold ${plan.id === 'pro' ? 'text-[#4F8EF7]' : plan.id === 'elite' ? 'text-purple-600' : 'text-gray-900'}`}>
                    {plan.price}
                  </span>
                  <span className="text-sm text-gray-500">{plan.period}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{plan.desc}</p>
              </div>

              <ul className="space-y-3 flex-1 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                    <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.id === 'pro' ? 'text-[#4F8EF7]' : plan.id === 'elite' ? 'text-purple-500' : 'text-green-500'}`} />
                    {f}
                  </li>
                ))}
              </ul>

              {currentPlan === plan.id ? (
                <Button disabled className="w-full bg-gray-100 text-gray-500">
                  {'\u2713'} Current Plan
                </Button>
              ) : plan.id === 'free' ? (
                <Button variant="outline" disabled className="w-full">
                  Free Plan
                </Button>
              ) : (
                <Button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={!!checkoutLoading}
                  className={`w-full ${plan.id === 'pro' ? 'bg-[#4F8EF7] text-white hover:bg-[#3B7BE8]' : 'bg-purple-600 text-white hover:bg-purple-700'} font-semibold`}
                >
                  {checkoutLoading === plan.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Zap className="w-4 h-4 mr-2" />
                  )}
                  {plan.cta}
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Feature comparison */}
        <div className="mt-12 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Feature Comparison</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-6 py-3 text-gray-600 font-medium">Feature</th>
                <th className="text-center px-4 py-3 text-gray-600 font-medium">Free</th>
                <th className="text-center px-4 py-3 text-[#4F8EF7] font-medium">Pro</th>
                <th className="text-center px-4 py-3 text-purple-600 font-medium">Elite</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[
                ['AI Quotation Audit', '3 lifetime', '50/month', 'Unlimited'],
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
                  <td className="px-4 py-3 text-center text-gray-500">{free === '\u2717' ? <X className="w-4 h-4 text-gray-300 mx-auto" /> : free}</td>
                  <td className="px-4 py-3 text-center text-[#4F8EF7] font-medium">{pro === '\u2717' ? <X className="w-4 h-4 text-gray-300 mx-auto" /> : pro}</td>
                  <td className="px-4 py-3 text-center text-purple-600 font-medium">{elite}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Stripe badge */}
        <div className="mt-8 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Secure payments powered by Stripe
        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="text-gray-400">Loading...</div></div>}>
      <PricingPageContent />
    </Suspense>
  );
}
