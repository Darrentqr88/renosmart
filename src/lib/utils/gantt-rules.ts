import { GanttTask, GanttSubtask, GanttParams } from '@/types';
import { addDays, format } from 'date-fns';
import { isWorkday } from './dates';

export interface ConstructionPhase {
  id: string;
  name: string;
  name_zh: string;
  trade: string;
  baseDays: number;
  scaleBy?: 'sqft' | 'points' | 'ft';
  scaleFactor?: number; // e.g. 1/100 for sqft
  parallel?: string[];  // runs parallel with these phase IDs
  deps: string[];       // depends on these phase IDs
  prepChecklist: { icon: string; text: string; text_zh: string; type: 'warn' | 'order' | 'check' | 'info' }[];
  subItems: { name: string; name_zh: string }[];
  // AI contextual hint per region
  hint_MY?: string;     // Malaysia-specific hint
  hint_SG?: string;     // Singapore-specific hint
  hint_zh?: string;     // Chinese hint (shared)
}

export const CONSTRUCTION_PHASES: ConstructionPhase[] = [
  {
    id: 'measurement', name: 'Site Survey & Preparation', name_zh: '现场勘查 & 备料',
    trade: 'Measurement', baseDays: 1, deps: [],
    prepChecklist: [
      { icon: '📐', text: 'Prepare measuring tools (laser/tape)', text_zh: '准备测量工具(激光/卷尺)', type: 'check' },
      { icon: '📋', text: 'Bring floor plan drawings', text_zh: '携带平面图', type: 'info' },
    ],
    subItems: [
      { name: 'Full site measurement', name_zh: '全屋测量' },
      { name: 'Photo documentation', name_zh: '现场拍照记录' },
      { name: 'Record existing conditions', name_zh: '记录现有状况' },
    ],
  },
  {
    id: 'design_conf', name: 'Design Confirmation', name_zh: '设计确认',
    trade: 'Measurement', baseDays: 3, deps: ['measurement'],
    prepChecklist: [
      { icon: '🎨', text: 'Finalize material selections', text_zh: '确定材料选择', type: 'order' },
      { icon: '📐', text: 'Complete 3D rendering', text_zh: '完成3D效果图', type: 'check' },
    ],
    subItems: [
      { name: 'Layout plan approval', name_zh: '平面布局确认' },
      { name: 'Material & color scheme', name_zh: '材料及色彩方案' },
      { name: 'Client sign-off', name_zh: '客户签名确认' },
    ],
  },
  {
    id: 'demolition', name: 'Demolition', name_zh: '拆除工程',
    trade: 'Demolition', baseDays: 5, deps: ['design_conf'],
    scaleBy: 'sqft', scaleFactor: 1 / 150,
    hint_MY: 'Debris disposal in MY: coordinate with DBKL/MBPP for lorry booking. Avoid hacking load-bearing walls without S.E. approval.',
    hint_SG: 'Singapore: BCA permit required for structural hacking. Engage Licensed Builder for approved works. Notify MCST if condo.',
    hint_zh: '拆除前务必确认哪些是承重墙，并保护好非施工区域地板和家具。垃圾需提前预约车辆清运。',
    prepChecklist: [
      { icon: '⚠️', text: 'Protect non-demolition areas', text_zh: '保护非拆除区域', type: 'warn' },
      { icon: '🚚', text: 'Arrange debris disposal truck', text_zh: '安排垃圾清运车', type: 'order' },
      { icon: '🔌', text: 'Disconnect existing utilities', text_zh: '断开现有水电', type: 'warn' },
      { icon: '📝', text: 'Confirm scope with client', text_zh: '与客户确认拆除范围', type: 'check' },
    ],
    subItems: [
      { name: 'Wall hacking', name_zh: '凿墙' },
      { name: 'Floor tile removal', name_zh: '拆除地砖' },
      { name: 'Ceiling removal', name_zh: '拆除天花板' },
      { name: 'Debris disposal', name_zh: '垃圾清运' },
    ],
  },
  {
    id: 'masonry', name: 'Construction & Plastering', name_zh: '水泥建筑工程',
    trade: 'Construction', baseDays: 5, deps: ['demolition'],
    scaleBy: 'sqft', scaleFactor: 1 / 100,
    hint_MY: 'Masonry is typically the critical path. Skim coat needs 2 coats with 2–3 day drying between each coat. New brickwork needs 14 days curing before skim.',
    hint_SG: 'Use approved cement mixes per BCA spec. Skim coat must cure min 72 hrs before painting. Condo: confirm with MCST on working hours (Mon–Sat 9am–5pm).',
    hint_zh: '批灰层是关键工序。每层批灰需晾干2-3天再批下一层。新砌墙需养护14天后才能批灰，否则会裂。',
    prepChecklist: [
      { icon: '🧱', text: 'Order bricks & cement', text_zh: '订购砖块及水泥', type: 'order' },
      { icon: '📐', text: 'Confirm new wall layout', text_zh: '确认新墙位置', type: 'check' },
    ],
    subItems: [
      { name: 'New wall construction', name_zh: '砌新墙' },
      { name: 'Wall plastering', name_zh: '墙面批灰' },
      { name: 'Window/door frame setting', name_zh: '门窗框架安装' },
    ],
  },
  {
    id: 'electrical1', name: 'Electrical Conduit & Wiring', name_zh: '水电暗槽布线',
    trade: 'Electrical', baseDays: 5, deps: ['masonry'],
    parallel: ['plumbing1'],
    scaleBy: 'points', scaleFactor: 1 / 6,
    prepChecklist: [
      { icon: '⚡', text: 'Confirm DB board upgrade needed?', text_zh: '确认是否需要升级电箱?', type: 'warn' },
      { icon: '📋', text: 'Electrical point layout confirmed', text_zh: '电位图确认', type: 'check' },
      { icon: '🔌', text: 'Order cables & conduits', text_zh: '订购电线及线管', type: 'order' },
    ],
    subItems: [
      { name: 'Conduit chasing & laying', name_zh: '开槽及铺管' },
      { name: 'DB board installation', name_zh: '电箱安装' },
      { name: 'Point wiring', name_zh: '各点位布线' },
    ],
  },
  {
    id: 'plumbing1', name: 'Plumbing Rough-In', name_zh: '水管布管工程',
    trade: 'Plumbing', baseDays: 4, deps: ['masonry'],
    parallel: ['electrical1'],
    prepChecklist: [
      { icon: '🚿', text: 'Sanitary ware selections confirmed', text_zh: '卫浴选品确认', type: 'check' },
      { icon: '📦', text: 'Order pipes & fittings', text_zh: '订购管件', type: 'order' },
      { icon: '📐', text: 'Hot/cold water point locations', text_zh: '冷热水点位确认', type: 'info' },
    ],
    subItems: [
      { name: 'Water supply piping', name_zh: '供水管路' },
      { name: 'Drainage piping', name_zh: '排水管路' },
      { name: 'Pressure test', name_zh: '水压测试' },
    ],
  },
  {
    id: 'waterproofing', name: 'Waterproofing', name_zh: '防水工程',
    hint_MY: '48-hour ponding test is mandatory before tiling. Do NOT proceed with tiling if any leakage detected. Use min 2 coats of membrane.',
    hint_SG: 'Waterproofing warranty min 5 years per SS 212. 48-hr ponding test required, witnessed by supervisor. Document with photos.',
    hint_zh: '防水层必须做2道，待第一道干透后再做第二道。做完防水后必须进行48小时蓄水试验，确认无渗漏才能铺砖。',
    trade: 'Waterproofing', baseDays: 3, deps: ['plumbing1'],
    scaleBy: 'sqft', scaleFactor: 1 / 300,
    prepChecklist: [
      { icon: '💧', text: 'Waterproofing membrane ordered', text_zh: '防水膜已订购', type: 'order' },
      { icon: '⏰', text: '48-hour ponding test required', text_zh: '需进行48小时蓄水试验', type: 'warn' },
    ],
    subItems: [
      { name: 'Surface preparation', name_zh: '基面处理' },
      { name: 'Membrane application (2 coats)', name_zh: '防水涂层(2道)' },
      { name: '48hr ponding test', name_zh: '48小时蓄水试验' },
    ],
  },
  {
    id: 'tiling', name: 'Floor & Wall Tiling', name_zh: '铺砖工程',
    hint_MY: 'Allow 24–48 hrs for tile adhesive to cure before grouting. Order 10% extra tiles for cuts & future replacement. Homogeneous tiles need diamond-blade cutter.',
    hint_SG: 'Hollow tile defects must be re-laid before handover. Use non-slip tiles for wet areas (R9 minimum). Document tile batch numbers for future matching.',
    hint_zh: '贴砖后需等待24-48小时才能填缝。瓷砖订购需多预留10%备用。卫生间及厨房须使用防滑砖，坡度朝排水口倾斜。',
    trade: 'Tiling', baseDays: 10, deps: ['waterproofing'],
    scaleBy: 'sqft', scaleFactor: 1 / 100,
    prepChecklist: [
      { icon: '🔲', text: 'Tile selection & purchase confirmed', text_zh: '瓷砖选购确认', type: 'check' },
      { icon: '📦', text: 'Tiles delivered on site', text_zh: '瓷砖已送达工地', type: 'order' },
      { icon: '🧪', text: 'Adhesive & grout ready', text_zh: '瓷砖胶及填缝剂准备', type: 'order' },
      { icon: '📐', text: 'Tile layout pattern approved', text_zh: '铺贴方案已确认', type: 'check' },
    ],
    subItems: [
      { name: 'Floor tiling', name_zh: '地砖铺设' },
      { name: 'Wall tiling (kitchen)', name_zh: '厨房墙砖' },
      { name: 'Wall tiling (bathroom)', name_zh: '卫生间墙砖' },
      { name: 'Grouting & cleaning', name_zh: '填缝及清理' },
    ],
  },
  {
    id: 'ceiling', name: 'False Ceiling & Partition', name_zh: '石膏板吊顶',
    trade: 'False Ceiling', baseDays: 7, deps: ['tiling'],
    scaleBy: 'sqft', scaleFactor: 1 / 120,
    prepChecklist: [
      { icon: '📏', text: 'Ceiling height & design confirmed', text_zh: '吊顶高度及造型确认', type: 'check' },
      { icon: '📦', text: 'Gypsum boards & framing ordered', text_zh: '石膏板及龙骨已订购', type: 'order' },
      { icon: '💡', text: 'Downlight positions marked', text_zh: '筒灯位置已标记', type: 'info' },
    ],
    subItems: [
      { name: 'Metal framing', name_zh: '龙骨安装' },
      { name: 'Gypsum board fixing', name_zh: '石膏板安装' },
      { name: 'Cornices & moulding', name_zh: '线条收口' },
      { name: 'Partition walls', name_zh: '隔墙' },
    ],
  },
  {
    id: 'painting1', name: 'Painting Phase 1 — Primer & Skim', name_zh: '油漆工程',
    hint_MY: 'Putty (filler) must be fully dry before sanding. Min 2 coats primer on new plaster. Weather humidity >85% will extend drying — avoid rainy season scheduling if possible.',
    hint_SG: 'Use low-VOC paints (Singapore Green Label preferred). New plaster: apply alkali-resistant primer first. Humidity controlled environments dry faster; open windows for ventilation.',
    hint_zh: '腻子层需完全干透才能打磨，打磨后上底漆。新批灰墙面需上抗碱底漆，否则面漆容易起泡。潮湿天气会大幅延长干燥时间。',
    trade: 'Painting', baseDays: 5, deps: ['ceiling'],
    scaleBy: 'sqft', scaleFactor: 1 / 200,
    prepChecklist: [
      { icon: '🎨', text: 'Paint colors selected', text_zh: '油漆颜色已选定', type: 'check' },
      { icon: '📦', text: 'Primer & putty ordered', text_zh: '底漆及腻子已订购', type: 'order' },
    ],
    subItems: [
      { name: 'Wall skim coat', name_zh: '墙面批灰' },
      { name: 'Sanding', name_zh: '打磨' },
      { name: 'Primer coat', name_zh: '底漆' },
    ],
  },
  {
    id: 'carpentry_measure', name: 'Carpentry Measurement', name_zh: '木工柜体测量',
    trade: 'Carpentry', baseDays: 2, deps: ['painting1'],
    prepChecklist: [
      { icon: '📐', text: 'Cabinet design finalized', text_zh: '柜体设计定稿', type: 'check' },
      { icon: '📋', text: 'Hardware selections confirmed', text_zh: '五金配件确认', type: 'info' },
    ],
    subItems: [
      { name: 'Kitchen cabinet measurement', name_zh: '厨柜测量' },
      { name: 'Wardrobe measurement', name_zh: '衣柜测量' },
      { name: 'TV console & shoe cabinet', name_zh: '电视柜及鞋柜' },
    ],
  },
  {
    id: 'carpentry_mfg', name: 'Carpentry Manufacturing', name_zh: '木工柜体',
    hint_MY: 'Factory lead time 4–6 weeks. Confirm final dimensions after painting primer — walls may shift by 3–5mm. Place order ASAP to avoid timeline delays.',
    hint_SG: 'HDB/condo: check if carpentry height exceeds 2.4m (permit needed). Factory lead time 3–5 weeks. Confirm all shop drawings with client before production.',
    hint_zh: '工厂生产周期约4-6周，需尽早下单。下单前必须拿到批灰后的实测尺寸，因为墙面可能有误差。',
    trade: 'Carpentry', baseDays: 28, deps: ['carpentry_measure'],
    parallel: ['electrical2'],
    prepChecklist: [
      { icon: '🏭', text: 'Factory production ~4-6 weeks', text_zh: '工厂生产约4-6周', type: 'info' },
      { icon: '📋', text: 'Final drawings approved', text_zh: '最终图纸确认', type: 'check' },
      { icon: '🪵', text: 'Material (laminate/veneer) confirmed', text_zh: '材料(面板/贴皮)确认', type: 'order' },
    ],
    subItems: [
      { name: 'CNC cutting & edge banding', name_zh: 'CNC切割及封边' },
      { name: 'Assembly & QC', name_zh: '组装及质检' },
      { name: 'Delivery scheduling', name_zh: '安排送货' },
    ],
  },
  {
    id: 'electrical2', name: 'Electrical Phase 2 — Switches & Sockets', name_zh: '开关插座安装',
    trade: 'Electrical', baseDays: 3, deps: ['painting1'],
    parallel: ['carpentry_mfg'],
    prepChecklist: [
      { icon: '🔌', text: 'Switch/socket brand & model confirmed', text_zh: '开关插座品牌型号确认', type: 'check' },
      { icon: '📦', text: 'Switches & sockets delivered', text_zh: '开关插座已到货', type: 'order' },
    ],
    subItems: [
      { name: 'Socket plate installation', name_zh: '插座面板安装' },
      { name: 'Switch plate installation', name_zh: '开关面板安装' },
      { name: 'Testing & labeling', name_zh: '测试及标记' },
    ],
  },
  {
    id: 'door_window', name: 'Door & Window Installation', name_zh: '门框/窗框安装',
    trade: 'Carpentry', baseDays: 3, deps: ['electrical2'],
    prepChecklist: [
      { icon: '🚪', text: 'Doors & windows delivered', text_zh: '门窗已到货', type: 'order' },
      { icon: '📐', text: 'Openings checked & level', text_zh: '开口尺寸及水平确认', type: 'check' },
    ],
    subItems: [
      { name: 'Door frame & leaf installation', name_zh: '门框及门扇安装' },
      { name: 'Window grille / sliding door', name_zh: '窗花/推拉门' },
      { name: 'Hardware (handles, locks)', name_zh: '五金件(把手/锁)' },
    ],
  },
  {
    id: 'carpentry_install', name: 'Carpentry Installation', name_zh: '木工柜体安装',
    trade: 'Carpentry', baseDays: 7, deps: ['carpentry_mfg', 'door_window'],
    prepChecklist: [
      { icon: '🔧', text: 'All cabinets delivered & inspected', text_zh: '所有柜体已送达并检查', type: 'check' },
      { icon: '⚠️', text: 'Protect finished floor tiles', text_zh: '保护已铺地砖', type: 'warn' },
    ],
    subItems: [
      { name: 'Kitchen cabinets', name_zh: '厨柜安装' },
      { name: 'Wardrobes', name_zh: '衣柜安装' },
      { name: 'TV console / shoe cabinet', name_zh: '电视柜/鞋柜安装' },
      { name: 'Countertop installation', name_zh: '台面安装' },
    ],
  },
  {
    id: 'electrical3', name: 'Lighting & Fixture Installation', name_zh: '灯具 & 洁具安装',
    trade: 'Electrical', baseDays: 3, deps: ['carpentry_install'],
    scaleBy: 'points', scaleFactor: 1 / 8,
    prepChecklist: [
      { icon: '💡', text: 'All light fixtures delivered', text_zh: '所有灯具已到货', type: 'order' },
      { icon: '📋', text: 'Fixture positions match ceiling cutouts', text_zh: '灯具位置与吊顶开孔对应', type: 'check' },
    ],
    subItems: [
      { name: 'Downlight installation', name_zh: '筒灯安装' },
      { name: 'Pendant & chandelier', name_zh: '吊灯安装' },
      { name: 'Under-cabinet lighting', name_zh: '柜底灯' },
      { name: 'Testing all circuits', name_zh: '全线路测试' },
    ],
  },
  {
    id: 'plumbing2', name: 'Plumbing Fixtures', name_zh: '卫浴洁具安装',
    trade: 'Plumbing', baseDays: 3, deps: ['carpentry_install'],
    parallel: ['electrical3'],
    prepChecklist: [
      { icon: '🚿', text: 'Sanitary ware items delivered', text_zh: '卫浴洁具已到货', type: 'order' },
      { icon: '📐', text: 'Mixer/tap models confirmed', text_zh: '水龙头型号确认', type: 'check' },
    ],
    subItems: [
      { name: 'Basin & tap installation', name_zh: '面盆及水龙头' },
      { name: 'WC & bidet', name_zh: '马桶及净身器' },
      { name: 'Shower set & rain shower', name_zh: '花洒及淋浴套装' },
      { name: 'Kitchen sink & tap', name_zh: '厨房水槽及龙头' },
    ],
  },
  {
    id: 'painting2', name: 'Painting Phase 2 — Topcoat', name_zh: '面漆工程',
    trade: 'Painting', baseDays: 4, deps: ['electrical3', 'plumbing2'],
    scaleBy: 'sqft', scaleFactor: 1 / 250,
    prepChecklist: [
      { icon: '🎨', text: 'Final touch-up color code ready', text_zh: '补漆色号准备', type: 'check' },
      { icon: '⚠️', text: 'Protect cabinets & fixtures from paint', text_zh: '保护柜体及洁具', type: 'warn' },
    ],
    subItems: [
      { name: 'Touch-up & patch', name_zh: '补灰及修补' },
      { name: 'Wall topcoat (2 coats)', name_zh: '墙面面漆(2道)' },
      { name: 'Ceiling topcoat', name_zh: '天花面漆' },
    ],
  },
  {
    id: 'cleaning', name: 'Final Cleaning', name_zh: '清洁收尾',
    trade: 'Cleaning', baseDays: 2, deps: ['painting2'],
    prepChecklist: [
      { icon: '🧹', text: 'Book professional cleaning team', text_zh: '预约专业清洁团队', type: 'order' },
    ],
    subItems: [
      { name: 'Dust & debris removal', name_zh: '除尘清渣' },
      { name: 'Floor polishing', name_zh: '地面抛光' },
      { name: 'Window & glass cleaning', name_zh: '窗户及玻璃清洁' },
    ],
  },
  {
    id: 'curtains', name: 'Curtain & Blinds', name_zh: '窗帘安装',
    trade: 'Cleaning', baseDays: 1, deps: ['cleaning'],
    parallel: ['delivery'],
    prepChecklist: [
      { icon: '🪟', text: 'Curtains delivered & inspected', text_zh: '窗帘已到货并检查', type: 'check' },
    ],
    subItems: [
      { name: 'Curtain track/rod installation', name_zh: '窗帘轨道/杆安装' },
      { name: 'Curtain hanging', name_zh: '窗帘挂设' },
    ],
  },
  {
    id: 'delivery', name: 'Appliance & Furniture Delivery', name_zh: '电器家具交付',
    trade: 'Measurement', baseDays: 2, deps: ['cleaning'],
    parallel: ['curtains'],
    prepChecklist: [
      { icon: '📦', text: 'Coordinate delivery time slots', text_zh: '协调送货时段', type: 'order' },
      { icon: '🛗', text: 'Lift booking (if condo)', text_zh: '预订电梯(公寓)', type: 'info' },
    ],
    subItems: [
      { name: 'Appliance delivery & hookup', name_zh: '电器送货及接驳' },
      { name: 'Furniture placement', name_zh: '家具就位' },
    ],
  },
  {
    id: 'handover', name: 'Handover & Defect Check', name_zh: '移交验收',
    trade: 'Handover', baseDays: 1, deps: ['curtains', 'delivery'],
    prepChecklist: [
      { icon: '📋', text: 'Prepare defect checklist', text_zh: '准备缺陷清单', type: 'check' },
      { icon: '📸', text: 'Take completion photos', text_zh: '拍摄竣工照片', type: 'info' },
      { icon: '🔑', text: 'Prepare keys & documents', text_zh: '准备钥匙及文件', type: 'check' },
    ],
    subItems: [
      { name: 'Walk-through inspection', name_zh: '现场验收' },
      { name: 'Defect list sign-off', name_zh: '缺陷清单签署' },
      { name: 'Key handover', name_zh: '钥匙移交' },
    ],
  },
];

