// RenoSmart - All TypeScript Types

export type UserRole = 'designer' | 'owner' | 'worker';
export type PlanType = 'free' | 'pro' | 'elite';
export type ProjectStatus = 'pending' | 'active' | 'completed';
export type PaymentStatus = 'pending' | 'collected' | 'overdue';
export type AIItemStatus = 'ok' | 'warn' | 'flag' | 'nodata';
export type AlertLevel = 'critical' | 'warning' | 'info';
export type Language = 'EN' | 'BM' | 'ZH';
export type Region = 'MY' | 'SG';

export interface Profile {
  id: string;
  user_id: string;
  role: UserRole;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  company_address?: string;
  trades?: string[];
  plan: PlanType;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
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

export interface QuotationItem {
  no: string;
  section: string;
  name: string;
  unit: string;
  qty: number;
  unitPrice: number;
  total: number;
  unitPriceDerived: boolean;
  status: AIItemStatus;
  note?: string;
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

export interface QuotationAnalysis {
  client: QuotationClient;
  score: QuotationScore;
  summary: string;
  items: QuotationItem[];
  subtotals: QuotationSubtotal[];
  totalAmount: number;
  missing: string[];
  alerts: QuotationAlert[];
}

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
  subtasks: GanttSubtask[];
  assigned_workers: string[];
}

export interface GanttSubtask {
  id: string;
  name: string;
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

export interface VariationOrder {
  id: string;
  project_id: string;
  vo_number: string;
  description: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  approved_at?: string;
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
