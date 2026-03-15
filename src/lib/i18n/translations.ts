import { Language, Region } from '@/types';

export interface Trans {
  nav: {
    dashboard: string;
    projects: string;
    quotation: string;
    workers: string;
    priceDb: string;
    pricing: string;
    settings: string;
  };
  status: { pending: string; active: string; completed: string };
  aiStatus: { ok: string; warn: string; flag: string; nodata: string };
  buttons: {
    upload: string; analyze: string; generateGantt: string;
    saveToProject: string; viewReport: string; shareOwner: string;
    newProject: string; login: string; register: string; getStarted: string;
  };
  quotation: { dragDrop: string; analyzing: string; extracting: string; done: string };
  landing: {
    hero: string; heroSub: string;
    feat1: string; feat1d: string;
    feat2: string; feat2d: string;
    feat3: string; feat3d: string;
    social: string;
    pricingTitle: string;
    freePlan: string; proPlan: string; elitePlan: string;
  };
}

const EN: Trans = {
  nav: {
    dashboard: 'Dashboard', projects: 'Projects', quotation: 'Quotation AI',
    workers: 'Workers', priceDb: 'Price Database', pricing: 'Pricing Plans', settings: 'Settings',
  },
  status: { pending: 'Pending', active: 'Active', completed: 'Completed' },
  aiStatus: { ok: 'Normal', warn: 'Caution', flag: 'Flagged', nodata: 'No Data' },
  buttons: {
    upload: 'Upload File', analyze: 'Analyze', generateGantt: 'Generate Gantt',
    saveToProject: 'Save to Project', viewReport: 'View Full Report',
    shareOwner: 'Share with Owner', newProject: 'New Project',
    login: 'Login', register: 'Sign Up', getStarted: 'Get Started Free',
  },
  quotation: {
    dragDrop: 'Drag & drop quotation here, or click to select',
    analyzing: 'Analyzing with AI...', extracting: 'Extracting text...',
    done: 'Analysis complete!',
  },
  landing: {
    hero: 'AI-Powered Renovation Management',
    heroSub: 'Audit quotations, auto-generate Gantt charts, and manage projects with AI precision.',
    feat1: 'AI Quotation Audit', feat1d: 'Detect overpriced items and missing scopes instantly.',
    feat2: 'Smart Gantt Chart', feat2d: 'Auto-generate construction schedules based on MY/SG workflows.',
    feat3: 'Multi-Project Dashboard', feat3d: 'Manage all your renovation projects in one place.',
    social: '50+ Interior Designers in MY & SG trust RenoSmart',
    pricingTitle: 'Simple, Transparent Pricing',
    freePlan: 'Free', proPlan: 'Pro', elitePlan: 'Elite',
  },
};

const BM: Trans = {
  nav: {
    dashboard: 'Papan Pemuka', projects: 'Projek', quotation: 'AI Sebutharga',
    workers: 'Pekerja', priceDb: 'Pangkalan Harga', pricing: 'Pelan Harga', settings: 'Tetapan',
  },
  status: { pending: 'Menunggu', active: 'Aktif', completed: 'Selesai' },
  aiStatus: { ok: 'Normal', warn: 'Berhati-hati', flag: 'Ditandai', nodata: 'Tiada Data' },
  buttons: {
    upload: 'Muat Naik', analyze: 'Analisis', generateGantt: 'Jana Gantt',
    saveToProject: 'Simpan ke Projek', viewReport: 'Lihat Laporan',
    shareOwner: 'Kongsi dengan Pemilik', newProject: 'Projek Baru',
    login: 'Log Masuk', register: 'Daftar', getStarted: 'Mulakan Percuma',
  },
  quotation: {
    dragDrop: 'Seret & lepas sebutharga di sini, atau klik untuk pilih',
    analyzing: 'Menganalisis dengan AI...', extracting: 'Mengekstrak teks...',
    done: 'Analisis selesai!',
  },
  landing: {
    hero: 'Pengurusan Renovasi Berkuasa AI',
    heroSub: 'Audit sebutharga, jana carta Gantt secara automatik, dan urus projek dengan ketepatan AI.',
    feat1: 'Audit Sebutharga AI', feat1d: 'Kesan item mahal dan skop yang tiada dengan serta-merta.',
    feat2: 'Carta Gantt Pintar', feat2d: 'Jana jadual pembinaan berdasarkan aliran kerja MY/SG.',
    feat3: 'Papan Pemuka Pelbagai Projek', feat3d: 'Urus semua projek renovasi anda di satu tempat.',
    social: '50+ Pereka Dalaman di MY & SG mempercayai RenoSmart',
    pricingTitle: 'Harga Mudah & Telus',
    freePlan: 'Percuma', proPlan: 'Pro', elitePlan: 'Elit',
  },
};

const ZH: Trans = {
  nav: {
    dashboard: '仪表板', projects: '项目', quotation: 'AI报价',
    workers: '工人', priceDb: '价格数据库', pricing: '定价方案', settings: '设置',
  },
  status: { pending: '待开工', active: '在施工', completed: '已完工' },
  aiStatus: { ok: '正常', warn: '注意', flag: '异常', nodata: '无数据' },
  buttons: {
    upload: '上传文件', analyze: '分析', generateGantt: '生成甘特图',
    saveToProject: '保存到项目', viewReport: '查看完整报告',
    shareOwner: '分享给业主', newProject: '新建项目',
    login: '登录', register: '注册', getStarted: '免费开始',
  },
  quotation: {
    dragDrop: '拖放报价单到此处，或点击选择文件',
    analyzing: 'AI分析中...', extracting: '提取文本中...',
    done: '分析完成！',
  },
  landing: {
    hero: 'AI驱动的装修管理平台',
    heroSub: '智能审核报价单，自动生成甘特图，用AI精度管理项目。',
    feat1: 'AI报价审核', feat1d: '即时发现超价项目和遗漏范围。',
    feat2: '智能甘特图', feat2d: '根据马来西亚/新加坡工程流程自动生成施工计划。',
    feat3: '多项目管理', feat3d: '在一个平台管理所有装修项目。',
    social: '马来西亚和新加坡超过50位室内设计师信赖RenoSmart',
    pricingTitle: '简单透明的定价',
    freePlan: '免费', proPlan: '专业版', elitePlan: '精英版',
  },
};

export const TRANSLATIONS: Record<Language, Trans> = { EN, BM, ZH };

export const PRICES: Record<Region, { pro: string; elite: string; currency: string }> = {
  MY: { pro: 'RM 99', elite: 'RM 299', currency: 'RM' },
  SG: { pro: 'S$ 39', elite: 'S$ 99', currency: 'S$' },
};
