'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Receipt, ChevronDown, ChevronUp, Image, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n/context';

interface CostRecord {
  id: string;
  project_id: string;
  supplier: string;
  receipt_date: string;
  receipt_number?: string;
  category: string;
  subcategory?: string;
  description: string;
  amount: number;
  items?: { description: string; category: string; qty: number; unit: string; unit_cost: number; total: number }[];
  receipt_url?: string;
  created_at: string;
}

interface ProjectInfo {
  id: string;
  name: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  Tiling: '#34d399', Electrical: '#f97316', Plumbing: '#3b82f6',
  Painting: '#a78bfa', Carpentry: '#60a5fa', Construction: '#fb923c',
  'Metal Work': '#f87171', Waterproofing: '#fbbf24', 'False Ceiling': '#4ade80',
  Flooring: '#2dd4bf', Glass: '#67e8f9', Aluminium: '#a3e635',
  'Air Conditioning': '#38bdf8', Cleaning: '#94a3b8', Other: '#9CA3AF',
};

interface WorkerReceiptsTabProps {
  userId: string;
}

export default function WorkerReceiptsTab({ userId }: WorkerReceiptsTabProps) {
  const supabase = createClient();
  const { t } = useI18n();
  const [records, setRecords] = useState<CostRecord[]>([]);
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterProject, setFilterProject] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('cost_records')
        .select('*, projects:project_id(id, name)')
        .eq('uploaded_by', userId)
        .order('receipt_date', { ascending: false });

      if (data) {
        const recs: CostRecord[] = [];
        const projMap = new Map<string, ProjectInfo>();
        for (const d of data) {
          recs.push(d as unknown as CostRecord);
          const proj = (d as Record<string, unknown>).projects as ProjectInfo | null;
          if (proj && !projMap.has(proj.id)) {
            projMap.set(proj.id, proj);
          }
        }
        setRecords(recs);
        setProjects(Array.from(projMap.values()));
      }
      setLoading(false);
    })();
  }, [userId]);

  const filtered = filterProject === 'all' ? records : records.filter(r => r.project_id === filterProject);

  // Group by project
  const grouped = new Map<string, CostRecord[]>();
  for (const r of filtered) {
    const key = r.project_id;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(r);
  }

  const totalAmount = filtered.reduce((sum, r) => sum + (r.amount || 0), 0);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const thisMonthCount = filtered.filter(r => r.receipt_date?.startsWith(thisMonth)).length;

  const getCategoryDisplay = (rec: CostRecord) => rec.subcategory || rec.category || 'Other';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-[#4F8EF7] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">{t.worker.receiptsThisMonth}</p>
          <p className="text-lg font-bold text-gray-900">{thisMonthCount}</p>
          <p className="text-[10px] text-gray-400">receipts</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">{t.worker.totalAmount}</p>
          <p className="text-lg font-bold text-gray-900">RM {totalAmount.toLocaleString('en-MY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
          <p className="text-[10px] text-gray-400">{filtered.length} receipts</p>
        </div>
      </div>

      {/* Project filter */}
      {projects.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <Filter className="w-3 h-3 text-gray-400 flex-shrink-0" />
          <button
            onClick={() => setFilterProject('all')}
            className={`px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${
              filterProject === 'all' ? 'bg-[#4F8EF7] text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {t.worker.allProjects}
          </button>
          {projects.map(p => (
            <button
              key={p.id}
              onClick={() => setFilterProject(p.id)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${
                filterProject === p.id ? 'bg-[#4F8EF7] text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {/* Receipts list grouped by project */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <Receipt className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-500">{t.worker.noReceipts}</p>
          <p className="text-xs text-gray-400 mt-1">{t.worker.uploadFromTasks}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(rec => {
            const catDisplay = getCategoryDisplay(rec);
            const catColor = CATEGORY_COLORS[catDisplay] || '#9CA3AF';
            const isExpanded = expandedId === rec.id;
            return (
              <div key={rec.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                  className="w-full px-3.5 py-3 flex items-center gap-3 text-left"
                >
                  {/* Receipt thumbnail or icon */}
                  {rec.receipt_url ? (
                    <div
                      className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); setLightboxUrl(rec.receipt_url!); }}
                    >
                      <img src={rec.receipt_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                      <Receipt className="w-4 h-4 text-gray-300" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{rec.supplier}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-gray-400">{rec.receipt_date}</span>
                      <Badge
                        className="text-[9px] px-1.5 py-0"
                        style={{ backgroundColor: `${catColor}18`, color: catColor, border: `1px solid ${catColor}30` }}
                      >
                        {catDisplay}
                      </Badge>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-900">RM {(rec.amount || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}</p>
                    {isExpanded ? <ChevronUp className="w-3 h-3 text-gray-400 ml-auto mt-1" /> : <ChevronDown className="w-3 h-3 text-gray-400 ml-auto mt-1" />}
                  </div>
                </button>

                {/* Expanded items */}
                {isExpanded && rec.items && rec.items.length > 0 && (
                  <div className="px-3.5 pb-3 border-t border-gray-50">
                    <div className="space-y-1.5 mt-2">
                      {rec.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-600 flex-1 truncate">{item.description}</span>
                          <span className="text-gray-400 mx-2">{item.qty} {item.unit}</span>
                          <span className="text-gray-700 font-medium">RM {(item.total || 0).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    {rec.receipt_number && (
                      <p className="text-[10px] text-gray-400 mt-2">Ref: {rec.receipt_number}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setLightboxUrl(null)}
        >
          <img src={lightboxUrl} alt="Receipt" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
        </div>
      )}
    </div>
  );
}
