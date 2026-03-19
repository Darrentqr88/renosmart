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
  dash: {
    pendingProjects: string; activeProjects: string; completedProjects: string; allProjects: string;
    pipelineValue: string; contractValue: string; completionRate: string;
    noReminders: string; reminders: string;
    negotiating: string; confirmed: string; settled: string;
    searchPlaceholder: string; dragHint: string;
    addProject: string; noProjects: string;
    manualEvent: string; milestone: string; task: string; payment: string;
    upcoming: string; noUpcoming: string;
    noEvents: string; addEvent: string;
    emptyTitle: string; emptyDesc: string; stepUpload: string; stepAnalysis: string; stepGantt: string; startUpload: string;
  };
  proj: {
    contractTotal: string; recordedCost: string; grossProfit: string; profitMargin: string;
    fromQuotation: string; fromReceipts: string; revenueCost: string; healthy: string;
    gantt: string; payments: string; photos: string; quotationsVO: string; profit: string;
    activeQuotation: string; viewItems: string; print: string;
    quotationVersions: string; compareVersions: string; uploadNewVersion: string;
    setActive: string; view: string;
    voTitle: string; approved: string; uploadVO: string; newVO: string;
    noVO: string; noVOHint: string;
    viewFullReport: string; edit: string;
    statusActive: string; statusPending: string; statusCompleted: string;
    missingItems: string; more: string;
  };
  cal: {
    today: string; addEvent: string; noEvents: string;
    meetingVisit: string; milestoneMark: string;
  };
  costDb: string;
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
  dash: {
    pendingProjects: 'Pending', activeProjects: 'Active', completedProjects: 'Completed', allProjects: 'All Projects',
    pipelineValue: 'Pipeline', contractValue: 'Contract', completionRate: 'Completion',
    noReminders: 'No reminders', reminders: 'reminders pending',
    negotiating: 'Negotiating', confirmed: 'Confirmed', settled: 'Settled',
    searchPlaceholder: 'Search projects or clients...',
    dragHint: 'Drag to target column to change project status',
    addProject: 'Add Project', noProjects: 'No projects',
    manualEvent: 'Manual', milestone: 'Milestone', task: 'Task', payment: 'Payment',
    upcoming: 'Upcoming', noUpcoming: 'No upcoming events',
    noEvents: 'No events', addEvent: 'Add Event',
    emptyTitle: 'Start Your First Renovation Project', emptyDesc: 'Upload a quotation and AI will analyze it and generate a Gantt chart', stepUpload: 'Upload Quotation', stepAnalysis: 'AI Analysis', stepGantt: 'Generate Gantt', startUpload: 'Upload Quotation to Start',
  },
  proj: {
    contractTotal: 'Contract Total', recordedCost: 'Recorded Cost', grossProfit: 'Gross Profit', profitMargin: 'Profit Margin',
    fromQuotation: 'From quotation', fromReceipts: 'From receipts', revenueCost: 'Revenue − Cost', healthy: 'Healthy',
    gantt: 'Gantt', payments: 'Payments', photos: 'Site Photos', quotationsVO: 'Quotations & VO', profit: 'Profit',
    activeQuotation: 'Active Quotation', viewItems: 'View Items', print: 'Print',
    quotationVersions: 'Quotation Versions', compareVersions: 'Compare Versions', uploadNewVersion: 'Upload New Version',
    setActive: 'Set Active', view: 'View',
    voTitle: 'Variation Orders VO', approved: 'Approved', uploadVO: 'Upload VO File', newVO: 'New VO',
    noVO: 'No variation orders', noVOHint: 'Click "New VO" or upload a VO file for auto-recognition',
    viewFullReport: 'View full AI audit report', edit: 'Edit',
    statusActive: 'Active', statusPending: 'Pending', statusCompleted: 'Completed',
    missingItems: 'Missing Items', more: 'more',
  },
  cal: {
    today: 'Today', addEvent: 'Add Event', noEvents: 'No events for this day',
    meetingVisit: 'Meeting/Visit', milestoneMark: 'Milestone',
  },
  costDb: 'Cost Database',
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
  dash: {
    pendingProjects: 'Menunggu', activeProjects: 'Aktif', completedProjects: 'Selesai', allProjects: 'Semua Projek',
    pipelineValue: 'Saluran', contractValue: 'Kontrak', completionRate: 'Kadar siap',
    noReminders: 'Tiada peringatan', reminders: 'peringatan belum selesai',
    negotiating: 'Berunding', confirmed: 'Disahkan', settled: 'Selesai',
    searchPlaceholder: 'Cari projek atau pelanggan...',
    dragHint: 'Seret ke lajur sasaran untuk menukar status projek',
    addProject: 'Tambah Projek', noProjects: 'Tiada projek',
    manualEvent: 'Manual', milestone: 'Pencapaian', task: 'Tugas', payment: 'Bayaran',
    upcoming: 'Akan datang', noUpcoming: 'Tiada acara akan datang',
    noEvents: 'Tiada acara', addEvent: 'Tambah Acara',
    emptyTitle: 'Mulakan Projek Pengubahsuaian Pertama Anda', emptyDesc: 'Muat naik sebut harga, AI akan menganalisis dan menjana carta Gantt', stepUpload: 'Muat Naik Sebut Harga', stepAnalysis: 'Analisis AI', stepGantt: 'Jana Gantt', startUpload: 'Muat Naik untuk Mula',
  },
  proj: {
    contractTotal: 'Jumlah Kontrak', recordedCost: 'Kos Direkod', grossProfit: 'Untung Kasar', profitMargin: 'Margin Untung',
    fromQuotation: 'Dari sebutharga', fromReceipts: 'Dari resit', revenueCost: 'Hasil − Kos', healthy: 'Sihat',
    gantt: 'Gantt', payments: 'Bayaran', photos: 'Foto Tapak', quotationsVO: 'Sebutharga & VO', profit: 'Untung',
    activeQuotation: 'Sebutharga Aktif', viewItems: 'Lihat Item', print: 'Cetak',
    quotationVersions: 'Versi Sebutharga', compareVersions: 'Bandingkan', uploadNewVersion: 'Muat Naik Versi Baru',
    setActive: 'Tetapkan Aktif', view: 'Lihat',
    voTitle: 'Perintah Variasi VO', approved: 'Diluluskan', uploadVO: 'Muat Naik Fail VO', newVO: 'VO Baru',
    noVO: 'Tiada perintah variasi', noVOHint: 'Klik "VO Baru" atau muat naik fail VO',
    viewFullReport: 'Lihat laporan audit AI penuh', edit: 'Sunting',
    statusActive: 'Aktif', statusPending: 'Menunggu', statusCompleted: 'Selesai',
    missingItems: 'Item Hilang', more: 'lagi',
  },
  cal: {
    today: 'Hari ini', addEvent: 'Tambah Acara', noEvents: 'Tiada acara untuk hari ini',
    meetingVisit: 'Mesyuarat/Lawatan', milestoneMark: 'Pencapaian',
  },
  costDb: 'Pangkalan Kos',
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
  dash: {
    pendingProjects: '待谈项目', activeProjects: '施工中', completedProjects: '已完工', allProjects: '全部项目',
    pipelineValue: '管道价值', contractValue: '合同额', completionRate: '完工率',
    noReminders: '无待处理提醒', reminders: '个提醒待处理',
    negotiating: '待谈 — 洽谈中', confirmed: '施工中 — 已成交', settled: '已完工 — 已结清',
    searchPlaceholder: '搜索项目或客户...',
    dragHint: '拖放到目标列以更改项目状态',
    addProject: '添加项目', noProjects: '暂无项目',
    manualEvent: '手动事项', milestone: '里程碑', task: '工程任务', payment: '收款提醒',
    upcoming: '即将事项', noUpcoming: '暂无即将到来的事项',
    noEvents: '当天无事项', addEvent: '添加事项',
    emptyTitle: '开始你的第一个装修项目', emptyDesc: '上传报价单，AI 将自动分析并生成甘特图', stepUpload: '上传报价单', stepAnalysis: 'AI 智能分析', stepGantt: '生成甘特图', startUpload: '上传报价单开始',
  },
  proj: {
    contractTotal: '合同总额', recordedCost: '已录成本', grossProfit: '毛利', profitMargin: '利润率',
    fromQuotation: '来自报价单', fromReceipts: '来自单据', revenueCost: '收入 − 成本', healthy: '健康',
    gantt: '进度表', payments: '分阶段付款', photos: '工地照片', quotationsVO: '报价单 & VO', profit: '利润',
    activeQuotation: '当前报价单', viewItems: '查看品项', print: '打印',
    quotationVersions: '报价单版本', compareVersions: '对比版本', uploadNewVersion: '上传新版本',
    setActive: '设为当前', view: '查看',
    voTitle: '变更单 VO', approved: '已批准', uploadVO: '上传VO文件', newVO: '新增 VO',
    noVO: '暂无变更单', noVOHint: '点击「新增 VO」或上传VO文件自动识别',
    viewFullReport: '查看完整 AI 审核报告', edit: '编辑',
    statusActive: '在施工', statusPending: '待谈', statusCompleted: '已完工',
    missingItems: '缺少项目', more: '更多',
  },
  cal: {
    today: '今天', addEvent: '添加事项', noEvents: '当天无事项',
    meetingVisit: '会议/拜访', milestoneMark: '里程碑',
  },
  costDb: '成本数据库',
};

export const TRANSLATIONS: Record<Language, Trans> = { EN, BM, ZH };

export const PRICES: Record<Region, { pro: string; elite: string; currency: string }> = {
  MY: { pro: 'RM 99', elite: 'RM 299', currency: 'RM' },
  SG: { pro: 'S$ 39', elite: 'S$ 99', currency: 'S$' },
};
