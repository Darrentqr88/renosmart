'use client';

import Link from 'next/link';
import { useI18n } from '@/lib/i18n/context';
import { Language, Region } from '@/types';
import { useState, useEffect, useRef } from 'react';

/* ── pricing data ──────────────────────────────────────────── */
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

/* ── multilingual text ─────────────────────────────────────── */
const T = {
  hero: {
    EN: 'Renovations Run Smarter\nWhen AI Has Your Back',
    BM: 'Pengubahsuaian Lebih Pintar\nDengan Sokongan AI',
    ZH: '有 AI 把关的装修\n每一步都更聪明',
  },
  heroSub: {
    EN: 'From quotation audit to progress tracking — RenoSmart gives designers, owners, and contractors the tools to deliver projects on time, on budget.',
    BM: 'Dari audit sebut harga hingga penjejakan kemajuan — RenoSmart memberi pereka, pemilik, dan kontraktor alat untuk menyiapkan projek tepat masa dan bajet.',
    ZH: '从报价审核到进度追踪 — RenoSmart 让设计师、业主和施工方按时按预算交付每一个项目。',
  },
  startFree: { EN: 'Start Free', BM: 'Mula Percuma', ZH: '免费开始' },
  watchDemo: { EN: 'Watch Demo', BM: 'Tonton Demo', ZH: '观看演示' },
  login: { EN: 'Login', BM: 'Log Masuk', ZH: '登录' },
  trustBadge: {
    EN: 'Trusted by 500+ renovation firms across Malaysia & Singapore',
    BM: 'Dipercayai 500+ firma pengubahsuaian di Malaysia & Singapura',
    ZH: '深受马来西亚和新加坡 500+ 装修公司信赖',
  },
  painTitle: {
    EN: 'The Problems We Solve',
    BM: 'Masalah Yang Kami Selesaikan',
    ZH: '我们解决的行业痛点',
  },
  painSubtitle: {
    EN: 'Every renovation project faces the same costly mistakes. RenoSmart eliminates them.',
    BM: 'Setiap projek pengubahsuaian menghadapi kesilapan yang sama. RenoSmart menghapuskannya.',
    ZH: '每个装修项目都在重复同样的代价高昂的错误。RenoSmart 一一消除。',
  },
  videoTitle: {
    EN: 'See RenoSmart in Action',
    BM: 'Lihat RenoSmart Beraksi',
    ZH: '观看 RenoSmart 实际操作',
  },
  videoSub: {
    EN: 'Watch how designers use AI to audit quotations and manage projects in minutes, not hours.',
    BM: 'Lihat bagaimana pereka menggunakan AI untuk mengaudit sebut harga dalam beberapa minit.',
    ZH: '看设计师如何用 AI 在几分钟内完成报价审核和项目管理。',
  },
  roleTitle: {
    EN: 'Choose Your Portal',
    BM: 'Pilih Portal Anda',
    ZH: '选择您的入口',
  },
  roleSub: {
    EN: 'RenoSmart serves every stakeholder in the renovation process.',
    BM: 'RenoSmart melayani setiap pihak dalam proses pengubahsuaian.',
    ZH: 'RenoSmart 服务装修流程中的每一个角色。',
  },
  howTitle: {
    EN: 'How It Works',
    BM: 'Cara Ia Berfungsi',
    ZH: '如何运作',
  },
  pricingTitle: {
    EN: 'Simple, Transparent Pricing',
    BM: 'Harga Mudah & Telus',
    ZH: '简单透明的定价',
  },
  pricingSub: {
    EN: 'Start free. Upgrade when you need more power.',
    BM: 'Mula percuma. Naik taraf apabila anda perlukan lebih.',
    ZH: '免费开始，按需升级。',
  },
  ctaTitle: {
    EN: 'Your next renovation project\ndeserves better tools.',
    BM: 'Projek pengubahsuaian seterusnya\nlayak alat yang lebih baik.',
    ZH: '你的下一个装修项目\n值得更好的工具。',
  },
  free: { EN: 'Free', BM: 'Percuma', ZH: '免费' },
  pro: { EN: 'Pro', BM: 'Pro', ZH: '专业版' },
  elite: { EN: 'Elite', BM: 'Elite', ZH: '旗舰版' },
  month: { EN: '/month', BM: '/bulan', ZH: '/月' },
  getStarted: { EN: 'Get Started', BM: 'Mula Sekarang', ZH: '立即开始' },
  currentPlan: { EN: 'Current Plan', BM: 'Pelan Semasa', ZH: '当前方案' },
};

