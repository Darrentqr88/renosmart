'use client';

import Link from 'next/link';
import { useI18n } from '@/lib/i18n/context';
import { Language, Region } from '@/types';
import { useState, useEffect, useRef } from 'react';

// ── Pricing data ─────────────────────────────────────────────────────
const PRICING = {
  MY: {
    currency: 'RM',
    free: '0',
    pro:   { monthly: '99',  quarterly: '267', yearly: '899'  },
    elite: { monthly: '299', quarterly: '808', yearly: '2,699' },
  },
  SG: {
    currency: 'SGD',
    free: '0',
    pro:   { monthly: '35',  quarterly: '99',  yearly: '350'  },
    elite: { monthly: '99',  quarterly: '268', yearly: '990'  },
  },
};

// Carousel slides (mock screenshots described as UI blocks)
const SLIDES = [
  {
    label: { EN: 'AI Quotation Audit', BM: 'Audit AI', ZH: 'AI 报价审核' },
    desc: { EN: 'Upload any PDF/Excel quotation — AI audits pricing, flags missing items, and scores completeness in seconds.', BM: 'Muat naik sebut harga PDF/Excel — AI menilai harga dan menandai item yang hilang.', ZH: '上传 PDF/Excel 报价单，AI 即时审核价格、标记遗漏项目并评分。' },
    color: 'from-amber-500/20 to-orange-500/10',
    icon: '🧠',
    stats: [{ v: '95%', l: 'Accuracy' }, { v: '< 30s', l: 'Analysis' }, { v: 'RM 8K', l: 'Avg Savings' }],
  },
  {
    label: { EN: 'Smart Gantt Chart', BM: 'Carta Gantt Pintar', ZH: '智能甘特图' },
    desc: { EN: 'Dependency-driven scheduling auto-generates from quotation items. Skips MY/SG public holidays automatically.', BM: 'Penjadualan dipacu kebergantungan jana secara automatik daripada sebut harga.', ZH: '依赖驱动排程，从报价单自动生成，自动跳过马来西亚/新加坡节假日。' },
    color: 'from-blue-500/20 to-cyan-500/10',
    icon: '📅',
    stats: [{ v: '20+', l: 'Phases' }, { v: 'Drag', l: 'Resize' }, { v: 'MY/SG', l: 'Holidays' }],
  },
  {
    label: { EN: 'Project Kanban', BM: 'Papan Kanban', ZH: '项目看板' },
    desc: { EN: 'Track all projects across Pending / Confirmed / Completed. One-click status cycling with contract amounts.', BM: 'Jejaki semua projek merentasi Pending / Confirmed / Completed.', ZH: '一览所有项目：待谈 / 已成交 / 已完工，一键切换状态。' },
    color: 'from-green-500/20 to-teal-500/10',
    icon: '📋',
    stats: [{ v: '3', l: 'Columns' }, { v: 'Drag', l: 'Drop' }, { v: 'Live', l: 'Progress' }],
  },
  {
    label: { EN: 'Profit Analytics', BM: 'Analitik Keuntungan', ZH: '利润分析' },
    desc: { EN: 'Real-time Revenue vs Cost comparison per trade. Workers upload receipts → AI OCR → instant profit margin.', BM: 'Perbandingan Hasil vs Kos masa nyata. Pekerja muat naik resit → OCR AI.', ZH: '实时收入 vs 成本对比，工人上传单据 → AI OCR → 即时利润率。' },
    color: 'from-purple-500/20 to-pink-500/10',
    icon: '💰',
    stats: [{ v: 'Auto', l: 'OCR' }, { v: '25', l: 'Categories' }, { v: 'Live', l: 'Margin' }],
  },
];