const TRADE_COLORS: Record<string, string> = {
  Measurement:       '#94a3b8',
  Demolition:        '#f87171',
  Construction:      '#f59e0b',
  'M&E':             '#fb923c',
  Electrical:        '#f97316',
  Plumbing:          '#3b82f6',
  Waterproofing:     '#fbbf24',
  Tiling:            '#34d399',
  Flooring:          '#2dd4bf',
  'False Ceiling':   '#4ade80',
  Painting:          '#a78bfa',
  Carpentry:         '#60a5fa',
  'Doors & Windows': '#f472b6',
  Fixtures:          '#c084fc',
  Glass:             '#67e8f9',
  'Glass Work':      '#67e8f9',
  Aluminium:         '#a3e635',
  'Aluminium Work':  '#a3e635',
  AC:                '#38bdf8',
  'Air Conditioning':'#38bdf8',
  Stone:             '#d4b483',
  'Stone Work':      '#d4b483',
  Marble:            '#e2c9a0',
  'Metal Work':      '#9ca3af',
  Ironwork:          '#9ca3af',
  'Metal Work/Ironwork': '#9ca3af',
  'Alarm & CCTV':    '#f43f5e',
  CCTV:              '#f43f5e',
  Landscaping:       '#86efac',
  Landscape:         '#86efac',
  'Smart Home':      '#818cf8',
  Solar:             '#fde68a',
  Pool:              '#7dd3fc',
  Signage:           '#fdba74',
  Furniture:         '#c4b5fd',
  Curtain:           '#fca5a5',
  Cleaning:          '#94a3b8',
  Handover:          '#22c55e',
};

