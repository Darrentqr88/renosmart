'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, Lock, RefreshCw, ChevronDown, ChevronRight, Info, BarChart3, List } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';

interface CostEntry {
  id: string;
  category: string;
  subcategory: string;
  material_method: string;
  item_name?: string;
  unit: string;
  region: string;
  min_cost: number;
  avg_cost: number;
  max_cost: number;
  sample_count: number;
  confidence: 'low' | 'mid' | 'high';
  updated_at: string;
}

interface CostRecord {
  id: string;
  description: string;
  category: string;
  subcategory: string;
  material_method: string;
  trade?: string;
  work_item?: string;
  supplier: string;
  receipt_date: string;
  amount: number;
  total_amount?: number;
  project_id: string | null;
  project_name?: string;
}

interface Project {
  id: string;
  name: string;
}

const CATEGORIES = [
  'All', 'Construction', 'Demolition', 'Tiling', 'Electrical', 'Plumbing', 'Painting',
  'False Ceiling', 'Carpentry', 'Tabletop', 'Waterproofing', 'Roofing', 'Aluminium', 'Glass',
  'Flooring', 'Air Conditioning', 'Metal Work', 'Landscape', 'Cleaning',
];

const CATEGORY_MAP: Record<string, string> = {
  tiling_material: 'Tiling', electrical_material: 'Electrical', plumbing_material: 'Plumbing',
  carpentry_material: 'Carpentry', paint: 'Painting', cement: 'Construction', steel: 'Metal Work',
  general_labour: 'Cleaning', waterproofing: 'Waterproofing', ceiling: 'False Ceiling',
  flooring: 'Flooring', ac: 'Air Conditioning', glass: 'Glass', aluminium: 'Aluminium',
  roofing: 'Roofing', landscape: 'Landscape', construction: 'Construction', demolition: 'Demolition',
  other: 'Other',
};

const MY_REGIONS = [
  { value: 'MY_KL', label: 'KL / Selangor' },
  { value: 'MY_JB', label: 'Johor Bahru' },
  { value: 'MY_PG', label: 'Penang' },
];
const SG_REGIONS = [{ value: 'SG', label: 'Singapore' }];

