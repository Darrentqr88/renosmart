'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, Lock, RefreshCw, Filter } from 'lucide-react';

interface CostRecord {
  id: string;
  description: string;
  category: string;
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
  'All', 'Tiling', 'Electrical', 'Plumbing', 'Painting', 'Carpentry',
  'False Ceiling', 'Waterproofing', 'Demolition', 'Aluminium', 'Glass',
  'Flooring', 'Air Conditioning', 'Metal Work', 'Cleaning',
];

const CATEGORY_MAP: Record<string, string> = {
  tiling_material:      'Tiling',
  electrical_material:  'Electrical',
  plumbing_material:    'Plumbing',
  carpentry_material:   'Carpentry',
  paint:                'Painting',
  cement:               'Demolition',
  steel:                'Metal Work',
  general_labour:       'Cleaning',
  waterproofing:        'Waterproofing',
  ceiling:              'False Ceiling',
  flooring:             'Flooring',
  ac:                   'Air Conditioning',
  glass:                'Glass',
  aluminium:            'Aluminium',
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
  const [currentPlan, setCurrentPlan] = useState('free');
  const [isSGUser, setIsSGUser] = useState(false);
  const [costRecords, setCostRecords] = useState<CostRecord[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState('all');
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

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
      let records = (data || []).map((r: Record<string, unknown>) => ({
        ...r,
        project_name: (r.projects as Record<string, unknown>)?.name || '—',
      })) as CostRecord[];

      // Filter by category
      if (category !== 'All') {
        records = records.filter(r => {
          const mapped = CATEGORY_MAP[r.category] || r.category || '';
          return mapped.toLowerCase() === category.toLowerCase();
        });
      }

      setCostRecords(records);
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

  const isLocked = currentPlan === 'free';
  const currency = isSGUser ? 'SGD' : 'RM';

  return (
    <div className="flex-1 p-4 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-[#F0B90B]" />
              成本数据库
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              来自工人单据上传的实际施工成本数据
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </Button>
        </div>

        {/* Free plan gate banner */}
        {isLocked && (
          <div className="bg-gradient-to-r from-[#F0B90B]/10 to-amber-50 border border-[#F0B90B]/30 rounded-2xl p-5 mb-6 flex items-start gap-4">
            <div className="w-10 h-10 bg-[#F0B90B]/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5 text-[#F0B90B]" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Pro 功能 — 成本智能数据库</p>
              <p className="text-sm text-gray-600 mt-0.5">
                升级至 Pro 或 Elite 以查看完整成本分析、利润率及按工种分类明细。
              </p>
            </div>
            <a href="/designer/pricing">
              <Button size="sm" className="bg-[#F0B90B] text-black hover:bg-[#d4a20a] font-semibold whitespace-nowrap">
                立即升级
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
              <option value="all">全部项目</option>
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

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100" style={{ overflowX: 'auto' }}>
          <table className="text-sm" style={{ minWidth: 600, width: '100%', tableLayout: 'auto' }}>
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-gray-600 font-medium">工种</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">品项描述</th>
                <th className="text-left px-3 py-3 text-gray-600 font-medium">供应商</th>
                <th className="text-center px-3 py-3 text-gray-600 font-medium">总价</th>
                <th className="text-center px-3 py-3 text-gray-600 font-medium">日期</th>
                <th className="text-left px-3 py-3 text-gray-600 font-medium">项目</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                    加载成本数据中...
                  </td>
                </tr>
              ) : costRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <div className="text-gray-400">
                      <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p>暂无成本记录。</p>
                      <p className="text-sm mt-1">工人通过 Task 卡片上传单据后，数据将显示在此处。</p>
                    </div>
                  </td>
                </tr>
              ) : (
                costRecords.map(r => {
                  const mapped = CATEGORY_MAP[r.category] || r.category || '—';
                  const dotColor = getTradeColor(r.category, r.trade);
                  return (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: dotColor }} />
                          <span className="text-gray-700 font-medium whitespace-nowrap">{r.trade || mapped}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 max-w-[200px]">
                        <p className="truncate">{r.description || r.work_item || '—'}</p>
                        {r.work_item && r.description && r.work_item !== r.description && (
                          <p className="text-xs text-gray-400 truncate">{r.work_item}</p>
                        )}
                      </td>
                      <td className="px-3 py-3 text-gray-500 whitespace-nowrap">{r.supplier || '—'}</td>
                      <td className="px-3 py-3 text-center">
                        <span className={`font-semibold text-gray-900 ${isLocked ? 'blur-sm select-none' : ''}`}>
                          {currency} {r.total_amount?.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center text-gray-500 whitespace-nowrap">
                        {r.receipt_date ? new Date(r.receipt_date).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                      </td>
                      <td className="px-3 py-3 text-gray-500 text-sm">
                        <span className="truncate block max-w-[120px]">{r.project_name || '—'}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* How it works */}
        <div className="mt-6 bg-gray-50 rounded-2xl p-5">
          <h3 className="font-semibold text-gray-700 mb-2">成本数据库说明</h3>
          <ul className="text-sm text-gray-500 space-y-1">
            <li>• 工人通过 Task 卡片的「上传单据」功能，AI OCR 识别单据后自动录入</li>
            <li>• 每条记录关联具体工序（如：水电粗安装）和工种（如：Electrical）</li>
            <li>• 数据用于计算项目利润率，显示在项目详情页顶部</li>
            <li>• Pro 用户可查看金额数据；免费用户显示模糊</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
