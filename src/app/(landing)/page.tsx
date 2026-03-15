'use client';

import Link from 'next/link';
import { useI18n } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, BarChart3, FolderOpen, Check, ChevronDown, Globe } from 'lucide-react';
import { Language, Region } from '@/types';
import { useState } from 'react';

export default function LandingPage() {
  const { lang, setLang, region, setRegion, t, prices } = useI18n();
  const [langOpen, setLangOpen] = useState(false);
  const [regionOpen, setRegionOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0A0F1A] text-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#0A0F1A]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#F0B90B] flex items-center justify-center">
              <span className="text-black font-bold text-sm">RS</span>
            </div>
            <span className="font-bold text-lg">RenoSmart</span>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-3">
            {/* Language switcher */}
            <div className="relative">
              <button
                onClick={() => { setLangOpen(!langOpen); setRegionOpen(false); }}
                className="flex items-center gap-1 text-sm text-white/70 hover:text-white px-2 py-1 rounded"
              >
                <Globe className="w-4 h-4" />
                {lang}
                <ChevronDown className="w-3 h-3" />
              </button>
              {langOpen && (
                <div className="absolute right-0 top-8 bg-[#1A2332] border border-white/10 rounded-lg py-1 w-24 shadow-xl">
                  {(['EN', 'BM', 'ZH'] as Language[]).map((l) => (
                    <button
                      key={l}
                      onClick={() => { setLang(l); setLangOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-white/10 ${lang === l ? 'text-[#F0B90B]' : 'text-white'}`}
                    >
                      {l === 'EN' ? 'English' : l === 'BM' ? 'Bahasa' : '中文'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Region switcher */}
            <div className="relative">
              <button
                onClick={() => { setRegionOpen(!regionOpen); setLangOpen(false); }}
                className="flex items-center gap-1 text-sm text-white/70 hover:text-white px-2 py-1 rounded border border-white/20 rounded-md"
              >
                {region === 'MY' ? '🇲🇾' : '🇸🇬'} {region}
                <ChevronDown className="w-3 h-3" />
              </button>
              {regionOpen && (
                <div className="absolute right-0 top-8 bg-[#1A2332] border border-white/10 rounded-lg py-1 w-24 shadow-xl">
                  {(['MY', 'SG'] as Region[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => { setRegion(r); setRegionOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-white/10 ${region === r ? 'text-[#F0B90B]' : 'text-white'}`}
                    >
                      {r === 'MY' ? '🇲🇾 Malaysia' : '🇸🇬 Singapore'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-white/70 hover:text-white">
                {t.buttons.login}
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="gold" size="sm">
                {t.buttons.getStarted}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 text-center">
        <Badge className="mb-6 bg-[#F0B90B]/20 text-[#F0B90B] border-[#F0B90B]/30">
          {t.landing.social}
        </Badge>
        <h1 className="text-5xl md:text-7xl font-bold mb-6 max-w-4xl mx-auto leading-tight">
          <span className="bg-gradient-to-r from-white via-[#F0B90B] to-white bg-clip-text text-transparent animate-gradient">
            {t.landing.hero}
          </span>
        </h1>
        <p className="text-xl text-white/60 max-w-2xl mx-auto mb-10">
          {t.landing.heroSub}
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/register">
            <Button variant="gold" size="lg" className="text-lg px-8">
              {t.buttons.getStarted}
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg" className="text-lg px-8 border-white/20 text-white hover:bg-white/10">
              {t.buttons.login}
            </Button>
          </Link>
        </div>

        {/* Dashboard mockup */}
        <div className="mt-20 max-w-5xl mx-auto relative">
          <div className="rounded-xl overflow-hidden border border-white/10 shadow-2xl shadow-[#F0B90B]/10 bg-[#0F1923]">
            <div className="flex h-8 items-center px-4 gap-2 border-b border-white/10 bg-[#1A2332]">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="ml-4 text-white/40 text-xs">RenoSmart Dashboard</span>
            </div>
            <div className="flex h-64 md:h-96">
              {/* Sidebar mock */}
              <div className="w-48 bg-[#0F1923] border-r border-white/5 p-4 hidden md:block">
                <div className="space-y-1">
                  {['Dashboard', 'Projects', 'Quotation AI', 'Gantt', 'Workers'].map((item, i) => (
                    <div key={i} className={`px-3 py-2 rounded text-xs ${i === 0 ? 'bg-[#F0B90B]/20 text-[#F0B90B]' : 'text-white/40'}`}>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              {/* Content mock */}
              <div className="flex-1 p-6 overflow-hidden">
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[['Active', '8', 'blue'], ['Completed', '23', 'green'], ['Revenue', 'RM 2.4M', 'gold']].map(([l, v, c]) => (
                    <div key={l} className={`rounded-lg p-3 ${c === 'blue' ? 'bg-blue-500/20 border border-blue-500/30' : c === 'green' ? 'bg-green-500/20 border border-green-500/30' : 'bg-[#F0B90B]/20 border border-[#F0B90B]/30'}`}>
                      <div className="text-xs text-white/50">{l}</div>
                      <div className={`text-lg font-bold ${c === 'gold' ? 'text-[#F0B90B]' : 'text-white'}`}>{v}</div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  {[75, 45, 90, 30].map((p, i) => (
                    <div key={i} className="bg-white/5 rounded p-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-white/60">Project {String.fromCharCode(65 + i)}</span>
                        <span className="text-[#F0B90B]">{p}%</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full">
                        <div className="h-full bg-[#F0B90B] rounded-full" style={{ width: `${p}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-[#0D1520]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">
            Everything you need to run a modern renovation business
          </h2>
          <p className="text-white/50 text-center mb-16 max-w-2xl mx-auto">
            From quotation audit to project handover, RenoSmart covers the entire renovation workflow.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Brain, title: t.landing.feat1, desc: t.landing.feat1d, color: 'from-purple-500/20 to-purple-600/5' },
              { icon: BarChart3, title: t.landing.feat2, desc: t.landing.feat2d, color: 'from-blue-500/20 to-blue-600/5' },
              { icon: FolderOpen, title: t.landing.feat3, desc: t.landing.feat3d, color: 'from-green-500/20 to-green-600/5' },
            ].map(({ icon: Icon, title, desc, color }) => (
              <Card key={title} className={`bg-gradient-to-br ${color} border-white/10 text-white`}>
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-[#F0B90B]/20 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-[#F0B90B]" />
                  </div>
                  <CardTitle className="text-white text-xl">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white/60">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">{t.landing.pricingTitle}</h2>
          <p className="text-white/50 text-center mb-16">No hidden fees. Cancel anytime.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free */}
            <div className="rounded-2xl border border-white/10 bg-[#0F1923] p-8">
              <h3 className="text-xl font-bold mb-2">{t.landing.freePlan}</h3>
              <div className="text-4xl font-bold mb-1">
                {prices.currency} 0
                <span className="text-base font-normal text-white/40">/mo</span>
              </div>
              <p className="text-white/40 text-sm mb-6">Forever free</p>
              <ul className="space-y-3 mb-8">
                {['3 AI analyses lifetime', '1 project', 'Basic Gantt', 'Email support'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/70">
                    <Check className="w-4 h-4 text-green-400" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/register">
                <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                  {t.buttons.getStarted}
                </Button>
              </Link>
            </div>

            {/* Pro */}
            <div className="rounded-2xl border-2 border-[#F0B90B] bg-[#0F1923] p-8 relative">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#F0B90B] text-black border-0 px-4">
                Popular ✦
              </Badge>
              <h3 className="text-xl font-bold mb-2">{t.landing.proPlan}</h3>
              <div className="text-4xl font-bold mb-1 text-[#F0B90B]">
                {prices.pro}
                <span className="text-base font-normal text-white/40">/mo</span>
              </div>
              <p className="text-white/40 text-sm mb-6">Perfect for growing firms</p>
              <ul className="space-y-3 mb-8">
                {['50 AI analyses/month', 'Unlimited projects', 'Smart Gantt + drag', 'Payment tracking', 'Owner portal', 'Priority support'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/70">
                    <Check className="w-4 h-4 text-[#F0B90B]" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/register">
                <Button variant="gold" className="w-full">
                  {t.buttons.getStarted}
                </Button>
              </Link>
            </div>

            {/* Elite */}
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-purple-900/30 to-[#0F1923] p-8">
              <h3 className="text-xl font-bold mb-2">{t.landing.elitePlan} ⚡</h3>
              <div className="text-4xl font-bold mb-1 text-purple-400">
                {prices.elite}
                <span className="text-base font-normal text-white/40">/mo</span>
              </div>
              <p className="text-white/40 text-sm mb-6">For large design firms</p>
              <ul className="space-y-3 mb-8">
                {['Unlimited AI analyses', 'Unlimited projects', 'All Pro features', 'Team collaboration', 'API access', 'Dedicated support', 'Custom branding'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/70">
                    <Check className="w-4 h-4 text-purple-400" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/register">
                <Button variant="outline" className="w-full border-purple-400/30 text-purple-400 hover:bg-purple-400/10">
                  {t.buttons.getStarted}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-4 bg-[#0A0F1A]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#F0B90B] flex items-center justify-center">
              <span className="text-black font-bold text-sm">RS</span>
            </div>
            <span className="font-bold">RenoSmart</span>
          </div>
          <p className="text-white/40 text-sm">
            © 2025 RenoSmart. Built for MY & SG renovation industry.
          </p>
          <div className="flex gap-6 text-sm text-white/40">
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Terms</a>
            <a href="#" className="hover:text-white">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