function nextWorkday(
  date: Date,
  region: 'MY' | 'SG' = 'MY',
  workOnSaturday = false,
  workOnSunday = false,
): Date {
  let d = addDays(date, 1);
  while (!isWorkday(d, region, workOnSaturday, workOnSunday)) {
    d = addDays(d, 1);
  }
  return d;
}

export function addWorkdays(
  startDate: Date,
  workdays: number,
  region: 'MY' | 'SG' = 'MY',
  workOnSaturday = false,
  workOnSunday = false,
): Date {
  let d = new Date(startDate);
  let count = 0;
  while (count < workdays) {
    d = addDays(d, 1);
    if (isWorkday(d, region, workOnSaturday, workOnSunday)) {
      count++;
    }
  }
  return d;
}

export type ProjectType = 'residential' | 'condo' | 'landed' | 'commercial' | 'mall';

const PROJECT_TYPE_MULTIPLIERS: Record<ProjectType, number> = {
  residential: 1.0,
  condo: 0.85,
  landed: 1.2,
  commercial: 1.5,
  mall: 2.0,
};

function calculateDuration(phase: ConstructionPhase, sqft: number, typeMultiplier: number): number {
  let days = phase.baseDays;

  if (phase.scaleBy === 'sqft' && phase.scaleFactor && sqft > 0) {
    days = Math.max(phase.baseDays, Math.ceil(sqft * phase.scaleFactor));
  }

  // Apply project type multiplier
  days = Math.max(1, Math.round(days * typeMultiplier));

  // Carpentry manufacturing has special bounds
  if (phase.id === 'carpentry_mfg') {
    days = Math.max(21, Math.min(42, days));
  }

  return days;
}

