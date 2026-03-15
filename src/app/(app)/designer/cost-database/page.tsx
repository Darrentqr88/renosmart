'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, TrendingDown, Lock, Filter } from 'lucide-react';

interface CostRecord {
  id: string;
  description: string;
  category: string;
  supplier: string;
  receipt_date: string;
  total_amount: number;
  project_id: string | null;
  project_name?: string;
}

interface ProjectSummary {
  id: string;
  name: string;
  revenue: number;
  cost: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  tiling_material: '#3B82F6',
  electrical_material: '#F59E0B',
  plumbing_material: '#10B981',
  carpentry_material: '#8B5CF6',
  paint: '#EC4899',
  cement: '#6B7280',
  steel: '#64748B',
  general_labour: '#F97316',
  other: '#9CA3AF',
};

const CATEGORY_LABELS: Record<string, string> = {
  tiling_material: 'Tiling',
  electrical_material: 'Electrical',
  plumbing_material: 'Plumbing',
  carpentry_material: 'Carpentry',
  paint: 'Paint',
  cement: 'Cement',
  steel: 'Steel',
  general_labour: 'Labour',
  other: 'Other',
};

export default function CostDatabasePage() {
  const supabase = createClient();
  const [currentPlan, setCurrentPlan] = useState('free');
  const [costRecords, setCostRecords] = useState<CostRecord[]>([]);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [selectedProject, setSelectedProject] = useState('all');
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalCost, setTotalCost] = useState(0);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('user_id', session.user.id)
        .single();
      if (profile) setCurrentPlan(profile.plan || 'free');

      // Load projects with revenue
      const { data: projectData } = await supabase
        .from('projects')
        .select('id, name, contract_amount')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (projectData) {
        // Load cost totals per project
        const summaries: ProjectSummary[] = await Promise.all(
          projectData.map(async (p) => {
            const { data: costs } = await supabase
              .from('cost_records')
              .select('total_amount')
              .eq('project_id', p.id);
            const cost = costs?.reduce((s, c) => s + (c.total_amount || 0), 0) || 0;
            return { id: p.id, name: p.name, revenue: p.contract_amount || 0, cost };
          })
        );
        setProjects(summaries);
        setTotalRevenue(summaries.reduce((s, p) => s + p.revenue, 0));
      }

      await fetchCosts(session.user.id);
    })();
  }, []);

  const fetchCosts = async (userId: string, projectId?: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('cost_records')
        .select('*')
        .eq('user_id', userId)
        .order('receipt_date', { ascending: false });

      if (projectId && projectId !== 'all') {
        query = query.eq('project_id', projectId);
      }

      const { data } = await query;
      setCostRecords(data || []);
      setTotalCost(data?.reduce((s, r) => s + (r.total_amount || 0), 0) || 0);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectFilter = async (projectId: string) => {
    setSelectedProject(projectId);
    const { data: { session } } = await supabase.auth.getSession();
    if (session) await fetchCosts(session.user.id, projectId);
  };

  const isLocked = currentPlan === 'free';
  const grossProfit = totalRevenue - totalCost;
  const margin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  // Category breakdown
  const categoryTotals: Record<string, number> = {};
  for (const r of costRecords) {
    categoryTotals[r.category] = (categoryTotals[r.category] || 0) + r.total_amount;
  }
  const sortedCategories = Object.entries(categoryTotals).sort(([, a], [, b]) => b - a);

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-[#F0B90B]" />
            Cost Database
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Actual costs from worker receipt uploads · Profit analysis
          </p>
        </div>

        {/* Free plan gate */}
        {isLocked && (
          <div className="bg-gradient-to-r from-[#F0B90B]/10 to-amber-50 border border-[#F0B90B]/30 rounded-2xl p-5 mb-6 flex items-start gap-4">
            <div className="w-10 h-10 bg-[#F0B90B]/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5 text-[#F0B90B]" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Pro Feature — Cost Intelligence</p>
              <p className="text-sm text-gray-600 mt-0.5">
                Upgrade to see full cost analysis, profit margins, and category breakdowns.
              </p>
            </div>
            <a href="/designer/pricing">
              <Button size="sm" className="bg-[#F0B90B] text-black hover:bg-[#d4a20a] font-semibold whitespace-nowrap">
                Upgrade Now
              </Button>
            </a>
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-xs text-gray-500 mb-1">Total Revenue</p>
            <p className={`text-xl font-bold text-gray-900 ${isLocked ? 'blur-sm' : ''}`}>
              RM {totalRevenue.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">From contract amounts</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-xs text-gray-500 mb-1">Total Cost</p>
            <p className={`text-xl font-bold text-gray-900 ${isLocked ? 'blur-sm' : ''}`}>
              RM {totalCost.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">From receipts</p>
          </div>
          <div className={`rounded-2xl border p-5 ${grossProfit >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
            <p className="text-xs text-gray-500 mb-1">Gross Profit</p>
            <p className={`text-xl font-bold flex items-center gap-1 ${grossProfit >= 0 ? 'text-green-700' : 'text-red-600'} ${isLocked ? 'blur-sm' : ''}`}>
              {grossProfit >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              RM {Math.abs(grossProfit).toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">Revenue minus costs</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-xs text-gray-500 mb-1">Margin</p>
            <p className={`text-xl font-bold ${margin >= 20 ? 'text-green-600' : margin >= 10 ? 'text-yellow-600' : 'text-red-500'} ${isLocked ? 'blur-sm' : ''}`}>
              {margin.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-400 mt-1">Profit / Revenue</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Category breakdown */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Cost by Category</h2>
            {sortedCategories.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No cost data yet.<br />Ask workers to upload receipts.</p>
            ) : (
              <div className="space-y-3">
                {sortedCategories.map(([cat, amount]) => {
                  const pct = totalCost > 0 ? (amount / totalCost) * 100 : 0;
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">{CATEGORY_LABELS[cat] || cat}</span>
                        <span className={`text-xs font-medium text-gray-800 ${isLocked ? 'blur-sm' : ''}`}>
                          RM {amount.toFixed(0)}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: CATEGORY_COLORS[cat] || '#9CA3AF' }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{pct.toFixed(1)}%</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cost records table */}
          <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">Receipt Records</h2>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={selectedProject}
                  onChange={e => handleProjectFilter(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-2 py-1"
                >
                  <option value="all">All Projects</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-gray-400 text-sm">Loading...</div>
            ) : costRecords.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>No cost records yet.</p>
                <p className="text-sm mt-1">Workers upload receipts from their portal.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-4 py-2.5 text-gray-500 font-medium">Date</th>
                      <th className="text-left px-4 py-2.5 text-gray-500 font-medium">Supplier</th>
                      <th className="text-left px-4 py-2.5 text-gray-500 font-medium">Item</th>
                      <th className="text-left px-4 py-2.5 text-gray-500 font-medium">Category</th>
                      <th className="text-right px-4 py-2.5 text-gray-500 font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {costRecords.map(r => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">
                          {r.receipt_date ? new Date(r.receipt_date).toLocaleDateString('en-MY') : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-gray-700">{r.supplier || '—'}</td>
                        <td className="px-4 py-2.5 text-gray-700 max-w-[160px] truncate">{r.description}</td>
                        <td className="px-4 py-2.5">
                          <Badge
                            style={{ backgroundColor: `${CATEGORY_COLORS[r.category]}20`, color: CATEGORY_COLORS[r.category], borderColor: `${CATEGORY_COLORS[r.category]}30` }}
                            className="text-xs"
                          >
                            {CATEGORY_LABELS[r.category] || r.category}
                          </Badge>
                        </td>
                        <td className={`px-4 py-2.5 text-right font-medium text-gray-800 ${isLocked ? 'blur-sm' : ''}`}>
                          RM {r.total_amount?.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Per-project profit summary */}
        {projects.length > 0 && (
          <div className="mt-6 bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Profit by Project</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-5 py-2.5 text-gray-500 font-medium">Project</th>
                  <th className="text-right px-4 py-2.5 text-gray-500 font-medium">Revenue</th>
                  <th className="text-right px-4 py-2.5 text-gray-500 font-medium">Cost</th>
                  <th className="text-right px-4 py-2.5 text-gray-500 font-medium">Profit</th>
                  <th className="text-right px-4 py-2.5 text-gray-500 font-medium">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {projects.map(p => {
                  const profit = p.revenue - p.cost;
                  const m = p.revenue > 0 ? (profit / p.revenue * 100) : 0;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-800">{p.name}</td>
                      <td className={`px-4 py-3 text-right text-gray-700 ${isLocked ? 'blur-sm' : ''}`}>RM {p.revenue.toLocaleString()}</td>
                      <td className={`px-4 py-3 text-right text-gray-700 ${isLocked ? 'blur-sm' : ''}`}>RM {p.cost.toLocaleString()}</td>
                      <td className={`px-4 py-3 text-right font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-500'} ${isLocked ? 'blur-sm' : ''}`}>
                        RM {profit.toLocaleString()}
                      </td>
                      <td className={`px-4 py-3 text-right ${isLocked ? 'blur-sm' : ''}`}>
                        <span className={`font-medium ${m >= 20 ? 'text-green-600' : m >= 10 ? 'text-yellow-600' : 'text-red-500'}`}>
                          {m.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