const CONFIDENCE_CONFIG = {
  low: { color: 'bg-red-50 text-red-600 border-red-200', label: '🔴 Low (<3)', icon: '🔴' },
  mid: { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', label: '🟡 Mid (3-19)', icon: '🟡' },
  high: { color: 'bg-green-50 text-green-600 border-green-200', label: '🟢 High (20+)', icon: '🟢' },
};

const DISCLAIMER = {
  EN: 'Cost data is crowdsourced from all users\' receipt uploads. Actual costs may vary by supplier, location, and market conditions.',
  ZH: '成本数据来源于所有用户上传的单据。实际成本可能因供应商、地区及市场状况而有所差异。',
};

export default function CostDatabasePage() {
  const supabase = createClient();
  const { lang, region: i18nRegion } = useI18n();

  const [currentPlan, setCurrentPlan] = useState('free');
  const [region, setRegion] = useState(i18nRegion === 'SG' ? 'SG' : 'MY_KL');
  const [activeCategory, setActiveCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'benchmarks' | 'records'>('benchmarks');

  // Benchmark data (aggregated)
  const [costData, setCostData] = useState<CostEntry[]>([]);
  const [totalDataPoints, setTotalDataPoints] = useState(0);
  const [loadingBenchmarks, setLoadingBenchmarks] = useState(true);

  // Raw records data
  const [costRecords, setCostRecords] = useState<CostRecord[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState('all');
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [expandedSubs, setExpandedSubs] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      setUserId(authUser.id);

      const { data: profile } = await supabase.from('profiles').select('plan').eq('user_id', authUser.id).single();
      if (profile) setCurrentPlan(profile.plan || 'free');

      const { data: projectData } = await supabase.from('projects').select('id, name').eq('user_id', authUser.id).order('created_at', { ascending: false });
      if (projectData) setProjects(projectData);
    })();
  }, []);

  useEffect(() => { setRegion(i18nRegion === 'SG' ? 'SG' : 'MY_KL'); }, [i18nRegion]);
  useEffect(() => { fetchBenchmarks(); }, [region, activeCategory]);

  // Fetch aggregated cost benchmarks (from cost_database table — all users' data)
  const fetchBenchmarks = async () => {
    setLoadingBenchmarks(true);
    try {
      let query = supabase
        .from('cost_database')
        .select('*')
        .eq('region', region)
        .order('category')
        .order('subcategory')
        .order('avg_cost', { ascending: false });

      if (activeCategory !== 'All') query = query.eq('category', activeCategory);

      const { data: rows } = await query;
      setCostData(rows || []);

      if (rows) {
        const subs = new Set(rows.map((r: CostEntry) => `${r.category}::${r.subcategory}`));
        setExpandedSubs(subs);
      }

      const { count } = await supabase
        .from('cost_data_points')
        .select('id', { count: 'exact', head: true })
        .eq('region', region);
      setTotalDataPoints(count || 0);
    } finally {
      setLoadingBenchmarks(false);
    }
  };

  // Fetch raw cost records (project-specific)
  const fetchRecords = async (projectId: string) => {
    if (!userId) return;
    setLoadingRecords(true);
    try {
      const { data: myProjects } = await supabase.from('projects').select('id').eq('user_id', userId);
      const projectIds = (myProjects || []).map((p: { id: string }) => p.id);

      let query = supabase.from('cost_records').select('*, projects(name)')
        .in('project_id', projectIds.length > 0 ? projectIds : ['__none__'])
        .order('receipt_date', { ascending: false });

      if (projectId !== 'all') {
        query = supabase.from('cost_records').select('*, projects(name)')
          .eq('project_id', projectId)
          .order('receipt_date', { ascending: false });
      }

      const { data } = await query;
      let records = (data || []).map((r: any) => ({
        ...r,
        subcategory: r.subcategory || 'General',
        material_method: r.material_method || 'Standard',
        project_name: r.projects?.name || '—',
      })) as CostRecord[];

      if (activeCategory !== 'All') {
        records = records.filter(r => {
          const mapped = CATEGORY_MAP[r.category] || r.category || '';
          return mapped.toLowerCase() === activeCategory.toLowerCase();
        });
      }

      setCostRecords(records);
    } finally {
      setLoadingRecords(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'records' && userId) fetchRecords(selectedProject);
  }, [viewMode, userId, selectedProject, activeCategory]);

  const groupedBenchmarks = useMemo(() => {
    const map = new Map<string, Map<string, CostEntry[]>>();
    for (const row of costData) {
      if (!map.has(row.category)) map.set(row.category, new Map());
      const catMap = map.get(row.category)!;
      if (!catMap.has(row.subcategory)) catMap.set(row.subcategory, []);
      catMap.get(row.subcategory)!.push(row);
    }
    return map;
  }, [costData]);

  const groupedRecords = useMemo(() => {
    const map = new Map<string, Map<string, CostRecord[]>>();
    for (const r of costRecords) {
      const cat = CATEGORY_MAP[r.category] || r.category || 'Other';
      const sub = r.subcategory || 'General';
      if (!map.has(cat)) map.set(cat, new Map());
      const catMap = map.get(cat)!;
      if (!catMap.has(sub)) catMap.set(sub, []);
      catMap.get(sub)!.push(r);
    }
    return map;
  }, [costRecords]);

  const toggleSub = (key: string) => {
    setExpandedSubs(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const isLocked = currentPlan === 'free';
  const isSG = region === 'SG';
  const currency = isSG ? 'SGD' : 'RM';
  const availableRegions = i18nRegion === 'SG' ? SG_REGIONS : MY_REGIONS;
  const loading = viewMode === 'benchmarks' ? loadingBenchmarks : loadingRecords;

  return (
    <div className="flex-1 p-4 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-[#10B981]" />
              {lang === 'ZH' ? '成本智能数据库' : 'Cost Intelligence Database'}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {lang === 'ZH' ? '实际施工成本基准' : 'Actual construction cost benchmarks'}
              {' · '}{costData.length} {lang === 'ZH' ? '项' : 'items'}
              {totalDataPoints > 0 ? ` · ${totalDataPoints.toLocaleString()} data points` : ''}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => viewMode === 'benchmarks' ? fetchBenchmarks() : fetchRecords(selectedProject)}>
            <RefreshCw className="w-4 h-4 mr-2" />
            {lang === 'ZH' ? '刷新' : 'Refresh'}
          </Button>
        </div>

        {/* Disclaimer */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-5 flex items-start gap-2">
          <Info className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-emerald-700">{DISCLAIMER[lang as keyof typeof DISCLAIMER] || DISCLAIMER.EN}</p>
        </div>

        {/* Free plan gate */}
        {isLocked && (
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl p-5 mb-6 flex items-start gap-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">
                {lang === 'ZH' ? 'Pro 功能 — 成本智能' : 'Pro Feature — Cost Intelligence'}
              </p>
              <p className="text-sm text-gray-600 mt-0.5">
                {lang === 'ZH'
                  ? '升级至 Pro 或 Elite 以查看精确成本基准数据。免费用户仅能看到模糊数据。'
                  : 'Upgrade to Pro or Elite to see exact cost benchmarks. Free users see blurred data.'}
              </p>
            </div>
            <a href="/designer/pricing">
              <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700 font-semibold whitespace-nowrap">
                {lang === 'ZH' ? '立即升级' : 'Upgrade Now'}
              </Button>
            </a>
          </div>
        )}

        {/* View mode toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setViewMode('benchmarks')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              viewMode === 'benchmarks' ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            {lang === 'ZH' ? '成本基准' : 'Cost Benchmarks'}
          </button>
          <button
            onClick={() => setViewMode('records')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              viewMode === 'records' ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            <List className="w-4 h-4" />
            {lang === 'ZH' ? '原始单据' : 'Raw Records'}
          </button>
        </div>

        {/* Controls Row: Region (benchmarks) or Project (records) */}
        <div className="flex flex-wrap gap-3 mb-4">
          {viewMode === 'benchmarks' ? (
            <>
              <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden">
                {availableRegions.map(r => (
                  <button
                    key={r.value}
                    onClick={() => setRegion(r.value)}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      region === r.value ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                <span className="text-xs text-gray-500">Currency:</span>
                <span className="text-sm font-semibold text-gray-800">{currency}</span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
              <DollarSign className="w-4 h-4 text-gray-400" />
              <select
                value={selectedProject}
                onChange={e => { setSelectedProject(e.target.value); fetchRecords(e.target.value); }}
                className="text-sm text-gray-700 bg-transparent focus:outline-none"
              >
                <option value="all">{lang === 'ZH' ? '全部项目' : 'All Projects'}</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 flex-wrap mb-5">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeCategory === cat ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Confidence legend (benchmarks only) */}
        {viewMode === 'benchmarks' && (
          <div className="flex gap-3 mb-5 flex-wrap">
            {Object.entries(CONFIDENCE_CONFIG).map(([key, cfg]) => (
              <Badge key={key} className={`${cfg.color} font-normal`}>{cfg.label}</Badge>
            ))}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
            {lang === 'ZH' ? '加载数据中...' : 'Loading data...'}
          </div>
        ) : viewMode === 'benchmarks' ? (
          /* ═══ BENCHMARKS VIEW ═══ */
          costData.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-30 text-gray-400" />
              <p className="text-gray-400">
                {lang === 'ZH' ? '此区域和类别暂无成本数据。' : 'No cost data yet for this region & category.'}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {lang === 'ZH' ? '上传单据后数据将自动聚合到此处（最少3个样本）。' : 'Upload receipts to build data. Minimum 3 samples to aggregate.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {Array.from(groupedBenchmarks.entries()).map(([category, subcatMap]) => (
                <div key={category}>
                  {activeCategory === 'All' && (
                    <h3 className="text-sm font-bold text-gray-700 mb-2 mt-4 uppercase tracking-wide">{category}</h3>
                  )}
                  {Array.from(subcatMap.entries()).map(([subcategory, items]) => {
                    const subKey = `${category}::${subcategory}`;
                    const isExpanded = expandedSubs.has(subKey);
                    return (
                      <div key={subKey} className="bg-white rounded-xl border border-gray-100 mb-2 overflow-hidden">
                        <button onClick={() => toggleSub(subKey)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-2">
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                            <span className="font-semibold text-gray-800">{subcategory}</span>
                            <span className="text-xs text-gray-400">({items.length})</span>
                          </div>
                        </button>
                        {isExpanded && (
                          <div style={{ overflowX: 'auto' }}>
                            <table className="text-sm w-full" style={{ minWidth: 550 }}>
                              <thead>
                                <tr className="bg-gray-50 border-t border-gray-100">
                                  <th className="text-left px-4 py-2 text-gray-500 font-medium text-xs">{lang === 'ZH' ? '材料/规格' : 'Material / Method'}</th>
                                  <th className="text-left px-3 py-2 text-gray-500 font-medium text-xs">{lang === 'ZH' ? '单位' : 'Unit'}</th>
                                  <th className="text-center px-3 py-2 text-gray-500 font-medium text-xs">Min ({currency})</th>
                                  <th className="text-center px-3 py-2 text-gray-500 font-medium text-xs">Avg ({currency})</th>
                                  <th className="text-center px-3 py-2 text-gray-500 font-medium text-xs">Max ({currency})</th>
                                  <th className="text-center px-3 py-2 text-gray-500 font-medium text-xs">{lang === 'ZH' ? '置信度' : 'Conf.'}</th>
                                  <th className="text-center px-3 py-2 text-gray-500 font-medium text-xs">n</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                {items.map(row => {
                                  const confCfg = CONFIDENCE_CONFIG[row.confidence] || CONFIDENCE_CONFIG.low;
                                  return (
                                    <tr key={row.id} className="hover:bg-gray-50">
                                      <td className="px-4 py-2.5 text-gray-800 font-medium">{row.material_method}</td>
                                      <td className="px-3 py-2.5 text-gray-500 text-xs">{row.unit}</td>
                                      <td className="px-3 py-2.5 text-center">
                                        <span className={isLocked ? 'blur-sm select-none' : ''}>{row.min_cost?.toFixed(2)}</span>
                                      </td>
                                      <td className="px-3 py-2.5 text-center">
                                        <span className={`font-semibold text-gray-900 ${isLocked ? 'blur-sm select-none' : ''}`}>{row.avg_cost?.toFixed(2)}</span>
                                      </td>
                                      <td className="px-3 py-2.5 text-center">
                                        <span className={isLocked ? 'blur-sm select-none' : ''}>{row.max_cost?.toFixed(2)}</span>
                                      </td>
                                      <td className="px-3 py-2.5 text-center"><span className="text-xs">{confCfg.icon}</span></td>
                                      <td className="px-3 py-2.5 text-center text-gray-400 text-xs">{row.sample_count}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )
        ) : (
          /* ═══ RAW RECORDS VIEW ═══ */
          costRecords.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <List className="w-8 h-8 mx-auto mb-2 opacity-30 text-gray-400" />
              <p className="text-gray-400">{lang === 'ZH' ? '暂无成本记录。' : 'No cost records yet.'}</p>
              <p className="text-sm text-gray-400 mt-1">{lang === 'ZH' ? '工人上传单据后数据将显示在此处。' : 'Worker receipt uploads will appear here.'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Array.from(groupedRecords.entries()).map(([category, subcatMap]) => (
                <div key={category}>
                  {activeCategory === 'All' && <h3 className="text-sm font-bold text-gray-700 mb-2 mt-4 uppercase tracking-wide">{category}</h3>}
                  {Array.from(subcatMap.entries()).map(([subcategory, records]) => {
                    const subKey = `rec::${category}::${subcategory}`;
                    const isExpanded = expandedSubs.has(subKey);
                    const totalAmount = records.reduce((sum, r) => sum + (r.amount ?? r.total_amount ?? 0), 0);
                    return (
                      <div key={subKey} className="bg-white rounded-xl border border-gray-100 mb-2 overflow-hidden">
                        <button onClick={() => toggleSub(subKey)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-2">
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                            <span className="font-semibold text-gray-800">{subcategory}</span>
                            <span className="text-xs text-gray-400">({records.length})</span>
                          </div>
                          <span className={`text-sm font-semibold text-gray-700 ${isLocked ? 'blur-sm select-none' : ''}`}>
                            {currency} {totalAmount.toFixed(2)}
                          </span>
                        </button>
                        {isExpanded && (
                          <div style={{ overflowX: 'auto' }}>
                            <table className="text-sm w-full" style={{ minWidth: 550 }}>
                              <thead>
                                <tr className="bg-gray-50 border-t border-gray-100">
                                  <th className="text-left px-4 py-2 text-gray-500 font-medium text-xs">{lang === 'ZH' ? '品项描述' : 'Description'}</th>
                                  <th className="text-left px-3 py-2 text-gray-500 font-medium text-xs">{lang === 'ZH' ? '供应商' : 'Supplier'}</th>
                                  <th className="text-center px-3 py-2 text-gray-500 font-medium text-xs">{lang === 'ZH' ? '总价' : 'Amount'}</th>
                                  <th className="text-center px-3 py-2 text-gray-500 font-medium text-xs">{lang === 'ZH' ? '日期' : 'Date'}</th>
                                  <th className="text-left px-3 py-2 text-gray-500 font-medium text-xs">{lang === 'ZH' ? '项目' : 'Project'}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                {records.map(r => (
                                  <tr key={r.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-2.5 text-gray-700 max-w-[200px]"><p className="truncate">{r.description || r.work_item || '—'}</p></td>
                                    <td className="px-3 py-2.5 text-gray-500 text-xs whitespace-nowrap">{r.supplier || '—'}</td>
                                    <td className="px-3 py-2.5 text-center">
                                      <span className={`font-semibold text-gray-900 ${isLocked ? 'blur-sm select-none' : ''}`}>
                                        {currency} {(r.amount ?? r.total_amount ?? 0).toFixed(2)}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2.5 text-center text-gray-500 text-xs whitespace-nowrap">
                                      {r.receipt_date ? new Date(r.receipt_date).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                                    </td>
                                    <td className="px-3 py-2.5 text-gray-500 text-xs"><span className="truncate block max-w-[120px]">{r.project_name || '—'}</span></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )
        )}

        {/* How it works */}
        <div className="mt-6 bg-gray-50 rounded-2xl p-5">
          <h3 className="font-semibold text-gray-700 mb-2">
            {lang === 'ZH' ? '成本智能数据库说明' : 'How Cost Intelligence Works'}
          </h3>
          <ul className="text-sm text-gray-500 space-y-1">
            <li>• {lang === 'ZH' ? '所有用户上传的单据自动拆解为独立品项，录入成本数据' : 'All users\' receipt uploads are auto-decomposed into individual items'}</li>
            <li>• {lang === 'ZH' ? '按类别 > 子类别 > 材料/规格分层聚合，计算最低/平均/最高成本' : 'Aggregated by Category > Subcategory > Material/Method with Min/Avg/Max costs'}</li>
            <li>• {lang === 'ZH' ? '每次上传新单据后自动重新计算（最少3个样本触发聚合）' : 'Auto-recalculates after each receipt upload (minimum 3 samples to aggregate)'}</li>
            <li>• {lang === 'ZH' ? '对比「价格数据库」（报价价）与「成本数据库」（实际成本），了解真实利润' : 'Compare Price DB (quotation prices) vs Cost DB (actual costs) to understand real margins'}</li>
            <li>• {lang === 'ZH' ? '切换「原始单据」查看您项目的详细成本记录' : 'Switch to "Raw Records" to see your project\'s detailed cost records'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