/* ── pain points data (with photos) ────────────────────────── */
const PAIN_POINTS = [
  {
    id: 'quotation',
    photo: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80',
    pain: {
      EN: 'Quotation errors eat your profit',
      BM: 'Kesilapan sebut harga makan keuntungan',
      ZH: '报价出错，利润蒸发',
    },
    painDetail: {
      EN: 'A missed waterproofing scope. A wrong tile calculation. One overlooked item can cost RM 8,000+ per project — and most designers don\'t catch it until it\'s too late.',
      BM: 'Skop kalis air tertinggal. Kiraan jubin salah. Satu item terlepas pandang boleh menelan kos RM 8,000+ setiap projek.',
      ZH: '防水范围遗漏、瓷砖算错、一个漏项就损失 RM 8,000+ — 大多数设计师直到亏了才发现。',
    },
    stat: 'RM 8,000+',
    statLabel: { EN: 'lost per project on average', BM: 'kerugian purata setiap projek', ZH: '每项目平均损失' },
    solution: {
      EN: 'AI audits every line in 30 seconds',
      BM: 'AI mengaudit setiap baris dalam 30 saat',
      ZH: 'AI 30 秒逐行审核',
    },
    solutionDetail: {
      EN: 'Upload your PDF or Excel quotation. AI scores completeness, flags missing scopes, detects pricing anomalies, and highlights items that don\'t add up.',
      BM: 'Muat naik PDF atau Excel. AI menilai kelengkapan, menanda skop yang hilang, dan mengesan anomali harga.',
      ZH: '上传 PDF 或 Excel 报价单，AI 评分完整度、标记遗漏范围、检测价格异常、高亮不合理项目。',
    },
    color: '#4F8EF7',
  },
  {
    id: 'schedule',
    photo: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80',
    pain: {
      EN: 'Schedules break, owners panic',
      BM: 'Jadual rosak, pemilik panik',
      ZH: '进度一改全崩，业主焦虑',
    },
    painDetail: {
      EN: 'You spend 3 hours making a Gantt chart in Excel. One subcontractor delays, and the whole timeline collapses. Meanwhile, owners keep calling: "When will my house be done?"',
      BM: 'Anda habiskan 3 jam buat carta Gantt di Excel. Seorang subkontraktor lewat, seluruh jadual runtuh. Pemilik terus bertanya: "Bila siap?"',
      ZH: '花 3 小时在 Excel 排甘特图，一个工种延误，整条时间线全崩。业主不停问："我的房子什么时候好？"',
    },
    stat: '3+ hrs',
    statLabel: { EN: 'wasted every time you reschedule', BM: 'terbuang setiap kali jadual semula', ZH: '每次重排都浪费' },
    solution: {
      EN: 'AI builds your Gantt from the quotation',
      BM: 'AI bina Gantt dari sebut harga anda',
      ZH: 'AI 从报价单自动生成排程',
    },
    solutionDetail: {
      EN: 'Dependency-driven schedules auto-generate from your quotation items. Drag to adjust. Holidays skipped. Owners track progress like tracking a delivery parcel.',
      BM: 'Jadual berasaskan kebergantungan dijana automatik. Seret untuk laras. Cuti dilangkau. Pemilik jejak kemajuan seperti jejak bungkusan.',
      ZH: '依赖驱动排程从报价项自动生成，拖拽调整，跳过假日。业主像追快递一样追踪装修进度。',
    },
    color: '#3B82F6',
  },
  {
    id: 'prep',
    photo: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80',
    pain: {
      EN: 'Workers show up, materials don\'t',
      BM: 'Pekerja tiba, bahan tak sampai',
      ZH: '工人到了，材料没到',
    },
    painDetail: {
      EN: 'The tiler arrives on Monday. But tiles weren\'t ordered. Measurements weren\'t confirmed. Now 4 workers wait idle while you scramble — that\'s RM 1,200/day burned.',
      BM: 'Tukang jubin tiba Isnin. Tetapi jubin belum dipesan. Ukuran belum disahkan. Kini 4 pekerja menunggu — RM 1,200/hari terbuang.',
      ZH: '贴砖师傅周一到场，但瓷砖没订、尺寸没确认。4 个工人干等着 — 每天白烧 RM 1,200。',
    },
    stat: '60%',
    statLabel: { EN: 'of delays caused by prep failures', BM: 'kelewatan disebabkan kegagalan persediaan', ZH: '的延期源于准备不足' },
    solution: {
      EN: 'Step-by-step prep reminders before each task',
      BM: 'Peringatan persediaan langkah demi langkah',
      ZH: '每项施工前逐步提醒确认',
    },
    solutionDetail: {
      EN: 'Every construction task has a prep checklist. Tile selected? Ordered? Delivered? Just confirm each step — no more surprises on site.',
      BM: 'Setiap tugas pembinaan ada senarai semak. Jubin dipilih? Dipesan? Dihantar? Sahkan setiap langkah.',
      ZH: '每个施工任务都有准备清单。瓷砖选了？订了？到了？逐步确认，工地再无意外。',
    },
    color: '#10B981',
  },
  {
    id: 'cost',
    photo: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&q=80',
    pain: {
      EN: 'Receipts vanish, profit is a guess',
      BM: 'Resit hilang, keuntungan hanya tekaan',
      ZH: '收据丢了，利润靠猜',
    },
    painDetail: {
      EN: 'Workers buy materials, lose receipts, forget to report costs. By project end, you discover the "profitable" job actually lost money. Sound familiar?',
      BM: 'Pekerja beli bahan, hilang resit, lupa lapor kos. Akhir projek, anda dapati projek "menguntungkan" sebenarnya rugi.',
      ZH: '工人买材料、丢收据、忘记报账。项目结束才发现，"赚钱的"项目其实亏了。听着耳熟？',
    },
    stat: '???',
    statLabel: { EN: 'is what most designers know about their real profit', BM: 'apa yang pereka tahu tentang untung sebenar', ZH: '大多数设计师对真实利润一无所知' },
    solution: {
      EN: 'Workers snap receipts, AI tracks every cost',
      BM: 'Pekerja tangkap resit, AI jejak setiap kos',
      ZH: '工人拍单据，AI 追踪每一笔开支',
    },
    solutionDetail: {
      EN: 'Workers photograph receipts on their phone. AI reads them instantly. Costs auto-categorize by trade. You see real-time profit margins — no more guessing.',
      BM: 'Pekerja ambil gambar resit di telefon. AI membaca serta-merta. Kos dikategorikan mengikut perdagangan. Anda lihat margin keuntungan masa nyata.',
      ZH: '工人用手机拍单据，AI 即时识别归类。每个工种实时利润率一目了然 — 再也不用猜。',
    },
    color: '#A855F7',
  },
];

