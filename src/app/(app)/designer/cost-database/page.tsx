'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, Lock, RefreshCw, Filter, ChevronDown, ChevronRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';

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
  total_amount: number;
  project_id: string | null;
  project_name?: string;
}

interface Project {
  id: string;
  name: string;
}

const CATEGORIES = [
  'All', 'Construction', 'Demolition', 'Tiling', 'Electrical', 'Plumbing', 'Painting',
  'False Ceiling', 'Carpentry', 'Waterproofing', 'Roofing', 'Aluminium', 'Glass',
  'Flooring', 'Air Conditioning', 'Metal Work', 'Landscape', 'Cleaning',
];

const CATEGORY_MAP: Record<string, string> = {
  tiling_material:      'Tiling',
  electrical_material:  'Electrical',
  plumbing_material:    'Plumbing',
  carpentry_material:   'Carpentry',
  paint:                'Painting',
  cement:               'Construction',
  steel:                'Metal Work',
  general_labour:       'Cleaning',
  waterproofing:        'Waterproofing',
  ceiling:              'False Ceiling',
  flooring:             'Flooring',
  ac:                   'Air Conditioning',
  glass:                'Glass',
  aluminium:            'Aluminium',
  roofing:              'Roofing',
  landscape:            'Landscape',
  construction:         'Construction',
  demolition:           'Demolition',
  other:                'Other',
};

const TRADE_COLORS: Record<string, string> = {
  tiling:        '#34d399',
  electrical:    '#f97316',
  plumbing:      '#3b82f6',
  painting:      '#a78bfa',
  carpentry:     '#60a5fa',
  ceiling:       '#4ade80',
  waterproofing: '#fbbf24',
  demolition:    '#f87171',
  aluminium:     '#a3e635',
  glass:         '#67e8f9',
  flooring:      '#2dd4bf',
  ac:            '#38bdf8',
  construction:  '#fb923c',
  roofing:       '#c084fc',
  landscape:     '#86efac',
  general:       '#94a3b8',
  other:         '#9CA3AF',
};

function getTradeColor(category: string, trade?: string): string {
  if (trade && TRADE_COLORS[trade]) return TRADE_COLORS[trade];
  const mapped = CATEGORY_MAP[category] || '';
  const key = mapped.toLowerCase().replace(/\s+/g, '_');
  return TRADE_COLORS[key] || '#9CA3AF';
}

