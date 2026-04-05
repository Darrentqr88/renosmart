import Link from 'next/link';
import type { Metadata } from 'next';

const BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://renosmart.vercel.app';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface ReportData {
  score?: { total?: number; completeness?: number; price?: number; logic?: number; risk?: number };
  projectType?: string;
  client?: { company?: string };
  itemCount?: number;
  alertCount?: number;
  missingCount?: number;
  totalAmount?: number;
  alertSummary?: { severity: string; message: string }[];
}

async function getReport(token: string): Promise<ReportData | null> {
  try {
    const res = await fetch(`${BASE}/api/share/report?token=${token}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.report;
  } catch {
    // Fallback: direct Supabase query for SSR
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/shared_reports?share_token=eq.${token}&select=report_data,expires_at`,
        { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }, cache: 'no-store' }
      );
      if (!res.ok) return null;
      const rows = await res.json();
      if (!rows?.[0]) return null;
      if (new Date(rows[0].expires_at) < new Date()) return null;
      return rows[0].report_data;
    } catch { return null; }
  }
}

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const report = await getReport(token);
  const score = report?.score?.total || 0;
  return {
    title: `Quotation Audit Report — Score: ${score}/100`,
    description: `AI-powered renovation quotation audit. ${report?.itemCount || 0} items analyzed, ${report?.alertCount || 0} alerts found.`,
    openGraph: {
      title: `RenoSmart AI Audit — Score: ${score}/100`,
      description: `${report?.alertCount || 0} issues found in ${report?.itemCount || 0} quotation items.`,
      siteName: 'RenoSmart',
    },
  };
}

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? '#22C55E' : score >= 60 ? '#F59E0B' : '#EF4444';
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={10} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={10}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        className="transition-all duration-1000" />
      <text x={size / 2} y={size / 2 + 8} textAnchor="middle"
        className="transform rotate-90 origin-center" fill={color}
        style={{ fontSize: 32, fontWeight: 800, transformOrigin: `${size / 2}px ${size / 2}px` }}>
        {score}
      </text>
    </svg>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color = value >= 80 ? '#22C55E' : value >= 60 ? '#F59E0B' : '#EF4444';
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-500 w-28 text-right">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-sm font-semibold w-8" style={{ color }}>{value}</span>
    </div>
  );
}

export default async function SharedReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const report = await getReport(token);

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Report Not Found</h1>
          <p className="text-gray-500 mb-6">This report may have expired or been removed.</p>
          <Link href="/" className="text-blue-600 hover:underline">Go to RenoSmart →</Link>
        </div>
      </div>
    );
  }

  const score = report.score || { total: 0, completeness: 0, price: 0, logic: 0, risk: 0 };
  const sevColor: Record<string, string> = {
    critical: 'bg-red-50 text-red-700 border-red-100',
    warning: 'bg-amber-50 text-amber-700 border-amber-100',
    info: 'bg-blue-50 text-blue-700 border-blue-100',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#E8A317] to-[#D4940F] flex items-center justify-center text-[10px] font-extrabold text-[#0B0F1A]">RS</div>
            <span className="text-base font-bold text-gray-900">RenoSmart</span>
          </Link>
          <span className="text-xs text-gray-400">AI Quotation Audit Report</span>
        </div>
      </div>

      {/* Report */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Score card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <ScoreRing score={score.total || 0} />
            <div className="flex-1 space-y-2 w-full">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Audit Score</h2>
              <ScoreBar label="Completeness" value={score.completeness || 0} />
              <ScoreBar label="Pricing" value={score.price || 0} />
              <ScoreBar label="Logic" value={score.logic || 0} />
              <ScoreBar label="Risk" value={score.risk || 0} />
            </div>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 text-center border border-gray-100">
            <p className="text-2xl font-bold text-gray-900">{report.itemCount || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Items Analyzed</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center border border-gray-100">
            <p className="text-2xl font-bold text-amber-600">{report.alertCount || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Alerts Found</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center border border-gray-100">
            <p className="text-2xl font-bold text-red-600">{report.missingCount || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Missing Items</p>
          </div>
        </div>

        {/* Alert preview */}
        {report.alertSummary && report.alertSummary.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Key Findings</h3>
            <div className="space-y-2">
              {report.alertSummary.map((alert, i) => (
                <div key={i} className={`px-3 py-2 rounded-lg border text-sm ${sevColor[alert.severity] || sevColor.info}`}>
                  {alert.message}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="bg-gradient-to-r from-[#4F8EF7] to-[#8B5CF6] rounded-2xl p-6 text-center text-white">
          <h3 className="text-lg font-bold mb-2">Want AI to audit YOUR quotation?</h3>
          <p className="text-sm opacity-90 mb-4">
            RenoSmart catches pricing errors, missing items, and scheduling risks — automatically.
          </p>
          <Link
            href="/register"
            className="inline-block px-6 py-3 bg-white text-[#4F8EF7] rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors no-underline"
          >
            Try RenoSmart Free →
          </Link>
          <p className="text-xs opacity-60 mt-3">3 free AI audits · No credit card required</p>
        </div>

        {/* Watermark */}
        <p className="text-center text-xs text-gray-400 mt-8">
          Powered by <Link href="/" className="text-gray-500 hover:text-gray-700 no-underline font-medium">RenoSmart AI</Link>
        </p>
      </div>
    </div>
  );
}