// ─── Core scheduling engine (shared by all generators) ───────────────────────
function _schedulePhases(
  projectId: string,
  phases: ConstructionPhase[],
  startDate: Date,
  sqft: number,
  typeMultiplier: number,
  region: 'MY' | 'SG',
  workOnSaturday: boolean,
  workOnSunday: boolean,
): GanttTask[] {
  const tasks: GanttTask[] = [];
  const taskEndDates: Record<string, Date> = {};

  let initialDate = new Date(startDate);
  while (!isWorkday(initialDate, region, workOnSaturday, workOnSunday)) {
    initialDate = addDays(initialDate, 1);
  }

  for (const phase of phases) {
    const duration = calculateDuration(phase, sqft, typeMultiplier);

    let taskStart: Date;
    if (phase.deps.length === 0) {
      taskStart = new Date(initialDate);
    } else {
      const depEnds = phase.deps
        .map(depId => taskEndDates[depId])
        .filter(Boolean);
      if (depEnds.length > 0) {
        const latestDepEnd = new Date(Math.max(...depEnds.map(d => d.getTime())));
        taskStart = nextWorkday(latestDepEnd, region, workOnSaturday, workOnSunday);
      } else {
        taskStart = new Date(initialDate);
      }
    }

    if (phase.parallel && phase.parallel.length > 0) {
      for (const parallelId of phase.parallel) {
        const parallelTask = tasks.find(t => t.id === `${projectId}-${parallelId}`);
        if (parallelTask) {
          const parallelStart = new Date(parallelTask.start_date);
          if (parallelStart < taskStart) taskStart = parallelStart;
        }
      }
    }

    const taskEnd = addWorkdays(taskStart, duration - 1, region, workOnSaturday, workOnSunday);
    taskEndDates[phase.id] = taskEnd;

    const subtasks: GanttSubtask[] = phase.subItems.map((sub, idx) => ({
      id: `${phase.id}-sub-${idx}`,
      name: sub.name,
      name_zh: sub.name_zh,
      completed: false,
    }));

    tasks.push({
      id: `${projectId}-${phase.id}`,
      project_id: projectId,
      name: phase.name,
      name_zh: phase.name_zh,
      trade: phase.trade,
      start_date: format(taskStart, 'yyyy-MM-dd'),
      end_date: format(taskEnd, 'yyyy-MM-dd'),
      duration,
      progress: 0,
      dependencies: phase.deps.map(d => `${projectId}-${d}`),
      color: TRADE_COLORS[phase.trade] || '#94A3B8',
      is_critical: ['demolition', 'tiling', 'carpentry_mfg', 'carpentry_install', 'handover'].includes(phase.id),
      subtasks,
      assigned_workers: [],
    });
  }

  return tasks;
}

