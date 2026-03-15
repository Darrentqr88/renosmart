'use client';

import { useState, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useI18n } from '@/lib/i18n/context';
import { extractTextFromFile } from '@/lib/pdf/extractor';
import { buildQuotationPrompt } from '@/lib/ai/quotation-prompt';
import { QuotationAnalysis, QuotationItem, AIItemStatus } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Upload, FileText, Brain, CheckCircle2, AlertTriangle,
  AlertCircle, XCircle, ChevronDown, ChevronUp, Eye, Share2,
  BarChart2, Loader2, X,
} from 'lucide-react';
import { GanttAutoGenerator } from '@/components/gantt/GanttAutoGenerator';

type UploadStep = string;

const STATUS_CONFIG: Record<AIItemStatus, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  ok: { label: '✓ Normal', icon: <CheckCircle2 className="w-3 h-3" />, color: 'text-green-700', bg: 'bg-green-50' },
  warn: { label: '⚠ Caution', icon: <AlertTriangle className="w-3 h-3" />, color: 'text-amber-700', bg: 'bg-amber-50' },
  flag: { label: '✗ Flagged', icon: <XCircle className="w-3 h-3" />, color: 'text-red-700', bg: 'bg-red-50' },
  nodata: { label: '– No Data', icon: <AlertCircle className="w-3 h-3" />, color: 'text-gray-500', bg: 'bg-gray-50' },
};

