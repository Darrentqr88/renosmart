'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Lock, RefreshCw, ChevronDown, ChevronRight, Info, Building2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';

interface PriceEntry {
  id: string;
  item_name?: string;
  category: string;
  subcategory: string;
  material_method: string;
  unit: string;
  supply_type: string;
  region: string;
  min_price: number;
  max_price: number;
  avg_price: number;
  sample_count: number;
  confidence: 'low' | 'mid' | 'high';
  updated_at: string;
}

const CATEGORIES = [
  'All', 'Construction', 'Demolition', 'Tiling', 'Electrical', 'Plumbing', 'Painting',
  'False Ceiling', 'Carpentry', 'Waterproofing', 'Roofing', 'Aluminium', 'Glass',
  'Flooring', 'Air Conditioning', 'Metal Work', 'Landscape', 'Cleaning',
];

const MY_REGIONS = [
  { value: 'MY_KL', label: 'KL / Selangor' },
  { value: 'MY_JB', label: 'Johor Bahru' },
  { value: 'MY_PG', label: 'Penang' },
];

const SG_REGIONS = [
  { value: 'SG', label: 'Singapore' },
];

const ALL_REGIONS = [...MY_REGIONS, SG_REGIONS[0]];

const CONFIDENCE_CONFIG = {
  low:  { color: 'bg-red-50 text-red-600 border-red-200',      label: '🔴 Low (<10)',  icon: '🔴' },
  mid:  { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', label: '🟡 Mid (10-49)', icon: '🟡' },
  high: { color: 'bg-green-50 text-green-600 border-green-200',   label: '🟢 High (50+)',  icon: '🟢' },
};

const PROPERTY_TYPES = [
  { value: 'landed',    label: 'Landed (Base)',       multiplier: 1.0 },
  { value: 'condo',     label: 'Condo / Apartment',   multiplier: 1.15 },
  { value: 'shopLot',   label: 'Shop Lot',            multiplier: 1.10 },
  { value: 'mall',      label: 'Mall',                multiplier: 1.40 },
  { value: 'factory',   label: 'Factory',             multiplier: 1.15 },
];

const SUPPLY_TYPES = [
  { value: 'all', label: 'All' },
  { value: 'supply_install', label: 'S&I' },
  { value: 'labour_only', label: 'Labour Only' },
  { value: 'supply_only', label: 'Supply Only' },
];

const DISCLAIMER = {
  EN: 'Prices are for reference only. Actual prices may vary due to site conditions, logistics, international trade prices, and weather.',
  BM: 'Harga adalah untuk rujukan sahaja. Harga sebenar mungkin berbeza disebabkan keadaan tapak, logistik, harga perdagangan antarabangsa dan cuaca.',
  ZH: '价格仅供参考。受施工现场条件、物流运输、国际贸易价格波动及天气等因素影响，实际价格可能有所变动。',
};

// Region detection now uses i18n context (user selects MY/SG at login/landing)
// Previously used phone prefix which was unreliable (MY users may have SG numbers)

export default function PriceDatabasePage() {
  const supabase = createClient();
  const { lang, region: i18nRegion } = useI18n();
  const [currentPlan, setCurrentPlan] = useState('free');
  const [region, setRegion] = useState(i18nRegion === 'SG' ? 'SG' : 'MY_KL');
  const [activeCategory, setActiveCategory] = useState('All');
  const [supplyTypeFilter, setSupplyTypeFilter] = useState('all');
  const [propertyType, setPropertyType] = useState('landed');
  const [data, setData] = useState<PriceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalDataPoints, setTotalDataPoints] = useState(0);
  const [expandedSubs, setExpandedSubs] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('plan')
          .eq('user_id', session.user.id)
          .single();
        if (profile) {
          setCurrentPlan(profile.plan || 'free');
        }
      }
    })();
  }, []);

  // Sync with i18n region when user switches MY/SG in navbar
  useEffect(() => {
    setRegion(i18nRegion === 'SG' ? 'SG' : 'MY_KL');
  }, [i18nRegion]);

  useEffect(() => {
    fetchData();
  }, [region, activeCategory, supplyTypeFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('price_database')
        .select('*')
        .eq('region', region)
        .order('category')
        .order('subcategory')
        .order('avg_price', { ascending: false });

      if (activeCategory !== 'All') {
        query = query.eq('category', activeCategory);
      }

      if (supplyTypeFilter !== 'all') {
        query = query.eq('supply_type', supplyTypeFilter);
      }

      const { data: rows } = await query;
      setData(rows || []);

      // Expand all subcategories by default
      if (rows) {
        const subs = new Set(rows.map((r: PriceEntry) => `${r.category}::${r.subcategory}`));
        setExpandedSubs(subs);
      }

      const { count } = await supabase
        .from('price_data_points')
        .select('id', { count: 'exact', head: true })
        .eq('region', region);
      setTotalDataPoints(count || 0);
    } finally {
      setLoading(false);
    }
  };

  // Group data by category > subcategory
  const groupedData = useMemo(() => {
    const map = new Map<string, Map<string, PriceEntry[]>>();
    for (const row of data) {
      if (!map.has(row.category)) map.set(row.category, new Map());
      const catMap = map.get(row.category)!;
      if (!catMap.has(row.subcategory)) catMap.set(row.subcategory, []);
      catMap.get(row.subcategory)!.push(row);
    }
    return map;
  }, [data]);

  const toggleSub = (key: string) => {
    setExpandedSubs(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const multiplier = PROPERTY_TYPES.find(p => p.value === propertyType)?.multiplier || 1.0;
  const isLocked = currentPlan === 'free';
  const isSG = region === 'SG';
  const currency = isSG ? 'SGD' : 'RM';
  // MY users see MY regions only; SG users (selected at login) see SG only
  const availableRegions = i18nRegion === 'SG' ? SG_REGIONS : MY_REGIONS;

  const applyMultiplier = (price: number) => {
    const adjusted = price * multiplier;
    return adjusted.toFixed(2);
  };

  return (
    <div className="flex-1 p-4 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-[#4F8EF7]" />
              {lang === 'ZH' ? '价格智能数据库' : lang === 'BM' ? 'Pangkalan Harga Pintar' : 'Price Intelligence Database'}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {lang === 'ZH' ? '市场价格基准' : 'Market price benchmarks'} · {data.length} {lang === 'ZH' ? '项' : 'items'} · {totalDataPoints > 0 ? `${totalDataPoints.toLocaleString()} data points` : 'Seed data + quotation uploads'}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            {lang === 'ZH' ? '刷新' : 'Refresh'}
          </Button>
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700">{DISCLAIMER[lang as keyof typeof DISCLAIMER] || DISCLAIMER.EN}</p>
        </div>

        {/* Free plan gate */}
        {isLocked && (
          <div className="bg-gradient-to-r from-[#4F8EF7]/10 to-blue-50 border border-[#4F8EF7]/30 rounded-2xl p-5 mb-6 flex items-start gap-4">
            <div className="w-10 h-10 bg-[#4F8EF7]/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5 text-[#4F8EF7]" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">
                {lang === 'ZH' ? 'Pro 功能 — 价格智能' : 'Pro Feature — Price Intelligence'}
              </p>
              <p className="text-sm text-gray-600 mt-0.5">
                {lang === 'ZH'
                  ? '升级至 Pro 或 Elite 以查看精确市场价格基准。免费用户仅能看到模糊数据。'
                  : 'Upgrade to Pro or Elite to see exact market price benchmarks. Free users see blurred data.'}
              </p>
            </div>
            <a href="/designer/pricing">
              <Button size="sm" className="bg-[#4F8EF7] text-white hover:bg-[#3B7BE8] font-semibold whitespace-nowrap">
                {lang === 'ZH' ? '立即升级' : 'Upgrade Now'}
              </Button>
            </a>
          </div>
        )}

        {/* Controls Row 1: Region + Currency + Property Type */}
        <div className="flex flex-wrap gap-3 mb-4">
          {/* Region */}
          <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden">
            {availableRegions.map(r => (
              <button
                key={r.value}
                onClick={() => setRegion(r.value)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  region === r.value ? 'bg-[#4F8EF7] text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Currency */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
            <span className="text-xs text-gray-500">Currency:</span>
            <span className="text-sm font-semibold text-gray-800">{currency}</span>
          </div>

          {/* Property Type */}
          <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-3 py-2">
            <Building2 className="w-4 h-4 text-gray-400" />
            <select
              value={propertyType}
              onChange={e => setPropertyType(e.target.value)}
              className="text-sm text-gray-700 bg-transparent focus:outline-none"
            >
              {PROPERTY_TYPES.map(pt => (
                <option key={pt.value} value={pt.value}>{pt.label}</option>
              ))}
            </select>
            {multiplier !== 1.0 && (
              <Badge className="bg-orange-50 text-orange-600 border-orange-200 text-xs ml-1">
                +{Math.round((multiplier - 1) * 100)}%
              </Badge>
            )}
          </div>
        </div>

        {/* Controls Row 2: Supply Type */}
        <div className="flex gap-2 mb-4">
          {SUPPLY_TYPES.map(st => (
            <button
              key={st.value}
              onClick={() => setSupplyTypeFilter(st.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                supplyTypeFilter === st.value
                  ? 'bg-[#4F8EF7] text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 flex-wrap mb-5">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
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

        {/* Confidence legend */}
        <div className="flex gap-3 mb-5 flex-wrap">
          {Object.entries(CONFIDENCE_CONFIG).map(([key, cfg]) => (
            <Badge key={key} className={`${cfg.color} font-normal`}>
              {cfg.label}
            </Badge>
          ))}
        </div>

        {/* Accordion table */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
            {lang === 'ZH' ? '加载价格数据中...' : 'Loading price data...'}
          </div>
        ) : data.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-30 text-gray-400" />
            <p className="text-gray-400">
              {lang === 'ZH' ? '此区域和类别暂无价格数据。' : 'No price data yet for this region & category.'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {lang === 'ZH' ? '在 Supabase 中运行种子 SQL，或上传报价单以构建数据。' : 'Run the seed SQL in Supabase, or upload quotations to build data.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {Array.from(groupedData.entries()).map(([category, subcatMap]) => (
              <div key={category}>
                {/* Category header (only show if "All" is selected) */}
                {activeCategory === 'All' && (
                  <h3 className="text-sm font-bold text-gray-700 mb-2 mt-4 uppercase tracking-wide">
                    {category}
                  </h3>
                )}

                {Array.from(subcatMap.entries()).map(([subcategory, items]) => {
                  const subKey = `${category}::${subcategory}`;
                  const isExpanded = expandedSubs.has(subKey);

                  return (
                    <div key={subKey} className="bg-white rounded-xl border border-gray-100 mb-2 overflow-hidden">
                      {/* Subcategory header */}
                      <button
                        onClick={() => toggleSub(subKey)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {isExpanded
                            ? <ChevronDown className="w-4 h-4 text-gray-400" />
                            : <ChevronRight className="w-4 h-4 text-gray-400" />
                          }
                          <span className="font-semibold text-gray-800">{subcategory}</span>
                          <span className="text-xs text-gray-400">({items.length})</span>
                        </div>
                      </button>

                      {/* Items table */}
                      {isExpanded && (
                        <div style={{ overflowX: 'auto' }}>
                          <table className="text-sm w-full" style={{ minWidth: 550 }}>
                            <thead>
                              <tr className="bg-gray-50 border-t border-gray-100">
                                <th className="text-left px-4 py-2 text-gray-500 font-medium text-xs">
                                  {lang === 'ZH' ? '材料/规格' : 'Material / Method'}
                                </th>
                                <th className="text-left px-3 py-2 text-gray-500 font-medium text-xs">
                                  {lang === 'ZH' ? '单位' : 'Unit'}
                                </th>
                                <th className="text-center px-3 py-2 text-gray-500 font-medium text-xs">
                                  Min ({currency})
                                </th>
                                <th className="text-center px-3 py-2 text-gray-500 font-medium text-xs">
                                  Avg ({currency})
                                </th>
                                <th className="text-center px-3 py-2 text-gray-500 font-medium text-xs">
                                  Max ({currency})
                                </th>
                                <th className="text-center px-3 py-2 text-gray-500 font-medium text-xs">
                                  {lang === 'ZH' ? '置信度' : 'Conf.'}
                                </th>
                                <th className="text-center px-3 py-2 text-gray-500 font-medium text-xs">n</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {items.map((row) => {
                                const confCfg = CONFIDENCE_CONFIG[row.confidence] || CONFIDENCE_CONFIG.low;
                                return (
                                  <tr key={row.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-2.5 text-gray-800 font-medium">
                                      {row.material_method}
                                      {row.supply_type === 'labour_only' && (
                                        <Badge className="ml-2 bg-blue-50 text-blue-600 border-blue-200 text-[10px]">Labour</Badge>
                                      )}
                                      {row.supply_type === 'supply_only' && (
                                        <Badge className="ml-2 bg-purple-50 text-purple-600 border-purple-200 text-[10px]">Supply</Badge>
                                      )}
                                    </td>
                                    <td className="px-3 py-2.5 text-gray-500 text-xs">{row.unit}</td>
                                    <td className="px-3 py-2.5 text-center">
                                      <span className={isLocked ? 'blur-sm select-none' : ''}>
                                        {applyMultiplier(row.min_price)}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2.5 text-center">
                                      <span className={`font-semibold text-gray-900 ${isLocked ? 'blur-sm select-none' : ''}`}>
                                        {applyMultiplier(row.avg_price)}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2.5 text-center">
                                      <span className={isLocked ? 'blur-sm select-none' : ''}>
                                        {applyMultiplier(row.max_price)}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2.5 text-center">
                                      <span className="text-xs">{confCfg.icon}</span>
                                    </td>
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
        )}

        {/* How it works */}
        <div className="mt-6 bg-gray-50 rounded-2xl p-5">
          <h3 className="font-semibold text-gray-700 mb-2">
            {lang === 'ZH' ? '价格数据库说明' : 'How Price Intelligence Works'}
          </h3>
          <ul className="text-sm text-gray-500 space-y-1">
            <li>• {lang === 'ZH' ? '基准数据来源于马来西亚/新加坡装修市场实际价格（2024–2025）' : 'Benchmark data sourced from real MY/SG renovation market rates (2024–2025)'}</li>
            <li>• {lang === 'ZH' ? '每次上传报价单后自动更新价格数据' : 'Every quotation you upload automatically adds price data points'}</li>
            <li>• {lang === 'ZH' ? '按类别 > 子类别 > 材料/规格分层显示' : 'Grouped by Category > Subcategory > Material/Method'}</li>
            <li>• {lang === 'ZH' ? '不同物业类型适用不同价格系数' : 'Different property types apply different price multipliers'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
