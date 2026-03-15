'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Lock, RefreshCw } from 'lucide-react';

interface PriceEntry {
  id: string;
  category: string;
  unit: string;
  region: string;
  min_price: number;
  max_price: number;
  avg_price: number;
  sample_count: number;
  confidence: 'low' | 'mid' | 'high';
  updated_at: string;
}

const CATEGORIES = [
  'All', 'Tiling', 'Electrical', 'Plumbing', 'Painting', 'Carpentry',
  'False Ceiling', 'Waterproofing', 'Demolition', 'Aluminium', 'Glass',
  'Flooring', 'Air Conditioning', 'Metal Work', 'Cleaning',
];

const REGIONS = [
  { value: 'MY_KL', label: 'KL / Selangor' },
  { value: 'MY_JB', label: 'Johor Bahru' },
  { value: 'MY_PG', label: 'Penang' },
  { value: 'SG', label: 'Singapore' },
];

const CONFIDENCE_CONFIG = {
  low: { color: 'bg-red-50 text-red-600 border-red-200', label: '🔴 Low (<10)', desc: 'Fewer than 10 samples' },
  mid: { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', label: '🟡 Mid (10-49)', desc: '10–49 samples' },
  high: { color: 'bg-green-50 text-green-600 border-green-200', label: '🟢 High (50+)', desc: '50+ samples' },
};

export default function PriceDatabasePage() {
  const supabase = createClient();
  const [currentPlan, setCurrentPlan] = useState('free');
  const [region, setRegion] = useState('MY_KL');
  const [activeCategory, setActiveCategory] = useState('All');
  const [data, setData] = useState<PriceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalDataPoints, setTotalDataPoints] = useState(0);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('plan')
          .eq('user_id', session.user.id)
          .single();
        if (profile) setCurrentPlan(profile.plan || 'free');
      }
    })();
  }, []);

  useEffect(() => {
    fetchData();
  }, [region, activeCategory]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('price_database')
        .select('*')
        .eq('region', region)
        .order('category')
        .order('avg_price', { ascending: false });

      if (activeCategory !== 'All') {
        query = query.eq('category', activeCategory);
      }

      const { data: rows } = await query;
      setData(rows || []);

      // Count total data points
      const { count } = await supabase
        .from('price_data_points')
        .select('id', { count: 'exact', head: true })
        .eq('region', region);
      setTotalDataPoints(count || 0);
    } finally {
      setLoading(false);
    }
  };

  const isLocked = currentPlan === 'free';

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-[#F0B90B]" />
              Price Intelligence Database
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Market prices auto-learned from {totalDataPoints.toLocaleString()} quotation data points
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Free plan gate banner */}
        {isLocked && (
          <div className="bg-gradient-to-r from-[#F0B90B]/10 to-amber-50 border border-[#F0B90B]/30 rounded-2xl p-5 mb-6 flex items-start gap-4">
            <div className="w-10 h-10 bg-[#F0B90B]/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5 text-[#F0B90B]" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Pro Feature — Price Intelligence</p>
              <p className="text-sm text-gray-600 mt-0.5">
                Upgrade to Pro or Elite to see exact market price benchmarks. Free users see blurred data.
              </p>
            </div>
            <a href="/designer/pricing">
              <Button size="sm" className="bg-[#F0B90B] text-black hover:bg-[#d4a20a] font-semibold whitespace-nowrap">
                Upgrade Now
              </Button>
            </a>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap gap-3 mb-5">
          {/* Region selector */}
          <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden">
            {REGIONS.map(r => (
              <button
                key={r.value}
                onClick={() => setRegion(r.value)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  region === r.value ? 'bg-[#F0B90B] text-black' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
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

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-gray-600 font-medium">Category</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Unit</th>
                <th className="text-center px-4 py-3 text-gray-600 font-medium">Min</th>
                <th className="text-center px-4 py-3 text-gray-600 font-medium">Avg</th>
                <th className="text-center px-4 py-3 text-gray-600 font-medium">Max</th>
                <th className="text-center px-4 py-3 text-gray-600 font-medium">Confidence</th>
                <th className="text-center px-4 py-3 text-gray-600 font-medium">Samples</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                    Loading price data...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <div className="text-gray-400">
                      <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p>No price data yet for this region & category.</p>
                      <p className="text-sm mt-1">Data is auto-learned from your quotation uploads (min. 10 samples required).</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((row) => {
                  const confCfg = CONFIDENCE_CONFIG[row.confidence] || CONFIDENCE_CONFIG.low;
                  return (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-800">{row.category}</td>
                      <td className="px-4 py-3 text-gray-500">{row.unit}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={isLocked ? 'blur-sm select-none' : ''}>
                          RM {row.min_price?.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-semibold text-gray-900 ${isLocked ? 'blur-sm select-none' : ''}`}>
                          RM {row.avg_price?.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={isLocked ? 'blur-sm select-none' : ''}>
                          RM {row.max_price?.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge className={`${confCfg.color} text-xs`}>
                          {row.confidence === 'high' ? '🟢' : row.confidence === 'mid' ? '🟡' : '🔴'} {row.confidence}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500">{row.sample_count}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* How it works */}
        <div className="mt-6 bg-gray-50 rounded-2xl p-5">
          <h3 className="font-semibold text-gray-700 mb-2">How Price Intelligence Works</h3>
          <ul className="text-sm text-gray-500 space-y-1">
            <li>• Every quotation you upload is analyzed and item prices are extracted</li>
            <li>• Prices are grouped by category, unit, and region</li>
            <li>• Once 10+ samples are collected, averages are calculated (outliers removed)</li>
            <li>• Data becomes more reliable as more designers contribute quotations</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