export function generateGanttTasks(
  projectId: string,
  startDate: Date,
  sqft: number = 1000,
  hasDemolition: boolean = true,
  projectType: ProjectType = 'residential',
  region: 'MY' | 'SG' = 'MY',
  workOnSaturday = false,
  workOnSunday = false,
): GanttTask[] {
  const typeMultiplier = PROJECT_TYPE_MULTIPLIERS[projectType] || 1.0;
  const phases = CONSTRUCTION_PHASES.filter(p => {
    if (!hasDemolition && p.id === 'demolition') return false;
    if (!hasDemolition && p.id === 'masonry') return false;
    return true;
  });
  return _schedulePhases(projectId, phases, startDate, sqft, typeMultiplier, region, workOnSaturday, workOnSunday);
}

// ─── Phase → required tradeScope keys (empty = always include) ───────────────
const PHASE_TRADE_REQUIRED: Record<string, string[]> = {
  measurement:       [],
  design_conf:       [],
  demolition:        ['demolition'],
  masonry:           ['demolition', 'masonry'],
  electrical1:       ['electrical'],
  plumbing1:         ['plumbing'],
  waterproofing:     ['waterproofing', 'tiling'],
  tiling:            ['tiling', 'flooring'],
  ceiling:           ['falseCeiling'],
  painting1:         ['painting'],
  carpentry_measure: ['carpentry'],
  carpentry_mfg:     ['carpentry'],
  electrical2:       ['electrical'],
  door_window:       ['aluminium'],
  carpentry_install: ['carpentry'],
  electrical3:       ['electrical'],
  plumbing2:         ['plumbing'],
  painting2:         ['painting'],
  cleaning:          [],
  curtains:          [],
  delivery:          [],
  handover:          [],
};