export default function CostDatabasePage() {
  const supabase = createClient();
  const { lang } = useI18n();
  const [currentPlan, setCurrentPlan] = useState('free');
  const [isSGUser, setIsSGUser] = useState(false);
  const [costRecords, setCostRecords] = useState<CostRecord[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState('all');
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [expandedSubs, setExpandedSubs] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUserId(session.user.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('plan, phone')
        .eq('user_id', session.user.id)
        .single();
      if (profile) {
        setCurrentPlan(profile.plan || 'free');
        const phone = profile.phone || '';
        setIsSGUser(phone.startsWith('+65') || phone.startsWith('65'));
      }

      const { data: projectData } = await supabase
        .from('projects')
        .select('id, name')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      if (projectData) setProjects(projectData);

      await fetchCosts(session.user.id, 'all', 'All');
    })();
  }, []);

  const fetchCosts = async (uid: string, projectId: string, category: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('cost_records')
        .select('*, projects(name)')
        .eq('user_id', uid)
        .order('receipt_date', { ascending: false });

      if (projectId !== 'all') {
        query = query.eq('project_id', projectId);
      }

      const { data } = await query;
      let records = (data || []).map((r: any) => ({
        ...r,
        subcategory: r.subcategory || 'General',
        material_method: r.material_method || 'Standard',
        project_name: r.projects?.name || '—',
      })) as CostRecord[];

      // Filter by category
      if (category !== 'All') {
        records = records.filter(r => {
          const mapped = CATEGORY_MAP[r.category] || r.category || '';
          return mapped.toLowerCase() === category.toLowerCase();
        });
      }

      setCostRecords(records);

      // Expand all subcategories
      const subs = new Set(records.map(r => {
        const cat = CATEGORY_MAP[r.category] || r.category || 'Other';
        return `${cat}::${r.subcategory}`;
      }));
      setExpandedSubs(subs);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (userId) fetchCosts(userId, selectedProject, activeCategory);
  };

  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId);
    if (userId) fetchCosts(userId, projectId, activeCategory);
  };

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    if (userId) fetchCosts(userId, selectedProject, category);
  };

  // Group by category > subcategory
  const groupedData = useMemo(() => {
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
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const isLocked = currentPlan === 'free';
  const currency = isSGUser ? 'SGD' : 'RM';

  return (
    <div className="flex-1 p-4 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-[#4F8EF7]" />
              {lang === 'ZH' ? '成本数据库' : lang === 'BM' ? 'Pangkalan Kos' : 'Cost Database'}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {lang === 'ZH' ? '来自工人单据上传的实际施工成本数据' : lang === 'BM' ? 'Data kos sebenar dari muat naik resit pekerja' : 'Actual construction cost data from worker receipt uploads'}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            {lang === 'ZH' ? '刷新' : 'Refresh'}
          </Button>
        </div>

        {/* Free plan gate */}
        {isLocked && (
          <div className="bg-gradient-to-r from-[#4F8EF7]/10 to-blue-50 border border-[#4F8EF7]/30 rounded-2xl p-5 mb-6 flex items-start gap-4">
            <div className="w-10 h-10 bg-[#4F8EF7]/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5 text-[#4F8EF7]" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">
                {lang === 'ZH' ? 'Pro 功能 — 成本智能数据库' : 'Pro Feature — Cost Intelligence'}
              </p>
              <p className="text-sm text-gray-600 mt-0.5">
                {lang === 'ZH'
                  ? '升级至 Pro 或 Elite 以查看完整成本分析、利润率及按工种分类明细。'
                  : 'Upgrade to Pro or Elite to view full cost analysis, profit margins, and trade breakdowns.'}
              </p>
            </div>
            <a href="/designer/pricing">
              <Button size="sm" className="bg-[#4F8EF7] text-white hover:bg-[#3B7BE8] font-semibold whitespace-nowrap">
                {lang === 'ZH' ? '立即升级' : 'Upgrade Now'}
              </Button>
            </a>
          </div>
        )}

        {/* Controls: Project selector */}
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedProject}
              onChange={e => handleProjectChange(e.target.value)}
              className="text-sm text-gray-700 bg-transparent focus:outline-none"
            >
              <option value="all">{lang === 'ZH' ? '全部项目' : 'All Projects'}</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 flex-wrap mb-5">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Accordion grouped records */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
            {lang === 'ZH' ? '加载成本数据中...' : 'Loading cost data...'}
          </div>
        ) : costRecords.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-30 text-gray-400" />
            <p className="text-gray-400">
              {lang === 'ZH' ? '暂无成本记录。' : 'No cost records yet.'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {lang === 'ZH' ? '工人通过 Task 卡片上传单据后，数据将显示在此处。' : 'Worker receipt uploads will appear here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {Array.from(groupedData.entries()).map(([category, subcatMap]) => (
              <div key={category}>
                {activeCategory === 'All' && (
                  <h3 className="text-sm font-bold text-gray-700 mb-2 mt-4 uppercase tracking-wide">
                    {category}
                  </h3>
                )}

                {Array.from(subcatMap.entries()).map(([subcategory, records]) => {
                  const subKey = `${category}::${subcategory}`;
                  const isExpanded = expandedSubs.has(subKey);
                  const totalAmount = records.reduce((sum, r) => sum + (r.total_amount || 0), 0);

                  return (
                    <div key={subKey} className="bg-white rounded-xl border border-gray-100 mb-2 overflow-hidden">
                      <button
                        onClick={() => toggleSub(subKey)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {isExpanded
                            ? <ChevronDown className="w-4 h-4 text-gray-400" />
                            : <ChevronRight className="w-4 h-4 text-gray-400" />
                          }
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: getTradeColor(records[0]?.category, records[0]?.trade) }} />
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
                                <th className="text-left px-4 py-2 text-gray-500 font-medium text-xs">
                                  {lang === 'ZH' ? '品项描述' : 'Description'}
                                </th>
                                <th className="text-left px-3 py-2 text-gray-500 font-medium text-xs">
                                  {lang === 'ZH' ? '材料/规格' : 'Material'}
                                </th>
                                <th className="text-left px-3 py-2 text-gray-500 font-medium text-xs">
                                  {lang === 'ZH' ? '供应商' : 'Supplier'}
                                </th>
                                <th className="text-center px-3 py-2 text-gray-500 font-medium text-xs">
                                  {lang === 'ZH' ? '总价' : 'Amount'}
                                </th>
                                <th className="text-center px-3 py-2 text-gray-500 font-medium text-xs">
                                  {lang === 'ZH' ? '日期' : 'Date'}
                                </th>
                                <th className="text-left px-3 py-2 text-gray-500 font-medium text-xs">
                                  {lang === 'ZH' ? '项目' : 'Project'}
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {records.map(r => (
                                <tr key={r.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-2.5 text-gray-700 max-w-[200px]">
                                    <p className="truncate">{r.description || r.work_item || '—'}</p>
                                  </td>
                                  <td className="px-3 py-2.5 text-gray-500 text-xs">
                                    {r.material_method !== 'Standard' ? r.material_method : '—'}
                                  </td>
                                  <td className="px-3 py-2.5 text-gray-500 text-xs whitespace-nowrap">{r.supplier || '—'}</td>
                                  <td className="px-3 py-2.5 text-center">
                                    <span className={`font-semibold text-gray-900 ${isLocked ? 'blur-sm select-none' : ''}`}>
                                      {currency} {r.total_amount?.toFixed(2)}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2.5 text-center text-gray-500 text-xs whitespace-nowrap">
                                    {r.receipt_date ? new Date(r.receipt_date).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                                  </td>
                                  <td className="px-3 py-2.5 text-gray-500 text-xs">
                                    <span className="truncate block max-w-[120px]">{r.project_name || '—'}</span>
                                  </td>
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
        )}

        {/* How it works */}
        <div className="mt-6 bg-gray-50 rounded-2xl p-5">
          <h3 className="font-semibold text-gray-700 mb-2">
            {lang === 'ZH' ? '成本数据库说明' : 'How Cost Database Works'}
          </h3>
          <ul className="text-sm text-gray-500 space-y-1">
            <li>• {lang === 'ZH' ? '工人通过 Task 卡片的「上传单据」功能，AI OCR 识别单据后自动录入' : 'Workers upload receipts via Task cards, AI OCR auto-extracts data'}</li>
            <li>• {lang === 'ZH' ? '每条记录按类别 > 子类别 > 材料/规格分类' : 'Each record classified by Category > Subcategory > Material/Method'}</li>
            <li>• {lang === 'ZH' ? '数据用于计算项目利润率，显示在项目详情页' : 'Data used to calculate project profit margins'}</li>
            <li>• {lang === 'ZH' ? 'Pro 用户可查看金额数据；免费用户显示模糊' : 'Pro users see full amounts; free users see blurred data'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
