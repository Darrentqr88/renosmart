'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { Camera, Upload, Loader2, Check, X, Receipt, ChevronDown } from 'lucide-react';

interface ReceiptItem {
  description: string;
  category: string;
  qty: number;
  unit: string;
  unit_cost: number;
  total: number;
}

interface ExtractedReceipt {
  supplier: string;
  date: string | null;
  items: ReceiptItem[];
  total_amount: number;
  receipt_number: string | null;
  notes: string;
}

interface Project {
  id: string;
  name: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  tiling_material: 'Tiling Material',
  electrical_material: 'Electrical Material',
  plumbing_material: 'Plumbing Material',
  carpentry_material: 'Carpentry Material',
  paint: 'Paint',
  cement: 'Cement',
  steel: 'Steel',
  general_labour: 'Labour',
  other: 'Other',
};

export default function WorkerReceiptsPage() {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState<'idle' | 'ocr' | 'review' | 'saving' | 'done'>('idle');
  const [extracted, setExtracted] = useState<ExtractedReceipt | null>(null);
  const [submittedReceipts, setSubmittedReceipts] = useState<ExtractedReceipt[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      // Get projects assigned to this worker
      const { data } = await supabase
        .from('projects')
        .select('id, name')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      if (data) setProjects(data);
    })();
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }

    setUploading(true);
    setStep('ocr');
    setExtracted(null);

    try {
      // Convert to base64
      const buffer = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
      const mimeType = file.type || 'image/jpeg';

      const res = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      });

      if (!res.ok) throw new Error('OCR failed');

      const data: ExtractedReceipt = await res.json();
      setExtracted(data);
      setStep('review');
    } catch {
      toast({ variant: 'destructive', title: 'OCR Failed', description: 'Could not extract receipt data. Please try again.' });
      setStep('idle');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!extracted) return;
    setStep('saving');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Save each item as a cost record
      for (const item of extracted.items) {
        await supabase.from('cost_records').insert({
          project_id: selectedProject || null,
          user_id: session.user.id,
          supplier: extracted.supplier,
          receipt_date: extracted.date,
          receipt_number: extracted.receipt_number,
          description: item.description,
          category: item.category,
          qty: item.qty,
          unit: item.unit,
          unit_cost: item.unit_cost,
          total_amount: item.total,
          notes: extracted.notes,
        });
      }

      setSubmittedReceipts(prev => [extracted, ...prev]);
      setExtracted(null);
      setPreviewUrl(null);
      setStep('done');
      toast({ title: 'Receipt Saved', description: `${extracted.items.length} items saved successfully.` });

      // Reset after a moment
      setTimeout(() => setStep('idle'), 2000);
    } catch {
      toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save receipt. Please try again.' });
      setStep('review');
    }
  };

  const updateItem = (idx: number, field: keyof ReceiptItem, value: string | number) => {
    if (!extracted) return;
    const items = [...extracted.items];
    items[idx] = { ...items[idx], [field]: value };
    // Recalc total if unit_cost or qty changed
    if (field === 'unit_cost' || field === 'qty') {
      items[idx].total = items[idx].qty * items[idx].unit_cost;
    }
    setExtracted({ ...extracted, items });
  };

  return (
    <div className="flex-1 p-4 overflow-y-auto bg-gray-50 min-h-screen">
      <Toaster />
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-[#F0B90B]" />
            Upload Receipt
          </h1>
          <p className="text-sm text-gray-500 mt-1">AI will scan and extract receipt details automatically</p>
        </div>

        {/* Project selector */}
        <div className="mb-4">
          <Label className="text-sm text-gray-700">Link to Project (optional)</Label>
          <div className="relative mt-1">
            <select
              value={selectedProject}
              onChange={e => setSelectedProject(e.target.value)}
              className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white pr-8"
            >
              <option value="">No project selected</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Upload area */}
        {step === 'idle' || step === 'done' ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center cursor-pointer hover:border-[#F0B90B] hover:bg-[#F0B90B]/5 transition-colors"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 bg-[#F0B90B]/10 rounded-full flex items-center justify-center">
                <Camera className="w-7 h-7 text-[#F0B90B]" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">Take Photo or Upload</p>
                <p className="text-sm text-gray-500 mt-0.5">JPG, PNG, or PDF receipt</p>
              </div>
              <Button variant="outline" size="sm" className="mt-2">
                <Upload className="w-4 h-4 mr-2" />
                Select File
              </Button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*,application/pdf" onChange={handleFileSelect} className="hidden" />
          </div>
        ) : null}

        {/* OCR Loading */}
        {step === 'ocr' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            {previewUrl && (
              <img src={previewUrl} alt="Receipt" className="max-h-48 mx-auto mb-4 rounded-lg object-contain" />
            )}
            <Loader2 className="w-8 h-8 animate-spin text-[#F0B90B] mx-auto mb-3" />
            <p className="font-medium text-gray-700">Scanning receipt...</p>
            <p className="text-sm text-gray-400 mt-1">AI is extracting details</p>
          </div>
        )}

        {/* Review extracted data */}
        {step === 'review' && extracted && (
          <div className="space-y-4">
            {previewUrl && (
              <img src={previewUrl} alt="Receipt" className="max-h-40 mx-auto rounded-lg object-contain" />
            )}

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Review Extracted Data</h2>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <Label className="text-xs text-gray-500">Supplier</Label>
                  <Input
                    value={extracted.supplier}
                    onChange={e => setExtracted({ ...extracted, supplier: e.target.value })}
                    className="mt-1 h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Date</Label>
                  <Input
                    type="date"
                    value={extracted.date || ''}
                    onChange={e => setExtracted({ ...extracted, date: e.target.value })}
                    className="mt-1 h-8 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {extracted.items.map((item, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Input
                        value={item.description}
                        onChange={e => updateItem(idx, 'description', e.target.value)}
                        className="h-7 text-sm flex-1"
                        placeholder="Item description"
                      />
                      <button
                        onClick={() => {
                          const items = extracted.items.filter((_, i) => i !== idx);
                          setExtracted({ ...extracted, items });
                        }}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      <div>
                        <Label className="text-xs text-gray-400">Qty</Label>
                        <Input
                          type="number"
                          value={item.qty}
                          onChange={e => updateItem(idx, 'qty', parseFloat(e.target.value) || 0)}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-400">Unit</Label>
                        <Input
                          value={item.unit}
                          onChange={e => updateItem(idx, 'unit', e.target.value)}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-400">Unit Cost</Label>
                        <Input
                          type="number"
                          value={item.unit_cost}
                          onChange={e => updateItem(idx, 'unit_cost', parseFloat(e.target.value) || 0)}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-400">Total</Label>
                        <div className="h-7 flex items-center text-xs font-medium text-gray-700 pl-1">
                          RM {item.total.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2">
                      <select
                        value={item.category}
                        onChange={e => updateItem(idx, 'category', e.target.value)}
                        className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
                      >
                        {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-sm text-gray-500">Total Amount</span>
                <span className="font-bold text-gray-900">
                  RM {extracted.items.reduce((s, i) => s + i.total, 0).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { setStep('idle'); setExtracted(null); setPreviewUrl(null); }} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSave} className="flex-1 bg-[#F0B90B] text-black hover:bg-[#d4a20a] font-semibold">
                Save Receipt
              </Button>
            </div>
          </div>
        )}

        {/* Saving state */}
        {step === 'saving' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#F0B90B] mx-auto mb-3" />
            <p className="font-medium text-gray-700">Saving receipt...</p>
          </div>
        )}

        {/* Submitted receipts */}
        {submittedReceipts.length > 0 && (
          <div className="mt-6">
            <h2 className="font-semibold text-gray-700 mb-3">Submitted Today</h2>
            <div className="space-y-2">
              {submittedReceipts.map((r, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm text-gray-800">{r.supplier}</p>
                    <p className="text-xs text-gray-400">{r.items.length} items · RM {r.items.reduce((s, item) => s + item.total, 0).toFixed(2)}</p>
                  </div>
                  <Badge className="bg-green-50 text-green-600 border-green-200">
                    <Check className="w-3 h-3 mr-1" />
                    Saved
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
