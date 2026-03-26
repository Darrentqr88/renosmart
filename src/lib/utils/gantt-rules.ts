import { GanttTask, GanttSubtask, GanttParams, GanttTradeData, GanttRiskNote, PhaseGroup, SiteType, VOItem } from '@/types';
import { addDays, format, parseISO } from 'date-fns';
import { isWorkday, MY_HOLIDAYS } from './dates';

/**
 * Generate a deterministic UUID v4-format string from a seed.
 * Same seed always produces the same UUID — safe for DB UUID columns.
 */
function deterministicUUID(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  const hex = (n: number) => ((n >>> 0) * 2654435761 >>> 0).toString(16).padStart(8, '0');
  const a = hex(h), b = hex(h + 1), c = hex(h + 2), d = hex(h + 3);
  // Format: 8-4-4-4-12 (total 32 hex chars)
  return `${a}-${b.slice(0,4)}-4${c.slice(1,4)}-${(8+(parseInt(d[0],16)%4)).toString(16)}${d.slice(1,4)}-${(b.slice(4)+c.slice(4)+d.slice(4)).slice(0,12).padEnd(12,'0')}`;
}

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
  phaseGroup?: PhaseGroup; // 'design' | 'preparation' | 'construction'
  prepChecklist: { icon: string; text: string; text_zh: string; type: 'warn' | 'order' | 'check' | 'info' }[];
  subItems: { name: string; name_zh: string }[];
  sourceItems?: string[];  // quotation item names linked to this phase
  // AI contextual hint per region
  hint_MY?: string;     // Malaysia-specific hint
  hint_SG?: string;     // Singapore-specific hint
  hint_zh?: string;     // Chinese hint (shared)
  // AI-enhanced fields (populated from GanttTradeData)
  aiSubTasks?: { name: string; name_zh?: string; days: number; note?: string }[];
  aiRisks?: GanttRiskNote[];
  aiLeadTimeDays?: number;
  aiLeadTimeNote?: string;
  aiMaterialNotes?: string[];
}