export default function LandingPage() {
  const { lang, setLang, region, setRegion, t } = useI18n();
  const [slide, setSlide] = useState(0);
  const [pricingPeriod, setPricingPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [statsCounted, setStatsCounted] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  const [navScrolled, setNavScrolled] = useState(false);

  // Auto-advance carousel
  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 4500);
    return () => clearInterval(t);
  }, []);

  // Navbar scroll effect
  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Stats animation trigger
  useEffect(() => {
    if (!statsRef.current) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsCounted(true); }, { threshold: 0.4 });
    obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  const prices = PRICING[region as keyof typeof PRICING] ?? PRICING.MY;

  const getPro  = () => prices.pro[pricingPeriod];
  const getElite = () => prices.elite[pricingPeriod];
  const savePct = { monthly: '', quarterly: 'Save 10%', yearly: 'Save 24%' };

  const LANG_LABELS: Record<Language, string> = { EN: 'English', BM: 'Bahasa', ZH: '中文' };

  return (
    <div style={{ background: '#0A0F1A', color: '#fff', fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)', minHeight: '100vh' }}>

      {/* ── Fixed Navbar ─────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: navScrolled ? 'rgba(15,25,35,0.97)' : 'rgba(10,15,26,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(240,185,11,0.12)',
        height: 64,
        display: 'flex', alignItems: 'center',
        padding: '0 24px', gap: 8,
        transition: 'background 0.3s',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 16 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F0B90B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, color: '#0d0f14' }}>RS</div>
          <span style={{ fontFamily: 'var(--font-cormorant, Cormorant Garamond, serif)', fontSize: 20, fontWeight: 700, color: '#F0B90B', letterSpacing: 0.5 }}>RenoSmart</span>
          <span style={{ fontSize: 9, color: '#4a5a6a', letterSpacing: 2, fontWeight: 400, marginLeft: 2 }}>PLATFORM</span>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Language toggle */}
        <div style={{ display: 'flex', gap: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 2 }}>
          {(['EN', 'BM', 'ZH'] as Language[]).map(l => (
            <button key={l} onClick={() => setLang(l)} style={{
              padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
              background: lang === l ? 'rgba(240,185,11,0.15)' : 'transparent',
              color: lang === l ? '#F0B90B' : '#8a9bb0',
              border: lang === l ? '1px solid rgba(240,185,11,0.3)' : '1px solid transparent',
              cursor: 'pointer', transition: 'all 0.15s',
            }}>{l === 'ZH' ? '中文' : l}</button>
          ))}
        </div>

        {/* Region toggle */}
        <div style={{ display: 'flex', gap: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 2, marginLeft: 4 }}>
          {(['MY', 'SG'] as Region[]).map(r => (
            <button key={r} onClick={() => setRegion(r)} style={{
              padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
              background: region === r ? 'rgba(240,185,11,0.15)' : 'transparent',
              color: region === r ? '#F0B90B' : '#8a9bb0',
              border: region === r ? '1px solid rgba(240,185,11,0.3)' : '1px solid transparent',
              cursor: 'pointer', transition: 'all 0.15s',
            }}>{r === 'MY' ? '🇲🇾 MY' : '🇸🇬 SG'}</button>
          ))}
        </div>

        {/* Login / Get Started */}
        <Link href="/login" style={{ padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#8a9bb0', textDecoration: 'none', transition: 'color 0.2s', marginLeft: 8 }}
          onMouseOver={e => (e.currentTarget.style.color = '#fff')}
          onMouseOut={e => (e.currentTarget.style.color = '#8a9bb0')}>
          {lang === 'ZH' ? '登入' : lang === 'BM' ? 'Log Masuk' : 'Login'}
        </Link>
        <Link href="/register" style={{ padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700, background: '#F0B90B', color: '#0d0f14', textDecoration: 'none', transition: 'all 0.2s' }}
          onMouseOver={e => (e.currentTarget.style.background = '#F8D33A')}
          onMouseOut={e => (e.currentTarget.style.background = '#F0B90B')}>
          {lang === 'ZH' ? '免费开始' : lang === 'BM' ? 'Mulakan Percuma' : 'Get Started Free'}
        </Link>
      </nav>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section style={{ paddingTop: 120, paddingBottom: 80, textAlign: 'center', padding: '120px 24px 80px' }}>
        <div style={{ display: 'inline-block', background: 'rgba(240,185,11,0.1)', border: '1px solid rgba(240,185,11,0.25)', borderRadius: 20, padding: '4px 14px', fontSize: 11, fontWeight: 700, color: '#F0B90B', letterSpacing: 1, marginBottom: 24 }}>
          🇲🇾 🇸🇬 &nbsp; {lang === 'ZH' ? '专为马来西亚 & 新加坡装修行业打造' : lang === 'BM' ? 'Dibina khas untuk industri pengubahsuaian Malaysia & Singapura' : 'Built for Malaysia & Singapore renovation industry'}
        </div>

        <h1 style={{ fontFamily: 'var(--font-cormorant, Cormorant Garamond, serif)', fontSize: 'clamp(42px, 7vw, 80px)', fontWeight: 700, lineHeight: 1.1, maxWidth: 820, margin: '0 auto 20px', backgroundImage: 'linear-gradient(135deg, #fff 0%, #F0B90B 50%, #fff 100%)', backgroundSize: '200% 200%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', animation: 'gradient 6s ease infinite' }}>
          {lang === 'ZH' ? 'AI 驱动的装修管理平台' : lang === 'BM' ? 'Platform Pengurusan Pengubahsuaian Berkuasa AI' : 'AI-Powered Renovation Management Platform'}
        </h1>

        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', maxWidth: 600, margin: '0 auto 40px', lineHeight: 1.6 }}>
          {lang === 'ZH' ? '智能报价审核 · 自动进度甘特图 · 实时成本追踪\n专为马来西亚/新加坡装修行业打造' : lang === 'BM' ? 'Audit sebut harga AI · Carta Gantt automatik · Penjejakan kos masa nyata' : 'AI Quotation Audit · Auto Gantt Scheduling · Real-time Cost Tracking'}
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/register" style={{ padding: '13px 28px', borderRadius: 10, fontSize: 15, fontWeight: 700, background: '#F0B90B', color: '#0d0f14', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {lang === 'ZH' ? '免费开始使用 →' : lang === 'BM' ? 'Mulakan Percuma →' : 'Get Started Free →'}
          </Link>
          <Link href="/login" style={{ padding: '13px 28px', borderRadius: 10, fontSize: 15, fontWeight: 700, background: 'transparent', color: '#fff', textDecoration: 'none', border: '1.5px solid rgba(255,255,255,0.2)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {lang === 'ZH' ? '登入账户' : lang === 'BM' ? 'Log Masuk' : 'Sign In'}
          </Link>
        </div>

        {/* App Mockup */}
        <div style={{ maxWidth: 900, margin: '60px auto 0', perspective: 1000 }}>
          <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 40px 80px rgba(0,0,0,0.4), 0 0 60px rgba(240,185,11,0.08)', transform: 'rotateX(4deg)', transformStyle: 'preserve-3d', background: '#0F1923' }}>
            {/* Browser chrome */}
            <div style={{ height: 32, background: '#1a2535', display: 'flex', alignItems: 'center', padding: '0 14px', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#E53935' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#F0B90B' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#16A34A' }} />
              <div style={{ flex: 1, height: 18, background: 'rgba(255,255,255,0.05)', borderRadius: 4, marginLeft: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>app.renosmart.com</span>
              </div>
            </div>
            {/* Content */}
            <div style={{ display: 'flex', height: 280 }}>
              {/* Sidebar */}
              <div style={{ width: 180, background: '#0F1923', borderRight: '1px solid rgba(255,255,255,0.04)', padding: '16px 0' }}>
                {['Dashboard', 'Projects', 'Quotation AI', 'Gantt Chart', 'Workers', 'Price DB'].map((item, i) => (
                  <div key={i} style={{ padding: '7px 16px', fontSize: 11, color: i === 0 ? '#F0B90B' : 'rgba(255,255,255,0.35)', background: i === 0 ? 'rgba(240,185,11,0.1)' : 'transparent', borderLeft: `2px solid ${i === 0 ? '#F0B90B' : 'transparent'}` }}>
                    {item}
                  </div>
                ))}
              </div>
              {/* Main */}
              <div style={{ flex: 1, padding: 16, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
                  {[['Active', '8', '#3b82f6'], ['Confirmed', '5', '#F0B90B'], ['Revenue', 'RM 2.4M', '#16A34A']].map(([l, v, c]) => (
                    <div key={l} style={{ borderRadius: 8, padding: '8px 10px', background: `${c}18`, border: `1px solid ${c}30` }}>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>{l}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: c, marginTop: 2 }}>{v}</div>
                    </div>
                  ))}
                </div>
                {[['Kitchen Reno', 78, '#60a5fa'], ['Office Fit-out', 45, '#F0B90B'], ['Condo Reno', 92, '#4ade80'], ['Retail Shop', 23, '#a78bfa']].map(([name, pct, color]) => (
                  <div key={name as string} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: '6px 10px', marginBottom: 5 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, marginBottom: 4 }}>
                      <span style={{ color: 'rgba(255,255,255,0.6)' }}>{name}</span>
                      <span style={{ color: color as string, fontWeight: 700 }}>{pct}%</span>
                    </div>
                    <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: color as string, borderRadius: 2, transition: 'width 1s ease' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ────────────────────────────────────── */}
      <div ref={statsRef} style={{ background: 'rgba(240,185,11,0.05)', borderTop: '1px solid rgba(240,185,11,0.12)', borderBottom: '1px solid rgba(240,185,11,0.12)', padding: '24px 32px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, textAlign: 'center' }}>
          {[['500+', lang === 'ZH' ? '活跃设计师' : 'Active Designers'], ['2,000+', lang === 'ZH' ? '管理项目' : 'Projects Managed'], ['RM 50M+', lang === 'ZH' ? '报价处理' : 'Quotations Processed'], ['95%', lang === 'ZH' ? 'AI 准确率' : 'AI Accuracy']].map(([v, l]) => (
            <div key={l} style={{ animation: statsCounted ? 'countUp 0.6s ease forwards' : 'none', opacity: statsCounted ? 1 : 0.4 }}>
              <div style={{ fontFamily: 'var(--font-dm-mono, DM Mono, monospace)', fontSize: 28, fontWeight: 800, color: '#F0B90B', lineHeight: 1 }}>{v}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 5 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Screenshot Carousel ──────────────────────────── */}
      <section style={{ padding: '80px 24px', background: '#0D1520' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontFamily: 'var(--font-cormorant, Cormorant Garamond, serif)', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, marginBottom: 12 }}>
              {lang === 'ZH' ? '探索 RenoSmart 的强大功能' : lang === 'BM' ? 'Terokai Ciri-ciri Berkuasa RenoSmart' : 'Explore RenoSmart\'s Powerful Features'}
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)' }}>
              {lang === 'ZH' ? '从报价审核到工程竣工，一站式管理' : 'From quotation audit to project handover, all in one place'}
            </p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 32, position: 'relative' }}>
            {/* Slide content */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center' }}>
              {/* Left: Visual mock */}
              <div style={{ background: `linear-gradient(135deg, ${SLIDES[slide].color.replace('from-', '').replace(' to-', ', ')})`, borderRadius: 16, padding: 32, minHeight: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>{SLIDES[slide].icon}</div>
                <div style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: 22, fontWeight: 700, textAlign: 'center', marginBottom: 20 }}>
                  {SLIDES[slide].label[lang as keyof typeof SLIDES[0]['label']] ?? SLIDES[slide].label.EN}
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  {SLIDES[slide].stats.map(s => (
                    <div key={s.l} style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--font-dm-mono, monospace)', fontSize: 20, fontWeight: 800, color: '#F0B90B' }}>{s.v}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Description */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#F0B90B', marginBottom: 12, textTransform: 'uppercase' }}>
                  {lang === 'ZH' ? '功能亮点' : 'FEATURE HIGHLIGHT'}
                </div>
                <h3 style={{ fontSize: 26, fontWeight: 700, marginBottom: 14, lineHeight: 1.2 }}>
                  {SLIDES[slide].label[lang as keyof typeof SLIDES[0]['label']] ?? SLIDES[slide].label.EN}
                </h3>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: 24 }}>
                  {SLIDES[slide].desc[lang as keyof typeof SLIDES[0]['desc']] ?? SLIDES[slide].desc.EN}
                </p>
                <Link href="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 9, background: 'rgba(240,185,11,0.12)', border: '1px solid rgba(240,185,11,0.3)', color: '#F0B90B', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                  {lang === 'ZH' ? '立即体验 →' : 'Try it now →'}
                </Link>
              </div>
            </div>

            {/* Dots */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 28 }}>
              {SLIDES.map((_, i) => (
                <button key={i} onClick={() => setSlide(i)} style={{ width: i === slide ? 24 : 8, height: 8, borderRadius: 4, background: i === slide ? '#F0B90B' : 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', transition: 'all 0.3s' }} />
              ))}
            </div>

            {/* Nav arrows */}
            <button onClick={() => setSlide(s => (s - 1 + SLIDES.length) % SLIDES.length)} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
            <button onClick={() => setSlide(s => (s + 1) % SLIDES.length)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
          </div>

          {/* 3-step process */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 32 }}>
            {[['①', lang === 'ZH' ? '上传报价单' : 'Upload Quotation', lang === 'ZH' ? 'PDF / Excel / CSV' : 'PDF / Excel / CSV'],
              ['②', lang === 'ZH' ? 'AI 智能分析' : 'AI Analysis', lang === 'ZH' ? '即时审核 + 评分' : 'Instant audit + scoring'],
              ['③', lang === 'ZH' ? '自动生成进度表' : 'Auto-Generate Schedule', lang === 'ZH' ? 'Gantt + 任务分配' : 'Gantt + task assignment']
            ].map(([n, title, sub]) => (
              <div key={n as string} style={{ textAlign: 'center', padding: '20px 16px', background: 'rgba(240,185,11,0.04)', border: '1px solid rgba(240,185,11,0.1)', borderRadius: 12 }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{n}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Role Entry Section ───────────────────────────── */}
      <section style={{ padding: '80px 24px', background: '#0A0F1A' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, textAlign: 'center', marginBottom: 12 }}>
            {lang === 'ZH' ? '您是谁？选择您的入口' : lang === 'BM' ? 'Siapa Anda? Pilih Portal Anda' : "Who Are You? Choose Your Portal"}
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 40 }}>
            {lang === 'ZH' ? '专属界面，为每个角色量身定制' : 'A dedicated workspace tailored for every role'}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[
              {
                icon: '🏗️',
                name: lang === 'ZH' ? '设计师 / 装修公司' : lang === 'BM' ? 'Pereka / Syarikat Pengubahsuaian' : 'Designer / ID Firm',
                tag: lang === 'ZH' ? '最受欢迎' : 'Most Popular',
                features: lang === 'ZH'
                  ? ['AI 报价审核 + 评分', '自动甘特图排程', '多项目看板管理', '工人任务分配', '价格数据库', '成本 vs 收入分析']
                  : ['AI Quotation Audit + Score', 'Auto Gantt Scheduling', 'Multi-project Kanban', 'Worker Task Assignment', 'Price Intelligence DB', 'Cost vs Revenue Analysis'],
                href: '/register?role=designer',
                color: '#F0B90B',
              },
              {
                icon: '🏠',
                name: lang === 'ZH' ? '业主 / 房主' : lang === 'BM' ? 'Pemilik Rumah' : 'Owner / Homeowner',
                tag: '',
                features: lang === 'ZH'
                  ? ['实时施工进度追踪', '付款进度明细', '施工照片审批', 'VO 变更单审批', '里程碑时间线', '文件下载']
                  : ['Real-time progress tracking', 'Payment schedule details', 'Site photo approval', 'VO / variation approval', 'Milestone timeline', 'Document download'],
                href: '/register?role=owner',
                color: '#00C9A7',
              },
              {
                icon: '🔨',
                name: lang === 'ZH' ? '装修工 / 承包商' : lang === 'BM' ? 'Pekerja / Kontraktor' : 'Worker / Subcontractor',
                tag: '',
                features: lang === 'ZH'
                  ? ['查看每日任务安排', '签到签退打卡', '上传完工照片', '上传材料单据', '材料准备清单', '工地信息查阅']
                  : ['View daily task assignments', 'Check-in / Check-out', 'Upload completion photos', 'Upload material receipts', 'Material prep checklist', 'Site information access'],
                href: '/register?role=worker',
                color: '#3b82f6',
              },
            ].map(({ icon, name, tag, features, href, color }) => (
              <Link key={name} href={href} style={{ textDecoration: 'none' }}>
                <div
                  style={{ background: '#0F1923', border: `1.5px solid rgba(255,255,255,0.08)`, borderRadius: 20, padding: 24, height: '100%', cursor: 'pointer', transition: 'all 0.25s', display: 'flex', flexDirection: 'column', gap: 14 }}
                  onMouseOver={e => { (e.currentTarget as HTMLDivElement).style.borderColor = color; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 12px 40px ${color}20`; }}
                  onMouseOut={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
                >
                  <div>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>{icon}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{name}</span>
                      {tag && <span style={{ fontSize: 9, fontWeight: 800, background: `${color}20`, color, border: `1px solid ${color}40`, borderRadius: 4, padding: '1px 7px', letterSpacing: 0.5 }}>{tag}</span>}
                    </div>
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {features.map(f => (
                      <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: 'rgba(255,255,255,0.65)' }}>
                        <span style={{ color, marginTop: 1, flexShrink: 0 }}>✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <div style={{ marginTop: 'auto', color, fontSize: 14, fontWeight: 700 }}>
                    {lang === 'ZH' ? '立即注册 →' : 'Register now →'}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', background: '#0D1520' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, textAlign: 'center', marginBottom: 12 }}>
            {lang === 'ZH' ? '专业装修管理，全面覆盖' : lang === 'BM' ? 'Pengurusan Pengubahsuaian Profesional' : 'Professional Renovation Management'}
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 56 }}>
            {lang === 'ZH' ? '从报价审核到工程移交，RenoSmart 覆盖完整工作流' : 'From quotation audit to project handover, RenoSmart covers the complete workflow'}
          </p>

          {[
            { icon: '🧠', title: lang === 'ZH' ? 'AI 报价审核' : 'AI Quotation Audit', desc: lang === 'ZH' ? '自动检测超价项目、遗漏范围，评分报告一目了然。支持 PDF / Excel / CSV / TXT 格式，3层解析保证 95% 准确率。' : 'Automatically detects overpriced items and missing scopes. Supports PDF/Excel/CSV/TXT with 3-layer parsing for 95% accuracy.', color: '#a78bfa', items: lang === 'ZH' ? ['AI 评分 (0-100分)', '价格异常标记', '遗漏项目提示', 'Supply type 分类'] : ['AI scoring 0-100', 'Price anomaly flags', 'Missing item alerts', 'Supply type classification'] },
            { icon: '📅', title: lang === 'ZH' ? '智能甘特图' : 'Smart Gantt Chart', desc: lang === 'ZH' ? '依赖驱动排程，自动跳过节假日和周末。木工三阶段（测量→工厂→安装）精准规划，拖拽调整即时保存。' : 'Dependency-driven scheduling, auto-skips MY/SG holidays. Multi-phase carpentry planning, drag-and-drop adjustments.', color: '#60a5fa', items: lang === 'ZH' ? ['20+ 施工阶段', '节假日自动跳过', '周六日工作可选', 'Pending/Confirmed/Completed 状态'] : ['20+ construction phases', 'Auto holiday skip', 'Sat/Sun toggle', 'Pending/Confirmed/Completed'] },
            { icon: '💰', title: lang === 'ZH' ? '价格情报数据库' : 'Price Intelligence DB', desc: lang === 'ZH' ? '从每份报价单自动学习市场价格。25大类，10个样本起显示市场参考价（最低/平均/最高）。' : 'Automatically learns market prices from every uploaded quotation. 25 categories, showing min/avg/max after 10 samples.', color: '#34d399', items: lang === 'ZH' ? ['MY_KL/JB/PG/SG 分区', '25大类+无限细分', '置信度标识', '工种成本 vs 报价对比'] : ['MY_KL/JB/PG/SG regions', '25 categories + sub-categories', 'Confidence ratings', 'Cost vs quotation comparison'] },
            { icon: '👷', title: lang === 'ZH' ? '工人管理系统' : 'Worker Management', desc: lang === 'ZH' ? '工人上传材料单据 → Claude Vision OCR 自动提取 → 实时更新项目成本，设计师即时看到利润率变化。' : 'Workers upload receipts → Claude Vision OCR auto-extracts data → real-time cost update, designers see profit margins instantly.', color: '#fb923c', items: lang === 'ZH' ? ['Claude Vision OCR', '24种工种分类', '任务签到打卡', '施工照片审批'] : ['Claude Vision OCR', '24 trade categories', 'Task check-in/out', 'Site photo approval'] },
          ].map(({ icon, title, desc, color, items }, i) => (
            <div key={title} style={{ display: 'grid', gridTemplateColumns: i % 2 === 0 ? '1fr 1fr' : '1fr 1fr', gap: 40, marginBottom: 64, direction: i % 2 === 1 ? 'rtl' : 'ltr' }}>
              {/* Visual */}
              <div style={{ background: `linear-gradient(135deg, ${color}15, ${color}05)`, border: `1px solid ${color}20`, borderRadius: 16, padding: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', direction: 'ltr', minHeight: 200 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 52, marginBottom: 16 }}>{icon}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                    {items.map(item => (
                      <span key={item} style={{ background: `${color}15`, border: `1px solid ${color}30`, color, borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{item}</span>
                    ))}
                  </div>
                </div>
              </div>
              {/* Text */}
              <div style={{ direction: 'ltr', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: 14 }}>{icon}</div>
                <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10, color: '#fff' }}>{title}</h3>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: 20 }}>{desc}</p>
                <Link href="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 8, background: `${color}12`, border: `1px solid ${color}30`, color, fontSize: 13, fontWeight: 700, textDecoration: 'none', width: 'fit-content' }}>
                  {lang === 'ZH' ? '了解更多 →' : 'Learn more →'}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Social Proof ─────────────────────────────────── */}
      <section style={{ padding: '64px 24px', background: '#0A0F1A', textAlign: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} style={{ width: 36, height: 36, borderRadius: '50%', background: `hsl(${i * 60}, 50%, 45%)`, border: '2px solid #0A0F1A', marginLeft: i > 1 ? -10 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>👤</div>
            ))}
          </div>
          <div style={{ fontSize: 14, color: '#F0B90B', marginBottom: 24, fontWeight: 600 }}>
            {lang === 'ZH' ? '500+ 位装修设计师信赖 RenoSmart' : '500+ renovation designers trust RenoSmart'}
          </div>
          <blockquote style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, fontStyle: 'italic', background: 'rgba(240,185,11,0.04)', border: '1px solid rgba(240,185,11,0.12)', borderRadius: 16, padding: '24px 28px' }}>
            {lang === 'ZH' ? '"上传报价单后，AI立刻帮我找出漏报的 M&E 项目，省了大约 RM 8,000。进度表自动生成，工人都能收到任务提醒。"' : '"After uploading the quotation, AI immediately found missing M&E items, saving approximately RM 8,000. The schedule auto-generated and workers received task reminders."'}
          </blockquote>
          <div style={{ marginTop: 16, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
            {lang === 'ZH' ? '— 张设计师，吉隆坡' : '— Kevin Tan, Interior Designer, Kuala Lumpur'}
          </div>
        </div>
      </section>

      {/* ── Pricing Section ──────────────────────────────── */}
      <section style={{ padding: '80px 24px', background: '#0D1520' }}>
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>
            {lang === 'ZH' ? '透明定价，随时升级' : 'Simple, Transparent Pricing'}
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 28 }}>
            {lang === 'ZH' ? '无隐藏费用 · 随时取消 · ' + (region === 'MY' ? '支持 FPX / 信用卡 (Billplz)' : '支持 Stripe SGD 结算') : `No hidden fees · Cancel anytime · ${region === 'MY' ? 'FPX / Card via Billplz' : 'SGD payment via Stripe'}`}
          </p>

          {/* Period toggle */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 36 }}>
            <div style={{ display: 'flex', gap: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 3 }}>
              {(['monthly', 'quarterly', 'yearly'] as const).map(p => (
                <button key={p} onClick={() => setPricingPeriod(p)} style={{ padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: pricingPeriod === p ? '#1a2535' : 'transparent', color: pricingPeriod === p ? '#fff' : '#8a9bb0', border: 'none', cursor: 'pointer', transition: 'all 0.15s', position: 'relative' }}>
                  {p === 'monthly' ? (lang === 'ZH' ? '月付' : 'Monthly') : p === 'quarterly' ? (lang === 'ZH' ? '季付' : 'Quarterly') : (lang === 'ZH' ? '年付' : 'Yearly')}
                  {p === 'quarterly' && <span style={{ fontSize: 9, fontWeight: 800, color: '#16A34A', marginLeft: 4 }}>-10%</span>}
                  {p === 'yearly' && <span style={{ fontSize: 9, fontWeight: 800, color: '#16A34A', marginLeft: 4 }}>-24%</span>}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {/* Free */}
            <div style={{ background: '#0F1923', border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden' }}>
              <div style={{ padding: '24px 24px 0' }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: '#6B7A94', background: 'rgba(255,255,255,0.06)', borderRadius: 5, padding: '2px 8px', display: 'inline-block', marginBottom: 12 }}>FREE</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{lang === 'ZH' ? '免费版' : 'Free'}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>{lang === 'ZH' ? '入门体验' : 'Get started'}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 20 }}>
                  <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)' }}>{prices.currency}</span>
                  <span style={{ fontSize: 40, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-dm-mono, monospace)', lineHeight: 1 }}>0</span>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>/{lang === 'ZH' ? '永久' : 'forever'}</span>
                </div>
              </div>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 24px' }} />
              <div style={{ padding: '16px 24px 24px' }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {(lang === 'ZH' ? ['3次 AI 分析（终身）', '1个工程项目', '基础甘特图', '邮件支持'] : ['3 AI analyses lifetime', '1 project', 'Basic Gantt chart', 'Email support']).map(f => (
                    <li key={f} style={{ display: 'flex', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.65)', alignItems: 'flex-start' }}><span style={{ color: '#16A34A', marginTop: 1 }}>✓</span>{f}</li>
                  ))}
                </ul>
                <Link href="/register" style={{ display: 'block', textAlign: 'center', padding: 11, borderRadius: 9, border: '1.5px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 13, fontWeight: 700, transition: 'all 0.2s' }}>
                  {lang === 'ZH' ? '免费注册' : 'Get Started Free'}
                </Link>
              </div>
            </div>

            {/* Pro */}
            <div style={{ background: '#0F1923', border: '2px solid #F0B90B', borderRadius: 20, overflow: 'hidden', position: 'relative', transform: 'scale(1.03)', boxShadow: '0 0 40px rgba(240,185,11,0.15)' }}>
              <div style={{ background: '#F0B90B', padding: '6px', textAlign: 'center', fontSize: 11, fontWeight: 800, color: '#0d0f14', letterSpacing: 1 }}>
                ✦ {lang === 'ZH' ? '最受欢迎' : 'MOST POPULAR'} ✦
              </div>
              <div style={{ padding: '20px 24px 0' }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: '#F0B90B', background: 'rgba(240,185,11,0.12)', borderRadius: 5, padding: '2px 8px', display: 'inline-block', marginBottom: 12 }}>PRO</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{lang === 'ZH' ? '专业版' : 'Pro'}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>{lang === 'ZH' ? '成长型装修公司首选' : 'For growing ID firms'}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 4 }}>
                  <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)' }}>{prices.currency}</span>
                  <span style={{ fontSize: 40, fontWeight: 800, color: '#F0B90B', fontFamily: 'var(--font-dm-mono, monospace)', lineHeight: 1 }}>{getPro()}</span>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>
                  /{pricingPeriod === 'monthly' ? (lang === 'ZH' ? '月' : 'mo') : pricingPeriod === 'quarterly' ? (lang === 'ZH' ? '季度' : 'quarter') : (lang === 'ZH' ? '年' : 'year')}
                  {savePct[pricingPeriod] && <span style={{ marginLeft: 8, color: '#16A34A', fontWeight: 700 }}>{savePct[pricingPeriod]}</span>}
                </div>
              </div>
              <div style={{ height: 1, background: 'rgba(240,185,11,0.2)', margin: '0 24px' }} />
              <div style={{ padding: '16px 24px 24px' }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {(lang === 'ZH' ? ['50次 AI 分析/月', '无限项目', '价格情报数据库', '付款进度追踪', '业主/工人门户', '工人任务分配', '施工照片审批'] : ['50 AI analyses/month', 'Unlimited projects', 'Price intelligence DB', 'Payment tracking', 'Owner & worker portals', 'Worker task assignment', 'Site photo approval']).map(f => (
                    <li key={f} style={{ display: 'flex', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.65)', alignItems: 'flex-start' }}><span style={{ color: '#F0B90B', marginTop: 1 }}>★</span>{f}</li>
                  ))}
                </ul>
                <Link href="/register?plan=pro" style={{ display: 'block', textAlign: 'center', padding: 11, borderRadius: 9, background: '#F0B90B', color: '#0d0f14', textDecoration: 'none', fontSize: 13, fontWeight: 800, transition: 'all 0.2s' }}>
                  {lang === 'ZH' ? '立即开始 Pro' : 'Start Pro Plan'}
                </Link>
              </div>
            </div>

            {/* Elite */}
            <div style={{ background: 'linear-gradient(135deg, rgba(167,139,250,0.08), #0F1923)', border: '1.5px solid rgba(167,139,250,0.25)', borderRadius: 20, overflow: 'hidden' }}>
              <div style={{ padding: '24px 24px 0' }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: '#a78bfa', background: 'rgba(167,139,250,0.12)', borderRadius: 5, padding: '2px 8px', display: 'inline-block', marginBottom: 12 }}>ELITE ⚡</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{lang === 'ZH' ? '旗舰版' : 'Elite'}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>{lang === 'ZH' ? '大型装修公司' : 'Large design firms'}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 4 }}>
                  <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)' }}>{prices.currency}</span>
                  <span style={{ fontSize: 40, fontWeight: 800, color: '#a78bfa', fontFamily: 'var(--font-dm-mono, monospace)', lineHeight: 1 }}>{getElite()}</span>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>
                  /{pricingPeriod === 'monthly' ? (lang === 'ZH' ? '月' : 'mo') : pricingPeriod === 'quarterly' ? (lang === 'ZH' ? '季度' : 'quarter') : (lang === 'ZH' ? '年' : 'year')}
                  {savePct[pricingPeriod] && <span style={{ marginLeft: 8, color: '#16A34A', fontWeight: 700 }}>{savePct[pricingPeriod]}</span>}
                </div>
              </div>
              <div style={{ height: 1, background: 'rgba(167,139,250,0.15)', margin: '0 24px' }} />
              <div style={{ padding: '16px 24px 24px' }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {(lang === 'ZH' ? ['无限 AI 分析', '所有 Pro 功能', '成本数据库', '利润分析看板', '团队成员管理', 'Excel 导出', '专属客服'] : ['Unlimited AI analyses', 'All Pro features', 'Cost database', 'Profit analytics', 'Team member management', 'Excel export', 'Dedicated support']).map(f => (
                    <li key={f} style={{ display: 'flex', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.65)', alignItems: 'flex-start' }}><span style={{ color: '#a78bfa', marginTop: 1 }}>✓</span>{f}</li>
                  ))}
                </ul>
                <Link href="/register?plan=elite" style={{ display: 'block', textAlign: 'center', padding: 11, borderRadius: 9, border: '1.5px solid rgba(167,139,250,0.35)', color: '#a78bfa', textDecoration: 'none', fontSize: 13, fontWeight: 700, transition: 'all 0.2s' }}>
                  {lang === 'ZH' ? '立即开始 Elite' : 'Start Elite Plan'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer style={{ background: '#070B12', borderTop: '1px solid rgba(240,185,11,0.1)', padding: '48px 24px 32px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 32, marginBottom: 40 }}>
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F0B90B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, color: '#0d0f14' }}>RS</div>
                <span style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: 18, fontWeight: 700, color: '#F0B90B' }}>RenoSmart</span>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: 240 }}>
                {lang === 'ZH' ? '专为马来西亚 & 新加坡装修行业打造的 AI 管理平台' : 'AI-powered renovation management platform built for Malaysia & Singapore'}
              </p>
              {/* Language + Region */}
              <div style={{ display: 'flex', gap: 6, marginTop: 16, flexWrap: 'wrap' }}>
                {(['EN', 'BM', 'ZH'] as Language[]).map(l => (
                  <button key={l} onClick={() => setLang(l)} style={{ padding: '3px 10px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: lang === l ? 'rgba(240,185,11,0.12)' : 'transparent', color: lang === l ? '#F0B90B' : '#6B7A94', border: `1px solid ${lang === l ? 'rgba(240,185,11,0.25)' : 'rgba(255,255,255,0.08)'}`, cursor: 'pointer' }}>{LANG_LABELS[l]}</button>
                ))}
                {(['MY', 'SG'] as Region[]).map(r => (
                  <button key={r} onClick={() => setRegion(r)} style={{ padding: '3px 10px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: region === r ? 'rgba(240,185,11,0.12)' : 'transparent', color: region === r ? '#F0B90B' : '#6B7A94', border: `1px solid ${region === r ? 'rgba(240,185,11,0.25)' : 'rgba(255,255,255,0.08)'}`, cursor: 'pointer' }}>{r === 'MY' ? '🇲🇾 MY' : '🇸🇬 SG'}</button>
                ))}
              </div>
            </div>
            {/* Product */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: '#4a5a6a', marginBottom: 14, textTransform: 'uppercase' }}>{lang === 'ZH' ? '产品' : 'Product'}</div>
              {(lang === 'ZH' ? ['AI 报价审核', '智能甘特图', '价格数据库', '成本分析', '工人管理'] : ['AI Quotation Audit', 'Smart Gantt', 'Price Database', 'Cost Analysis', 'Worker Management']).map(f => (
                <div key={f} style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}>{f}</div>
              ))}
            </div>
            {/* Support */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: '#4a5a6a', marginBottom: 14, textTransform: 'uppercase' }}>{lang === 'ZH' ? '支持' : 'Support'}</div>
              {(lang === 'ZH' ? ['使用文档', '常见问题', '定价方案', '联系我们'] : ['Documentation', 'FAQ', 'Pricing', 'Contact Us']).map(f => (
                <div key={f} style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 8, cursor: 'pointer' }}>{f}</div>
              ))}
            </div>
            {/* Legal */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: '#4a5a6a', marginBottom: 14, textTransform: 'uppercase' }}>{lang === 'ZH' ? '法律' : 'Legal'}</div>
              {(lang === 'ZH' ? ['隐私政策', '服务条款', '安全政策'] : ['Privacy Policy', 'Terms of Service', 'Security']).map(f => (
                <div key={f} style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 8, cursor: 'pointer' }}>{f}</div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>© 2025 RenoSmart. {lang === 'ZH' ? '专为马来西亚 & 新加坡装修行业打造' : 'Built for MY & SG renovation industry.'}</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>Powered by Claude AI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
