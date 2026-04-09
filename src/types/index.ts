// RenoSmart - All TypeScript Types

export type UserRole = 'designer' | 'owner' | 'worker';
export type PlanType = 'free' | 'pro' | 'elite';
export type ProjectStatus = 'pending' | 'active' | 'completed';
export type PaymentStatus = 'not_due' | 'pending' | 'collected';
export type AIItemStatus = 'ok' | 'warn' | 'flag' | 'nodata';
export type AlertLevel = 'critical' | 'warning' | 'info';
export type Language = 'EN' | 'ZH';
export type Region = 'MY' | 'SG';

export interface Profile {
  id: string;
  user_id: string;
  role: UserRole;
  name: string;
  email: string;
  phone?: string;
  region?: Region;   // 'MY' | 'SG' — derived from phone prefix on registration
  company?: string;
  company_address?: string;
  trades?: string[];
  plan: PlanType;
  avatar_url?: string;
  team_id?: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  user_id: string | null;
  email: string;
  name?: string;
  avatar_url?: string;
  role: 'owner' | 'member';
  status: 'pending' | 'active' | 'removed';
}

export interface Project {
  id: string;
  designer_id: string;
  name: string;
  address: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  contract_amount: number;
  status: ProjectStatus;
  progress: number;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Quotation {
  id: string;
  project_id?: string;
  designer_id: string;
  file_name: string;
  file_url?: string;
  version: number;
  is_active: boolean;
  analysis_result?: QuotationAnalysis;
  created_at: string;
}

export type SupplyType = 'supply_install' | 'labour_only' | 'supply_only';

export interface QuotationItem {
  no: string;
  section: string;
  name: string;
  unit: string;
  qty: number;
  unitPrice: number;
  total: number;
  unitPriceDerived: boolean;
  supplyType?: SupplyType;
  status: AIItemStatus;
  note?: string;
  subcategory?: string;       // e.g., "Kitchen Cabinet", "Floor Tiles"
  materialMethod?: string;    // e.g., "Laminated", "600x600"
  estMinPrice?: number;       // AI-estimated market min price for this item
  estMaxPrice?: number;       // AI-estimated market max price for this item
  page?: number;              // Source page number from original PDF (1-based)
}

export interface QuotationSubtotal {
  label: string;
  amount: number;
}

export interface QuotationAlert {
  level: AlertLevel;
  title: string;
  desc: string;
}

export interface QuotationScore {
  total: number;
  completeness: number;
  price: number;
  logic: number;
  risk: number;
}

export interface QuotationClient {
  company: string;
  address: string;
  attention: string;
  tel: string;
  email: string | null;
  projectRef: string;
  projectName: string;
}

export interface QuotationPaymentTerm {
  label: string;
  percentage: number;
  amount: number;
  condition?: string;
}

export interface GanttTradeData {
  sqft?: number;
  points?: number;
  units?: number;
  ft?: number;
  itemCount?: number;      // number of carpentry items/cabinets (for mfg duration calc)
  estimatedDays: number;
  taskName?: string;       // quotation-specific task name, e.g. "Kitchen & Bathroom Tiling"
  taskName_zh?: string;    // Chinese task name
  itemNames?: string[];    // quotation item names linked to this trade
  // ── AI-enhanced fields ──
  subTasks?: GanttSubTask[];     // AI-generated sub-tasks with individual durations
  risks?: GanttRiskNote[];       // trade-specific risk warnings with severity
  leadTimeDays?: number;         // material procurement lead time (days before work starts)
  leadTimeNote?: string;         // why lead time is needed (e.g. "Italian marble 4-6 weeks import")
  materialNotes?: string[];      // key materials to confirm/order
}

export interface GanttSubTask {
  name: string;
  name_zh?: string;
  days: number;              // estimated duration for this sub-task
  note?: string;             // e.g. "large format tile — slower installation"
}

export interface GanttRiskNote {
  level: 'high' | 'medium' | 'low';
  text: string;
  text_zh?: string;
}

export interface GanttCustomPhase {
  name: string;
  name_zh: string;
  trade: string;
  estimatedDays: number;
  insertAfter: string; // phase id to insert after
  subTasks?: GanttSubTask[];
  risks?: GanttRiskNote[];
  leadTimeDays?: number;
  leadTimeNote?: string;
}

export interface TradeHint {
  prepItems: string[];       // pre-work reminders / 事前项目提醒
  warnings?: string[];       // trade-specific risk warnings
  quotationNotes?: string;   // summary of related quotation items
}

export type SiteType = 'residential' | 'condo' | 'apartment' | 'landed_terrace' | 'landed_semid' | 'landed_bungalow' | 'shop_lot' | 'commercial' | 'mall' | 'factory' | 'other';

export interface GanttPhaseOrderEntry {
  id: string;
  deps: string[];
  phaseGroup: 'design' | 'preparation' | 'construction';
  parallel?: string[];
  note?: string;
}

export interface GanttParams {
  sqft: number;
  projectType: 'residential' | 'condo' | 'landed' | 'commercial' | 'mall';
  siteType?: SiteType;
  hasDemolition: boolean;
  /** All trade/work categories found in this quotation (used to filter Gantt phases) */
  detectedCategories?: string[];
  tradeScope: {
    demolition?:      GanttTradeData;
    masonry?:         GanttTradeData;
    construction?:    GanttTradeData;
    tiling?:          GanttTradeData;
    electrical?:      GanttTradeData;
    plumbing?:        GanttTradeData;
    painting?:        GanttTradeData;
    carpentry?:       GanttTradeData;
    falseCeiling?:    GanttTradeData;
    waterproofing?:   GanttTradeData;
    flooring?:        GanttTradeData;
    aluminium?:       GanttTradeData;
    aircon?:          GanttTradeData;
    glass?:           GanttTradeData;
    landscape?:       GanttTradeData;
    curtain?:         GanttTradeData;
    delivery?:        GanttTradeData;
    metalwork?:       GanttTradeData;
    metalRoofing?:    GanttTradeData;
    stonework?:       GanttTradeData;
    stone?:           GanttTradeData;
    tabletop?:        GanttTradeData;
    wallpaper?:       GanttTradeData;
    alarm?:           GanttTradeData;
    kitchenAppliance?: GanttTradeData;
  };
  customPhases?: GanttCustomPhase[];
  phaseOrder?: GanttPhaseOrderEntry[];
  riskNotes?: Record<string, string>;
  tradeHints?: Record<string, TradeHint>;
}

export interface QuotationAnalysis {
  client: QuotationClient;
  score: QuotationScore;
  summary: string;
  items: QuotationItem[];
  subtotals: QuotationSubtotal[];
  totalAmount: number;
  missing: string[];
  alerts: QuotationAlert[];
  projectType?: string;
  projectSqft?: number;
  paymentTerms?: QuotationPaymentTerm[];
  ganttParams?: GanttParams;
  missingCritical?: {
    item: string;
    reason: string;
    estimatedCost: string;
    urgency: 'critical' | 'warning';
  }[];
}

export type GanttTaskStatus = 'pending' | 'confirmed' | 'completed';

export type PhaseGroup = 'design' | 'preparation' | 'construction';

export interface GanttTask {
  id: string;
  project_id: string;
  name: string;
  name_zh?: string;
  trade: string;
  start_date: string;
  end_date: string;
  duration: number;
  progress: number;
  dependencies: string[];
  color: string;
  is_critical: boolean;
  taskStatus?: GanttTaskStatus;
  subtasks: GanttSubtask[];
  assigned_workers: string[];
  sort_order?: number;
  phase_group?: PhaseGroup;
  source_items?: string[];  // quotation item names linked to this task
  quotation_items?: string[];  // quotation items for worker display
  ai_hint?: TradeHint | null; // batch-generated AI trade hint (persisted in DB)
  phase_id?: string; // original CONSTRUCTION_PHASES id (e.g. 'demolition', 'tiling')
  is_duration_locked?: boolean; // true when duration was manually set by designer/worker
  base_duration?: number; // original quotation-based calculated duration (floor for compression)
  // ── AI-enhanced fields ──
  risks?: GanttRiskNote[];       // AI-identified risks for this task
  leadTimeDays?: number;         // material lead time before work starts
  leadTimeNote?: string;         // why lead time is needed
  materialNotes?: string[];      // key materials to confirm/order
}

export interface GanttSubtask {
  id: string;
  name: string;
  name_zh?: string;
  completed: boolean;
}

export interface PaymentPhase {
  id: string;
  project_id: string;
  phase_number: number;
  label: string;
  amount: number;
  percentage: number;
  due_date?: string;
  status: PaymentStatus;
  collected_at?: string;
  notes?: string;
}

export interface VOItem {
  no?: string;
  description: string;
  qty?: number;
  unit?: string;
  unit_price?: number;
  total: number;
  trade?: string;
}

export interface VariationOrder {
  id: string;
  project_id: string;
  vo_number: string;
  description: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  approved_at?: string;
  items?: VOItem[];
  file_name?: string;
  notes?: string;
}

export interface Worker {
  id: string;
  designer_id: string;
  profile_id: string;
  name: string;
  phone: string;
  trades: string[];
  status: 'active' | 'inactive';
}

export interface SitePhoto {
  id: string;
  project_id: string;
  uploaded_by: string;
  url: string;
  thumbnail_url?: string;
  caption?: string;
  task_id?: string;
  approved: boolean;
  created_at: string;
}

export interface AIUsage {
  id: string;
  user_id: string;
  year_month: string;
  usage_count: number;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: string;
  link?: string;
}

// i18n
export interface Translations {
  nav: {
    dashboard: string;
    projects: string;
    quotation: string;
    workers: string;
    priceDb: string;
    pricing: string;
    settings: string;
  };
  status: {
    pending: string;
    active: string;
    completed: string;
  };
  aiStatus: {
    ok: string;
    warn: string;
    flag: string;
    nodata: string;
  };
  buttons: {
    upload: string;
    analyze: string;
    generateGantt: string;
    saveToProject: string;
    viewReport: string;
    shareOwner: string;
    newProject: string;
    login: string;
    register: string;
    getStarted: string;
  };
  quotation: {
    dragDrop: string;
    analyzing: string;
    extracting: string;
    done: string;
  };
}

// ============================================
// Hybrid Scoring System
// ============================================

export interface PriceComparison {
  itemIndex: number;
  itemName: string;
  quotedPrice: number;
  dbMin: number | null;
  dbMax: number | null;
  dbAvg: number | null;
  aiEstMin: number | null;
  aiEstMax: number | null;
  deviation: number | null;
  verdict: 'ok' | 'warn_high' | 'flag_high' | 'flag_low' | 'ai_estimated';
  source: 'database' | 'known_range' | 'ai_estimate' | 'ai_status';
  sampleCount: number;
  category: string;
  subcategory: string;
  materialMethod: string;
}

export interface DimensionBreakdown {
  aiScore: number;
  dataScore: number;
  blendedScore: number;
  detail: string;
}

export interface ScoreBreakdown {
  price: DimensionBreakdown;
  completeness: DimensionBreakdown;
  logic: DimensionBreakdown;
  risk: DimensionBreakdown;
  total: number;
  priceComparisons: PriceComparison[];
  dbMatchCount: number;
  aiEstimateCount: number;
  dbMatchTotal: number;
}

export const WORKER_TRADES = [
  'Plumbing',
  'Electrical',
  'Tiling',
  'False Ceiling',
  'Carpentry',
  'Painting',
  'Demolition/Hacking',
  'Glass Work',
  'Aluminium Work',
  'Metal Work/Ironwork',
  'Flooring (Timber/Vinyl)',
  'Stone/Marble',
  'Waterproofing',
  'Air Conditioning',
  'Cleaning',
  'Alarm & CCTV',
  'Landscaping',
  'Other',
] as const;

export type WorkerTrade = (typeof WORKER_TRADES)[number];

export const TRADE_COLORS: Record<string, string> = {
  Demolition: '#EF4444',
  Electrical: '#F59E0B',
  Plumbing: '#3B82F6',
  Waterproofing: '#8B5CF6',
  Tiling: '#10B981',
  'False Ceiling': '#6366F1',
  Painting: '#EC4899',
  Carpentry: '#D97706',
  Cleaning: '#14B8A6',
  Lighting: '#FBBF24',
  Measurement: '#64748B',
  Approval: '#64748B',
  Handover: '#22C55E',
};