export const CONSTRUCTION_PHASES: ConstructionPhase[] = [
  {
    id: 'design_conf', name: 'Design Confirmation', name_zh: '设计确认',
    trade: 'Measurement', baseDays: 3, deps: [], phaseGroup: 'design',
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
    id: 'measurement', name: 'Site Survey & Preparation', name_zh: '现场勘查 & 备料',
    trade: 'Measurement', baseDays: 1, deps: ['design_conf'], phaseGroup: 'design',
    prepChecklist: [
      { icon: '📐', text: 'Prepare measuring tools (laser/tape)', text_zh: '准备测量工具(激光/卷尺)', type: 'check' },
      { icon: '📋', text: 'Bring floor plan drawings', text_zh: '携带平面图', type: 'info' },
      { icon: '🛒', text: 'Order tiles/stone (4-8 week lead time)', text_zh: '下单：地砖/石材（交货期4-8周）', type: 'order' },
      { icon: '🛒', text: 'Order custom cabinetry (4-6 weeks production)', text_zh: '下单：定制柜体（生产约4-6周）', type: 'order' },
      { icon: '🛒', text: 'Order timber flooring (2-4 weeks)', text_zh: '下单：木地板（交货期2-4周）', type: 'order' },
      { icon: '⚠️', text: 'Submit renovation permit to building management', text_zh: '提交装修申请表给物业管理处', type: 'warn' },
    ],
    subItems: [
      { name: 'Full site measurement', name_zh: '全屋测量' },
      { name: 'Photo documentation', name_zh: '现场拍照记录' },
      { name: 'Record existing conditions', name_zh: '记录现有状况' },
    ],
  },
  {
    id: 'demolition', name: 'Demolition Works', name_zh: '拆除工程',
    trade: 'Demolition', baseDays: 5, deps: ['measurement'], phaseGroup: 'construction',
    scaleBy: 'sqft', scaleFactor: 1 / 150,
    hint_MY: 'Debris disposal in MY: coordinate with DBKL/MBPP for lorry booking. Avoid hacking load-bearing walls without S.E. approval.',
    hint_SG: 'Singapore: BCA permit required for structural hacking. Engage Licensed Builder for approved works. Notify MCST if condo.',
    hint_zh: '拆除前务必确认哪些是承重墙，并保护好非施工区域地板和家具。垃圾需提前预约车辆清运。',
    prepChecklist: [
      { icon: '⚠️', text: 'Photograph ALL existing conditions before demolition', text_zh: '拆除前全程拍摄现场存档', type: 'warn' },
      { icon: '⚠️', text: 'Close water main, electrical DB, gas valve', text_zh: '关闭水表、电表、燃气总阀', type: 'warn' },
      { icon: '⚠️', text: 'Protect non-demolition areas', text_zh: '保护非拆除区域', type: 'warn' },
      { icon: '🚚', text: 'Arrange debris disposal truck', text_zh: '安排垃圾清运车', type: 'order' },
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
    id: 'masonry', name: 'Construction Works', name_zh: '建筑工程',
    trade: 'Construction', baseDays: 5, deps: ['demolition'], phaseGroup: 'construction',
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
    scaleBy: 'sqft', scaleFactor: 1 / 600,
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
    id: 'stone_marble', name: 'Stone & Marble Works', name_zh: '石材工程',
    hint_MY: 'Natural stone requires sealing before and after installation. Marble is porous — apply impregnating sealer. Allow 3-5 days for fabrication of custom cuts.',
    hint_SG: 'Natural stone slabs must be inspected for cracks before installation. Use epoxy adhesive for heavy pieces. Seal with penetrating sealer for stain resistance.',
    hint_zh: '天然石材安装前后都需做防护处理。大理石属多孔材料，必须做渗透型防护。定制切割需3-5天加工时间。',
    trade: 'Stone', baseDays: 3, deps: ['tiling'],
    prepChecklist: [
      { icon: '🪨', text: 'Stone slabs selected & ordered', text_zh: '石材已选购订购', type: 'order' },
      { icon: '📐', text: 'Template/measurement taken', text_zh: '现场模板已测量', type: 'check' },
    ],
    subItems: [
      { name: 'Stone wall cladding', name_zh: '石材墙面' },
      { name: 'Marble/granite flooring', name_zh: '大理石/花岗岩地面' },
      { name: 'Kitchen backsplash stone', name_zh: '厨房石材背景' },
      { name: 'Feature wall stone', name_zh: '背景墙石材' },
    ],
  },
  {
    id: 'ac_piping', name: 'AC Piping & Drainage', name_zh: '空调铜管预埋',
    trade: 'Air Conditioning', baseDays: 2, deps: ['tiling'],
    hint_MY: 'AC copper piping and condensate drainage must be installed BEFORE false ceiling. Coordinate with ceiling contractor for access points.',
    hint_zh: '空调铜管和冷凝排水管必须在吊顶之前安装。与吊顶师傅协调预留检修口。',
    prepChecklist: [
      { icon: '❄️', text: 'AC brand/model confirmed', text_zh: '空调品牌型号确认', type: 'check' },
      { icon: '📐', text: 'Indoor unit positions marked', text_zh: '内机位置已标记', type: 'check' },
      { icon: '📦', text: 'Copper pipes & fittings ready', text_zh: '铜管及配件已准备', type: 'order' },
    ],
    subItems: [
      { name: 'Copper pipe routing', name_zh: '铜管走管' },
      { name: 'Condensate drain piping', name_zh: '冷凝排水管' },
      { name: 'Insulation wrapping', name_zh: '保温包扎' },
    ],
  },
  {
    id: 'ceiling', name: 'False Ceiling & Partition', name_zh: '石膏板吊顶',
    trade: 'False Ceiling', baseDays: 7, deps: ['tiling', 'ac_piping'],
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
    trade: 'Painting', baseDays: 4, deps: ['ceiling'],
    scaleBy: 'sqft', scaleFactor: 1 / 600,
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
    id: 'door_window', name: 'Doors & Windows Installation', name_zh: '门窗安装',
    trade: 'Doors & Windows', baseDays: 3, deps: ['electrical2'],
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
    id: 'glass_work', name: 'Glass Work', name_zh: '玻璃工程',
    hint_MY: 'Tempered glass requires 7-10 day lead time for custom sizes. Measure after tiling is complete for accurate dimensions.',
    hint_SG: 'Glass must comply with SS 310 for safety glazing. Tempered or laminated glass required for shower screens and balcony.',
    hint_zh: '钢化玻璃需提前7-10天定制。瓷砖铺完后再精确测量尺寸，确保安装无缝隙。淋浴房玻璃必须用钢化玻璃。',
    trade: 'Glass', baseDays: 3, deps: ['door_window'],
    prepChecklist: [
      { icon: '🪟', text: 'Glass panels ordered & measured', text_zh: '玻璃已订购及测量', type: 'order' },
      { icon: '📐', text: 'Opening dimensions confirmed after tiling', text_zh: '贴砖后开口尺寸已确认', type: 'check' },
    ],
    subItems: [
      { name: 'Shower screen installation', name_zh: '淋浴屏安装' },
      { name: 'Mirror installation', name_zh: '镜子安装' },
      { name: 'Glass panel / partition', name_zh: '玻璃隔断' },
    ],
  },
  {
    id: 'metal_work', name: 'Metal Work / Ironwork', name_zh: '铁工工程',
    hint_MY: 'Custom metalwork (gates, grilles) needs 2-3 weeks fabrication. Hot-dip galvanize for outdoor items. Powder coat finish preferred.',
    hint_SG: 'Metal railings must comply with BCA requirements. Min 1m height for balcony railings. Use stainless steel 304 for outdoor.',
    hint_zh: '定制铁艺（门、栏杆）需2-3周制作。户外铁件必须热镀锌防锈。建议粉末喷涂表面处理。',
    trade: 'Metal Work', baseDays: 3, deps: ['masonry'],
    prepChecklist: [
      { icon: '🔩', text: 'Metal work design approved', text_zh: '铁艺设计已确认', type: 'check' },
      { icon: '📦', text: 'Fabrication order placed', text_zh: '已下单制作', type: 'order' },
    ],
    subItems: [
      { name: 'Gate & grille installation', name_zh: '铁门/铁花安装' },
      { name: 'Railing & handrail', name_zh: '栏杆/扶手' },
      { name: 'Awning / canopy', name_zh: '雨棚/遮阳篷' },
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
    id: 'tabletop', name: 'Table Top / Countertop', name_zh: '台面工程',
    hint_MY: 'Quartz and solid surface need 5-7 day fabrication. Template must be taken AFTER cabinets are installed. Sink cutout position must match plumbing point.',
    hint_SG: 'Ensure countertop overhang does not exceed 300mm without support bracket. Use silicone sealant at wall junction for waterproofing.',
    hint_zh: '石英石和人造石台面需5-7天加工。必须在柜体安装完成后才能测量模板。水槽开孔位置必须与水管对应。',
    trade: 'Tabletop', baseDays: 2, deps: ['carpentry_install'],
    prepChecklist: [
      { icon: '⚠️', text: 'Template measurement AFTER carpentry installed', text_zh: '必须在柜体安装完成后才能测量模板', type: 'warn' },
      { icon: '📐', text: 'Countertop template measured', text_zh: '台面模板已测量', type: 'check' },
      { icon: '📦', text: 'Material fabricated & ready (5-7 days)', text_zh: '台面材料已加工完成（需5-7天）', type: 'order' },
      { icon: '🔧', text: 'Sink cutout matches plumbing point', text_zh: '水槽开孔与水管位置对应', type: 'check' },
    ],
    subItems: [
      { name: 'Kitchen countertop', name_zh: '厨房台面' },
      { name: 'Bathroom vanity top', name_zh: '浴室台面' },
      { name: 'Bar counter top', name_zh: '吧台台面' },
    ],
  },
  {
    id: 'electrical3', name: 'Lighting & Accessories', name_zh: '灯具配件安装',
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
    id: 'plumbing2', name: 'Sanitary Ware Installation', name_zh: '洁具安装',
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
    id: 'ac_install', name: 'AC Indoor/Outdoor Unit Installation', name_zh: '空调内外机安装',
    trade: 'Air Conditioning', baseDays: 2, deps: ['carpentry_install'],
    parallel: ['electrical3', 'plumbing2'],
    hint_MY: 'Outdoor unit must have proper ventilation clearance (min 300mm). Check condenser bracket load capacity for wall-mount units.',
    hint_zh: '室外机需保证通风间距（至少300mm）。壁挂式需检查支架承重。安装后测试制冷效果及排水。',
    prepChecklist: [
      { icon: '❄️', text: 'Indoor & outdoor units delivered', text_zh: '内外机已到货', type: 'order' },
      { icon: '🔧', text: 'Mounting brackets installed', text_zh: '安装支架已固定', type: 'check' },
    ],
    subItems: [
      { name: 'Indoor unit mounting', name_zh: '内机安装' },
      { name: 'Outdoor unit mounting', name_zh: '外机安装' },
      { name: 'Refrigerant charging & testing', name_zh: '充注冷媒及测试' },
    ],
  },
  {
    id: 'painting2', name: 'Painting Phase 2 — Topcoat', name_zh: '面漆工程',
    trade: 'Painting', baseDays: 3, deps: ['electrical3', 'plumbing2', 'ac_install'],
    scaleBy: 'sqft', scaleFactor: 1 / 1200,
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
    id: 'landscape', name: 'Landscape Works', name_zh: '景观工程',
    trade: 'Landscape', baseDays: 10, deps: ['painting2'],
    prepChecklist: [
      { icon: '🌱', text: 'Landscape design approved', text_zh: '景观设计已批准', type: 'check' },
      { icon: '📦', text: 'Plants & materials ordered', text_zh: '植物及材料已订购', type: 'order' },
      { icon: '💧', text: 'Irrigation system planned', text_zh: '灌溉系统规划', type: 'info' },
    ],
    subItems: [
      { name: 'Garden paving & hardscape', name_zh: '花园铺设及硬景观' },
      { name: 'Planting & turfing', name_zh: '种植及草坪' },
      { name: 'Fence & gate installation', name_zh: '围栏及门安装' },
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
    trade: 'Curtain', baseDays: 1, deps: ['cleaning'],
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
    trade: 'Delivery', baseDays: 2, deps: ['cleaning'],
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

/* Vibrant, visually distinct trade colors — gradient-inspired palette */
const TRADE_COLORS: Record<string, string> = {
  Measurement:       '#8B8BA8',
  Demolition:        '#EF4444',
  Construction:      '#F97316',
  'M&E':             '#F59E0B',
  Electrical:        '#F97316',
  Plumbing:          '#3B82F6',
  Waterproofing:     '#06B6D4',
  Tiling:            '#10B981',
  Flooring:          '#14B8A6',
  'False Ceiling':   '#22C55E',
  Painting:          '#8B5CF6',
  Carpentry:         '#4F8EF7',
  'Doors & Windows': '#F472B6',
  Fixtures:          '#A855F7',
  Glass:             '#06B6D4',
  'Glass Work':      '#06B6D4',
  Aluminium:         '#84CC16',
  'Aluminium Work':  '#84CC16',
  AC:                '#0EA5E9',
  'Air Conditioning':'#0EA5E9',
  Stone:             '#A8896C',
  'Stone Work':      '#A8896C',
  Marble:            '#C4A882',
  'Metal Work':      '#6B7280',
  Ironwork:          '#6B7280',
  'Metal Work/Ironwork': '#6B7280',
  'Alarm & CCTV':    '#E11D48',
  CCTV:              '#E11D48',
  Landscaping:       '#22C55E',
  Landscape:         '#22C55E',
  'Smart Home':      '#6366F1',
  Solar:             '#FBBF24',
  Pool:              '#38BDF8',
  Signage:           '#FB923C',
  Furniture:         '#A78BFA',
  Curtain:           '#F472B6',
  Cleaning:          '#8B8BA8',
  Handover:          '#22C55E',
  Preliminaries:     '#94A3B8',
  Delivery:          '#A78BFA',
  Stonework:         '#A8896C',
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

function calculateDuration(phase: ConstructionPhase, sqft: number, typeMultiplier: number, hasExtension = false): number {
  let days = phase.baseDays;

  // Masonry with extension/build work: min 20 days (14-day curing + plastering + drying)
  // Larger scope adds only marginal time since curing period is fixed
  if (phase.id === 'masonry' && hasExtension) {
    days = Math.max(20, 20 + Math.ceil(Math.max(0, sqft - 300) / 200));
    days = Math.max(1, Math.round(days * typeMultiplier));
    return days;
  }

  if (phase.scaleBy === 'sqft' && phase.scaleFactor && sqft > 0) {
    days = Math.max(phase.baseDays, Math.ceil(sqft * phase.scaleFactor));
  }

  // Apply project type multiplier
  days = Math.max(1, Math.round(days * typeMultiplier));

  // Carpentry manufacturing: factory production not affected by project type
  // Min 7 days, max 42 days (6 weeks)
  if (phase.id === 'carpentry_mfg') {
    return Math.max(7, Math.min(42, phase.baseDays));
  }

  // Cap painting phases: primer max 8 days, topcoat max 7 days
  if (phase.id === 'painting1') return Math.min(days, 8);
  if (phase.id === 'painting2') return Math.min(days, 7);
  // Cap door/window: max 5 days (count-based, not sqft)
  if (phase.id === 'door_window') return Math.min(days, 5);

  return days;
}

// Detect extension/build work from quotation item names
const EXTENSION_PATTERNS = [
  /\bextension\b/i, /\bbuild\b/i, /\bnew\s*structure/i, /\b扩建/,
  /\bnew\s*build/i, /\bstructural\s*work/i, /\brc\s*column/i,
  /\brc\s*beam/i, /\bfoundation/i, /\bfooting/i, /\bpiling/i,
  /\breinforced\s*concrete/i, /\bnew\s*room/i, /\badd(?:ition|ing)\s*room/i,
];

// ─── Site type multipliers ──────────────────────────────────────────────────
const SITE_TYPE_MULTIPLIERS: Record<string, number> = {
  residential: 1.0,
  condo: 0.85,
  apartment: 0.85,
  landed_terrace: 1.1,
  landed_semid: 1.2,
  landed_bungalow: 1.4,
  landed: 1.2,
  shop_lot: 1.1,
  commercial: 1.5,
  mall: 2.0,
  factory: 1.8,
  other: 1.0,
};

export function getSiteTypeMultiplier(siteType?: string): number {
  return SITE_TYPE_MULTIPLIERS[siteType || 'residential'] || 1.0;
}

// ─── Project type compliance reminders ──────────────────────────────────────
const SITE_TYPE_PERMITS: Record<string, { name: string; name_zh: string; items: { name: string; name_zh: string }[] }> = {
  condo: {
    name: 'Condo Permits & Compliance',
    name_zh: '公寓施工许可及合规',
    items: [
      { name: 'Apply renovation permit from Management/MCST', name_zh: '向物业管理申请装修许可' },
      { name: 'Book service lift for material delivery', name_zh: '预约货梯搬运材料' },
      { name: 'Confirm working hours restriction (Mon-Sat 9am-5pm)', name_zh: '确认施工时间限制' },
      { name: 'Submit contractor & worker details to Management', name_zh: '提交承包商及工人资料' },
      { name: 'Arrange deposit with Management', name_zh: '缴纳装修保证金' },
    ],
  },
  apartment: {
    name: 'Apartment Permits & Compliance',
    name_zh: '公寓施工许可及合规',
    items: [
      { name: 'Apply renovation permit from Management/MCST', name_zh: '向物业管理申请装修许可' },
      { name: 'Book service lift for material delivery', name_zh: '预约货梯搬运材料' },
      { name: 'Confirm working hours restriction', name_zh: '确认施工时间限制' },
    ],
  },
  landed_terrace: {
    name: 'Landed Property Permits',
    name_zh: '有地房产施工许可',
    items: [
      { name: 'Check PBT/council building permit requirement', name_zh: '确认地方政府建筑许可' },
      { name: 'Notify neighbours of renovation works', name_zh: '通知邻居施工计划' },
      { name: 'Arrange temporary hoarding/fencing', name_zh: '安排临时围挡' },
    ],
  },
  landed_semid: {
    name: 'Landed Property Permits',
    name_zh: '有地房产施工许可',
    items: [
      { name: 'Check PBT/council building permit requirement', name_zh: '确认地方政府建筑许可' },
      { name: 'Notify neighbours of renovation works', name_zh: '通知邻居施工计划' },
      { name: 'Arrange temporary hoarding/fencing', name_zh: '安排临时围挡' },
    ],
  },
  landed_bungalow: {
    name: 'Landed Property Permits',
    name_zh: '有地房产施工许可',
    items: [
      { name: 'Check PBT/council building permit for structural works', name_zh: '确认结构工程许可' },
      { name: 'Engage structural engineer if needed', name_zh: '如需聘请结构工程师' },
      { name: 'Notify neighbours & arrange hoarding', name_zh: '通知邻居及安排围挡' },
    ],
  },
  landed: {
    name: 'Landed Property Permits',
    name_zh: '有地房产施工许可',
    items: [
      { name: 'Check PBT/council building permit requirement', name_zh: '确认地方政府建筑许可' },
      { name: 'Notify neighbours of renovation works', name_zh: '通知邻居施工计划' },
    ],
  },
  commercial: {
    name: 'Commercial Permits & Compliance',
    name_zh: '商业空间施工许可',
    items: [
      { name: 'Fire safety permit (BOMBA)', name_zh: '消防安全许可' },
      { name: 'Coordinate after-hours work schedule', name_zh: '协调营业时间外施工' },
      { name: 'Install temporary partition & dust barrier', name_zh: '安装临时隔板防尘措施' },
    ],
  },
  mall: {
    name: 'Mall/Retail Permits & Compliance',
    name_zh: '商场施工许可',
    items: [
      { name: 'Mall management renovation permit', name_zh: '商场管理处施工许可' },
      { name: 'Fire safety clearance (BOMBA)', name_zh: '消防安全批文' },
      { name: 'Coordinate night works / off-peak delivery', name_zh: '协调夜间施工/非高峰送货' },
      { name: 'Temporary hoarding to approved mall spec', name_zh: '按商场规格安装临时围挡' },
    ],
  },
  factory: {
    name: 'Factory/Industrial Permits',
    name_zh: '工厂施工许可',
    items: [
      { name: 'Factory license / DOSH compliance', name_zh: '工厂许可证/DOSH合规' },
      { name: 'Structural engineer approval for structural changes', name_zh: '结构变更需工程师审批' },
      { name: 'Coordinate with ongoing factory operations', name_zh: '与工厂运营协调施工' },
    ],
  },
  shop_lot: {
    name: 'Shop Lot Permits',
    name_zh: '店铺施工许可',
    items: [
      { name: 'Check local council renovation permit', name_zh: '确认地方政府装修许可' },
      { name: 'Fire safety compliance check', name_zh: '消防合规检查' },
    ],
  },
};

function buildPermitsPhase(siteType: string): ConstructionPhase | null {
  const permits = SITE_TYPE_PERMITS[siteType];
  if (!permits) return null;
  return {
    id: 'permits_compliance',
    name: permits.name,
    name_zh: permits.name_zh,
    trade: 'Preliminaries',
    baseDays: 3,
    deps: ['design_conf'],
    phaseGroup: 'preparation',
    prepChecklist: [],
    subItems: permits.items,
  };
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
  siteType?: string,
  hasExtension = false,
): GanttTask[] {
  // Inject permits phase if siteType known and not already present
  if (siteType && !phases.some(p => p.id === 'permits_compliance')) {
    const permitsPhase = buildPermitsPhase(siteType);
    if (permitsPhase) {
      // Insert after design_conf
      const dcIdx = phases.findIndex(p => p.id === 'design_conf');
      if (dcIdx >= 0) {
        phases = [...phases];
        phases.splice(dcIdx + 1, 0, permitsPhase);
      }
    }
  }

  // Separate phases by group
  const designPhases = phases.filter(p => p.phaseGroup === 'design');
  const prepPhases = phases.filter(p => p.phaseGroup === 'preparation');
  const constructionPhases = phases.filter(p => !p.phaseGroup || p.phaseGroup === 'construction');

  const tasks: GanttTask[] = [];
  const taskEndDates: Record<string, Date> = {};
  const taskStartDates: Record<string, Date> = {};

  // Use siteType multiplier if available, otherwise use provided typeMultiplier
  const effectiveMultiplier = siteType ? getSiteTypeMultiplier(siteType) : typeMultiplier;

  // Ensure startDate is a workday
  let constructionStart = new Date(startDate);
  while (!isWorkday(constructionStart, region, workOnSaturday, workOnSunday)) {
    constructionStart = addDays(constructionStart, 1);
  }

  // ── Stage 1: Design phases — schedule BACKWARD from constructionStart ──────
  if (designPhases.length > 0) {
    // Reverse order: schedule from last to first, going backward
    const reversed = [...designPhases].reverse();
    let cursor = new Date(constructionStart);
    // Go back one workday from constructionStart
    cursor = addDays(cursor, -1);
    while (!isWorkday(cursor, region, workOnSaturday, workOnSunday)) {
      cursor = addDays(cursor, -1);
    }

    for (const phase of reversed) {
      const duration = calculateDuration(phase, sqft, effectiveMultiplier, hasExtension);
      const taskEnd = new Date(cursor);

      // Go back (duration - 1) workdays for start
      let taskStart = new Date(cursor);
      let count = 0;
      while (count < duration - 1) {
        taskStart = addDays(taskStart, -1);
        if (isWorkday(taskStart, region, workOnSaturday, workOnSunday)) count++;
      }

      taskEndDates[phase.id] = taskEnd;
      taskStartDates[phase.id] = taskStart;

      // Move cursor to day before taskStart
      cursor = addDays(taskStart, -1);
      while (!isWorkday(cursor, region, workOnSaturday, workOnSunday)) {
        cursor = addDays(cursor, -1);
      }

      // Prefer AI sub-tasks over hardcoded subItems
      const subtasks: GanttSubtask[] = phase.aiSubTasks?.length
        ? phase.aiSubTasks.map((sub, idx) => ({
            id: `${phase.id}-ai-${idx}`, name: sub.name, name_zh: sub.name_zh, completed: false,
          }))
        : phase.subItems.map((sub, idx) => ({
            id: `${phase.id}-sub-${idx}`, name: sub.name, name_zh: sub.name_zh, completed: false,
          }));

      // Prepend (will reverse later)
      tasks.unshift({
        id: deterministicUUID(`${projectId}-${phase.id}`),
        phase_id: phase.id,
        project_id: projectId,
        name: phase.name,
        name_zh: phase.name_zh,
        trade: phase.trade,
        start_date: format(taskStart, 'yyyy-MM-dd'),
        end_date: format(taskEnd, 'yyyy-MM-dd'),
        duration,
        progress: 0,
        dependencies: phase.deps.map(d => deterministicUUID(`${projectId}-${d}`)),
        color: TRADE_COLORS[phase.trade] || '#94A3B8',
        is_critical: false,
        subtasks,
        assigned_workers: [],
        sort_order: 0, // will reindex later
        phase_group: 'design',
        source_items: phase.sourceItems || [],
        risks: phase.aiRisks,
        leadTimeDays: phase.aiLeadTimeDays,
        leadTimeNote: phase.aiLeadTimeNote,
        materialNotes: phase.aiMaterialNotes,
      });
    }
  }

  // ── Stage 2: Preparation phases — forward from constructionStart ────────────
  const scheduleForward = (phasesToSchedule: ConstructionPhase[], group: PhaseGroup, startFrom: Date) => {
    for (const phase of phasesToSchedule) {
      const duration = calculateDuration(phase, sqft, effectiveMultiplier, hasExtension);

      let taskStart: Date;
      if (phase.deps.length === 0) {
        taskStart = new Date(startFrom);
      } else {
        const depEnds = phase.deps.map(depId => taskEndDates[depId]).filter(Boolean);
        if (depEnds.length > 0) {
          const latestDepEnd = new Date(Math.max(...depEnds.map(d => d.getTime())));
          taskStart = nextWorkday(latestDepEnd, region, workOnSaturday, workOnSunday);
        } else {
          taskStart = new Date(startFrom);
        }
      }

      if (phase.parallel && phase.parallel.length > 0) {
        for (const parallelId of phase.parallel) {
          const parallelTask = tasks.find(t => t.id === deterministicUUID(`${projectId}-${parallelId}`));
          if (parallelTask) {
            const parallelStart = new Date(parallelTask.start_date);
            if (parallelStart < taskStart) taskStart = parallelStart;
          }
        }
      }

      const taskEnd = addWorkdays(taskStart, duration - 1, region, workOnSaturday, workOnSunday);
      taskEndDates[phase.id] = taskEnd;
      taskStartDates[phase.id] = taskStart;

      // Prefer AI sub-tasks over hardcoded subItems
      const subtasks: GanttSubtask[] = phase.aiSubTasks?.length
        ? phase.aiSubTasks.map((sub, idx) => ({
            id: `${phase.id}-ai-${idx}`, name: sub.name, name_zh: sub.name_zh, completed: false,
          }))
        : phase.subItems.map((sub, idx) => ({
            id: `${phase.id}-sub-${idx}`, name: sub.name, name_zh: sub.name_zh, completed: false,
          }));

      tasks.push({
        id: deterministicUUID(`${projectId}-${phase.id}`),
        phase_id: phase.id,
        project_id: projectId,
        name: phase.name,
        name_zh: phase.name_zh,
        trade: phase.trade,
        start_date: format(taskStart, 'yyyy-MM-dd'),
        end_date: format(taskEnd, 'yyyy-MM-dd'),
        duration,
        progress: 0,
        dependencies: phase.deps.map(d => deterministicUUID(`${projectId}-${d}`)),
        color: TRADE_COLORS[phase.trade] || '#94A3B8',
        is_critical: ['demolition', 'tiling', 'carpentry_mfg', 'carpentry_install', 'handover'].includes(phase.id),
        subtasks,
        assigned_workers: [],
        sort_order: tasks.length,
        phase_group: group,
        source_items: phase.sourceItems || [],
        risks: phase.aiRisks,
        leadTimeDays: phase.aiLeadTimeDays,
        leadTimeNote: phase.aiLeadTimeNote,
        materialNotes: phase.aiMaterialNotes,
      });
    }
  };

  scheduleForward(prepPhases, 'preparation', constructionStart);

  // ── Stage 3: Construction phases — after preparation ends ──────────────────
  const prepEndDates = prepPhases.map(p => taskEndDates[p.id]).filter(Boolean);
  let constructionAfterPrep = constructionStart;
  if (prepEndDates.length > 0) {
    const latestPrep = new Date(Math.max(...prepEndDates.map(d => d.getTime())));
    constructionAfterPrep = nextWorkday(latestPrep, region, workOnSaturday, workOnSunday);
  }

  scheduleForward(constructionPhases, 'construction', constructionAfterPrep);

  // Reindex sort_order
  tasks.forEach((t, i) => { t.sort_order = i; });

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
  siteType?: string,
): GanttTask[] {
  const typeMultiplier = PROJECT_TYPE_MULTIPLIERS[projectType] || 1.0;
  const phases = CONSTRUCTION_PHASES.filter(p => {
    if (!hasDemolition && p.id === 'demolition') return false;
    if (!hasDemolition && p.id === 'masonry') return false;
    return true;
  });
  return _schedulePhases(projectId, phases, startDate, sqft, typeMultiplier, region, workOnSaturday, workOnSunday, siteType);
}

// ─── Phase → required tradeScope keys (empty = always include) ───────────────
const PHASE_TRADE_REQUIRED: Record<string, string[]> = {
  measurement:       [],
  design_conf:       [],
  demolition:        ['demolition'],
  masonry:           ['demolition', 'masonry', 'construction'],
  electrical1:       ['electrical'],
  plumbing1:         ['plumbing'],
  waterproofing:     ['waterproofing', 'tiling'],
  tiling:            ['tiling', 'flooring'],
  ac_piping:         ['aircon'],
  ceiling:           ['falseCeiling'],
  painting1:         ['painting'],
  carpentry_measure: ['carpentry'],
  carpentry_mfg:     ['carpentry'],
  electrical2:       ['electrical'],
  door_window:       ['aluminium'],
  carpentry_install: ['carpentry'],
  electrical3:       ['electrical'],
  plumbing2:         ['plumbing'],
  ac_install:        ['aircon'],
  painting2:         ['painting'],
  stone_marble:      ['stonework'],
  glass_work:        ['glass'],
  metal_work:        ['metalwork'],
  tabletop:          ['tabletop'],
  landscape:         ['landscape'],
  cleaning:          [],
  curtains:          ['curtain'],
  delivery:          ['delivery'],
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
  siteType?: string,
): GanttTask[] {
  const ts = params.tradeScope || {};

  // Map phase IDs → AI-estimated durations
  const overrides: Record<string, number> = {};

  if (ts.demolition?.estimatedDays)   overrides['demolition']       = ts.demolition.estimatedDays;
  if (ts.masonry?.estimatedDays)      overrides['masonry']          = ts.masonry.estimatedDays;
  if (ts.tiling?.estimatedDays)       overrides['tiling']           = ts.tiling.estimatedDays;
  // Waterproofing: enforce min 4 days (surface prep + 2-coat membrane + drying)
  if (ts.waterproofing?.estimatedDays) overrides['waterproofing']   = Math.max(4, ts.waterproofing.estimatedDays);
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
    const p = Math.min(ts.painting.estimatedDays, 15); // cap total painting to 15 days
    overrides['painting1'] = Math.min(8, Math.max(3, Math.ceil(p * 0.55)));
    overrides['painting2'] = Math.min(7, Math.max(2, Math.ceil(p * 0.45)));
  }
  if (ts.carpentry?.estimatedDays || ts.carpentry?.ft || ts.carpentry?.itemCount) {
    // itemCount from AI (new field), fallback to itemNames count, fallback to 3
    const itemCount = (ts.carpentry as { itemCount?: number }).itemCount
      ?? (ts.carpentry.itemNames || []).length
      ?? 3;
    // mfg: min 10 days, +3 per item, cap 42
    const minMfgDays = Math.min(42, Math.max(10, itemCount * 3));
    overrides['carpentry_mfg'] = Math.min(42, Math.max(minMfgDays, ts.carpentry.estimatedDays || minMfgDays));
    // install: 3-person crew, ceil(ft/8/3), min 3
    overrides['carpentry_install'] = ts.carpentry.ft
      ? Math.max(3, Math.ceil(ts.carpentry.ft / 8 / 3))
      : Math.max(3, Math.ceil(itemCount * 2 / 3));
  }
  if (ts.aluminium?.estimatedDays) {
    overrides['door_window'] = Math.min(5, Math.max(2, ts.aluminium.estimatedDays));
  }
  if (ts.aircon?.estimatedDays) {
    const a = ts.aircon.estimatedDays;
    overrides['ac_piping'] = Math.max(1, Math.ceil(a * 0.4));
    overrides['ac_install'] = Math.max(1, Math.ceil(a * 0.6));
  }
  if (ts.glass?.estimatedDays)      overrides['glass_work']   = ts.glass.estimatedDays;
  if (ts.landscape?.estimatedDays)  overrides['landscape']    = ts.landscape.estimatedDays;
  if (ts.metalwork?.estimatedDays)  overrides['metal_work']   = ts.metalwork.estimatedDays;
  if (ts.stonework?.estimatedDays || ts.stone?.estimatedDays)
    overrides['stone_marble'] = (ts.stone?.estimatedDays || ts.stonework?.estimatedDays)!;
  if (ts.tabletop?.estimatedDays)   overrides['tabletop']     = ts.tabletop.estimatedDays;
  if (ts.curtain?.estimatedDays)   overrides['curtains']   = ts.curtain.estimatedDays;
  if (ts.delivery?.estimatedDays)  overrides['delivery']   = ts.delivery.estimatedDays;

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
    ac_piping:         'aircon',
    ceiling:           'falseCeiling',
    painting1:         'painting',
    painting2:         'painting',
    carpentry_measure: 'carpentry',
    carpentry_mfg:     'carpentry',
    carpentry_install: 'carpentry',
    door_window:       'aluminium',
    ac_install:        'aircon',
    stone_marble:      'stonework',
    glass_work:        'glass',
    metal_work:        'metalwork',
    tabletop:          'tabletop',
    landscape:         'landscape',
  };

  // ── Phase-specific item filter: sub-phases only show relevant items ──────
  // Without this, ALL electrical items appear in ALL 3 electrical phases.
  const PHASE_ITEM_FILTER: Record<string, RegExp> = {
    electrical1: /\bwir(?:ing|e)\b|\bdb\b|\bmcb\b|circuit|conduit|cable|rewir/i,
    electrical2: /switch|socket|power\s*point|13a|\brelocat/i,
    electrical3: /light\s*point|downlight|pendant|\bfan\s*point|cove\s*light|lighting|ceiling\s*fan/i,
    plumbing1:   /pipe|drain|floor\s*trap|rough|relocat|extend/i,
    plumbing2:   /basin|\bwc\b|toilet|tap|shower|sanit|bidet|wash/i,
    painting1:   /primer|sealer|skim/i,
    painting2:   /paint|emulsion|putty|topcoat/i,
  };

  const phases: ConstructionPhase[] = CONSTRUCTION_PHASES
    .filter(p => includedIds.has(p.id))
    .map(p => {
      const remappedDeps = [...new Set(p.deps.flatMap(d => resolveDepChain(d)))];
      const tradeKey = PHASE_PRIMARY_TRADE[p.id];
      const tradeData = tradeKey ? ts[tradeKey] : undefined;
      const allTradeItems = tradeData?.itemNames || [];

      // Filter items to phase-specific subset (e.g. electrical1 only gets wiring items)
      const phaseFilter = PHASE_ITEM_FILTER[p.id];
      let sourceItems = allTradeItems;
      if (phaseFilter && allTradeItems.length > 0) {
        const filtered = allTradeItems.filter(name => phaseFilter.test(name));
        sourceItems = filtered.length > 0 ? filtered : allTradeItems;
      }

      // ── Inject AI-enhanced data from tradeScope ──
      const aiEnhanced: Partial<ConstructionPhase> = {};
      if (tradeData) {
        if (tradeData.subTasks?.length) aiEnhanced.aiSubTasks = tradeData.subTasks;
        if (tradeData.risks?.length) aiEnhanced.aiRisks = tradeData.risks;
        if (tradeData.leadTimeDays) aiEnhanced.aiLeadTimeDays = tradeData.leadTimeDays;
        if (tradeData.leadTimeNote) aiEnhanced.aiLeadTimeNote = tradeData.leadTimeNote;
        if (tradeData.materialNotes?.length) aiEnhanced.aiMaterialNotes = tradeData.materialNotes;
      }

      // Keep default category label names (e.g. "Demolition", "Electrical Conduit & Wiring")
      // Do NOT override with AI-specific names — those are too detailed for Gantt labels
      if (overrides[p.id] !== undefined) {
        return {
          ...p, ...aiEnhanced, deps: remappedDeps, baseDays: overrides[p.id], scaleBy: undefined, scaleFactor: undefined,
          sourceItems,
        };
      }
      return { ...p, ...aiEnhanced, deps: remappedDeps, sourceItems };
    });

  // ── Append customPhases from AI (non-standard trades: CCTV, smart home, etc.) ──
  // NOTE: glass, landscape, metalwork, stonework are now standard phases — skip them here
  const STANDARD_CUSTOM_TRADES = new Set([
    'glass', 'glass work', 'landscape', 'landscaping',
    'metal work', 'metalwork', 'ironwork', 'stone', 'stonework', 'marble', 'stone work',
    // Construction/masonry items belong to the standard masonry phase
    'construction', 'masonry', 'brickwork', 'structural', 'plastering', 'plaster', 'screed',
  ]);
  // Patterns to detect construction-related customPhase names (broader than exact Set match)
  const CONSTRUCTION_NAME_PATTERNS = /\b(construct|masonry|brickwork|rc\s|reinforc|structural|plaster(?!.*ceil)|screed|slab)\b/i;
  const customPhaseTradesSeen = new Set<string>();
  if (params.customPhases?.length) {
    for (const cp of params.customPhases) {
      if (!cp.name) continue;
      const tradeLower = (cp.trade || '').toLowerCase();
      // Skip trades now handled by standard CONSTRUCTION_PHASES
      const isConstructionRelated = STANDARD_CUSTOM_TRADES.has(tradeLower)
        || CONSTRUCTION_NAME_PATTERNS.test(cp.name)
        || CONSTRUCTION_NAME_PATTERNS.test(cp.trade || '');
      if (isConstructionRelated) {
        // Merge phase name into masonry tradeScope so it appears in Construction Works source_items
        const itemName = cp.name;
        if (ts.masonry) {
          const existing = ts.masonry.itemNames || [];
          if (!existing.includes(itemName)) {
            ts.masonry = { ...ts.masonry, itemNames: [...existing, itemName] };
          }
        } else {
          Object.assign(ts, { masonry: { itemNames: [itemName] } });
        }
        continue;
      }
      if (STANDARD_CUSTOM_TRADES.has(tradeLower)) continue;
      customPhaseTradesSeen.add(tradeLower);

      // Resolve insertAfter: if target not in included phases, walk dep chain
      let resolvedDeps: string[] = [];
      if (cp.insertAfter) {
        if (includedIds.has(cp.insertAfter)) {
          resolvedDeps = [cp.insertAfter];
        } else {
          resolvedDeps = resolveDepChain(cp.insertAfter);
        }
      }
      // Fallback: if still no deps, attach after painting2 or last included phase
      if (resolvedDeps.length === 0) {
        const fallbacks = ['painting2', 'carpentry_install', 'tiling', 'masonry'];
        for (const fb of fallbacks) {
          if (includedIds.has(fb)) { resolvedDeps = [fb]; break; }
        }
      }

      const insertIdx = resolvedDeps.length > 0
        ? phases.findIndex(p => p.id === resolvedDeps[0])
        : -1;
      const newPhase: ConstructionPhase = {
        id: `custom_${cp.name.replace(/\s+/g, '_').toLowerCase()}`,
        name: cp.name,
        name_zh: cp.name_zh || cp.name,
        trade: cp.trade,
        baseDays: cp.estimatedDays || 3,
        deps: resolvedDeps,
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
    'demolition','hacking','masonry','brickwork','plastering','screed','structural','rc','construct','construction',
    'tiling','tile','ceramic','homogeneous','vinyl','timber floor','parquet','spc','flooring',
    'electrical','wiring','electrics','lighting',
    'plumbing','sanitary','piping',
    'waterproofing','membrane',
    'false ceiling','gypsum','plaster ceiling',
    'painting','paint','coating',
    'carpentry','cabinet','wardrobe','joinery',
    'aluminium','window','sliding door','grille',
    'air conditioning','aircon','hvac','daikin','midea',
    'glass','shower screen','mirror','tempered',
    'landscape','landscaping','garden','turf','planting','fence','fencing',
    'metal work','metalwork','ironwork','stainless steel','wrought iron',
    'stone','marble','granite','quartz','countertop',
    'curtain','blind','drape',
    'delivery','appliance','furniture delivery',
    'floor protection','site protection','site preparation',
    'preliminaries','preliminary','preparation','hoarding',
    'conclusion','defect','handover','touch up','touch-up',
    'protective','mobilization','mobilisation',
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

      // Detect if this is pre-construction or post-construction work
      const isPreConstruction = /protect|hoarding|site\s*prep|preliminar|pre.?construct|mobiliz/i.test(lower);
      const isPostConstruction = /conclus|defect|touch.?up|snag|punch/i.test(lower);

      let autoDeps: string[];
      let autoPhaseGroup: PhaseGroup | undefined;
      if (isPreConstruction) {
        autoDeps = ['design_conf'].filter(d => includedIds.has(d));
        autoPhaseGroup = 'preparation';
      } else if (isPostConstruction) {
        autoDeps = ['cleaning'].filter(d => includedIds.has(d));
        autoPhaseGroup = undefined; // stays in construction group, after cleaning
      } else {
        autoDeps = ['painting2'].filter(d => includedIds.has(d));
        autoPhaseGroup = undefined;
      }

      // Create a simple phase for this non-standard category
      phases.push({
        id: `auto_${cat.replace(/\s+/g, '_').toLowerCase()}`,
        name: cat,
        name_zh: cat,
        trade: cat,
        baseDays: 3,
        deps: autoDeps,
        phaseGroup: autoPhaseGroup,
        prepChecklist: [],
        subItems: [],
      });
    }
  }

  // Detect extension/build from masonry items
  const masonryItems = ts.masonry?.itemNames || [];
  const hasExtension = masonryItems.some(name => EXTENSION_PATTERNS.some(p => p.test(name)));

  // If extension detected, ensure masonry override is at least 20 days
  if (hasExtension && overrides['masonry'] !== undefined) {
    overrides['masonry'] = Math.max(20, overrides['masonry']);
  }

  return _schedulePhases(projectId, phases, startDate, params.sqft || 1000, 1.0, region, workOnSaturday, workOnSunday, siteType || params.siteType, hasExtension);
}

// Export prep checklists for use in task detail panel
export function getPhaseChecklist(phaseId: string) {
  const phase = CONSTRUCTION_PHASES.find(p => p.id === phaseId);
  return phase?.prepChecklist || [];
}

export function getPhaseById(phaseId: string) {
  return CONSTRUCTION_PHASES.find(p => p.id === phaseId);
}

/** Fallback: find phase by task name when phase_id is missing (old data) */
export function getPhaseByName(taskName: string): typeof CONSTRUCTION_PHASES[0] | undefined {
  const lower = taskName.toLowerCase();
  return CONSTRUCTION_PHASES.find(p =>
    p.name.toLowerCase() === lower || p.name_zh === taskName
  ) || CONSTRUCTION_PHASES.find(p =>
    lower.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(lower)
  );
}

// ─── Item deduplication & floor-aware grouping ─────────────────────────────────

function extractFloor(section: string): string {
  const s = (section || '').toUpperCase().trim();
  if (/^GF\b|^GROUND/i.test(s)) return 'GF';
  if (/^FF\b|^FIRST|^1F\b/i.test(s)) return '1F';
  if (/^2F\b|^SECOND/i.test(s)) return '2F';
  if (/^3F\b|^THIRD/i.test(s)) return '3F';
  if (/^BF\b|^BASEMENT/i.test(s)) return 'BF';
  if (/^RF\b|^ROOF/i.test(s)) return 'RF';
  return 'ALL';
}

function normalizeItemName(name: string): string {
  return name
    .toLowerCase()
    .replace(/^(gf|ff|1f|2f|3f|bf|rf|g|f)[- ]*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
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
 * Deduplicate quotation items: merge items with same normalized name + same trade.
 * Items in different sections but with identical names get merged (qty/total summed).
 */
function deduplicateItems(items: QuotationItemForGantt[]): QuotationItemForGantt[] {
  const seen = new Map<string, QuotationItemForGantt>();
  for (const item of items) {
    const normName = normalizeItemName(item.name);
    const floor = extractFloor(item.section || '');
    // Key: normalized name + floor (keep different floors separate)
    const key = `${normName}|${floor}`;
    if (seen.has(key)) {
      const existing = seen.get(key)!;
      existing.qty = (existing.qty || 0) + (item.qty || 0);
      existing.total = (existing.total || 0) + (item.total || 0);
      if (!existing.section && item.section) existing.section = item.section;
    } else {
      seen.set(key, { ...item });
    }
  }
  return Array.from(seen.values());
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
  siteType?: string,
): GanttTask[] {
  // ── 0. Deduplicate items ─────────────────────────────────────────────────
  const dedupedItems = deduplicateItems(parsedItems);

  const txt = dedupedItems.map(i => ((i.section || '') + ' ' + i.name).toLowerCase()).join(' ');

  // ── 1. Estimate project area (sqft) ──────────────────────────────────────
  let sqft = 0;
  for (const item of dedupedItems) {
    const unit = (item.unit || '').toLowerCase().replace(/\s+/g, '');
    const isArea = unit.includes('sqft') || unit === 'sf' || unit === 'sft'
                || unit === 'sqm' || unit === 'm2' || unit === 'ft2';
    if (isArea && (item.qty || 0) > sqft) sqft = item.qty || 0;
  }
  if (sqft < 50) {
    const tilingQty = dedupedItems
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

  // Collect sections and item names per detected trade
  const tradeSections: Record<string, string[]> = {};
  const tradeItemNames: Record<string, string[]> = {};
  const addSection = (key: string, item: QuotationItemForGantt) => {
    if (!tradeSections[key]) tradeSections[key] = [];
    if (!tradeItemNames[key]) tradeItemNames[key] = [];
    const sec = item.section?.replace(/^(GF|FF|G|F|1F|2F|3F)-?/i, '').trim() || '';
    if (sec && !tradeSections[key].includes(sec)) tradeSections[key].push(sec);
    if (!tradeItemNames[key].includes(item.name)) tradeItemNames[key].push(item.name);
  };

  // Helper: returns generic trade label + collected item names
  // Labels are generic category names (e.g. "Demolition & Hacking"), NOT quotation-specific
  const makeName = (key: string, suffix: string, suffixZh: string): { taskName: string; taskName_zh: string; itemNames: string[] } => {
    return {
      taskName: suffix,
      taskName_zh: suffixZh,
      itemNames: tradeItemNames[key] || [],
    };
  };

  // Also track items per trade per floor for smart consolidation
  const tradeFloorItems: Record<string, Record<string, QuotationItemForGantt[]>> = {};
  const addFloorItem = (key: string, item: QuotationItemForGantt) => {
    const floor = extractFloor(item.section || '');
    if (!tradeFloorItems[key]) tradeFloorItems[key] = {};
    if (!tradeFloorItems[key][floor]) tradeFloorItems[key][floor] = [];
    tradeFloorItems[key][floor].push(item);
  };

  for (const item of dedupedItems) {
    const bestTrade = classifyItemTrade(item.section || '', item.name);

    if (bestTrade) {
      addSection(bestTrade, item);
      addFloorItem(bestTrade, item);
    }
  }

  // ── 4. Contract amount scale factor ─────────────────────────────────────
  // Larger projects take proportionally longer. Scale base durations by contract value.
  const totalAmt = dedupedItems.reduce((s, i) => s + (i.total || 0), 0);
  let amtScale = 1.0;
  if      (totalAmt > 300000) amtScale = 2.5;
  else if (totalAmt > 150000) amtScale = 1.8;
  else if (totalAmt > 80000)  amtScale = 1.4;
  else if (totalAmt > 40000)  amtScale = 1.2;
  else if (totalAmt > 20000)  amtScale = 1.1;
  const sc = (days: number) => Math.round(days * amtScale);

  if (tradeSections.demolition)    tradeScope.demolition    = { estimatedDays: sc(5), ...makeName('demolition', 'Demolition Works', '拆除工程') };
  // Extension/build detection: min 20 days for structural extension (14-day curing + plastering)
  const masonryHasExtension = (tradeItemNames.masonry || []).some(name => EXTENSION_PATTERNS.some(p => p.test(name)));
  const masonryDays = masonryHasExtension ? Math.max(20, sc(20)) : sc(5);
  if (tradeSections.masonry)       tradeScope.masonry       = { estimatedDays: masonryDays, ...makeName('masonry', 'Construction Works', '建筑工程') };
  if (tradeSections.electrical)    tradeScope.electrical    = { estimatedDays: sc(8), ...makeName('electrical', 'Electrical Works', '电气工程') };
  if (tradeSections.plumbing)      tradeScope.plumbing      = { estimatedDays: sc(5), ...makeName('plumbing', 'Plumbing Works', '水管工程') };
  // Waterproofing: surface prep + 2-coat membrane + drying (ponding test concurrent)
  if (tradeSections.waterproofing) tradeScope.waterproofing = { estimatedDays: Math.max(4, sc(Math.ceil(sqft / 150))), ...makeName('waterproofing', 'Waterproofing', '防水工程') };
  if (tradeSections.tiling)        tradeScope.tiling        = { sqft, estimatedDays: Math.max(5, sc(Math.ceil(sqft / 80))), ...makeName('tiling', 'Tiling Works', '铺砖工程') };
  if (tradeSections.flooring)      tradeScope.flooring      = { estimatedDays: Math.max(3, sc(Math.ceil(sqft / 70))), ...makeName('flooring', 'Flooring Works', '地板工程') };
  if (tradeSections.falseCeiling)  tradeScope.falseCeiling  = { estimatedDays: sc(5), ...makeName('falseCeiling', 'False Ceiling', '吊顶工程') };
  if (tradeSections.painting)      tradeScope.painting      = { estimatedDays: Math.max(4, sc(Math.ceil((sqft * 2) / 150))), ...makeName('painting', 'Painting Works', '油漆工程') };
  if (tradeSections.carpentry)     tradeScope.carpentry     = { estimatedDays: sc(28), ...makeName('carpentry', 'Carpentry Works', '木工柜体工程') };
  if (tradeSections.aluminium)     tradeScope.aluminium     = { estimatedDays: sc(3), ...makeName('aluminium', 'Doors & Windows Installation', '门窗安装') };
  if (tradeSections.aircon)        tradeScope.aircon        = { estimatedDays: sc(2), ...makeName('aircon', 'Aircon Installation', '空调安装') };
  // Standard trades
  if (tradeSections.glass)         tradeScope.glass         = { estimatedDays: sc(5), ...makeName('glass', 'Glass Work', '玻璃工程') };
  if (tradeSections.landscape)     tradeScope.landscape     = { estimatedDays: sc(10), ...makeName('landscape', 'Landscape Works', '景观工程') };
  if (tradeSections.metalwork)     tradeScope.metalwork     = { estimatedDays: sc(7), ...makeName('metalwork', 'Metal Work', '金属工程') };
  if (tradeSections.stonework)     tradeScope.stonework     = { estimatedDays: sc(5), ...makeName('stonework', 'Stone & Marble Work', '石材工程') };
  if (tradeSections.tabletop)      tradeScope.tabletop      = { estimatedDays: sc(3), ...makeName('tabletop', 'Table Top / Countertop', '台面工程') };
  if (tradeSections.curtain)       tradeScope.curtain       = { estimatedDays: 1, ...makeName('curtain', 'Curtain & Blinds', '窗帘安装') };
  if (tradeSections.delivery)      tradeScope.delivery      = { estimatedDays: 2, ...makeName('delivery', 'Appliance & Furniture Delivery', '电器家具交付') };

  // If no specific trades detected, fall back to full default schedule
  if (Object.keys(tradeScope).length === 0) {
    return generateGanttTasks(projectId, startDate, sqft, false, projectType, region, workOnSaturday, workOnSunday, siteType);
  }

  // ── 5. No floor-splitting — consolidate all floors into single trade task ──
  // The HTML demo uses one task per trade category, not per-floor splits.
  const customPhases: GanttParams['customPhases'] = [];

  // No floor-split logic needed — each trade already has one consolidated entry
  // in tradeScope with all items aggregated. This prevents duplicate tasks like
  // "Carpentry" appearing 3x for GF/FF/2F.

  const derivedParams: GanttParams = {
    sqft,
    projectType,
    hasDemolition: !!tradeScope.demolition,
    tradeScope,
    customPhases,
  };

  return generateGanttFromAIParams(projectId, derivedParams, startDate, region, workOnSaturday, workOnSunday, siteType);
}

// ─── Classify a single item into a trade key ───────────────────────────────
// Exported so GanttAutoGenerator can enrich AI ganttParams with itemNames
const TRADE_PATTERNS_SHARED: Record<string, RegExp[]> = {
  demolition:     [/\bdemol/, /\bhack(?:ing)?\b/, /\bbreak/, /strip.?out/, /chipping/, /\bremov(?:e|al)\b.*(?:wall|tile|floor|door)/, /\bdismantle/, /\btear\s*down/, /\bknock\s*down/, /\brip\s*out/, /\bcut\s*out/, /\b拆/, /\b打石/, /\b破拆/, /拆旧/, /拆除/],
  masonry:        [/\bbrick/, /brick\s*wall/, /\bplaster(?!.*ceil)/, /\bscreed/, /\brender/, /\bnew\s*wall/, /\bbrickwork/, /\brc\s/, /reinforc/, /\bconstruct/, /\bextension/, /\braise\s*floor/, /\bmasonry/, /\bfooting/, /\bbeam\b/, /\bcolumn\b/, /ground\s*beam/, /rc\s*staircase/, /rc\s*slab/, /rc\s*floor/, /rc\s*roof/, /cement\s*work/, /\bkerb\b/, /\bconceal/, /\b混凝土/, /\b砌砖/, /\b扩建/],
  waterproofing:  [/water.?proof/, /\bmembrane/, /\bponding/, /kalis\s*air/, /\b防水/, /torch.?on/],
  alarm:          [/\bcctv\b/, /\balarm\b/, /\bcamera\b/, /auto.?gate/, /\brecorder\b/, /smart\s*home/, /access\s*control/, /security\s*system/, /\bip\s*cam/, /\bintercom/],
  aircon:         [/air.?con/, /\baircon/, /\bdaikin/, /\bmidea/, /\byork\b/, /\bmitsubishi/, /split\s*unit/, /\bac\s/, /\b1\.?5\s*hp/, /\b2\s*hp/, /\b3\s*hp/, /\bhorse\s*power/, /\bcompressor/, /cassette\s*type/, /ceiling\s*type.*unit|unit.*ceiling\s*type/, /\b冷气/, /\b空调/],
  falseCeiling:   [/false\s*ceil/, /\bgypsum/, /\bpartition/, /plaster\s*ceil/, /cove\s*light/, /\bcornice/, /\bL.box\b/, /[uU].?box/, /\bbulkhead/, /false\s*wall/, /\bsiling/, /\b石膏板/],
  plumbing:       [/\bplumb/, /\bpipe\b/, /\bwc\b/, /\btoilet/, /\btap\b/, /\bdrain/, /\bshower/, /\bsanit/, /floor\s*trap/, /\bbidet/, /\binlet/, /\boutlet\s*pipe/, /\bbasin\b/, /\bfaucet/, /bi.?tap/, /water\s*heater/, /\bpaip\b/, /\bkran\b/, /pvc.*pipe/, /toilet\s*bowl/, /\b洗手盆/],
  electrical:     [/\belectr/, /\bwir(?:ing|e)\b/, /\bswitch\b/, /\bsocket\b/, /\bdb\s*box/, /\bdb\b.*(?:rewir|box)/, /\bmcb\b/, /\blight\s*point/, /\bdownlight/, /\bpendant/, /\bpower\s*point/, /\bcircuit/, /\bfan\s*point/, /\bconduit/, /\b13a\b/, /\b15a\b/, /\b20a\b/, /cable\s*tray/, /\bwifi\s*point/, /internet\s*point/, /\btel(?:ephone)?\s*point/, /tv\s*point/, /\bcctv\s*point/, /\bcat\s*5\b/, /\bcat\s*6\b/, /\bcat5\b/, /\bcat6\b/, /conceal.*wir/],
  tiling:         [/\btil(?:e[sd]?|ing)\b/, /\bceram/, /\bporcel/, /\bceramic/, /\bporcelain/, /\bmosaic/, /\bhomogeneous/, /anti.?slip/, /\bjubin/, /floor\s*tile/, /wall\s*tile/, /\d{3}.?x.?\d{3}/, /homogenous/],
  flooring:       [/\bvinyl/, /timber\s*floor/, /\bparquet/, /laminate\s*floor/, /\bspc\b/, /\blvt\b/, /engineered.*floor/, /\bcarpet\s*floor/, /\bmerbau/, /\b木地板/, /composite\s*deck/],
  painting:       [/\bpaint(?:ing)?\b/, /\bprimer/, /skim.?coat/, /\bputty/, /\bemulsion/, /\bsealer/, /\bnippon/, /\bdulux/, /\bjotun/, /texture.*paint/, /\b油漆/, /\b漆\b/, /\btopcoat/],
  carpentry:      [/\bcabinet/, /\bcarpent/, /\bwardrobe/, /\bjoiner/, /\bshelf\b|\bshelv/, /\bvanity/, /\bbasin\s*cabinet/, /base\s*cabinet/, /wall\s*cabinet/, /tall\s*cabinet/, /kitchen.*cabinet/, /\bcupboard/, /\bsolid\s*plywood/, /\bhob\b/, /\bhood\b/, /tv\s*console/, /feature\s*wall/, /built.?in/, /shoe\s*rack/, /\bisland\b/, /bar\s*counter/, /\bpanel\b.*(?:wall|cabinet)/, /mirror\s*cabinet/, /\blaminated\b/, /\bmelamine\b/, /\b衣柜/, /\b衣橱/, /\b厨房\s*(?:柜|家具)/, /\b客厅\s*(?:柜|背景)/, /\b背景墙/, /\b木工/],
  tabletop:       [/\bcountertop/, /\bcounter\s*top/, /table\s*top/, /\btabletop/, /\bsolid\s*surface/, /\bquartz\s*top/, /\bpostform/, /\bsintered/, /\bdekton/, /\bneolith/, /worktop/, /marble.*top/, /granite.*top/, /\bcorian/, /vanity\s*top/, /basin\s*top/, /kitchen\s*top/, /bar.*top/, /island.*top/],
  aluminium:      [/\balumi?n/, /\baluminum/, /\bwindow\b.*(?:frame|instal|replac)/, /sliding\s*door/, /door\s*frame/, /\bcasement/, /casement\s*door/, /bi.?fold.*door/, /folding.*door/, /fixed\s*glass.*door/, /fix(?:ed)?\s*window/, /\bupvc/, /\bwindow\s*frame/, /powder\s*coat/, /\bpcw\b/, /toilet\s*door/],
  glass:          [/\bglass\b/, /shower\s*screen/, /\bmirror\b/, /\btempered/, /glass\s*panel/, /fix(?:ed)?\s*glass(?!\s*door)/, /\b玻璃/],
  stonework:      [/\bmarble/, /\bgranite/, /\bquartz(?!\s*top)/, /\bstone\b/, /natural\s*stone/],
  metalwork:      [/metal\s*work/, /iron\s*work/, /\bwrought/, /stainless\s*steel/, /\bmetal\s*(gate|fence|railing|roof)/, /\bms\s*(gate|fence|railing)/, /mild\s*steel/, /\bgrille\b/, /\bgate\b/, /\bawning/, /metal.*roof/, /polycarbonate/, /composite\s*panel/, /pu\s*metal/, /\bdeck.*steel/, /\brailing/],
  landscape:      [/\blandscap/, /\bgarden\b/, /\bturf\b/, /\bplanting/, /\bpaving\b/, /\bfenc(?:e|ing)\b/, /\bgrassturf/, /\bdecking\b/, /\b植草/],
  curtain:        [/\bcurtain/, /\bblind\b/, /roller\s*blind/, /\bsheer/, /\bdrape/],
  delivery:       [/\bappliance/, /furniture\s*deliver/, /loose\s*furniture/],
  preliminary:    [/\bfloor\s*protect/, /\bsite\s*protect/, /\bhoarding/, /\bpreliminar/, /\bmobiliz/, /\bsite\s*prep/],
  cleaning:       [/\bclean/, /\bdefect/, /\btouch.?up/, /\bsnag/, /\bpunch\s*list/, /\bconclus/, /\bdisposal/, /remove\s*waste/, /\brubbish/, /\bdebris/],
};

/**
 * Check whether a classified trade key (from classifyItemTrade) matches a task's
 * trade name, accounting for naming aliases used across different parts of the app.
 */
export function tradeMatches(taskTrade: string, classifiedTrade: string): boolean {
  const t = taskTrade.toLowerCase();
  const c = classifiedTrade.toLowerCase();
  if (c === t) return true;
  // Alias map: task trade → accepted classified trade values
  const ALIASES: Record<string, string[]> = {
    'construction': ['masonry'],
    'masonry': ['construction'],
    'false ceiling': ['falseceil', 'falseceiling', 'ceiling'],
    'ceiling': ['falseceil', 'falseceiling', 'false ceiling'],
    'alarm & cctv': ['alarm'],
    'electrical': ['alarm'],
    'window & door': ['aluminium'],
    'aluminium': ['window & door'],
    'metal work': ['metalwork'],
    'metal work / ironwork': ['metalwork'],
    'metalwork': ['metal work'],
    'stone': ['stonework'],
    'stonework': ['stone'],
    'stone & marble works': ['stonework'],
    'glass': ['glass work'],
    'glass work': ['glass'],
    'tabletop': ['table top', 'countertop'],
    'table top / countertop': ['tabletop'],
    'tiling': ['flooring'],
    'flooring': ['tiling'],
    'landscape': ['landscape works'],
    'aircon': ['aircon', 'ac'],
    'ac': ['aircon'],
  };
  return ALIASES[t]?.includes(c) ?? false;
}

export function classifyItemTrade(section: string, name: string): string | null {
  const text = ((section || '') + ' ' + name).toLowerCase();
  let bestTrade: string | null = null;
  let bestScore = 0;
  for (const [trade, patterns] of Object.entries(TRADE_PATTERNS_SHARED)) {
    let score = 0;
    for (const p of patterns) { if (p.test(text)) score++; }
    if (score > bestScore) {
      bestScore = score;
      bestTrade = trade;
    }
  }
  // Priority: tabletop wins over stonework when both match (countertop/table top with marble/granite)
  if (bestTrade === 'stonework' && bestScore > 0) {
    let tabletopScore = 0;
    for (const p of TRADE_PATTERNS_SHARED.tabletop || []) { if (p.test(text)) tabletopScore++; }
    if (tabletopScore > 0) bestTrade = 'tabletop';
  }
  return bestTrade;
}

// ─── Detect construction trade from free text ──────────────────────────────
// Trade key → display name mapping for VO tasks
const TRADE_DISPLAY_NAMES: Record<string, string> = {
  demolition: 'Demolition', masonry: 'Construction', electrical: 'Electrical',
  plumbing: 'Plumbing', tiling: 'Tiling', flooring: 'Flooring',
  painting: 'Painting', carpentry: 'Carpentry', tabletop: 'Tabletop',
  falseCeiling: 'False Ceiling', waterproofing: 'Waterproofing',
  aluminium: 'Aluminium', glass: 'Glass', aircon: 'AC',
  stonework: 'Stone & Marble', metalwork: 'Metal Work',
  landscape: 'Landscape', curtain: 'Curtain', delivery: 'Delivery',
  alarm: 'Alarm & CCTV', preliminary: 'Preliminary', cleaning: 'Cleaning',
};

export function detectTradeForVO(text: string): string {
  const key = classifyItemTrade('', text);
  return (key && TRADE_DISPLAY_NAMES[key]) || 'Construction';
}

/**
 * Append VO-derived tasks/subtasks into the existing Gantt task list.
 *
 * Strategy per trade group in voItems:
 *  - If a matching trade task exists AND progress < 100 → append items as subtasks
 *  - Otherwise (completed or no match) → create a new "<Trade> VO" task after anchor
 *
 * Fallback (no voItems): original single-task behaviour.
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
  voItems?: VOItem[],
): GanttTask[] {
  const result: GanttTask[] = tasks.map(t => ({ ...t, subtasks: t.subtasks ? [...t.subtasks] : [] }));

  // ── Helper: classify trade from VOItem ────────────────────────────────────
  const itemTrade = (item: VOItem): string => {
    if (item.trade && TRADE_DISPLAY_NAMES[item.trade]) return item.trade;
    const key = classifyItemTrade('', item.description);
    return (key && TRADE_DISPLAY_NAMES[key]) ? key : 'general';
  };

  // ── Helper: build a new VO GanttTask for a trade group ────────────────────
  const buildVOTask = (tradeKey: string, items: VOItem[], anchorTask: GanttTask): GanttTask => {
    const tradeName = TRADE_DISPLAY_NAMES[tradeKey] || tradeKey;
    const totalAmt = items.reduce((s, i) => s + (i.total || 0), 0) || voAmount;
    const duration = Math.max(1, Math.min(14, Math.ceil(totalAmt / 1500)));
    const anchorEnd = new Date(anchorTask.end_date + 'T00:00:00');
    const voStart = nextWorkday(anchorEnd, region, workOnSaturday, workOnSunday);
    const voEnd = addWorkdays(voStart, duration - 1, region, workOnSaturday, workOnSunday);
    return {
      id: deterministicUUID(`${projectId}-vo-${voId}-${tradeKey}`),
      phase_id: `vo-${voId}-${tradeKey}`,
      project_id: projectId,
      name: `${tradeName} VO`,
      name_zh: `${tradeName} 变更`,
      trade: tradeKey,
      start_date: format(voStart, 'yyyy-MM-dd'),
      end_date: format(voEnd, 'yyyy-MM-dd'),
      duration,
      progress: 0,
      dependencies: [anchorTask.id],
      color: TRADE_COLORS[tradeKey] || '#f59e0b',
      is_critical: false,
      subtasks: items.map((item, i) => ({
        id: `vo-${voId}-${tradeKey}-${i}`,
        name: item.description,
        name_zh: item.description,
        completed: false,
      })),
      assigned_workers: [],
    };
  };

  // ── Path A: voItems provided — one new VO task per trade, inserted right after its trade task ──
  if (voItems && voItems.length > 0) {
    // Group items by trade
    const byTrade: Record<string, VOItem[]> = {};
    for (const item of voItems) {
      const key = itemTrade(item);
      if (!byTrade[key]) byTrade[key] = [];
      byTrade[key].push(item);
    }

    // Collect (anchorId, voTask) pairs — resolve anchors BEFORE any insertions to avoid shifting
    const inserts: { anchorId: string | null; voTask: GanttTask }[] = [];
    for (const [tradeKey, items] of Object.entries(byTrade)) {
      const existingTask = result.find(t =>
        t.trade.toLowerCase() === tradeKey.toLowerCase() && t.phase_id !== 'handover');
      const anchor = existingTask
        || result.filter(t => t.phase_id !== 'handover').slice(-1)[0]
        || result[0];
      if (anchor) {
        inserts.push({ anchorId: existingTask?.id ?? null, voTask: buildVOTask(tradeKey, items, anchor) });
      }
    }

    // Insert in reverse anchor-index order so earlier inserts don't shift later indices
    inserts.sort((a, b) => {
      const ia = a.anchorId ? result.findIndex(t => t.id === a.anchorId) : result.length;
      const ib = b.anchorId ? result.findIndex(t => t.id === b.anchorId) : result.length;
      return ib - ia; // descending
    });
    for (const { anchorId, voTask } of inserts) {
      const anchorIdx = anchorId ? result.findIndex(t => t.id === anchorId) : -1;
      // Insert immediately after anchor; fall back to before handover; fall back to end
      const insertIdx = anchorIdx >= 0
        ? anchorIdx + 1
        : (() => { const hi = result.findIndex(t => t.phase_id === 'handover'); return hi >= 0 ? hi : result.length; })();
      result.splice(insertIdx, 0, voTask);
    }

    return result;
  }

  // ── Path B: no items — single VO task inserted right after matching trade task ──────────────
  const trade = detectTradeForVO(voDescription);
  const anchorIdx = result.findIndex(t =>
    t.trade.toLowerCase() === trade.toLowerCase() && t.phase_id !== 'handover');
  const anchorTask = anchorIdx >= 0
    ? result[anchorIdx]
    : result.filter(t => t.phase_id !== 'handover').slice(-1)[0] || result[0];

  if (!anchorTask) return result;

  const duration = Math.max(1, Math.min(14, Math.ceil(voAmount / 1500)));
  const anchorEnd = new Date(anchorTask.end_date + 'T00:00:00');
  const voStart = nextWorkday(anchorEnd, region, workOnSaturday, workOnSunday);
  const voEnd = addWorkdays(voStart, duration - 1, region, workOnSaturday, workOnSunday);

  const voTask: GanttTask = {
    id: deterministicUUID(`${projectId}-vo-${voId}`),
    phase_id: `vo-${voId}`,
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

  // Insert immediately after the anchor trade task
  const insertIdx = anchorIdx >= 0
    ? anchorIdx + 1
    : (() => { const hi = result.findIndex(t => t.phase_id === 'handover'); return hi >= 0 ? hi : result.length; })();
  result.splice(insertIdx, 0, voTask);
  return result;
}

// ---------------------------------------------------------------------------
// Shared scheduling helpers (used by GanttAutoGenerator AND project detail page)
// ---------------------------------------------------------------------------

export function isWorkday_simple(d: Date, workSat = false, workSun = false): boolean {
  const day = d.getDay();
  if (day === 6 && !workSat) return false;
  if (day === 0 && !workSun) return false;
  return !MY_HOLIDAYS.has(format(d, 'yyyy-MM-dd'));
}

export function addWorkdays_simple(start: Date, workdays: number, workSat = false, workSun = false): Date {
  let d = new Date(start);
  let count = 0;
  while (count < workdays) {
    d = addDays(d, 1);
    if (isWorkday_simple(d, workSat, workSun)) count++;
  }
  return d;
}

export function nextWorkday_simple(d: Date, workSat = false, workSun = false): Date {
  let cursor = new Date(d);
  while (!isWorkday_simple(cursor, workSat, workSun)) {
    cursor = addDays(cursor, 1);
  }
  return cursor;
}

/**
 * Full reschedule: recalculate ALL task dates based on duration + workday rules.
 * Root tasks keep their start_date; dependents derive start from deps.
 * Used when workSat/workSun changes — compresses or expands the calendar.
 */
export function fullReschedule(tasks: GanttTask[], workSat = false, workSun = false): GanttTask[] {
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();
  for (const t of tasks) {
    if (!inDegree.has(t.id)) inDegree.set(t.id, 0);
    for (const depId of t.dependencies || []) {
      if (!adj.has(depId)) adj.set(depId, []);
      adj.get(depId)!.push(t.id);
      inDegree.set(t.id, (inDegree.get(t.id) || 0) + 1);
    }
  }
  const queue = tasks.filter(t => (inDegree.get(t.id) || 0) === 0).map(t => t.id);
  const order: string[] = [];
  let qi = 0;
  while (qi < queue.length) {
    const id = queue[qi++];
    order.push(id);
    for (const childId of adj.get(id) || []) {
      const newDeg = (inDegree.get(childId) || 0) - 1;
      inDegree.set(childId, newDeg);
      if (newDeg === 0) queue.push(childId);
    }
  }
  const orderSet = new Set(order);
  for (const t of tasks) { if (!orderSet.has(t.id)) order.push(t.id); }

  const updMap = new Map<string, GanttTask>(tasks.map(t => [t.id, t]));
  for (const taskId of order) {
    const task = updMap.get(taskId)!;
    const deps = task.dependencies || [];
    const dur = task.duration || 1;
    let taskStart: Date;
    if (deps.length === 0) {
      taskStart = nextWorkday_simple(parseISO(task.start_date), workSat, workSun);
    } else {
      let latestDepEndStr = '';
      for (const dId of deps) {
        const depTask = updMap.get(dId);
        if (depTask && depTask.end_date > latestDepEndStr) latestDepEndStr = depTask.end_date;
      }
      taskStart = latestDepEndStr
        ? nextWorkday_simple(addDays(parseISO(latestDepEndStr), 1), workSat, workSun)
        : nextWorkday_simple(parseISO(task.start_date), workSat, workSun);
    }
    const taskEnd = dur > 1 ? addWorkdays_simple(taskStart, dur - 1, workSat, workSun) : taskStart;
    updMap.set(taskId, { ...task, start_date: format(taskStart, 'yyyy-MM-dd'), end_date: format(taskEnd, 'yyyy-MM-dd') });
  }
  return tasks.map(t => updMap.get(t.id)!);
}

/**
 * Forward reschedule (BFS/topological): shift tasks FORWARD when a dependency
 * ends later than a dependent's start. Never pulls tasks backward.
 * Used after drag/resize so downstream tasks cascade correctly.
 */
export function forwardReschedule(tasks: GanttTask[], workSat = false, workSun = false, movedTaskId?: string | string[]): GanttTask[] {
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();
  for (const t of tasks) {
    if (!inDegree.has(t.id)) inDegree.set(t.id, 0);
    for (const depId of t.dependencies || []) {
      if (!adj.has(depId)) adj.set(depId, []);
      adj.get(depId)!.push(t.id);
      inDegree.set(t.id, (inDegree.get(t.id) || 0) + 1);
    }
  }
  const queue = tasks.filter(t => (inDegree.get(t.id) || 0) === 0).map(t => t.id);
  const order: string[] = [];
  let qi = 0;
  while (qi < queue.length) {
    const id = queue[qi++];
    order.push(id);
    for (const childId of adj.get(id) || []) {
      const newDeg = (inDegree.get(childId) || 0) - 1;
      inDegree.set(childId, newDeg);
      if (newDeg === 0) queue.push(childId);
    }
  }
  const orderSet = new Set(order);
  for (const t of tasks) { if (!orderSet.has(t.id)) order.push(t.id); }

  const updMap = new Map<string, GanttTask>(tasks.map(t => [t.id, t]));
  const shifted = new Set<string>(); // track which tasks moved
  // Seed with the explicitly moved task(s) so both forward AND backward cascade works
  if (movedTaskId) {
    const ids = Array.isArray(movedTaskId) ? movedTaskId : [movedTaskId];
    ids.forEach(id => shifted.add(id));
  }
  for (const taskId of order) {
    const task = updMap.get(taskId)!;
    const deps = task.dependencies || [];
    if (deps.length === 0) continue;
    // Skip explicitly moved task(s) — user's choice takes priority (allows overlap/parallel work)
    if (movedTaskId && (Array.isArray(movedTaskId) ? movedTaskId.includes(taskId) : taskId === movedTaskId)) continue;
    // Check if any dependency was shifted (cascade trigger)
    const anyDepShifted = deps.some(dId => shifted.has(dId));
    let latestDepEndStr = '';
    for (const dId of deps) {
      const depTask = updMap.get(dId);
      if (depTask && depTask.end_date > latestDepEndStr) latestDepEndStr = depTask.end_date;
    }
    if (!latestDepEndStr) continue;
    const minStart = nextWorkday_simple(addDays(parseISO(latestDepEndStr), 1), workSat, workSun);
    const minStartStr = format(minStart, 'yyyy-MM-dd');
    // Bidirectional cascade: push forward if overlapping OR pull forward if a dep was shifted
    if (task.start_date < minStartStr || anyDepShifted) {
      const newEnd = (task.duration || 1) > 1
        ? addWorkdays_simple(minStart, (task.duration || 1) - 1, workSat, workSun)
        : minStart;
      updMap.set(taskId, { ...task, start_date: minStartStr, end_date: format(newEnd, 'yyyy-MM-dd') });
      shifted.add(taskId);
    }
  }
  if (shifted.size === 0) return tasks;
  return tasks.map(t => updMap.get(t.id)!);
}
