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
  pay: {
    contractWithVO: string; includesVO: string;
    collected: string; outstanding: string;
    balanced: string; unallocated: string; overContract: string; phasesTotal: string;
    savePayment: string;
    description: string; amount: string; percentage: string; dueDate: string;
    status: string; clickToChange: string; descPlaceholder: string;
    clickMarkCollected: string; clickToggle: string;
    addPhase: string; total: string; phaseDefault: string; deletePhase: string;
    statusNotDue: string; statusPending: string; statusCollected: string; statusOverdue: string;
  };
  cal: {
    today: string; addEvent: string; noEvents: string;
    meetingVisit: string; milestoneMark: string;
  };
  costDb: string;
  worker: {
    tasks: string; schedule: string; photos: string; receipts: string; profile: string;
    goodMorning: string; goodAfternoon: string; goodEvening: string;
    tasksToday: string; noTasksToday: string; checkSchedule: string;
    upcoming: string; viewAll: string;
    checkIn: string; checkOut: string; checkedIn: string;
    autoCheckedIn: string; leftSite: string;
    photo: string; invoice: string; complete: string;
    allDone: string; confirmComplete: string;
    workItems: string; duration: string; days: string; editDuration: string;
    saveDuration: string; cancelEdit: string;
    subtasks: string; progress: string;
    receiptsThisMonth: string; totalAmount: string; noReceipts: string;
    uploadFromTasks: string; allProjects: string;
    personal: string; companyInfo: string; name: string; phone: string; email: string;
    company: string; address: string; ssm: string; teamSize: string;
    projectRange: string; about: string; serviceRegions: string;
    trades: string; signOut: string; teamManagement: string; comingSoon: string;
    rating: string; attendance: string; onTimeCompletion: string;
    photoQuality: string; documentation: string; reliability: string;
    basedOnTasks: string; tasksCompleted: string;
    notSet: string; tapEdit: string;
    monthView: string; weekView: string; today: string;
    approvedBadge: string; pendingBadge: string; rejectedBadge: string;
    filterAll: string; filterByTrade: string;
    // Invoice/receipt modal
    uploadInvoice: string; scanningReceipt: string; scanningWait: string;
    scanFailed: string; readFailed: string; saveFailed: string;
    supplier: string; date: string; noItemsDetected: string;
    total: string; retake: string; confirmSave: string;
    savingProject: string; saved: string; invoiceLinked: string;
    takePhotoOrUpload: string; selectFile: string;
    detectingLocation: string; doneForToday: string;
    todaysTasks: string;
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
  pay: {
    contractWithVO: 'Contract Total (incl. VO)', includesVO: 'incl. VO',
    collected: 'Collected', outstanding: 'Outstanding',
    balanced: '✅ Payment plan matches contract amount', unallocated: 'unallocated', overContract: 'over contract',
    phasesTotal: 'Phases total:', savePayment: '💾 Save Payment Plan',
    description: 'Description', amount: 'Amount (RM)', percentage: 'Share', dueDate: 'Due Date',
    status: 'Status', clickToChange: 'click to change', descPlaceholder: 'Payment description...',
    clickMarkCollected: 'Click to mark as collected', clickToggle: 'Click to toggle status',
    addPhase: '+ Add Payment Phase', total: 'Total', phaseDefault: 'Phase', deletePhase: 'Delete phase',
    statusNotDue: 'Not Due', statusPending: 'Pending', statusCollected: 'Collected', statusOverdue: 'Overdue',
  },
  cal: {
    today: 'Today', addEvent: 'Add Event', noEvents: 'No events for this day',
    meetingVisit: 'Meeting/Visit', milestoneMark: 'Milestone',
  },
  costDb: 'Cost Database',
  worker: {
    tasks: 'Tasks', schedule: 'Schedule', photos: 'Photos', receipts: 'Receipts', profile: 'Profile',
    goodMorning: 'Good morning', goodAfternoon: 'Good afternoon', goodEvening: 'Good evening',
    tasksToday: 'tasks today', noTasksToday: 'No tasks today!', checkSchedule: 'Check Schedule for upcoming work',
    upcoming: 'Upcoming', viewAll: 'View all upcoming tasks',
    checkIn: 'Check In', checkOut: 'Check Out', checkedIn: 'Checked In',
    autoCheckedIn: 'Auto checked in at site', leftSite: 'Left site, auto checkout in 15min',
    photo: 'Photo', invoice: 'Invoice', complete: 'Complete',
    allDone: 'All tasks done!', confirmComplete: 'Confirm Completion',
    workItems: 'Work Items (from quotation)', duration: 'Duration', days: 'days', editDuration: 'Edit Duration',
    saveDuration: 'Save', cancelEdit: 'Cancel',
    subtasks: 'Subtasks', progress: 'Progress',
    receiptsThisMonth: 'This Month', totalAmount: 'Total Amount', noReceipts: 'No receipts yet',
    uploadFromTasks: 'Upload receipts from the Invoice button in your tasks', allProjects: 'All Projects',
    personal: 'Personal', companyInfo: 'Company Info', name: 'Name', phone: 'Phone', email: 'Email',
    company: 'Company', address: 'Address', ssm: 'SSM No.', teamSize: 'Team Size',
    projectRange: 'Project Range', about: 'About', serviceRegions: 'Service Regions',
    trades: 'Trades', signOut: 'Sign Out', teamManagement: 'Team Management', comingSoon: 'Coming Soon',
    rating: 'Performance Rating', attendance: 'Attendance', onTimeCompletion: 'On-time Completion',
    photoQuality: 'Photo Quality', documentation: 'Documentation', reliability: 'Reliability',
    basedOnTasks: 'Based on', tasksCompleted: 'tasks completed',
    notSet: 'Not set', tapEdit: 'tap edit',
    monthView: 'Month', weekView: 'Week', today: 'Today',
    approvedBadge: 'Approved', pendingBadge: 'Pending', rejectedBadge: 'Rejected',
    filterAll: 'All', filterByTrade: 'Filter by trade',
    // Invoice/receipt modal
    uploadInvoice: 'Upload Invoice', scanningReceipt: 'AI scanning receipt...',
    scanningWait: 'Usually takes 5-10 seconds', scanFailed: 'AI scan failed, please retry',
    readFailed: 'File read failed', saveFailed: 'Save failed, please retry',
    supplier: 'Supplier', date: 'Date', noItemsDetected: 'No items detected, will record total amount',
    total: 'Total', retake: 'Retake', confirmSave: 'Confirm Save',
    savingProject: 'Saving to project...', saved: 'Saved!', invoiceLinked: 'Invoice linked to',
    takePhotoOrUpload: 'Take Photo or Upload', selectFile: 'Select File',
    detectingLocation: 'Detecting location...', doneForToday: 'Done for today',
    todaysTasks: "Today's Tasks",
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
  pay: {
    contractWithVO: 'Jumlah Kontrak (termasuk VO)', includesVO: 'termasuk VO',
    collected: 'Diterima', outstanding: 'Belum Terima',
    balanced: '✅ Pelan bayaran sepadan dengan jumlah kontrak', unallocated: 'belum diperuntukkan', overContract: 'melebihi kontrak',
    phasesTotal: 'Jumlah fasa:', savePayment: '💾 Simpan Pelan Bayaran',
    description: 'Keterangan', amount: 'Amaun (RM)', percentage: 'Bahagian', dueDate: 'Tarikh Akhir',
    status: 'Status', clickToChange: 'klik untuk tukar', descPlaceholder: 'Keterangan bayaran...',
    clickMarkCollected: 'Klik untuk tandakan sebagai diterima', clickToggle: 'Klik untuk tukar status',
    addPhase: '+ Tambah Fasa Bayaran', total: 'Jumlah', phaseDefault: 'Fasa', deletePhase: 'Padam fasa',
    statusNotDue: 'Belum Tiba', statusPending: 'Menunggu', statusCollected: 'Diterima', statusOverdue: 'Tamat Tempoh',
  },
  cal: {
    today: 'Hari ini', addEvent: 'Tambah Acara', noEvents: 'Tiada acara untuk hari ini',
    meetingVisit: 'Mesyuarat/Lawatan', milestoneMark: 'Pencapaian',
  },
  costDb: 'Pangkalan Kos',
  worker: {
    tasks: 'Tugas', schedule: 'Jadual', photos: 'Foto', receipts: 'Resit', profile: 'Profil',
    goodMorning: 'Selamat pagi', goodAfternoon: 'Selamat petang', goodEvening: 'Selamat malam',
    tasksToday: 'tugas hari ini', noTasksToday: 'Tiada tugas hari ini!', checkSchedule: 'Semak Jadual untuk kerja akan datang',
    upcoming: 'Akan Datang', viewAll: 'Lihat semua tugas akan datang',
    checkIn: 'Daftar Masuk', checkOut: 'Daftar Keluar', checkedIn: 'Sudah Masuk',
    autoCheckedIn: 'Auto daftar masuk di tapak', leftSite: 'Meninggalkan tapak, auto keluar 15min',
    photo: 'Foto', invoice: 'Invois', complete: 'Selesai',
    allDone: 'Semua tugas selesai!', confirmComplete: 'Sahkan Siap',
    workItems: 'Senarai Kerja (dari sebutharga)', duration: 'Tempoh', days: 'hari', editDuration: 'Ubah Tempoh',
    saveDuration: 'Simpan', cancelEdit: 'Batal',
    subtasks: 'Sub-tugas', progress: 'Kemajuan',
    receiptsThisMonth: 'Bulan Ini', totalAmount: 'Jumlah Amaun', noReceipts: 'Tiada resit lagi',
    uploadFromTasks: 'Muat naik resit dari butang Invois dalam tugas anda', allProjects: 'Semua Projek',
    personal: 'Peribadi', companyInfo: 'Info Syarikat', name: 'Nama', phone: 'Telefon', email: 'E-mel',
    company: 'Syarikat', address: 'Alamat', ssm: 'No. SSM', teamSize: 'Saiz Pasukan',
    projectRange: 'Julat Projek', about: 'Tentang', serviceRegions: 'Kawasan Perkhidmatan',
    trades: 'Tred', signOut: 'Log Keluar', teamManagement: 'Pengurusan Pasukan', comingSoon: 'Akan Datang',
    rating: 'Penilaian Prestasi', attendance: 'Kehadiran', onTimeCompletion: 'Siap Tepat Masa',
    photoQuality: 'Kualiti Foto', documentation: 'Dokumentasi', reliability: 'Kebolehpercayaan',
    basedOnTasks: 'Berdasarkan', tasksCompleted: 'tugas selesai',
    notSet: 'Belum ditetapkan', tapEdit: 'tekan sunting',
    monthView: 'Bulan', weekView: 'Minggu', today: 'Hari Ini',
    approvedBadge: 'Diluluskan', pendingBadge: 'Menunggu', rejectedBadge: 'Ditolak',
    filterAll: 'Semua', filterByTrade: 'Tapis mengikut tred',
    uploadInvoice: 'Muat Naik Invois', scanningReceipt: 'AI mengimbas resit...',
    scanningWait: 'Biasanya 5-10 saat', scanFailed: 'Imbasan AI gagal, sila cuba lagi',
    readFailed: 'Gagal membaca fail', saveFailed: 'Gagal menyimpan, sila cuba lagi',
    supplier: 'Pembekal', date: 'Tarikh', noItemsDetected: 'Tiada item dikesan, jumlah akan direkod',
    total: 'Jumlah', retake: 'Ambil Semula', confirmSave: 'Sahkan Simpan',
    savingProject: 'Menyimpan ke projek...', saved: 'Disimpan!', invoiceLinked: 'Invois dikaitkan ke',
    takePhotoOrUpload: 'Ambil Foto atau Muat Naik', selectFile: 'Pilih Fail',
    detectingLocation: 'Mengesan lokasi...', doneForToday: 'Selesai untuk hari ini',
    todaysTasks: 'Tugas Hari Ini',
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
  pay: {
    contractWithVO: '合同总额（含VO）', includesVO: '含 VO',
    collected: '已收款', outstanding: '未收款',
    balanced: '✅ 付款计划与合同金额匹配', unallocated: '未分配', overContract: '超出合同',
    phasesTotal: '各期合计：', savePayment: '💾 保存付款计划',
    description: '付款说明', amount: '金额 (RM)', percentage: '占比', dueDate: '截止日期',
    status: '状态', clickToChange: '可点击换状态', descPlaceholder: '付款说明...',
    clickMarkCollected: '点击标记为已收款', clickToggle: '点击切换状态',
    addPhase: '+ 添加付款阶段', total: '合计', phaseDefault: '期', deletePhase: '删除此期',
    statusNotDue: '未到期', statusPending: '待收款', statusCollected: '已收款', statusOverdue: '已到期',
  },
  cal: {
    today: '今天', addEvent: '添加事项', noEvents: '当天无事项',
    meetingVisit: '会议/拜访', milestoneMark: '里程碑',
  },
  costDb: '成本数据库',
  worker: {
    tasks: '任务', schedule: '日程', photos: '照片', receipts: '收据', profile: '个人',
    goodMorning: '早上好', goodAfternoon: '下午好', goodEvening: '晚上好',
    tasksToday: '个今日任务', noTasksToday: '今天没有任务！', checkSchedule: '查看日程了解即将到来的工作',
    upcoming: '即将到来', viewAll: '查看所有即将到来的任务',
    checkIn: '签到', checkOut: '签退', checkedIn: '已签到',
    autoCheckedIn: '已到达工地，自动签到', leftSite: '已离开工地，15分钟后自动签退',
    photo: '拍照', invoice: '单据', complete: '完工',
    allDone: '所有工序已完成！', confirmComplete: '确认完工',
    workItems: '工作内容（来自报价单）', duration: '工期', days: '天', editDuration: '修改工期',
    saveDuration: '保存', cancelEdit: '取消',
    subtasks: '工序清单', progress: '进度',
    receiptsThisMonth: '本月', totalAmount: '总金额', noReceipts: '暂无收据',
    uploadFromTasks: '请从任务中的单据按钮上传收据', allProjects: '全部项目',
    personal: '个人信息', companyInfo: '公司信息', name: '姓名', phone: '电话', email: '邮箱',
    company: '公司', address: '地址', ssm: 'SSM编号', teamSize: '团队规模',
    projectRange: '项目范围', about: '简介', serviceRegions: '服务区域',
    trades: '工种', signOut: '退出登录', teamManagement: '团队管理', comingSoon: '即将推出',
    rating: '绩效评分', attendance: '出勤率', onTimeCompletion: '准时完工',
    photoQuality: '照片质量', documentation: '文档提交', reliability: '可靠度',
    basedOnTasks: '基于', tasksCompleted: '个已完成任务',
    notSet: '未设置', tapEdit: '点击编辑',
    monthView: '月', weekView: '周', today: '今天',
    approvedBadge: '已通过', pendingBadge: '待审批', rejectedBadge: '已拒绝',
    filterAll: '全部', filterByTrade: '按工种筛选',
    uploadInvoice: '上传单据', scanningReceipt: 'AI 正在识别单据...',
    scanningWait: '通常需要 5-10 秒', scanFailed: 'AI 扫描失败，请重试',
    readFailed: '文件读取失败', saveFailed: '保存失败，请重试',
    supplier: '供应商', date: '日期', noItemsDetected: '未识别到明细，将以总金额记录',
    total: '合计', retake: '重拍', confirmSave: '确认保存',
    savingProject: '正在保存到项目...', saved: '已保存！', invoiceLinked: '单据已关联到',
    takePhotoOrUpload: '拍照或上传', selectFile: '选择文件',
    detectingLocation: '正在定位...', doneForToday: '今日已完成',
    todaysTasks: '今日任务',
  },
};

export const TRANSLATIONS: Record<Language, Trans> = { EN, BM, ZH };

export const PRICES: Record<Region, { pro: string; elite: string; currency: string }> = {
  MY: { pro: 'RM 99', elite: 'RM 299', currency: 'RM' },
  SG: { pro: 'S$ 39', elite: 'S$ 99', currency: 'S$' },
};
