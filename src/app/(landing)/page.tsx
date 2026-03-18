'use client';

import Link from 'next/link';
import { useI18n } from '@/lib/i18n/context';
import { Language, Region } from '@/types';
import { useState, useEffect, useRef } from 'react';

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

const FEATURES = [
  {
    num: '01',
    label: { EN: 'AI Quotation Audit', BM: 'Audit Sebut Harga AI', ZH: 'AI 报价审核' },
    tag:   { EN: 'CORE FEATURE', BM: 'CIRI UTAMA', ZH: '核心功能' },
    desc:  {
      EN: 'Upload any PDF or Excel quotation — AI audits every line item, detects overpricing, flags missing scopes, and scores completeness in under 30 seconds.',
      BM: 'Muat naik sebarang PDF atau Excel — AI mengaudit setiap item, mengesan lebih bayar, dan menanda skop yang hilang dalam 30 saat.',
      ZH: '上传任何 PDF 或 Excel 报价单，AI 审核每个细项、检测价格异常、标记遗漏范围，30 秒内完成评分。',
    },
    stats: [{ v: '95%', l: 'Accuracy' }, { v: '<30s', l: 'Speed' }, { v: 'RM 8K', l: 'Avg Saved' }],
    color: '#F0B90B',
  },
  {
    num: '02',
    label: { EN: 'Smart Gantt Scheduler', BM: 'Penjadualan Gantt', ZH: '智能甘特排程' },
    tag:   { EN: 'AUTOMATION', BM: 'AUTOMASI', ZH: '自动化' },
    desc:  {
      EN: 'Dependency-driven schedules auto-generate from quotation items. 20+ construction phases, trade-specific durations, automatic MY/SG public holiday skipping.',
      BM: 'Jadual dipacu kebergantungan jana secara automatik daripada item sebut harga, dengan lebih 20 fasa pembinaan.',
      ZH: '依赖驱动排程从报价单自动生成，涵盖 20+ 施工阶段，按工种计算工期，自动跳过法定节假日。',
    },
    stats: [{ v: '20+', l: 'Phases' }, { v: 'Drag', l: 'Resize' }, { v: 'Auto', l: 'Holiday Skip' }],
    color: '#60A5FA',
  },
  {
    num: '03',
    label: { EN: 'Price Intelligence DB', BM: 'Pangkalan Harga', ZH: '价格智能数据库' },
    tag:   { EN: 'MARKET DATA', BM: 'DATA PASARAN', ZH: '市场数据' },
    desc:  {
      EN: 'Crowd-sourced market pricing for 200+ renovation items, updated from every analysis. Compare quotations against current MY/SG market rates by region.',
      BM: 'Harga pasaran untuk 200+ item pengubahsuaian, dikemaskini daripada setiap analisis. Bandingkan sebut harga anda dengan kadar semasa.',
      ZH: '200+ 装修项目的众包市场定价，每次分析后自动更新。按地区对比报价与当前 MY/SG 市场价。',
    },
    stats: [{ v: '200+', l: 'Items' }, { v: '4', l: 'Regions' }, { v: 'Live', l: 'Updates' }],
    color: '#34D399',
  },
  {
    num: '04',
    label: { EN: 'Profit Analytics', BM: 'Analitik Untung', ZH: '利润分析' },
    tag:   { EN: 'FINANCE', BM: 'KEWANGAN', ZH: '财务' },
    desc:  {
      EN: 'Real-time Revenue vs Cost dashboard per project. Workers upload receipts → Claude Vision OCR extracts costs → instant profit margin by trade.',
      BM: 'Papan pemuka Hasil vs Kos masa nyata. Pekerja muat naik resit → OCR Claude Vision → kiraan margin keuntungan setiap perdagangan.',
      ZH: '实时每项目收入 vs 成本仪表板。工人上传单据 → Claude Vision OCR → 按工种即时计算利润率。',
    },
    stats: [{ v: 'Auto', l: 'OCR' }, { v: '25', l: 'Categories' }, { v: '±2%', l: 'Accuracy' }],
    color: '#A78BFA',
  },
];