/* ── role portals ──────────────────────────────────────────── */
const ROLES = [
  {
    id: 'designer',
    title: { EN: 'Designer', BM: 'Pereka', ZH: '设计师' },
    subtitle: { EN: 'Interior Design Firms', BM: 'Firma Rekabentuk Dalaman', ZH: '室内设计公司' },
    color: '#4F8EF7',
    photo: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80',
    features: {
      EN: ['AI Quotation Audit & Scoring', 'Auto Gantt Scheduling', 'Price Intelligence Database', 'Real-time Profit Tracking', 'Multi-project Management'],
      BM: ['Audit Sebut Harga AI', 'Penjadualan Gantt Auto', 'Pangkalan Data Harga', 'Jejak Keuntungan Masa Nyata', 'Pengurusan Pelbagai Projek'],
      ZH: ['AI 报价审核与评分', '自动甘特排程', '价格智能数据库', '实时利润追踪', '多项目管理'],
    },
    popular: true,
  },
  {
    id: 'owner',
    title: { EN: 'Homeowner', BM: 'Pemilik Rumah', ZH: '业主' },
    subtitle: { EN: 'Property Owners', BM: 'Pemilik Hartanah', ZH: '房产业主' },
    color: '#14B8A6',
    photo: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80',
    features: {
      EN: ['Track progress like a parcel', 'View shared documents', 'Payment schedule overview', 'Approve variation orders', 'Site photo gallery'],
      BM: ['Jejak kemajuan seperti bungkusan', 'Lihat dokumen dikongsi', 'Gambaran jadual bayaran', 'Luluskan perintah variasi', 'Galeri foto tapak'],
      ZH: ['像追踪包裹一样追踪进度', '查看共享文件', '付款计划概览', '审批变更单', '工地照片库'],
    },
    popular: false,
  },
  {
    id: 'contractor',
    title: { EN: 'Contractor', BM: 'Kontraktor', ZH: '施工工人' },
    subtitle: { EN: 'Workers & Subcontractors', BM: 'Pekerja & Subkontraktor', ZH: '工人和分包商' },
    color: '#6366F1',
    photo: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80',
    features: {
      EN: ['Daily task assignments', 'Check-in / Check-out', 'Receipt photo upload + OCR', 'Site photo submissions', 'Prep checklist confirmations'],
      BM: ['Tugasan harian', 'Daftar Masuk / Keluar', 'Muat naik resit + OCR', 'Hantar foto tapak', 'Senarai semak persediaan'],
      ZH: ['每日任务分配', '签到 / 签退', '单据拍照上传 + OCR', '工地照片提交', '事前准备逐步确认'],
    },
    popular: false,
  },
];

/* ── How it works steps ────────────────────────────────────── */
const STEPS = [
  {
    num: '01',
    title: { EN: 'Upload Quotation', BM: 'Muat Naik Sebut Harga', ZH: '上传报价单' },
    desc: { EN: 'Drop your PDF or Excel file. We handle any format.', BM: 'Lepaskan fail PDF atau Excel anda.', ZH: '拖放 PDF 或 Excel 文件，兼容任何格式。' },
  },
  {
    num: '02',
    title: { EN: 'AI Analyzes', BM: 'AI Menganalisis', ZH: 'AI 分析审核' },
    desc: { EN: 'Score, flag, price-check — all in 30 seconds.', BM: 'Skor, tandakan, semak harga — 30 saat.', ZH: '评分、标记、价格核查 — 30 秒搞定。' },
  },
  {
    num: '03',
    title: { EN: 'Manage & Profit', BM: 'Urus & Untung', ZH: '管理并获利' },
    desc: { EN: 'Gantt auto-generates. Workers report. You track profit.', BM: 'Gantt dijana automatik. Pekerja melapor. Anda jejak keuntungan.', ZH: '甘特图自动生成，工人汇报，实时追踪利润。' },
  },
];

/* ── pricing features ──────────────────────────────────────── */
const PLAN_FEATURES = {
  free: {
    EN: ['3 lifetime AI audits', 'Basic Gantt chart', '1 project', 'Email support'],
    BM: ['3 audit AI seumur hidup', 'Carta Gantt asas', '1 projek', 'Sokongan e-mel'],
    ZH: ['3 次终身 AI 审核', '基础甘特图', '1 个项目', '邮件支持'],
  },
  pro: {
    EN: ['50 AI audits / month', 'Full Gantt + dependencies', 'Price Intelligence DB', '10 projects', 'Priority support'],
    BM: ['50 audit AI / bulan', 'Gantt penuh + kebergantungan', 'Pangkalan Data Harga', '10 projek', 'Sokongan keutamaan'],
    ZH: ['每月 50 次 AI 审核', '完整甘特图 + 依赖', '价格智能数据库', '10 个项目', '优先支持'],
  },
  elite: {
    EN: ['250 AI audits / month (shared)', 'Everything in Pro', 'Cost Database + Profit', 'Unlimited projects', 'Team members (5 accounts)', 'Receipt OCR'],
    BM: ['250 audit AI / bulan (dikongsi)', 'Semua dalam Pro', 'Pangkalan Kos + Untung', 'Projek tanpa had', 'Ahli pasukan (5 akaun)', 'OCR Resit'],
    ZH: ['每月 250 次 AI 审核（共享）', 'Pro 全部功能', '成本数据库 + 利润', '无限项目', '团队成员（5 账号）', '单据 OCR'],
  },
};

/* ═══════════════════════════════════════════════════════════ */
/*  COMPONENT                                                 */
/* ═══════════════════════════════════════════════════════════ */