function ScoreCircle({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 40;
  const strokeDash = (score / 100) * circumference;
  const color = score >= 75 ? '#22C55E' : score >= 50 ? '#F59E0B' : '#EF4444';

  return (
    <div className="relative w-24 h-24">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#E5E7EB" strokeWidth="8" />
        <circle
          cx="50" cy="50" r="40" fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={`${strokeDash} ${circumference}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-gray-900">{score}</span>
        <span className="text-xs text-gray-500">/ 100</span>
      </div>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color = value >= 75 ? 'bg-green-500' : value >= 50 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-600 w-24 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-700 w-8 text-right">{value}</span>
    </div>
  );
}

export default function QuotationPage() {
  const { t, lang } = useI18n();
  const supabase = createClient();

  // Upload state
  const [step, setStep] = useState<UploadStep>('idle');
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Analysis results (CRITICAL: all cleared on new upload)
  const [analysis, setAnalysis] = useState<QuotationAnalysis | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [showGantt, setShowGantt] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [showAllItems, setShowAllItems] = useState(false);

  // CRITICAL: Clear ALL previous state on new upload
  const clearAllState = useCallback(() => {
    setAnalysis(null);
    setPdfUrl(null);
    setShowPdfViewer(false);
    setShowGantt(false);
    setExtractedText('');
    setShowAllItems(false);
    setStep('idle');
    setProgress(0);
    setProgressLabel('');
  }, []);

  const processFile = async (file: File) => {
    // CRITICAL: Clear ALL previous state first
    clearAllState();

    setFileName(file.name);
    setFileSize(`${(file.size / 1024).toFixed(1)} KB`);

    // Create object URL for PDF preview
    if (file.name.endsWith('.pdf')) {
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
    }

    try {
      // Step 1: Extract text
      setStep('extracting');
      setProgressLabel(t.quotation.extracting);
      setProgress(20);

      const text = await extractTextFromFile(file);
      setExtractedText(text);
      setProgress(50);

      // Step 2: AI Analysis
      setStep('analyzing');
      setProgressLabel(t.quotation.analyzing);
      setProgress(60);

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const outputLang = lang === 'ZH' ? 'Chinese (Simplified)' : lang === 'BM' ? 'Bahasa Malaysia' : 'English';
      const prompt = buildQuotationPrompt(text, outputLang);

      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 8000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'AI analysis failed');
      }

      const aiResult = await res.json();
      const content = aiResult.content?.[0]?.text || '';

      // Parse JSON response
      let parsed: QuotationAnalysis;
      try {
        // Extract JSON from response (handles any extra text)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON found in response');
        parsed = JSON.parse(jsonMatch[0]);
      } catch {
        throw new Error('AI returned invalid JSON. Please try again.');
      }

      setProgress(90);
      setAnalysis(parsed);
      setStep('done');
      setProgress(100);
      setProgressLabel(t.quotation.done);

      toast({ title: 'Analysis complete!', description: parsed.summary, variant: 'success' as never });

      // CRITICAL: Auto-generate Gantt after analysis
      setShowGantt(true);

    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Analysis failed';
      setStep('error');
      setProgressLabel(msg);
      toast({ variant: 'destructive', title: 'Analysis failed', description: msg });
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset input so same file can be re-uploaded
    e.target.value = '';
  };

  const displayedItems = showAllItems ? (analysis?.items || []) : (analysis?.items || []).slice(0, 10);

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <Toaster />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AI Quotation Audit</h1>
        <p className="text-gray-500 mt-1">Upload a quotation PDF, Excel, or CSV for instant AI analysis</p>
      </div>

      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => step !== 'extracting' && step !== 'analyzing' && fileInputRef.current?.click()}
        className={`
          relative rounded-2xl border-2 border-dashed p-10 text-center transition-all cursor-pointer mb-6
          ${isDragging ? 'border-[#F0B90B] bg-[#F0B90B]/5 scale-[1.01]' : 'border-gray-200 hover:border-[#F0B90B] hover:bg-[#F0B90B]/5'}
          ${(step === 'extracting' || step === 'analyzing') ? 'pointer-events-none' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.xlsx,.xls,.csv,.txt"
          className="hidden"
          onChange={handleFileSelect}
        />

        {step === 'idle' || step === 'error' ? (
          <>
            <Upload className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">{t.quotation.dragDrop}</p>
            <p className="text-sm text-gray-400 mt-2">PDF, Excel (.xlsx/.xls), CSV, TXT · Max 50MB</p>
          </>
        ) : (
          <>
            <div className="flex items-center justify-center gap-3 mb-4">
              <FileText className="w-8 h-8 text-[#F0B90B]" />
              <div className="text-left">
                <p className="font-medium text-gray-900">{fileName}</p>
                <p className="text-sm text-gray-500">{fileSize}</p>
              </div>
            </div>
            <div className="max-w-sm mx-auto">
              <Progress value={progress} className="h-2 mb-2" />
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                {(step === 'extracting' || step === 'analyzing') && (
                  <Loader2 className="w-4 h-4 animate-spin text-[#F0B90B]" />
                )}
                {step === 'done' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                {step === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
                {progressLabel}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            {pdfUrl && (
              <Button variant="outline" onClick={() => setShowPdfViewer(true)} className="gap-2">
                <Eye className="w-4 h-4" /> View PDF
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowGantt(!showGantt)} className="gap-2">
              <BarChart2 className="w-4 h-4" /> {showGantt ? 'Hide' : 'Show'} Gantt
            </Button>
            <Button variant="outline" className="gap-2">
              <Share2 className="w-4 h-4" /> Share with Owner
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Client Info Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <h2 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Client Information
              </h2>
              <div className="space-y-2 text-sm">
                {analysis.client.company && (
                  <div><span className="text-blue-600 font-medium">Company:</span> <span className="text-blue-900">{analysis.client.company}</span></div>
                )}
                {analysis.client.attention && (
                  <div><span className="text-blue-600 font-medium">Attn:</span> <span className="text-blue-900">{analysis.client.attention}</span></div>
                )}
                {analysis.client.projectName && (
                  <div><span className="text-blue-600 font-medium">Project:</span> <span className="text-blue-900">{analysis.client.projectName}</span></div>
                )}
                {analysis.client.tel && (
                  <div><span className="text-blue-600 font-medium">Tel:</span> <span className="text-blue-900">{analysis.client.tel}</span></div>
                )}
                {analysis.client.address && (
                  <div><span className="text-blue-600 font-medium">Address:</span> <span className="text-blue-900">{analysis.client.address}</span></div>
                )}
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <div className="text-blue-600 font-medium text-xs">PROJECT SUMMARY</div>
                  <p className="text-blue-900 mt-1">{analysis.summary}</p>
                </div>
                <div className="mt-2 pt-2 border-t border-blue-200">
                  <span className="text-blue-600 font-medium">Total Amount:</span>
                  <span className="text-blue-900 font-bold ml-2 text-lg">
                    {formatCurrency(analysis.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* AI Score Card */}
            <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-500" /> AI Score
              </h2>
              <div className="flex items-center gap-6 mb-4">
                <ScoreCircle score={analysis.score.total} />
                <div className="flex-1 space-y-3">
                  <ScoreBar label="Completeness" value={analysis.score.completeness} />
                  <ScoreBar label="Price" value={analysis.score.price} />
                  <ScoreBar label="Logic" value={analysis.score.logic} />
                  <ScoreBar label="Risk" value={analysis.score.risk} />
                </div>
              </div>
            </div>

            {/* Alerts */}
            <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Alerts
              </h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {analysis.alerts.length === 0 ? (
                  <p className="text-sm text-gray-400">No alerts</p>
                ) : (
                  analysis.alerts.map((alert, i) => (
                    <div key={i} className={`rounded-lg p-3 ${
                      alert.level === 'critical' ? 'bg-red-50 border border-red-200' :
                      alert.level === 'warning' ? 'bg-amber-50 border border-amber-200' :
                      'bg-blue-50 border border-blue-200'
                    }`}>
                      <div className={`text-xs font-semibold uppercase mb-1 ${
                        alert.level === 'critical' ? 'text-red-600' :
                        alert.level === 'warning' ? 'text-amber-600' : 'text-blue-600'
                      }`}>{alert.level}</div>
                      <div className="text-sm font-medium text-gray-900">{alert.title}</div>
                      <div className="text-xs text-gray-600 mt-0.5">{alert.desc}</div>
                    </div>
                  ))
                )}

                {analysis.missing.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="text-xs font-semibold text-gray-500 mb-2">MISSING ITEMS</div>
                    {analysis.missing.map((m, i) => (
                      <div key={i} className="text-sm text-gray-600 flex items-center gap-1">
                        <X className="w-3 h-3 text-red-400" /> {m}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Work Items Table */}
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">
                Work Items ({analysis.items.length} items)
              </h2>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                {(['ok', 'warn', 'flag', 'nodata'] as AIItemStatus[]).map((s) => {
                  const count = analysis.items.filter((i) => i.status === s).length;
                  return count > 0 ? (
                    <span key={s} className={`${STATUS_CONFIG[s].color} font-medium`}>
                      {STATUS_CONFIG[s].label} ({count})
                    </span>
                  ) : null;
                })}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 w-8">#</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Description</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 w-16">Unit</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 w-20">Qty</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 w-28">Unit Price</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 w-28">Subtotal</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 w-32">AI Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {displayedItems.map((item: QuotationItem, i: number) => {
                    const cfg = STATUS_CONFIG[item.status];
                    return (
                      <tr key={i} className={`hover:bg-gray-50 ${item.status === 'flag' ? 'bg-red-50/30' : ''}`}>
                        <td className="px-4 py-3 text-gray-400 font-mono">{item.no}</td>
                        <td className="px-4 py-3">
                          {item.section && (
                            <div className="text-xs text-gray-400 mb-0.5">{item.section}</div>
                          )}
                          <div className="text-gray-900 font-medium">{item.name}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{item.unit}</td>
                        <td className="px-4 py-3 text-right text-gray-700 font-mono">{item.qty}</td>
                        <td className="px-4 py-3 text-right font-mono">
                          <span className={item.unitPriceDerived ? 'text-amber-600 italic' : 'text-gray-700'}>
                            {item.unitPrice.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-medium text-gray-900">
                          {formatCurrency(item.total)}
                        </td>
                        <td className="px-4 py-3">
                          <div className={`flex flex-col items-center gap-0.5`}>
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${cfg.color} ${cfg.bg}`}>
                              {cfg.icon}
                              {cfg.label}
                            </span>
                            {item.note && (
                              <span className="text-xs text-gray-400 text-center leading-tight mt-0.5">
                                {item.note}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Subtotals */}
                {analysis.subtotals.map((sub, i) => (
                  <tfoot key={i}>
                    <tr className="bg-gray-50">
                      <td colSpan={5} className="px-4 py-3 text-right text-sm font-medium text-gray-600">
                        {sub.label}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900 font-mono">
                        {formatCurrency(sub.amount)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                ))}
                <tfoot>
                  <tr className="bg-[#F0B90B]/10 border-t-2 border-[#F0B90B]">
                    <td colSpan={5} className="px-4 py-3 text-right font-bold text-gray-900">
                      TOTAL AMOUNT
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900 text-lg font-mono">
                      {formatCurrency(analysis.totalAmount)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>

            {analysis.items.length > 10 && (
              <div className="px-5 py-3 border-t border-gray-100 text-center">
                <button
                  onClick={() => setShowAllItems(!showAllItems)}
                  className="text-sm text-[#F0B90B] hover:underline flex items-center gap-1 mx-auto"
                >
                  {showAllItems ? (
                    <><ChevronUp className="w-4 h-4" /> Show less</>
                  ) : (
                    <><ChevronDown className="w-4 h-4" /> Show all {analysis.items.length} items</>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Gantt Chart */}
          {showGantt && (
            <GanttAutoGenerator analysis={analysis} />
          )}
        </div>
      )}

      {/* PDF Viewer Overlay */}
      {showPdfViewer && pdfUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 bg-[#1A2332] border-b border-white/10">
            <span className="text-white font-medium">{fileName}</span>
            <button onClick={() => setShowPdfViewer(false)} className="text-white/60 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <iframe
            src={pdfUrl}
            className="flex-1 w-full"
            title="PDF Viewer"
          />
        </div>
      )}
    </div>
  );
}