// ─── AI-enhanced Gantt: uses Claude-extracted trade durations ─────────────────
export function generateGanttFromAIParams(
  projectId: string,
  params: GanttParams,
  startDate: Date,
  region: 'MY' | 'SG' = 'MY',
  workOnSaturday = false,
  workOnSunday = false,
): GanttTask[] {
  const ts = params.tradeScope || {};

  // Map phase IDs → AI-estimated durations
  const overrides: Record<string, number> = {};

  if (ts.demolition?.estimatedDays)   overrides['demolition']       = ts.demolition.estimatedDays;
  if (ts.masonry?.estimatedDays)      overrides['masonry']          = ts.masonry.estimatedDays;
  if (ts.tiling?.estimatedDays)       overrides['tiling']           = ts.tiling.estimatedDays;
  if (ts.waterproofing?.estimatedDays) overrides['waterproofing']   = ts.waterproofing.estimatedDays;
  if (ts.falseCeiling?.estimatedDays) overrides['ceiling']          = ts.falseCeiling.estimatedDays;
  if (ts.flooring?.estimatedDays)     overrides['tiling']           = Math.max(overrides['tiling'] || 0, ts.flooring.estimatedDays);

  if (ts.electrical?.estimatedDays) {
    const e = ts.electrical.estimatedDays;
    overrides['electrical1'] = Math.max(3, Math.ceil(e * 0.60));
    overrides['electrical2'] = Math.max(2, Math.ceil(e * 0.20));
    overrides['electrical3'] = Math.max(2, Math.ceil(e * 0.20));
  }
  if (ts.plumbing?.estimatedDays) {
    const p = ts.plumbing.estimatedDays;
    overrides['plumbing1'] = Math.max(2, Math.ceil(p * 0.60));
    overrides['plumbing2'] = Math.max(2, Math.ceil(p * 0.40));
  }
  if (ts.painting?.estimatedDays) {
    const p = ts.painting.estimatedDays;
    overrides['painting1'] = Math.max(3, Math.ceil(p * 0.55));
    overrides['painting2'] = Math.max(2, Math.ceil(p * 0.45));
  }
  if (ts.carpentry?.estimatedDays) {
    overrides['carpentry_mfg'] = Math.max(21, Math.min(42, ts.carpentry.estimatedDays));
    overrides['carpentry_install'] = ts.carpentry.ft
      ? Math.max(4, Math.ceil(ts.carpentry.ft / 6))
      : 7;
  }
  if (ts.aluminium?.estimatedDays) {
    overrides['door_window'] = ts.aluminium.estimatedDays;
  }

  // ── Filter phases: only include those whose trade exists in tradeScope ───────
  const hasTradeKey = (required: string[]) =>
    required.length === 0 || required.some(k => ts[k as keyof typeof ts] != null);

  const includedIds = new Set(
    CONSTRUCTION_PHASES
      .filter(p => {
        if (!params.hasDemolition && (p.id === 'demolition' || p.id === 'masonry')) return false;
        return hasTradeKey(PHASE_TRADE_REQUIRED[p.id] ?? []);
      })
      .map(p => p.id),
  );

  // ── Remap deps: walk through removed phases to find nearest included ancestor ─
  function resolveDepChain(depId: string, seen = new Set<string>()): string[] {
    if (seen.has(depId)) return [];
    seen.add(depId);
    if (includedIds.has(depId)) return [depId];
    const removed = CONSTRUCTION_PHASES.find(p => p.id === depId);
    if (!removed) return [];
    return removed.deps.flatMap(d => resolveDepChain(d, new Set(seen)));
  }

  // ── Phase ID → primary trade key (for taskName lookup) ──────────────────────
  const PHASE_PRIMARY_TRADE: Record<string, keyof typeof ts> = {
    demolition:        'demolition',
    masonry:           'masonry',
    electrical1:       'electrical',
    electrical2:       'electrical',
    electrical3:       'electrical',
    plumbing1:         'plumbing',
    plumbing2:         'plumbing',
    waterproofing:     'waterproofing',
    tiling:            'tiling',
    ceiling:           'falseCeiling',
    painting1:         'painting',
    painting2:         'painting',
    carpentry_measure: 'carpentry',
    carpentry_mfg:     'carpentry',
    carpentry_install: 'carpentry',
    door_window:       'aluminium',
  };

  const phases: ConstructionPhase[] = CONSTRUCTION_PHASES
    .filter(p => includedIds.has(p.id))
    .map(p => {
      const remappedDeps = [...new Set(p.deps.flatMap(d => resolveDepChain(d)))];
      // Apply quotation-specific task name from AI tradeScope
      const tradeKey = PHASE_PRIMARY_TRADE[p.id];
      const tradeData = tradeKey ? ts[tradeKey] : undefined;
      const customName = tradeData?.taskName;
      const customNameZh = tradeData?.taskName_zh;
      if (overrides[p.id] !== undefined) {
        return {
          ...p, deps: remappedDeps, baseDays: overrides[p.id], scaleBy: undefined, scaleFactor: undefined,
          name: customName || p.name,
          name_zh: customNameZh || p.name_zh,
        };
      }
      return {
        ...p, deps: remappedDeps,
        name: customName || p.name,
        name_zh: customNameZh || p.name_zh,
      };
    });

  // ── Append customPhases from AI (non-standard trades: glass, landscape, CCTV, etc.) ──
  const customPhaseTradesSeen = new Set<string>();
  if (params.customPhases?.length) {
    for (const cp of params.customPhases) {
      if (!cp.name) continue;
      customPhaseTradesSeen.add((cp.trade || '').toLowerCase());
      const insertIdx = phases.findIndex(p => p.id === cp.insertAfter);
      const newPhase: ConstructionPhase = {
        id: `custom_${cp.name.replace(/\s+/g, '_').toLowerCase()}`,
        name: cp.name,
        name_zh: cp.name_zh || cp.name,
        trade: cp.trade,
        baseDays: cp.estimatedDays || 3,
        deps: cp.insertAfter && includedIds.has(cp.insertAfter) ? [cp.insertAfter] : [],
        prepChecklist: [],
        subItems: [],
      };
      if (insertIdx >= 0) {
        phases.splice(insertIdx + 1, 0, newPhase);
      } else {
        phases.push(newPhase);
      }
    }
  }

  // ── Auto-create phases for detectedCategories not yet covered ────────────────
  // Maps category keywords → standard tradeScope key (already handled above)
  const standardKeywords = new Set([
    'demolition','hacking','masonry','brickwork','plastering','screed',
    'tiling','tile','ceramic','homogeneous','vinyl','timber floor','parquet','spc','flooring',
    'electrical','wiring','electrics','lighting',
    'plumbing','sanitary','piping',
    'waterproofing','membrane',
    'false ceiling','gypsum','plaster ceiling',
    'painting','paint','coating',
    'carpentry','cabinet','wardrobe','joinery',
    'aluminium','window','sliding door','grille',
    'air conditioning','aircon','hvac','daikin','midea',
  ]);
  const isStandardCategory = (cat: string) => {
    const lower = cat.toLowerCase();
    return [...standardKeywords].some(kw => lower.includes(kw));
  };

  if (params.detectedCategories?.length) {
    for (const cat of params.detectedCategories) {
      if (!cat) continue;
      const lower = cat.toLowerCase();
      // Skip if already covered by standard phases or customPhases
      if (isStandardCategory(lower)) continue;
      if (customPhaseTradesSeen.has(lower)) continue;
      // Also skip if a customPhase with same trade name was already added
      const alreadyAdded = phases.some(p => p.trade.toLowerCase() === lower);
      if (alreadyAdded) continue;

      // Create a simple phase for this non-standard category
      phases.push({
        id: `auto_${cat.replace(/\s+/g, '_').toLowerCase()}`,
        name: cat,
        name_zh: cat,
        trade: cat,
        baseDays: 3,
        deps: ['painting2'].filter(d => includedIds.has(d)),
        prepChecklist: [],
        subItems: [],
      });
    }
  }

  return _schedulePhases(projectId, phases, startDate, params.sqft || 1000, 1.0, region, workOnSaturday, workOnSunday);
}