export default function LandingPage() {
  const { lang, setLang, region, setRegion } = useI18n();
  const [navScrolled, setNavScrolled] = useState(false);
  const [pricingPeriod, setPricingPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // scroll handler for navbar
  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // intersection observer for scroll reveal
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisibleSections((prev) => new Set([...prev, e.target.id]));
          }
        });
      },
      { threshold: 0.15 }
    );
    Object.values(sectionRefs.current).forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // close login dropdown on outside click

  const prices = PRICING[region as keyof typeof PRICING] ?? PRICING.MY;
  const getPro = () => prices.pro[pricingPeriod];
  const getElite = () => prices.elite[pricingPeriod];
  const isVisible = (id: string) => visibleSections.has(id);

  const savePct: Record<string, string> = { monthly: '', quarterly: 'Save 10%', yearly: 'Save 24%' };

  return (
    <div style={{ background: '#0B0F1A', color: '#F1F5F9', minHeight: '100vh', fontFamily: 'var(--font-dm-sans), system-ui, sans-serif' }}>

      {/* ── KEYFRAMES ──────────────────────────────────────── */}
      <style>{`
        @keyframes ldFadeUp {
          from { opacity: 0; transform: translateY(40px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ldFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes ldFloat {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-12px); }
        }
        @keyframes ldPulseGlow {
          0%, 100% { opacity: 0.4; }
          50%      { opacity: 0.8; }
        }
        @keyframes ldSlideRight {
          from { transform: translateX(-30px); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
        @keyframes ldGridPulse {
          0%, 100% { opacity: 0.03; }
          50%      { opacity: 0.08; }
        }
        @keyframes ldShimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes ldScaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes ldPlayPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); box-shadow: 0 0 0 0 rgba(79,142,247,0.4); }
          50%      { transform: translate(-50%, -50%) scale(1.08); box-shadow: 0 0 0 20px rgba(79,142,247,0); }
        }

        .ld-reveal { opacity: 0; transform: translateY(40px); transition: opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1); }
        .ld-reveal.visible { opacity: 1; transform: translateY(0); }
        .ld-reveal-d1 { transition-delay: 0.1s; }
        .ld-reveal-d2 { transition-delay: 0.2s; }
        .ld-reveal-d3 { transition-delay: 0.3s; }
        .ld-reveal-d4 { transition-delay: 0.4s; }

        .ld-pain-card { position: relative; overflow: hidden; border-radius: 16px; background: #111827; border: 1px solid rgba(255,255,255,0.06); transition: transform 0.3s, border-color 0.3s, box-shadow 0.3s; }
        .ld-pain-card:hover { transform: translateY(-4px); border-color: rgba(255,255,255,0.12); box-shadow: 0 20px 60px rgba(0,0,0,0.4); }

        .ld-role-card { position: relative; overflow: hidden; border-radius: 20px; background: #111827; border: 1px solid rgba(255,255,255,0.06); transition: all 0.4s cubic-bezier(0.16,1,0.3,1); cursor: pointer; }
        .ld-role-card:hover { transform: translateY(-8px); }

        .ld-pricing-card { border-radius: 16px; background: #111827; border: 1px solid rgba(255,255,255,0.06); padding: 32px; transition: transform 0.3s, border-color 0.3s; }
        .ld-pricing-card:hover { transform: translateY(-4px); }
        .ld-pricing-card.featured { border-color: #4F8EF7; background: linear-gradient(145deg, #111827 0%, #0f1628 100%); }

        .ld-btn-primary { display: inline-flex; align-items: center; gap: 8px; padding: 14px 32px; background: linear-gradient(135deg, #4F8EF7, #8B5CF6, #EC4899); color: #fff; font-weight: 600; font-size: 15px; border-radius: 12px; border: none; cursor: pointer; transition: all 0.2s; text-decoration: none; }
        .ld-btn-primary:hover { background: linear-gradient(135deg, #3B7BE8, #7C4FE0, #DB2777); transform: translateY(-1px); box-shadow: 0 8px 24px rgba(79,142,247,0.3); }

        .ld-btn-secondary { display: inline-flex; align-items: center; gap: 8px; padding: 14px 32px; background: transparent; color: #F1F5F9; font-weight: 500; font-size: 15px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.15); cursor: pointer; transition: all 0.2s; text-decoration: none; }
        .ld-btn-secondary:hover { border-color: rgba(255,255,255,0.3); background: rgba(255,255,255,0.04); }

        /* Mobile navbar */
        @media (max-width: 640px) {
          .ld-nav-hide-mobile { display: none !important; }
          .ld-nav-login { padding: 6px 12px !important; font-size: 13px !important; }
        }
      `}</style>

      {/* ── NAVBAR ──────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 clamp(16px, 4vw, 48px)',
        height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: navScrolled ? 'rgba(11,15,26,0.92)' : 'transparent',
        backdropFilter: navScrolled ? 'blur(16px) saturate(180%)' : 'none',
        borderBottom: navScrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
        transition: 'all 0.3s',
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#F1F5F9' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #4F8EF7, #8B5CF6, #EC4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: '#fff', fontFamily: 'var(--font-dm-mono)' }}>RS</div>
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #4F8EF7, #8B5CF6, #EC4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>RenoSmart</span>
        </Link>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Language toggle */}
          <div className="ld-nav-hide-mobile" style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
            {(['EN', 'BM', 'ZH'] as Language[]).map((l) => (
              <button key={l} onClick={() => setLang(l)} style={{
                padding: '6px 10px', fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer',
                background: lang === l ? 'rgba(79,142,247,0.15)' : 'transparent',
                color: lang === l ? '#4F8EF7' : '#94A3B8',
                transition: 'all 0.2s',
              }}>
                {l === 'ZH' ? '中文' : l}
              </button>
            ))}
          </div>

          {/* Region toggle */}
          <div className="ld-nav-hide-mobile" style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
            {(['MY', 'SG'] as Region[]).map((r) => (
              <button key={r} onClick={() => setRegion(r)} style={{
                padding: '6px 10px', fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer',
                background: region === r ? 'rgba(79,142,247,0.15)' : 'transparent',
                color: region === r ? '#4F8EF7' : '#94A3B8',
                transition: 'all 0.2s',
              }}>
                {r === 'MY' ? '🇲🇾 MY' : '🇸🇬 SG'}
              </button>
            ))}
          </div>

          {/* Login button */}
          <Link href="/login" className="ld-nav-login" style={{
            padding: '8px 20px', fontSize: 14, fontWeight: 500, border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 10, background: 'transparent', color: '#F1F5F9', cursor: 'pointer', transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none',
          }}>
            {T.login[lang]}
          </Link>

          {/* CTA */}
          <Link href="/register" className="ld-btn-primary ld-nav-hide-mobile" style={{ padding: '8px 20px', fontSize: 14 }}>
            {T.startFree[lang]}
          </Link>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────── */}
      <section style={{
        position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', overflow: 'hidden', padding: '120px clamp(16px, 4vw, 48px) 80px',
      }}>
        {/* Background image placeholder + overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url("https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1920&q=80")',
          backgroundSize: 'cover', backgroundPosition: 'center',
          filter: 'brightness(0.3) saturate(0.6)',
        }} />
        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(11,15,26,0.6) 0%, rgba(11,15,26,0.85) 50%, #0B0F1A 100%)',
        }} />
        {/* Blueprint grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            linear-gradient(rgba(59,130,246,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59,130,246,0.06) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
          animation: 'ldGridPulse 6s ease-in-out infinite',
        }} />
        {/* Glow orb */}
        <div style={{
          position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 600,
          background: 'radial-gradient(circle, rgba(79,142,247,0.08) 0%, transparent 70%)',
          animation: 'ldPulseGlow 4s ease-in-out infinite',
          pointerEvents: 'none',
        }} />

        {/* Content */}
        <div style={{ position: 'relative', textAlign: 'center', maxWidth: 840, zIndex: 1 }}>
          <div style={{
            display: 'inline-block', padding: '6px 16px', borderRadius: 100, fontSize: 12, fontWeight: 600,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            background: 'rgba(79,142,247,0.1)', color: '#4F8EF7', border: '1px solid rgba(79,142,247,0.2)',
            marginBottom: 32,
            animation: 'ldFadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both',
          }}>
            {lang === 'EN' ? 'AI-Powered Renovation Management' : lang === 'BM' ? 'Pengurusan Pengubahsuaian AI' : 'AI 驱动装修管理'}
          </div>

          <h1 style={{
            fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 800, lineHeight: 1.08,
            fontFamily: 'var(--font-playfair), serif',
            letterSpacing: '-0.03em',
            whiteSpace: 'pre-line',
            animation: 'ldFadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.1s both',
          }}>
            {T.hero[lang]}
          </h1>

          <p style={{
            marginTop: 24, fontSize: 'clamp(16px, 2vw, 20px)', lineHeight: 1.6,
            color: '#94A3B8', maxWidth: 640, marginLeft: 'auto', marginRight: 'auto',
            animation: 'ldFadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.2s both',
          }}>
            {T.heroSub[lang]}
          </p>

          {/* CTAs */}
          <div style={{
            marginTop: 40, display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap',
            animation: 'ldFadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.3s both',
          }}>
            <Link href="/register" className="ld-btn-primary" style={{ fontSize: 16, padding: '16px 36px' }}>
              {T.startFree[lang]}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10m-4-4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
            <a href="#video" className="ld-btn-secondary" style={{ fontSize: 16, padding: '16px 36px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              {T.watchDemo[lang]}
            </a>
          </div>

          {/* Trust badge */}
          <p style={{
            marginTop: 48, fontSize: 13, color: '#64748B',
            animation: 'ldFadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.4s both',
          }}>
            {T.trustBadge[lang]}
          </p>
        </div>

        {/* Scroll hint */}
        <div style={{
          position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          animation: 'ldFloat 3s ease-in-out infinite',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </div>
      </section>

      {/* ── PAIN POINTS (photo-based) ──────────────────────── */}
      <section
        id="pain-section"
        ref={(el) => { sectionRefs.current['pain-section'] = el; }}
        style={{ padding: 'clamp(60px, 10vw, 120px) 0', maxWidth: 1400, margin: '0 auto' }}
      >
        <div className={`ld-reveal ${isVisible('pain-section') ? 'visible' : ''}`} style={{ textAlign: 'center', marginBottom: 64, padding: '0 clamp(16px, 4vw, 48px)' }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, fontFamily: 'var(--font-playfair), serif', letterSpacing: '-0.02em' }}>
            {T.painTitle[lang]}
          </h2>
          <p style={{ marginTop: 16, fontSize: 17, color: '#94A3B8', maxWidth: 600, margin: '16px auto 0' }}>
            {T.painSubtitle[lang]}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {PAIN_POINTS.map((pp, i) => {
            const isEven = i % 2 === 0;
            return (
              <div
                key={pp.id}
                className={`ld-reveal ${isVisible('pain-section') ? 'visible' : ''}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))',
                  minHeight: 420,
                  transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${i * 0.1}s, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${i * 0.1}s`,
                }}
              >
                {/* Photo side */}
                <div style={{
                  position: 'relative', overflow: 'hidden',
                  order: isEven ? 0 : 1,
                  minHeight: 300,
                }}>
                  <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: `url("${pp.photo}")`,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    filter: 'brightness(0.5) saturate(0.7)',
                    transition: 'transform 0.6s ease',
                  }} />
                  <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(${isEven ? '90deg' : '270deg'}, transparent 0%, rgba(11,15,26,0.7) 100%)` }} />
                  {/* Stat overlay */}
                  <div style={{
                    position: 'absolute', bottom: 32, left: 32, right: 32,
                  }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 14, padding: '14px 24px',
                      borderRadius: 14, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}>
                      <span style={{ fontSize: 36, fontWeight: 800, fontFamily: 'var(--font-dm-mono)', color: '#EF4444' }}>{pp.stat}</span>
                      <span style={{ fontSize: 13, color: '#CBD5E1', maxWidth: 180, lineHeight: 1.3 }}>{pp.statLabel[lang]}</span>
                    </div>
                  </div>
                </div>

                {/* Content side */}
                <div style={{
                  padding: 'clamp(32px, 5vw, 56px)',
                  display: 'flex', flexDirection: 'column', justifyContent: 'center',
                  order: isEven ? 1 : 0,
                  background: i % 2 === 0 ? '#0D1117' : '#0F151F',
                }}>
                  {/* Pain */}
                  <div style={{ marginBottom: 28 }}>
                    <div style={{
                      display: 'inline-block', padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                      letterSpacing: '0.06em', textTransform: 'uppercase',
                      background: 'rgba(239,68,68,0.12)', color: '#EF4444', marginBottom: 12,
                    }}>
                      {lang === 'EN' ? 'THE PROBLEM' : lang === 'BM' ? 'MASALAH' : '痛点'}
                    </div>
                    <h3 style={{ fontSize: 'clamp(22px, 3vw, 28px)', fontWeight: 700, lineHeight: 1.2, marginBottom: 12 }}>
                      {pp.pain[lang]}
                    </h3>
                    <p style={{ fontSize: 15, lineHeight: 1.7, color: '#94A3B8' }}>{pp.painDetail[lang]}</p>
                  </div>

                  {/* Divider */}
                  <div style={{ height: 1, background: `linear-gradient(90deg, ${pp.color}40, transparent)`, marginBottom: 28 }} />

                  {/* Solution */}
                  <div>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 6,
                      fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                      background: `${pp.color}15`, color: pp.color, marginBottom: 12,
                    }}>
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      {lang === 'EN' ? 'RENOSMART SOLUTION' : lang === 'BM' ? 'PENYELESAIAN' : '解决方案'}
                    </div>
                    <h4 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: pp.color }}>{pp.solution[lang]}</h4>
                    <p style={{ fontSize: 14, lineHeight: 1.7, color: '#94A3B8' }}>{pp.solutionDetail[lang]}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── VIDEO SECTION ──────────────────────────────────── */}
      <section
        id="video"
        ref={(el) => { sectionRefs.current['video'] = el; }}
        style={{ padding: 'clamp(40px, 8vw, 100px) clamp(16px, 4vw, 48px)', maxWidth: 1000, margin: '0 auto' }}
      >
        <div className={`ld-reveal ${isVisible('video') ? 'visible' : ''}`} style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, fontFamily: 'var(--font-playfair), serif', letterSpacing: '-0.02em' }}>
            {T.videoTitle[lang]}
          </h2>
          <p style={{ marginTop: 12, fontSize: 17, color: '#94A3B8' }}>
            {T.videoSub[lang]}
          </p>
        </div>

        {/* Video placeholder */}
        <div className={`ld-reveal ld-reveal-d1 ${isVisible('video') ? 'visible' : ''}`} style={{
          position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 20, overflow: 'hidden',
          background: 'linear-gradient(135deg, #111827 0%, #1a1610 50%, #111827 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
          cursor: 'pointer',
        }}>
          {/* Grid pattern inside video */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `
              linear-gradient(rgba(79,142,247,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(79,142,247,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }} />
          {/* Play button */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, #4F8EF7, #8B5CF6, #EC4899)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'ldPlayPulse 2s ease-in-out infinite',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="#0B0F1A"><polygon points="8 5 19 12 8 19 8 5" /></svg>
          </div>
          {/* Label */}
          <div style={{
            position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
            fontSize: 13, color: '#94A3B8', fontWeight: 500,
          }}>
            {lang === 'EN' ? '2:30 min demo' : lang === 'BM' ? '2:30 min demo' : '2 分 30 秒演示'}
          </div>
        </div>
      </section>

      {/* ── ROLE PORTALS (with photos) ─────────────────────── */}
      <section
        id="roles-section"
        ref={(el) => { sectionRefs.current['roles-section'] = el; }}
        style={{ padding: 'clamp(60px, 10vw, 120px) clamp(16px, 4vw, 48px)', maxWidth: 1200, margin: '0 auto' }}
      >
        <div className={`ld-reveal ${isVisible('roles-section') ? 'visible' : ''}`} style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, fontFamily: 'var(--font-playfair), serif', letterSpacing: '-0.02em' }}>
            {T.roleTitle[lang]}
          </h2>
          <p style={{ marginTop: 12, fontSize: 17, color: '#94A3B8' }}>
            {T.roleSub[lang]}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {ROLES.filter((role) => role.id === 'designer').map((role, i) => (
            <Link
              key={role.id}
              href={`/register?role=${role.id === 'contractor' ? 'worker' : role.id}`}
              className={`ld-role-card ld-reveal ${isVisible('roles-section') ? 'visible' : ''} ld-reveal-d${i + 1}`}
              style={{ textDecoration: 'none', color: '#F1F5F9', display: 'block' }}
            >
              {/* Photo header */}
              <div style={{
                position: 'relative', height: 200, overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  backgroundImage: `url("${role.photo}")`,
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  filter: 'brightness(0.55) saturate(0.8)',
                  transition: 'transform 0.5s ease',
                }} />
                <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, transparent 30%, ${role.color}15 100%)` }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: role.color }} />

                {role.popular && (
                  <div style={{
                    position: 'absolute', top: 16, right: 16, padding: '5px 14px', borderRadius: 100,
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                    color: role.color, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                    border: `1px solid ${role.color}40`,
                  }}>
                    {lang === 'EN' ? 'MOST POPULAR' : lang === 'BM' ? 'PALING POPULAR' : '最受欢迎'}
                  </div>
                )}

                {/* Title overlay on photo */}
                <div style={{ position: 'absolute', bottom: 20, left: 24 }}>
                  <h3 style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-playfair), serif', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                    {role.title[lang]}
                  </h3>
                  <p style={{ fontSize: 13, color: '#CBD5E1', marginTop: 2, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
                    {role.subtitle[lang]}
                  </p>
                </div>
              </div>

              <div style={{ padding: '24px 24px 28px' }}>
                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {role.features[lang].map((feat, fi) => (
                    <li key={fi} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#CBD5E1' }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8l3.5 3.5L13 5" stroke={role.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {feat}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div style={{
                  marginTop: 24, padding: '12px 24px', borderRadius: 12, textAlign: 'center',
                  background: `${role.color}12`, color: role.color, fontWeight: 600, fontSize: 14,
                  border: `1px solid ${role.color}30`,
                  transition: 'all 0.2s',
                }}>
                  {lang === 'EN' ? `Enter as ${role.title.EN}` : lang === 'BM' ? `Masuk sebagai ${role.title.BM}` : `以${role.title.ZH}身份进入`}
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ display: 'inline', marginLeft: 6, verticalAlign: 'middle' }}>
                    <path d="M3 8h10m-4-4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────── */}
      <section
        id="how-section"
        ref={(el) => { sectionRefs.current['how-section'] = el; }}
        style={{
          padding: 'clamp(60px, 10vw, 100px) clamp(16px, 4vw, 48px)',
          maxWidth: 1000, margin: '0 auto',
        }}
      >
        <div className={`ld-reveal ${isVisible('how-section') ? 'visible' : ''}`} style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, fontFamily: 'var(--font-playfair), serif', letterSpacing: '-0.02em' }}>
            {T.howTitle[lang]}
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 32, position: 'relative' }}>
          {STEPS.map((step, i) => (
            <div key={step.num} className={`ld-reveal ${isVisible('how-section') ? 'visible' : ''} ld-reveal-d${i + 1}`} style={{ textAlign: 'center' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%', margin: '0 auto 20px',
                background: 'linear-gradient(135deg, rgba(79,142,247,0.15), rgba(79,142,247,0.05))',
                border: '2px solid rgba(79,142,247,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, fontWeight: 800, color: '#4F8EF7', fontFamily: 'var(--font-dm-mono)',
              }}>
                {step.num}
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700 }}>{step.title[lang]}</h3>
              <p style={{ marginTop: 8, fontSize: 14, color: '#94A3B8', lineHeight: 1.6 }}>{step.desc[lang]}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ────────────────────────────────────────── */}
      <section
        id="pricing-section"
        ref={(el) => { sectionRefs.current['pricing-section'] = el; }}
        style={{
          padding: 'clamp(60px, 10vw, 120px) clamp(16px, 4vw, 48px)',
          maxWidth: 1100, margin: '0 auto',
        }}
      >
        <div className={`ld-reveal ${isVisible('pricing-section') ? 'visible' : ''}`} style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, fontFamily: 'var(--font-playfair), serif', letterSpacing: '-0.02em' }}>
            {T.pricingTitle[lang]}
          </h2>
          <p style={{ marginTop: 12, fontSize: 17, color: '#94A3B8' }}>
            {T.pricingSub[lang]}
          </p>
        </div>

        {/* Period toggle */}
        <div className={`ld-reveal ld-reveal-d1 ${isVisible('pricing-section') ? 'visible' : ''}`} style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>
            {(['monthly', 'quarterly', 'yearly'] as const).map((p) => (
              <button key={p} onClick={() => setPricingPeriod(p)} style={{
                padding: '10px 24px', fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer',
                background: pricingPeriod === p ? 'rgba(79,142,247,0.15)' : 'transparent',
                color: pricingPeriod === p ? '#4F8EF7' : '#94A3B8',
                transition: 'all 0.2s', position: 'relative',
              }}>
                {p === 'monthly' ? (lang === 'EN' ? 'Monthly' : lang === 'BM' ? 'Bulanan' : '月付') :
                 p === 'quarterly' ? (lang === 'EN' ? 'Quarterly' : lang === 'BM' ? 'Suku Tahun' : '季付') :
                 (lang === 'EN' ? 'Yearly' : lang === 'BM' ? 'Tahunan' : '年付')}
                {savePct[p] && <span style={{ display: 'block', fontSize: 10, color: '#10B981', marginTop: 2 }}>{savePct[p]}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Cards */}
        <div className={`ld-reveal ld-reveal-d2 ${isVisible('pricing-section') ? 'visible' : ''}`} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {/* Free */}
          <div className="ld-pricing-card">
            <div style={{ fontSize: 14, fontWeight: 600, color: '#94A3B8' }}>{T.free[lang]}</div>
            <div style={{ marginTop: 8 }}>
              <span style={{ fontSize: 42, fontWeight: 800, fontFamily: 'var(--font-dm-mono)' }}>{prices.currency} 0</span>
            </div>
            <ul style={{ marginTop: 24, listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {PLAN_FEATURES.free[lang].map((f, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#CBD5E1' }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7l3 3L11.5 4" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/register" style={{
              display: 'block', marginTop: 28, padding: '12px 0', borderRadius: 10, textAlign: 'center',
              border: '1px solid rgba(255,255,255,0.15)', color: '#F1F5F9', fontWeight: 600, fontSize: 14,
              textDecoration: 'none', transition: 'all 0.2s',
            }}>
              {T.getStarted[lang]}
            </Link>
          </div>

          {/* Pro */}
          <div className="ld-pricing-card featured">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#4F8EF7' }}>{T.pro[lang]}</span>
              <span style={{ padding: '2px 10px', borderRadius: 100, fontSize: 11, fontWeight: 600, background: 'rgba(79,142,247,0.15)', color: '#4F8EF7' }}>
                {lang === 'EN' ? 'POPULAR' : lang === 'BM' ? 'POPULAR' : '热门'}
              </span>
            </div>
            <div style={{ marginTop: 8 }}>
              <span style={{ fontSize: 42, fontWeight: 800, fontFamily: 'var(--font-dm-mono)' }}>{prices.currency} {getPro()}</span>
              <span style={{ fontSize: 14, color: '#94A3B8' }}>{T.month[lang]}</span>
            </div>
            <ul style={{ marginTop: 24, listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {PLAN_FEATURES.pro[lang].map((f, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#CBD5E1' }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7l3 3L11.5 4" stroke="#4F8EF7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/register" className="ld-btn-primary" style={{
              display: 'block', marginTop: 28, textAlign: 'center', textDecoration: 'none', width: '100%', justifyContent: 'center',
            }}>
              {T.getStarted[lang]}
            </Link>
          </div>

          {/* Elite */}
          <div className="ld-pricing-card">
            <div style={{ fontSize: 14, fontWeight: 600, color: '#A855F7' }}>{T.elite[lang]}</div>
            <div style={{ marginTop: 8 }}>
              <span style={{ fontSize: 42, fontWeight: 800, fontFamily: 'var(--font-dm-mono)' }}>{prices.currency} {getElite()}</span>
              <span style={{ fontSize: 14, color: '#94A3B8' }}>{T.month[lang]}</span>
            </div>
            <ul style={{ marginTop: 24, listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {PLAN_FEATURES.elite[lang].map((f, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#CBD5E1' }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7l3 3L11.5 4" stroke="#A855F7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/register" style={{
              display: 'block', marginTop: 28, padding: '12px 0', borderRadius: 10, textAlign: 'center',
              border: '1px solid rgba(168,85,247,0.3)', color: '#A855F7', fontWeight: 600, fontSize: 14,
              textDecoration: 'none', transition: 'all 0.2s',
            }}>
              {T.getStarted[lang]}
            </Link>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: '#64748B' }}>
          {lang === 'EN' ? 'Payment via FPX, Card, or TNG (Billplz). Cancel anytime.' :
           lang === 'BM' ? 'Bayaran melalui FPX, Kad, atau TNG (Billplz). Batal bila-bila masa.' :
           '支持 FPX、银行卡、TNG 支付（Billplz）。随时取消。'}
        </p>
      </section>

      {/* ── FINAL CTA ──────────────────────────────────────── */}
      <section style={{
        padding: 'clamp(80px, 12vw, 160px) clamp(16px, 4vw, 48px)',
        textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        {/* Glow */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 500, height: 500,
          background: 'radial-gradient(circle, rgba(79,142,247,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <h2 style={{
          fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800,
          fontFamily: 'var(--font-playfair), serif', letterSpacing: '-0.02em',
          whiteSpace: 'pre-line', position: 'relative',
        }}>
          {T.ctaTitle[lang]}
        </h2>
        <div style={{ marginTop: 32, position: 'relative' }}>
          <Link href="/register" className="ld-btn-primary" style={{ fontSize: 16, padding: '16px 40px' }}>
            {T.startFree[lang]}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10m-4-4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer style={{
        padding: '48px clamp(16px, 4vw, 48px) 24px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        maxWidth: 1200, margin: '0 auto',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40, marginBottom: 40 }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #4F8EF7, #8B5CF6, #EC4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, color: '#fff', fontFamily: 'var(--font-dm-mono)' }}>RS</div>
              <span style={{ fontSize: 16, fontWeight: 700 }}>RenoSmart</span>
            </div>
            <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6 }}>
              {lang === 'EN' ? 'AI-powered renovation management for Malaysia & Singapore.' :
               lang === 'BM' ? 'Pengurusan pengubahsuaian berkuasa AI untuk Malaysia & Singapura.' :
               'AI 驱动的马来西亚和新加坡装修管理平台。'}
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, background: 'rgba(255,255,255,0.04)', color: '#94A3B8' }}>🇲🇾 Malaysia</span>
              <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, background: 'rgba(255,255,255,0.04)', color: '#94A3B8' }}>🇸🇬 Singapore</span>
            </div>
          </div>

          {/* Product links */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B', marginBottom: 16 }}>
              {lang === 'EN' ? 'Product' : lang === 'BM' ? 'Produk' : '产品'}
            </div>
            {[
              { label: { EN: 'AI Quotation Audit', BM: 'Audit AI', ZH: 'AI 报价审核' }, href: '/register' },
              { label: { EN: 'Smart Gantt', BM: 'Gantt Pintar', ZH: '智能排程' }, href: '/register' },
              { label: { EN: 'Price Database', BM: 'Pangkalan Harga', ZH: '价格数据库' }, href: '/register' },
              { label: { EN: 'Pricing', BM: 'Harga', ZH: '定价' }, href: '/designer/pricing' },
            ].map((link) => (
              <Link key={link.href + link.label.EN} href={link.href} style={{ display: 'block', fontSize: 14, color: '#94A3B8', textDecoration: 'none', marginBottom: 10, transition: 'color 0.2s' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#F1F5F9')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}>
                {link.label[lang]}
              </Link>
            ))}
          </div>

          {/* Users */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B', marginBottom: 16 }}>
              {lang === 'EN' ? 'For Users' : lang === 'BM' ? 'Untuk Pengguna' : '用户'}
            </div>
            {[
              { label: { EN: 'Designers', BM: 'Pereka', ZH: '设计师' }, href: '/register?role=designer' },
            ].map((link) => (
              <Link key={link.href} href={link.href} style={{ display: 'block', fontSize: 14, color: '#94A3B8', textDecoration: 'none', marginBottom: 10, transition: 'color 0.2s' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#F1F5F9')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}>
                {link.label[lang]}
              </Link>
            ))}
          </div>

          {/* Account */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B', marginBottom: 16 }}>
              {lang === 'EN' ? 'Account' : lang === 'BM' ? 'Akaun' : '账户'}
            </div>
            {[
              { label: { EN: 'Login', BM: 'Log Masuk', ZH: '登录' }, href: '/login' },
              { label: { EN: 'Register', BM: 'Daftar', ZH: '注册' }, href: '/register' },
              { label: { EN: 'Settings', BM: 'Tetapan', ZH: '设置' }, href: '/designer/settings' },
            ].map((link) => (
              <Link key={link.href} href={link.href} style={{ display: 'block', fontSize: 14, color: '#94A3B8', textDecoration: 'none', marginBottom: 10, transition: 'color 0.2s' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#F1F5F9')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}>
                {link.label[lang]}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: 12, color: '#475569' }}>&copy; {new Date().getFullYear()} RenoSmart. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 16 }}>
            <span style={{ fontSize: 12, color: '#475569', cursor: 'pointer' }}>{lang === 'EN' ? 'Privacy Policy' : lang === 'BM' ? 'Dasar Privasi' : '隐私政策'}</span>
            <span style={{ fontSize: 12, color: '#475569', cursor: 'pointer' }}>{lang === 'EN' ? 'Terms of Service' : lang === 'BM' ? 'Terma Perkhidmatan' : '服务条款'}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