export default function LandingPage() {
  const { lang, setLang, region, setRegion } = useI18n();
  const [activeFeature, setActiveFeature] = useState(0);
  const [pricingPeriod, setPricingPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [statsCounted, setStatsCounted] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!statsRef.current) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsCounted(true); }, { threshold: 0.4 });
    obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  const prices = PRICING[region as keyof typeof PRICING] ?? PRICING.MY;
  const getPro   = () => prices.pro[pricingPeriod];
  const getElite = () => prices.elite[pricingPeriod];
  const savePct: Record<string, string> = { monthly: '', quarterly: 'Save 10%', yearly: 'Save 24%' };
  const feat = FEATURES[activeFeature];

  return (
    <div style={{ background: '#060C14', color: '#FFFFFF', fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)', minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{`
        @keyframes fadeUp   { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shimmer  { 0%,100% { background-position:200% center; } 50% { background-position:0% center; } }
        @keyframes float    { 0%,100% { transform:rotateX(5deg) translateY(0px); } 50% { transform:rotateX(5deg) translateY(-10px); } }
        @keyframes glowPulse{ 0%,100% { opacity:.6; } 50% { opacity:1; } }
        .anim-1 { animation: fadeUp .7s ease both .1s; }
        .anim-2 { animation: fadeUp .7s ease both .25s; }
        .anim-3 { animation: fadeUp .7s ease both .4s; }
        .anim-4 { animation: fadeUp .7s ease both .55s; }
        .anim-5 { animation: fadeUp .7s ease both .7s; }
        .mockup-float { animation: float 5s ease-in-out infinite; }
        .shimmer-text {
          background: linear-gradient(120deg, #fff 0%, #F0B90B 40%, #fff 60%, #F0B90B 100%);
          background-size: 300% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 5s linear infinite;
        }
        .feat-tab:hover { background: rgba(240,185,11,0.06) !important; }
        .role-card { transition: all .3s ease !important; }
        .role-card:hover { transform: translateY(-4px) !important; }
        .btn-gold:hover  { background: #F8D33A !important; transform: translateY(-1px); box-shadow: 0 8px 28px rgba(240,185,11,.4) !important; }
        .btn-ghost:hover { background: rgba(255,255,255,.1) !important; color: #fff !important; }
        .price-card:hover { border-color: rgba(240,185,11,.35) !important; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { overflow-x: hidden; }
      `}</style>

      {/* ── NAVBAR ───────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 60, display: 'flex', alignItems: 'center', padding: '0 32px', gap: 8,
        background: navScrolled ? 'rgba(6,12,20,.97)' : 'transparent',
        backdropFilter: navScrolled ? 'blur(20px)' : 'none',
        borderBottom: navScrolled ? '1px solid rgba(240,185,11,.12)' : '1px solid transparent',
        transition: 'all .3s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 'auto' }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: 'linear-gradient(135deg,#F0B90B,#F8D33A)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: 12, color: '#060C14',
            boxShadow: '0 4px 12px rgba(240,185,11,.35)',
          }}>RS</div>
          <span style={{ fontFamily: 'var(--font-cormorant,Cormorant Garamond,serif)', fontSize: 22, fontWeight: 700, color: '#F0B90B', letterSpacing: .5 }}>RenoSmart</span>
        </div>

        <div style={{ display: 'flex', gap: 2, background: 'rgba(255,255,255,.04)', borderRadius: 8, padding: 3 }}>
          {(['EN','BM','ZH'] as Language[]).map(l => (
            <button key={l} onClick={() => setLang(l)} style={{
              padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
              background: lang === l ? 'rgba(240,185,11,.15)' : 'transparent',
              color: lang === l ? '#F0B90B' : '#6B7A8D',
              border: lang === l ? '1px solid rgba(240,185,11,.3)' : '1px solid transparent',
              cursor: 'pointer', transition: 'all .15s',
            }}>{l === 'ZH' ? '中文' : l}</button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 2, background: 'rgba(255,255,255,.04)', borderRadius: 8, padding: 3 }}>
          {(['MY','SG'] as Region[]).map(r => (
            <button key={r} onClick={() => setRegion(r)} style={{
              padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
              background: region === r ? 'rgba(240,185,11,.15)' : 'transparent',
              color: region === r ? '#F0B90B' : '#6B7A8D',
              border: region === r ? '1px solid rgba(240,185,11,.3)' : '1px solid transparent',
              cursor: 'pointer', transition: 'all .15s',
            }}>{r === 'MY' ? '🇲🇾 MY' : '🇸🇬 SG'}</button>
          ))}
        </div>

        <Link href="/login" className="btn-ghost" style={{
          padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
          color: '#8899AA', textDecoration: 'none', transition: 'all .2s', marginLeft: 4,
        }}>
          {lang === 'ZH' ? '登入' : lang === 'BM' ? 'Log Masuk' : 'Login'}
        </Link>
        <Link href="/register" className="btn-gold" style={{
          padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700,
          background: '#F0B90B', color: '#060C14', textDecoration: 'none',
          transition: 'all .2s', boxShadow: '0 4px 16px rgba(240,185,11,.25)',
        }}>
          {lang === 'ZH' ? '免费开始' : lang === 'BM' ? 'Mulakan Percuma' : 'Get Started Free'}
        </Link>
      </nav>

      {/* ── HERO ─────────────────────────────────────────── */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '120px 24px 80px', position: 'relative', overflow: 'hidden',
        backgroundImage: `
          linear-gradient(rgba(240,185,11,.035) 1px, transparent 1px),
          linear-gradient(90deg, rgba(240,185,11,.035) 1px, transparent 1px)`,
        backgroundSize: '64px 64px',
      }}>
        {/* Glow orb */}
        <div style={{
          position: 'absolute', top: '35%', left: '50%', transform: 'translate(-50%,-50%)',
          width: 800, height: 500, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(240,185,11,.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Badge */}
        <div className="anim-1" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(240,185,11,.08)', border: '1px solid rgba(240,185,11,.2)',
          borderRadius: 24, padding: '6px 16px',
          fontSize: 11, fontWeight: 700, color: '#F0B90B', letterSpacing: 1.5,
          marginBottom: 32, textTransform: 'uppercase',
        }}>
          <span>🇲🇾</span>
          <span style={{ width: 1, height: 10, background: 'rgba(240,185,11,.3)' }} />
          <span>🇸🇬</span>
          <span style={{ width: 1, height: 10, background: 'rgba(240,185,11,.3)' }} />
          <span>
            {lang === 'ZH' ? '专为马来西亚 & 新加坡装修行业打造'
              : lang === 'BM' ? 'Dibina untuk industri pengubahsuaian MY & SG'
              : 'Built for MY & SG Renovation Industry'}
          </span>
        </div>

        {/* H1 */}
        <h1 className="anim-2" style={{
          fontFamily: 'var(--font-cormorant,Cormorant Garamond,serif)',
          fontSize: 'clamp(52px,8.5vw,100px)', fontWeight: 700, lineHeight: 1.0,
          textAlign: 'center', maxWidth: 940, letterSpacing: -1,
        }}>
          {lang === 'ZH' ? (
            <><span style={{ color: '#FFF' }}>AI 驱动的</span><br /><span className="shimmer-text">装修管理平台</span></>
          ) : lang === 'BM' ? (
            <><span style={{ color: '#FFF' }}>Platform Pengurusan</span><br /><span className="shimmer-text">Pengubahsuaian AI</span></>
          ) : (
            <><span style={{ color: '#FFF' }}>AI-Powered</span><br /><span className="shimmer-text">Renovation Intelligence</span></>
          )}
        </h1>

        {/* Gold rule */}
        <div className="anim-2" style={{
          width: 80, height: 3, borderRadius: 2,
          background: 'linear-gradient(90deg,transparent,#F0B90B,transparent)',
          margin: '28px auto',
        }} />

        {/* Sub */}
        <p className="anim-3" style={{
          fontSize: 17, color: 'rgba(255,255,255,.55)', maxWidth: 560,
          textAlign: 'center', lineHeight: 1.7, marginBottom: 40,
        }}>
          {lang === 'ZH'
            ? 'AI 报价审核 · 智能甘特排程 · 实时成本追踪。专为马来西亚与新加坡装修行业量身打造。'
            : lang === 'BM'
            ? 'Audit sebut harga AI · Penjadualan Gantt pintar · Penjejakan kos masa nyata. Untuk industri MY & SG.'
            : 'AI Quotation Audit · Smart Gantt Scheduling · Real-time Cost Analytics. Engineered for MY & SG renovation professionals.'}
        </p>

        {/* CTAs */}
        <div className="anim-4" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 72 }}>
          <Link href="/register" className="btn-gold" style={{
            padding: '13px 28px', borderRadius: 10, fontSize: 15, fontWeight: 700,
            background: '#F0B90B', color: '#060C14', textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center', gap: 8,
            boxShadow: '0 8px 30px rgba(240,185,11,.3)', transition: 'all .2s',
          }}>
            {lang === 'ZH' ? '免费开始使用' : lang === 'BM' ? 'Mulakan Percuma' : 'Get Started Free'} →
          </Link>
          <Link href="/login" className="btn-ghost" style={{
            padding: '13px 28px', borderRadius: 10, fontSize: 15, fontWeight: 600,
            background: 'rgba(255,255,255,.06)', color: 'rgba(255,255,255,.8)',
            textDecoration: 'none', border: '1px solid rgba(255,255,255,.12)',
            display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'all .2s',
          }}>
            {lang === 'ZH' ? '登入账户' : lang === 'BM' ? 'Log Masuk' : 'Sign In'}
          </Link>
        </div>

        {/* App Mockup */}
        <div className="anim-5" style={{ maxWidth: 900, width: '100%', perspective: 1200 }}>
          <div className="mockup-float" style={{
            borderRadius: 16, overflow: 'hidden',
            border: '1px solid rgba(255,255,255,.08)',
            boxShadow: '0 40px 100px rgba(0,0,0,.6), 0 0 80px rgba(240,185,11,.07), inset 0 1px 0 rgba(255,255,255,.08)',
            transformStyle: 'preserve-3d',
          }}>
            {/* Browser chrome */}
            <div style={{ height: 36, background: '#0D1626', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 8, borderBottom: '1px solid rgba(255,255,255,.05)' }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {['#E53935','#F0B90B','#16A34A'].map(c => (
                  <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: .8 }} />
                ))}
              </div>
              <div style={{ flex: 1, height: 20, background: 'rgba(255,255,255,.04)', borderRadius: 5, marginLeft: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,.25)', fontFamily: 'var(--font-dm-mono,monospace)' }}>app.renosmart.com/designer</span>
              </div>
            </div>

            {/* App interior */}
            <div style={{ display: 'flex', height: 300, background: '#0A1628' }}>
              {/* Sidebar */}
              <div style={{ width: 190, background: '#060C14', borderRight: '1px solid rgba(255,255,255,.04)', padding: '20px 0', flexShrink: 0 }}>
                <div style={{ padding: '0 16px 14px', borderBottom: '1px solid rgba(255,255,255,.04)', marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#F0B90B', letterSpacing: 1 }}>RENOSMART</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,.3)', marginTop: 2 }}>Designer Dashboard</div>
                </div>
                {[{n:'Dashboard',a:true},{n:'Projects',a:false},{n:'Quotation AI',a:false},{n:'Gantt Chart',a:false},{n:'Price DB',a:false},{n:'Workers',a:false}].map(({n,a}) => (
                  <div key={n} style={{
                    padding: '7px 16px', fontSize: 11,
                    color: a ? '#F0B90B' : 'rgba(255,255,255,.3)',
                    background: a ? 'rgba(240,185,11,.08)' : 'transparent',
                    borderLeft: `2px solid ${a ? '#F0B90B' : 'transparent'}`,
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: a ? '#F0B90B' : 'rgba(255,255,255,.15)' }} />
                    {n}
                  </div>
                ))}
              </div>

              {/* Main */}
              <div style={{ flex: 1, padding: '16px 20px', overflow: 'hidden' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', marginBottom: 12, fontFamily: 'var(--font-dm-mono,monospace)', letterSpacing: .5 }}>MARCH 2025 — OVERVIEW</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 14 }}>
                  {[{l:'Active',v:'8',c:'#3B82F6'},{l:'Confirmed',v:'5',c:'#F0B90B'},{l:'Revenue',v:'RM 2.4M',c:'#10B981'},{l:'Margin',v:'23.4%',c:'#A78BFA'}].map(({l,v,c}) => (
                    <div key={l} style={{ borderRadius: 8, padding: '8px 10px', background: `${c}12`, border: `1px solid ${c}25` }}>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,.4)', marginBottom: 3 }}>{l}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: c, fontFamily: 'var(--font-dm-mono,monospace)' }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                  {[
                    {col:'🔵 Pending',items:['Botanical Villa','Sunway Condo'],c:'#3B82F6'},
                    {col:'🟡 Active',items:["D'Putra Kitchen",'Bangsar Office'],c:'#F0B90B'},
                    {col:'✅ Done',items:['Ara Damansara'],c:'#10B981'},
                  ].map(({col,items,c}) => (
                    <div key={col} style={{ background: 'rgba(255,255,255,.03)', borderRadius: 8, padding: 8 }}>
                      <div style={{ fontSize: 8, fontWeight: 700, color: c, marginBottom: 6, letterSpacing: .5 }}>{col}</div>
                      {items.map(item => (
                        <div key={item} style={{ background: 'rgba(255,255,255,.04)', borderRadius: 5, padding: '5px 7px', marginBottom: 4, fontSize: 9, color: 'rgba(255,255,255,.6)', border: '1px solid rgba(255,255,255,.06)' }}>{item}</div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, opacity: .3 }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: '#8899AA', fontFamily: 'var(--font-dm-mono,monospace)' }}>SCROLL</div>
          <div style={{ width: 1, height: 32, background: 'linear-gradient(to bottom,#8899AA,transparent)' }} />
        </div>
      </section>

      {/* ── STATS BAR ─────────────────────────────────────── */}
      <div ref={statsRef} style={{
        background: 'rgba(240,185,11,.04)',
        borderTop: '1px solid rgba(240,185,11,.1)',
        borderBottom: '1px solid rgba(240,185,11,.1)',
        padding: '36px 24px',
      }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24, textAlign: 'center' }}>
          {[
            { v: '500+',    l: lang === 'ZH' ? '活跃设计师' : lang === 'BM' ? 'Pereka Aktif' : 'Active Designers' },
            { v: '2,000+',  l: lang === 'ZH' ? '项目管理' : lang === 'BM' ? 'Projek Diurus' : 'Projects Managed' },
            { v: 'RM 50M+', l: lang === 'ZH' ? '报价处理额' : lang === 'BM' ? 'Sebut Harga Diproses' : 'Quotations Processed' },
            { v: '95%',     l: lang === 'ZH' ? 'AI 准确率' : lang === 'BM' ? 'Ketepatan AI' : 'AI Accuracy' },
          ].map(({v,l}) => (
            <div key={l} style={{ opacity: statsCounted ? 1 : .3, transition: 'opacity .8s ease' }}>
              <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: 44, fontWeight: 700, color: '#F0B90B', lineHeight: 1 }}>{v}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.45)', marginTop: 6, letterSpacing: .5 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ──────────────────────────────────────── */}
      <section style={{ padding: '100px 24px', background: '#08111C' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ marginBottom: 64 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, color: '#F0B90B', marginBottom: 16, textTransform: 'uppercase', fontFamily: 'var(--font-dm-mono,monospace)' }}>
              — {lang === 'ZH' ? '功能特点' : lang === 'BM' ? 'CIRI-CIRI' : 'CAPABILITIES'}
            </div>
            <h2 style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: 'clamp(32px,5vw,56px)', fontWeight: 700, lineHeight: 1.1, maxWidth: 600 }}>
              {lang === 'ZH' ? '从报价到竣工，一站式管理' : lang === 'BM' ? 'Dari Sebut Harga Hingga Serah Selesai' : 'From Quotation to Handover'}
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 48, alignItems: 'start' }}>
            {/* Tab list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {FEATURES.map((f, i) => (
                <button
                  key={f.num}
                  className="feat-tab"
                  onClick={() => setActiveFeature(i)}
                  style={{
                    textAlign: 'left', padding: '20px 24px', borderRadius: 12,
                    background: i === activeFeature ? 'rgba(240,185,11,.08)' : 'transparent',
                    border: `1px solid ${i === activeFeature ? 'rgba(240,185,11,.25)' : 'rgba(255,255,255,.05)'}`,
                    cursor: 'pointer', transition: 'all .25s',
                    display: 'flex', gap: 16, alignItems: 'flex-start',
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-dm-mono,monospace)', fontSize: 13, fontWeight: 700, color: i === activeFeature ? '#F0B90B' : 'rgba(255,255,255,.2)', minWidth: 24, paddingTop: 2 }}>{f.num}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: i === activeFeature ? '#FFF' : 'rgba(255,255,255,.5)', marginBottom: i === activeFeature ? 4 : 0 }}>
                      {f.label[lang as keyof typeof f.label] ?? f.label.EN}
                    </div>
                    {i === activeFeature && (
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', letterSpacing: 1 }}>
                        {f.tag[lang as keyof typeof f.tag] ?? f.tag.EN}
                      </div>
                    )}
                  </div>
                  {i === activeFeature && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#F0B90B', marginTop: 6, flexShrink: 0, animation: 'glowPulse 2s ease infinite' }} />}
                </button>
              ))}
            </div>

            {/* Feature detail */}
            <div style={{
              background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.07)',
              borderRadius: 20, padding: 36, position: 'sticky', top: 80,
            }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: `${feat.color}15`, border: `1px solid ${feat.color}30`,
                borderRadius: 6, padding: '4px 10px', marginBottom: 20,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: feat.color, animation: 'glowPulse 2s ease infinite' }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: feat.color, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'var(--font-dm-mono,monospace)' }}>
                  {feat.tag[lang as keyof typeof feat.tag] ?? feat.tag.EN}
                </span>
              </div>

              <h3 style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: 'clamp(24px,3vw,36px)', fontWeight: 700, lineHeight: 1.2, marginBottom: 16 }}>
                {feat.label[lang as keyof typeof feat.label] ?? feat.label.EN}
              </h3>

              <p style={{ fontSize: 14, color: 'rgba(255,255,255,.6)', lineHeight: 1.8, marginBottom: 32 }}>
                {feat.desc[lang as keyof typeof feat.desc] ?? feat.desc.EN}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 28 }}>
                {feat.stats.map(s => (
                  <div key={s.l} style={{ textAlign: 'center', padding: '14px 8px', background: `${feat.color}08`, borderRadius: 10, border: `1px solid ${feat.color}18` }}>
                    <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: 28, fontWeight: 700, color: feat.color, lineHeight: 1 }}>{s.v}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,.4)', marginTop: 4, letterSpacing: .5 }}>{s.l}</div>
                  </div>
                ))}
              </div>

              <Link href="/register" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', borderRadius: 9,
                background: `${feat.color}15`, border: `1px solid ${feat.color}35`,
                color: feat.color, fontSize: 13, fontWeight: 700, textDecoration: 'none', transition: 'all .2s',
              }}>
                {lang === 'ZH' ? '立即体验' : lang === 'BM' ? 'Cuba Sekarang' : 'Try it now'} →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────── */}
      <section style={{
        padding: '100px 24px', background: '#060C14', position: 'relative', overflow: 'hidden',
        backgroundImage: `linear-gradient(rgba(240,185,11,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(240,185,11,.025) 1px, transparent 1px)`,
        backgroundSize: '64px 64px',
      }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, color: '#F0B90B', marginBottom: 16, textTransform: 'uppercase', fontFamily: 'var(--font-dm-mono,monospace)' }}>
              — {lang === 'ZH' ? '工作流程' : lang === 'BM' ? 'CARA KERJA' : 'HOW IT WORKS'}
            </div>
            <h2 style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: 'clamp(32px,5vw,52px)', fontWeight: 700 }}>
              {lang === 'ZH' ? '三步即可开始' : lang === 'BM' ? 'Tiga Langkah Untuk Bermula' : 'Three Steps to Start'}
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 2, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 48, left: '16%', right: '16%', height: 1, background: 'linear-gradient(90deg,transparent,rgba(240,185,11,.3),rgba(240,185,11,.3),transparent)', pointerEvents: 'none' }} />
            {[
              { n:'01', icon:'📄', title: lang==='ZH'?'上传报价单':lang==='BM'?'Muat Naik Sebut Harga':'Upload Quotation', sub:'PDF · Excel · CSV · TXT' },
              { n:'02', icon:'🧠', title: lang==='ZH'?'AI 智能分析':lang==='BM'?'Analisis AI':'AI Analysis',                 sub: lang==='ZH'?'即时审核 · 评分 · 标记':'Instant audit · Scoring · Flagging' },
              { n:'03', icon:'📅', title: lang==='ZH'?'自动生成进度表':lang==='BM'?'Jana Jadual Automatik':'Auto-Generate Schedule', sub: lang==='ZH'?'Gantt · 任务分配 · 通知':'Gantt · Tasks · Notifications' },
            ].map(({n,icon,title,sub}) => (
              <div key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '0 24px' }}>
                <div style={{
                  width: 80, height: 80, borderRadius: '50%',
                  background: 'rgba(240,185,11,.08)', border: '1px solid rgba(240,185,11,.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, marginBottom: 24, position: 'relative', zIndex: 1,
                  boxShadow: '0 0 0 8px #060C14',
                }}>{icon}</div>
                <div style={{ fontFamily: 'var(--font-dm-mono,monospace)', fontSize: 11, color: '#F0B90B', letterSpacing: 1, marginBottom: 8 }}>{n}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#FFF', marginBottom: 8 }}>{title}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', lineHeight: 1.6 }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROLE PORTALS ──────────────────────────────────── */}
      <section style={{ padding: '100px 24px', background: '#08111C' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ marginBottom: 64 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, color: '#F0B90B', marginBottom: 16, textTransform: 'uppercase', fontFamily: 'var(--font-dm-mono,monospace)' }}>
              — {lang === 'ZH' ? '用户角色' : lang === 'BM' ? 'JENIS PENGGUNA' : 'USER PORTALS'}
            </div>
            <h2 style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: 'clamp(32px,5vw,56px)', fontWeight: 700, lineHeight: 1.1 }}>
              {lang === 'ZH' ? '为每个角色量身定制' : lang === 'BM' ? 'Dibina untuk Setiap Peranan' : 'Tailored for Every Role'}
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
            {[
              {
                icon: '🏗️',
                name: lang==='ZH'?'设计师 / 装修公司':lang==='BM'?'Pereka / Syarikat ID':'Designer / ID Firm',
                tag:  lang==='ZH'?'最受欢迎':lang==='BM'?'Paling Popular':'Most Popular',
                features: lang==='ZH'
                  ? ['AI 报价审核 + 评分','自动甘特排程','多项目看板','工人任务分配','价格智能数据库','成本 vs 收入分析']
                  : ['AI Quotation Audit + Score','Auto Gantt Scheduling','Multi-project Kanban','Worker Task Assignment','Price Intelligence DB','Cost vs Revenue Analytics'],
                href: '/register?role=designer', color: '#F0B90B',
              },
              {
                icon: '🏠',
                name: lang==='ZH'?'业主 / 房主':lang==='BM'?'Pemilik Rumah':'Owner / Homeowner',
                tag: '',
                features: lang==='ZH'
                  ? ['实时进度追踪','付款进度明细','施工照片审批','VO 变更单审批','里程碑时间线','文件下载']
                  : ['Real-time progress tracking','Payment schedule details','Site photo approval','VO variation approval','Milestone timeline','Document download'],
                href: '/register?role=owner', color: '#00C9A7',
              },
              {
                icon: '🔨',
                name: lang==='ZH'?'施工工人 / 承包商':lang==='BM'?'Pekerja / Kontraktor':'Worker / Contractor',
                tag: '',
                features: lang==='ZH'
                  ? ['每日任务安排','签到签退打卡','上传完工照片','上传材料单据','材料准备清单','工地信息查阅']
                  : ['Daily task assignments','Check-in / Check-out','Upload completion photos','Upload material receipts','Prep checklists','Site information'],
                href: '/register?role=worker', color: '#60A5FA',
              },
            ].map(({icon,name,tag,features,href,color}) => (
              <Link key={name} href={href} style={{ textDecoration: 'none' }}>
                <div
                  className="role-card"
                  style={{
                    background: '#0F1E2F', border: '1px solid rgba(255,255,255,.07)',
                    borderRadius: 20, padding: 28, height: '100%', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', gap: 16,
                    boxShadow: '0 4px 20px rgba(0,0,0,.2)',
                  }}
                  onMouseOver={e => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.borderColor = `${color}50`;
                    el.style.boxShadow = `0 12px 40px ${color}15, 0 4px 20px rgba(0,0,0,.2)`;
                  }}
                  onMouseOut={e => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.borderColor = 'rgba(255,255,255,.07)';
                    el.style.boxShadow = '0 4px 20px rgba(0,0,0,.2)';
                  }}
                >
                  <div>
                    <div style={{
                      width: 52, height: 52, borderRadius: 14,
                      background: `${color}15`, border: `1px solid ${color}25`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 24, marginBottom: 16,
                    }}>{icon}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 17, fontWeight: 700, color: '#FFF' }}>{name}</span>
                      {tag && <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: .8, textTransform: 'uppercase', background: `${color}15`, color, border: `1px solid ${color}30`, borderRadius: 4, padding: '2px 7px' }}>{tag}</span>}
                    </div>
                  </div>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                    {features.map(f => (
                      <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: 'rgba(255,255,255,.6)' }}>
                        <span style={{ color, marginTop: 1, flexShrink: 0, fontSize: 11, fontWeight: 700 }}>✓</span>{f}
                      </li>
                    ))}
                  </ul>
                  <div style={{ color, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {lang==='ZH'?'立即注册':lang==='BM'?'Daftar Sekarang':'Get started'} →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ───────────────────────────────────────── */}
      <section style={{
        padding: '100px 24px', background: '#060C14',
        backgroundImage: `linear-gradient(rgba(240,185,11,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(240,185,11,.025) 1px, transparent 1px)`,
        backgroundSize: '64px 64px',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, color: '#F0B90B', marginBottom: 16, textTransform: 'uppercase', fontFamily: 'var(--font-dm-mono,monospace)' }}>
              — {lang==='ZH'?'价格方案':lang==='BM'?'PELAN HARGA':'PRICING'}
            </div>
            <h2 style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: 'clamp(32px,5vw,52px)', fontWeight: 700, marginBottom: 28 }}>
              {lang==='ZH'?'简单透明的定价':lang==='BM'?'Harga yang Jelas & Telus':'Simple, Transparent Pricing'}
            </h2>

            {/* Period toggle */}
            <div style={{ display: 'inline-flex', gap: 4, background: 'rgba(255,255,255,.05)', borderRadius: 10, padding: 4 }}>
              {(['monthly','quarterly','yearly'] as const).map(p => (
                <button key={p} onClick={() => setPricingPeriod(p)} style={{
                  padding: '8px 18px', borderRadius: 7, fontSize: 12, fontWeight: 700,
                  background: pricingPeriod === p ? '#F0B90B' : 'transparent',
                  color: pricingPeriod === p ? '#060C14' : 'rgba(255,255,255,.5)',
                  border: 'none', cursor: 'pointer', transition: 'all .2s', position: 'relative',
                }}>
                  {p==='monthly'?(lang==='ZH'?'月付':'Monthly'):p==='quarterly'?(lang==='ZH'?'季付':'Quarterly'):(lang==='ZH'?'年付':'Yearly')}
                  {savePct[p] && pricingPeriod !== p && (
                    <span style={{ position: 'absolute', top: -10, right: -4, background: '#10B981', color: '#fff', fontSize: 8, fontWeight: 800, borderRadius: 4, padding: '1px 5px' }}>{savePct[p]}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
            {[
              {
                name: lang==='ZH'?'免费版':'Free',
                price: prices.free, period: '',
                desc: lang==='ZH'?'开始体验 AI 报价审核':'Get started with AI analysis',
                features: lang==='ZH'
                  ? ['3 次终身 AI 分析','1 个活跃项目','基础报价解析','甘特图预览','无到期日']
                  : ['3 lifetime AI analyses','1 active project','Basic quotation parsing','Gantt preview','No expiry'],
                cta: lang==='ZH'?'免费开始':'Start Free',
                href: '/register', highlight: false, color: 'rgba(255,255,255,.1)',
              },
              {
                name: 'Pro',
                price: getPro(), period: `${prices.currency}/${lang==='ZH'?'月':'mo'}`,
                desc: lang==='ZH'?'专业装修公司首选':'For professional renovation firms',
                features: lang==='ZH'
                  ? ['每月 50 次 AI 分析','无限项目','价格数据库访问','VO + 多版本报价','工人任务管理','WhatsApp 分享','优先客服']
                  : ['50 AI analyses/month','Unlimited projects','Price database access','VO + multi-version quotations','Worker task management','WhatsApp sharing','Priority support'],
                cta: lang==='ZH'?'开始使用 Pro':'Get Pro',
                href: '/pricing', highlight: true, color: '#F0B90B',
              },
              {
                name: 'Elite',
                price: getElite(), period: `${prices.currency}/${lang==='ZH'?'月':'mo'}`,
                desc: lang==='ZH'?'多团队 · 无限使用':'Multi-team · Unlimited everything',
                features: lang==='ZH'
                  ? ['无限 AI 分析','无限项目','成本数据库 + 利润分析','多团队成员','价格 API 访问','白标报告','SLA 保证服务']
                  : ['Unlimited AI analyses','Unlimited projects','Cost DB + profit analytics','Multiple team members','Price API access','White-label reports','SLA guaranteed support'],
                cta: lang==='ZH'?'联系我们':'Contact Sales',
                href: '/pricing', highlight: false, color: '#A78BFA',
              },
            ].map(({name,price,period,desc,features,cta,href,highlight,color}) => (
              <div key={name} className="price-card" style={{
                background: highlight ? 'rgba(240,185,11,.05)' : '#0F1E2F',
                border: `1.5px solid ${highlight ? 'rgba(240,185,11,.35)' : 'rgba(255,255,255,.07)'}`,
                borderRadius: 20, padding: '32px 28px', position: 'relative',
                transition: 'border-color .3s', display: 'flex', flexDirection: 'column',
              }}>
                {highlight && (
                  <div style={{
                    position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)',
                    background: '#F0B90B', color: '#060C14', fontSize: 10, fontWeight: 800,
                    padding: '4px 14px', borderRadius: 10, letterSpacing: 1, textTransform: 'uppercase', whiteSpace: 'nowrap',
                  }}>{lang==='ZH'?'最受欢迎':'Most Popular'}</div>
                )}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: color === '#F0B90B' ? '#F0B90B' : 'rgba(255,255,255,.6)', marginBottom: 4, letterSpacing: .5 }}>{name}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: 52, fontWeight: 700, color: '#FFF', lineHeight: 1 }}>{price}</span>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,.4)' }}>{period}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginTop: 8 }}>{desc}</div>
                </div>

                <div style={{ height: 1, background: 'rgba(255,255,255,.06)', marginBottom: 24 }} />

                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, flex: 1, marginBottom: 28 }}>
                  {features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: 'rgba(255,255,255,.65)' }}>
                      <span style={{ color: highlight ? '#F0B90B' : '#10B981', fontSize: 12, marginTop: 1, flexShrink: 0, fontWeight: 700 }}>✓</span>{f}
                    </li>
                  ))}
                </ul>

                <Link href={href} style={{
                  display: 'block', textAlign: 'center', padding: '12px 0', borderRadius: 10,
                  background: highlight ? '#F0B90B' : 'rgba(255,255,255,.06)',
                  color: highlight ? '#060C14' : 'rgba(255,255,255,.8)',
                  fontSize: 14, fontWeight: 700, textDecoration: 'none',
                  border: `1px solid ${highlight ? 'transparent' : 'rgba(255,255,255,.1)'}`,
                  transition: 'all .2s',
                }}>{cta}</Link>
              </div>
            ))}
          </div>

          <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,.3)', marginTop: 24 }}>
            {lang==='ZH'?'所有方案均支持 FPX / 信用卡 / TNG 支付':'All plans support FPX / Credit Card / TNG payment via Billplz'}
          </p>
        </div>
      </section>

      {/* ── FOOTER CTA ────────────────────────────────────── */}
      <section style={{
        padding: '100px 24px', textAlign: 'center',
        background: 'linear-gradient(135deg,#060C14 0%,#0A1628 100%)',
        borderTop: '1px solid rgba(240,185,11,.1)', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          width: 700, height: 400, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(240,185,11,.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{ maxWidth: 640, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ fontFamily: 'var(--font-dm-mono,monospace)', fontSize: 11, fontWeight: 700, letterSpacing: 3, color: '#F0B90B', marginBottom: 20, textTransform: 'uppercase' }}>
            — {lang==='ZH'?'立即开始':lang==='BM'?'MULAKAN HARI INI':'GET STARTED TODAY'}
          </div>
          <h2 style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: 'clamp(36px,6vw,68px)', fontWeight: 700, lineHeight: 1.1, marginBottom: 24 }}>
            {lang==='ZH'?'让 AI 改变您的装修业务':lang==='BM'?'Biar AI Ubah Perniagaan Anda':'Let AI Transform Your Renovation Business'}
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,.5)', marginBottom: 40, lineHeight: 1.6 }}>
            {lang==='ZH'?'加入 500+ 马来西亚与新加坡装修设计师。免费开始，随时升级。':'Join 500+ renovation professionals in Malaysia & Singapore. Free to start, upgrade anytime.'}
          </p>
          <Link href="/register" className="btn-gold" style={{
            padding: '14px 36px', borderRadius: 10, fontSize: 15, fontWeight: 700,
            background: '#F0B90B', color: '#060C14', textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center', gap: 8,
            boxShadow: '0 8px 30px rgba(240,185,11,.3)', transition: 'all .2s',
          }}>
            {lang==='ZH'?'免费开始 — 无需信用卡':lang==='BM'?'Mulakan Percuma':'Start Free — No Credit Card'}
          </Link>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer style={{ padding: '56px 24px 32px', background: '#040810', borderTop: '1px solid rgba(255,255,255,.05)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr repeat(3,1fr)', gap: 40, marginBottom: 48 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#F0B90B,#F8D33A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 11, color: '#040810' }}>RS</div>
                <span style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: 20, fontWeight: 700, color: '#F0B90B' }}>RenoSmart</span>
              </div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,.3)', lineHeight: 1.7, maxWidth: 220 }}>
                {lang==='ZH'?'AI 驱动的装修管理平台，专为马来西亚与新加坡打造。':'AI-powered renovation management for Malaysia & Singapore professionals.'}
              </p>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                {['🇲🇾 Malaysia','🇸🇬 Singapore'].map(c => (
                  <span key={c} style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', background: 'rgba(255,255,255,.05)', borderRadius: 4, padding: '3px 8px' }}>{c}</span>
                ))}
              </div>
            </div>

            {[
              {
                title: lang==='ZH'?'产品':'Product',
                links: [
                  { label: lang==='ZH'?'AI 报价审核':'AI Quotation Audit', href: '/register' },
                  { label: lang==='ZH'?'甘特排程':'Gantt Scheduler', href: '/register' },
                  { label: lang==='ZH'?'价格数据库':'Price Database', href: '/register' },
                  { label: lang==='ZH'?'价格方案':'Pricing', href: '/pricing' },
                ],
              },
              {
                title: lang==='ZH'?'用户':'Users',
                links: [
                  { label: lang==='ZH'?'设计师入口':'Designer Portal', href: '/register?role=designer' },
                  { label: lang==='ZH'?'业主入口':'Owner Portal', href: '/register?role=owner' },
                  { label: lang==='ZH'?'工人入口':'Worker Portal', href: '/register?role=worker' },
                ],
              },
              {
                title: lang==='ZH'?'账号':'Account',
                links: [
                  { label: lang==='ZH'?'登入':'Login', href: '/login' },
                  { label: lang==='ZH'?'注册':'Register', href: '/register' },
                  { label: lang==='ZH'?'设置':'Settings', href: '/designer/settings' },
                ],
              },
            ].map(({title,links}) => (
              <div key={title}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: 'rgba(255,255,255,.4)', marginBottom: 16, textTransform: 'uppercase' }}>{title}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {links.map(({label,href}) => (
                    <Link key={label} href={href} style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', textDecoration: 'none', transition: 'color .2s' }}
                      onMouseOver={e => (e.currentTarget.style.color = '#F0B90B')}
                      onMouseOut={e  => (e.currentTarget.style.color = 'rgba(255,255,255,.4)')}>
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,.05)', marginBottom: 24 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.25)', fontFamily: 'var(--font-dm-mono,monospace)' }}>
              © 2025 RenoSmart. {lang==='ZH'?'保留所有权利':'All rights reserved.'}
            </div>
            <div style={{ display: 'flex', gap: 20 }}>
              {[lang==='ZH'?'隐私政策':'Privacy Policy', lang==='ZH'?'使用条款':'Terms of Service'].map(label => (
                <a key={label} href="#" style={{ fontSize: 12, color: 'rgba(255,255,255,.25)', textDecoration: 'none' }}>{label}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