// Export prep checklists for use in task detail panel
export function getPhaseChecklist(phaseId: string) {
  const phase = CONSTRUCTION_PHASES.find(p => p.id === phaseId);
  return phase?.prepChecklist || [];
}

export function getPhaseById(phaseId: string) {
  return CONSTRUCTION_PHASES.find(p => p.id === phaseId);
}

// ─── Smart Gantt generation from parsed quotation items ───────────────────────
export interface QuotationItemForGantt {
  name: string;
  section?: string;
  qty?: number;
  unitPrice?: number;
  total?: number;
  unit?: string;
}

/**
 * Extract construction parameters from quotation items, then build a
 * fully dependency-driven Gantt schedule that reflects the real scope.
 *
 * Detects: sqft, project type, hasDemolition, AND which trades are present
 * (so only phases with matching quotation items are included).
 */
export function generateGanttFromQuotation(
  projectId: string,
  parsedItems: QuotationItemForGantt[],
  startDate: Date,
  region: 'MY' | 'SG' = 'MY',
  workOnSaturday = false,
  workOnSunday = false,
): GanttTask[] {
  const txt = parsedItems.map(i => ((i.section || '') + ' ' + i.name).toLowerCase()).join(' ');

  // ── 1. Estimate project area (sqft) ──────────────────────────────────────
  let sqft = 0;
  for (const item of parsedItems) {
    const unit = (item.unit || '').toLowerCase().replace(/\s+/g, '');
    const isArea = unit.includes('sqft') || unit === 'sf' || unit === 'sft'
                || unit === 'sqm' || unit === 'm2' || unit === 'ft2';
    if (isArea && (item.qty || 0) > sqft) sqft = item.qty || 0;
  }
  if (sqft < 50) {
    const tilingQty = parsedItems
      .filter(i => /til|ceram|homogeneous|floor|vinyl|timber|spc|parquet/.test(
        ((i.section || '') + ' ' + i.name).toLowerCase()))
      .reduce((s, i) => s + (i.qty || 0), 0);
    sqft = tilingQty > 80 ? tilingQty : 1000;
  }
  sqft = Math.max(300, Math.min(8000, sqft));

  // ── 2. Detect project type ────────────────────────────────────────────────
  let projectType: ProjectType = 'residential';
  if (/condo|condominium|apartment|service residen/.test(txt)) projectType = 'condo';
  else if (/bungalow|semi.?d|terrace|link house|landed/.test(txt)) projectType = 'landed';
  else if (/commercial|office|retail|shophouse|mall/.test(txt)) projectType = 'commercial';

  // ── 3. Detect which trades are present → build minimal GanttParams ────────
  const tradeScope: GanttParams['tradeScope'] = {};

  // Collect sections per detected trade for specific task names
  const tradeSections: Record<string, string[]> = {};
  const addSection = (key: string, item: QuotationItemForGantt) => {
    if (!tradeSections[key]) tradeSections[key] = [];
    const sec = item.section?.replace(/^(GF|FF|G|F|1F|2F|3F)-?/i, '').trim() || '';
    if (sec && !tradeSections[key].includes(sec)) tradeSections[key].push(sec);
  };

  // Helper: join up to 3 sections into readable name
  const makeName = (key: string, suffix: string, suffixZh: string): { taskName: string; taskName_zh: string } => {
    const secs = tradeSections[key] || [];
    const label = secs.length > 0 ? secs.slice(0, 3).join(' & ') + ' ' : '';
    const label_zh = secs.length > 0 ? secs.slice(0, 3).join(' / ') + ' ' : '';
    return {
      taskName: label + suffix + (secs.length > 3 ? ' etc.' : ''),
      taskName_zh: label_zh + suffixZh + (secs.length > 3 ? '等' : ''),
    };
  };

  for (const item of parsedItems) {
    const text = ((item.section || '') + ' ' + item.name).toLowerCase();
    if (/demol|hack|break|remov|strip.?out|chipping/.test(text)) addSection('demolition', item);
    if (/brick|plaster|screed|skim|render|new wall|brickwork/.test(text)) addSection('masonry', item);
    if (/electr|wir|switch|socket|db|mcb|light|pendant|downlight|fan/.test(text)) addSection('electrical', item);
    if (/plumb|pipe|basin|wc|toilet|tap|drain|shower|sanit/.test(text)) addSection('plumbing', item);
    if (/water.?proof|membrane|ponding/.test(text)) addSection('waterproofing', item);
    if (/til|ceram|porcel|mosaic|floor tile|wall tile/.test(text)) addSection('tiling', item);
    if (/vinyl|timber floor|parquet|laminate|spc|lvt/.test(text)) addSection('flooring', item);
    if (/ceil|gypsum|partition|false|plaster ceil/.test(text)) addSection('falseCeiling', item);
    if (/paint|coat|primer|putty/.test(text)) addSection('painting', item);
    if (/carp|cabinet|wardrobe|kitchen cab|joiner|shelf/.test(text)) addSection('carpentry', item);
    if (/alumin|window|sliding door|door frame|grille/.test(text)) addSection('aluminium', item);
    if (/air.?con|aircon|daikin|midea|split unit/.test(text)) addSection('aircon', item);
  }

  if (tradeSections.demolition)   tradeScope.demolition   = { estimatedDays: 5, ...makeName('demolition', 'Demolition & Hacking', '拆除工程') };
  if (tradeSections.masonry)      tradeScope.masonry      = { estimatedDays: 5, ...makeName('masonry', 'Masonry & Plastering', '水泥建筑工程') };
  if (tradeSections.electrical)   tradeScope.electrical   = { estimatedDays: 8, ...makeName('electrical', 'Electrical Works', '电气工程') };
  if (tradeSections.plumbing)     tradeScope.plumbing     = { estimatedDays: 5, ...makeName('plumbing', 'Plumbing Works', '水管工程') };
  if (tradeSections.waterproofing) tradeScope.waterproofing = { estimatedDays: 3, ...makeName('waterproofing', 'Waterproofing', '防水工程') };
  if (tradeSections.tiling)       tradeScope.tiling       = { sqft, estimatedDays: Math.max(5, Math.ceil(sqft / 80)), ...makeName('tiling', 'Tiling Works', '铺砖工程') };
  if (tradeSections.flooring)     tradeScope.flooring     = { estimatedDays: Math.max(3, Math.ceil(sqft / 70)), ...makeName('flooring', 'Flooring Works', '地板工程') };
  if (tradeSections.falseCeiling) tradeScope.falseCeiling = { estimatedDays: 5, ...makeName('falseCeiling', 'False Ceiling', '吊顶工程') };
  if (tradeSections.painting)     tradeScope.painting     = { estimatedDays: Math.max(4, Math.ceil((sqft * 2) / 150)), ...makeName('painting', 'Painting Works', '油漆工程') };
  if (tradeSections.carpentry)    tradeScope.carpentry    = { estimatedDays: 28, ...makeName('carpentry', 'Carpentry Works', '木工柜体工程') };
  if (tradeSections.aluminium)    tradeScope.aluminium    = { estimatedDays: 3, ...makeName('aluminium', 'Aluminium & Windows', '铝窗工程') };
  if (tradeSections.aircon)       tradeScope.aircon       = { estimatedDays: 2, ...makeName('aircon', 'Aircon Installation', '空调安装') };

  // If no specific trades detected, fall back to full default schedule
  if (Object.keys(tradeScope).length === 0) {
    return generateGanttTasks(projectId, startDate, sqft, false, projectType, region, workOnSaturday, workOnSunday);
  }

  const derivedParams: GanttParams = {
    sqft,
    projectType,
    hasDemolition: !!tradeScope.demolition,
    tradeScope,
    customPhases: [],
  };

  return generateGanttFromAIParams(projectId, derivedParams, startDate, region, workOnSaturday, workOnSunday);
}

// ─── Detect construction trade from free text ──────────────────────────────
export function detectTradeForVO(text: string): string {
  const t = text.toLowerCase();
  if (/electr|wir|switch|socket|db|mcb|light|pendant|downlight/.test(t)) return 'Electrical';
  if (/plumb|pipe|basin|wc|toilet|tap|drain|shower/.test(t)) return 'Plumbing';
  if (/til|ceram|porcel|mosaic|floor tile/.test(t)) return 'Tiling';
  if (/carp|cabinet|wardrobe|kitchen|joiner|shelf/.test(t)) return 'Carpentry';
  if (/paint|coat|primer|skim|putty/.test(t)) return 'Painting';
  if (/ceil|gypsum|partition|false/.test(t)) return 'False Ceiling';
  if (/water.?proof|membrane/.test(t)) return 'Waterproofing';
  if (/demol|hack|break|removal/.test(t)) return 'Demolition';
  if (/floor|timber|vinyl|laminate|parquet/.test(t)) return 'Tiling';
  if (/glass|shower scr|mirror/.test(t)) return 'Glass';
  if (/ac|air.?con|daikin|midea/.test(t)) return 'AC';
  return 'Construction';
}

/**
 * Append a VO-derived task into the existing Gantt task list.
 * The new task is inserted before the final Handover task.
 */
export function appendVOTask(
  tasks: GanttTask[],
  voId: string,
  voDescription: string,
  voAmount: number,
  projectId: string,
  region: 'MY' | 'SG' = 'MY',
  workOnSaturday = false,
  workOnSunday = false,
): GanttTask[] {
  const trade = detectTradeForVO(voDescription);

  // Find latest end date among tasks for this trade (or last non-handover task)
  const tradeTasks = tasks.filter(t =>
    t.trade.toLowerCase() === trade.toLowerCase() && !t.id.endsWith('-handover'));
  const anchorTask = tradeTasks.length > 0
    ? tradeTasks[tradeTasks.length - 1]
    : tasks.filter(t => !t.id.endsWith('-handover')).slice(-1)[0] || tasks[0];

  if (!anchorTask) return tasks;

  // Duration: rough 1 day per RM 1,500 of VO value, min 1 max 14
  const duration = Math.max(1, Math.min(14, Math.ceil(voAmount / 1500)));
  const anchorEnd = new Date(anchorTask.end_date + 'T00:00:00');
  const voStart = nextWorkday(anchorEnd, region, workOnSaturday, workOnSunday);
  const voEnd = addWorkdays(voStart, duration - 1, region, workOnSaturday, workOnSunday);

  const voTask: GanttTask = {
    id: `${projectId}-vo-${voId}`,
    project_id: projectId,
    name: `VO: ${voDescription}`,
    name_zh: `变更单: ${voDescription}`,
    trade,
    start_date: format(voStart, 'yyyy-MM-dd'),
    end_date: format(voEnd, 'yyyy-MM-dd'),
    duration,
    progress: 0,
    dependencies: [anchorTask.id],
    color: TRADE_COLORS[trade] || '#f59e0b',
    is_critical: false,
    subtasks: [{ id: `vo-${voId}-sub-0`, name: voDescription, name_zh: voDescription, completed: false }],
    assigned_workers: [],
  };

  // Insert before handover task
  const handoverIdx = tasks.findIndex(t => t.id.endsWith('-handover'));
  const result = [...tasks];
  if (handoverIdx >= 0) {
    result.splice(handoverIdx, 0, voTask);
  } else {
    result.push(voTask);
  }
  return result;
}
