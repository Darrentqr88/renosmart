'use client';

import { useState, useRef } from 'react';
import { MapPin, ChevronDown, ChevronUp, Receipt, Loader2, CheckCircle2, X, Upload, Camera, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import WorkerTaskCard, { WorkerTask, TaskSubtask } from './WorkerTaskCard';

export interface ProjectSummary {
  id: string;
  name: string;
  address?: string;
}

interface CheckinState {
  status: 'idle' | 'detecting' | 'checked_in' | 'checked_out';
  time?: string;
  checkoutTime?: string;
}

interface OcrItem {
  description: string;
  category: string;
  qty: number;
  unit: string;
  unit_cost: number;
  total: number;
}

interface OcrResult {
  supplier: string;
  date: string;
  items: OcrItem[];
  total_amount: number;
  receipt_number?: string;
}

type InvoiceStep = 'idle' | 'scanning' | 'review' | 'saving' | 'done';

interface WorkerProjectCardProps {
  project: ProjectSummary;
  tasks: WorkerTask[];
  sessionUserId: string;
  profileName: string;
  onProgressChange: (taskId: string, progress: number) => void;
  onSubtaskToggle: (taskId: string, subtaskId: string) => void;
  onComplete: (taskId: string) => void;
  onPhotoClick: (task: WorkerTask) => void;
}

export default function WorkerProjectCard({
  project,
  tasks,
  sessionUserId,
  profileName,
  onProgressChange,
  onSubtaskToggle,
  onComplete,
  onPhotoClick,
}: WorkerProjectCardProps) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const today = new Date().toISOString().split('T')[0];

  const [tasksExpanded, setTasksExpanded] = useState(true);
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  // Check-in state (persisted per project in localStorage)
  const storageKey = `checkin_${project.id}_${today}`;
  const [checkin, setCheckin] = useState<CheckinState>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey);
      if (stored) return JSON.parse(stored);
    }
    return { status: 'idle' };
  });

  // Invoice (receipt) state
  const [invoiceStep, setInvoiceStep] = useState<InvoiceStep>('idle');
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);

  const handleCheckin = async () => {
    setCheckin({ status: 'detecting' });
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) { reject(new Error('GPS not available')); return; }
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 });
      });

      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' });
      const state: CheckinState = { status: 'checked_in', time: timeStr };
      setCheckin(state);
      localStorage.setItem(storageKey, JSON.stringify(state));

      // Notify designer via project_events
      await supabase.from('project_events').insert({
        project_id: project.id,
        user_id: sessionUserId,
        event_type: 'worker_checkin',
        title: `${profileName} checked in`,
        event_date: today,
        notes: `Checked in at ${timeStr} · GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
      });
    } catch {
      // GPS denied or error — still allow manual check-in
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' });
      const state: CheckinState = { status: 'checked_in', time: timeStr };
      setCheckin(state);
      localStorage.setItem(storageKey, JSON.stringify(state));

      await supabase.from('project_events').insert({
        project_id: project.id,
        user_id: sessionUserId,
        event_type: 'worker_checkin',
        title: `${profileName} checked in`,
        event_date: today,
        notes: `Checked in at ${timeStr} (no GPS)`,
      });
    }
  };

  const handleCheckout = async () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' });
    const state: CheckinState = { status: 'checked_out', time: checkin.time, checkoutTime: timeStr };
    setCheckin(state);
    localStorage.setItem(storageKey, JSON.stringify(state));

    await supabase.from('project_events').insert({
      project_id: project.id,
      user_id: sessionUserId,
      event_type: 'worker_checkout',
      title: `${profileName} checked out`,
      event_date: today,
      notes: `Checked out at ${timeStr}`,
    });
  };

  // Invoice OCR flow
  const handleFileSelect = async (file: File) => {
    setOcrError(null);
    setInvoiceStep('scanning');
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64 = (e.target?.result as string).split(',')[1];
          const res = await fetch('/api/ocr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
          });
          if (!res.ok) throw new Error('OCR failed');
          const data = await res.json();
          setOcrResult(data);
          setInvoiceStep('review');
        } catch {
          setOcrError('AI 扫描失败，请重试');
          setInvoiceStep('idle');
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setOcrError('文件读取失败');
      setInvoiceStep('idle');
    }
  };

  const handleSaveInvoice = async () => {
    if (!ocrResult) return;
    setInvoiceStep('saving');
    try {
      await supabase.from('cost_records').insert({
        project_id: project.id,
        user_id: sessionUserId,
        uploaded_by: sessionUserId,
        supplier: ocrResult.supplier || 'Unknown Supplier',
        receipt_date: ocrResult.date || today,
        receipt_number: ocrResult.receipt_number || null,
        category: ocrResult.items[0]?.category || 'other',
        description: ocrResult.supplier || 'Receipt',
        amount: ocrResult.total_amount,
        items: ocrResult.items,
      });
      setInvoiceStep('done');
      setTimeout(() => {
        setInvoiceOpen(false);
        setInvoiceStep('idle');
        setOcrResult(null);
      }, 1800);
    } catch {
      setOcrError('保存失败，请重试');
      setInvoiceStep('review');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
      {/* Project header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-50">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-gray-900 text-base truncate">{project.name}</h2>
            {project.address && (
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                <p className="text-[11px] text-gray-400 truncate">{project.address}</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
            <span className="text-[11px] font-semibold text-gray-500">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* GPS Check-in button */}
        <div className="mt-3">
          {checkin.status === 'idle' && (
            <button
              onClick={handleCheckin}
              style={{ touchAction: 'manipulation' }}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#4F8EF7] text-white rounded-xl text-sm font-semibold transition-colors active:scale-[0.97]"
            >
              <MapPin className="w-4 h-4" />
              Check In to Site
            </button>
          )}
          {checkin.status === 'detecting' && (
            <div className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-50 rounded-xl text-sm text-amber-700">
              <Loader2 className="w-4 h-4 animate-spin" />
              Detecting location...
            </div>
          )}
          {checkin.status === 'checked_in' && (
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 py-2.5 px-3 bg-green-50 border border-green-200 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                <div>
                  <p className="text-[12px] font-semibold text-green-700">Checked In</p>
                  <p className="text-[10px] text-green-500">{checkin.time}</p>
                </div>
              </div>
              <button
                onClick={handleCheckout}
                className="px-4 py-2.5 bg-gray-100 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-200 transition-colors"
              >
                Check Out
              </button>
            </div>
          )}
          {checkin.status === 'checked_out' && (
            <div className="flex items-center gap-2 py-2 px-3 bg-gray-50 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-gray-400" />
              <p className="text-[11px] text-gray-500">
                {checkin.time} → {checkin.checkoutTime} · Done for today
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tasks toggle */}
      <button
        onClick={() => setTasksExpanded(!tasksExpanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors"
      >
        <span className="text-[12px] font-semibold text-gray-600">Today&apos;s Tasks ({tasks.length})</span>
        {tasksExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {/* Task cards */}
      {tasksExpanded && (
        <div className="px-3 pb-3 space-y-3">
          {tasks.map(task => (
            <WorkerTaskCard
              key={task.id}
              task={task}
              onProgressChange={onProgressChange}
              onSubtaskToggle={onSubtaskToggle}
              onComplete={onComplete}
              onPhotoClick={onPhotoClick}
              onReceiptClick={() => setInvoiceOpen(true)}
            />
          ))}
        </div>
      )}

      {/* Invoice upload button */}
      <div className="px-4 pb-4">
        <button
          onClick={() => { setInvoiceOpen(true); setInvoiceStep('idle'); }}
          style={{ touchAction: 'manipulation' }}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm font-semibold text-amber-700 transition-colors active:scale-[0.97]"
        >
          <Receipt className="w-4 h-4" />
          Upload Invoice
        </button>
      </div>

      {/* Invoice modal */}
      {invoiceOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm overflow-hidden shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-amber-600" />
                  <h3 className="font-bold text-gray-900">Upload Invoice</h3>
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Project: <span className="font-semibold text-amber-700">{project.name}</span>
                </p>
              </div>
              <button
                onClick={() => { setInvoiceOpen(false); setInvoiceStep('idle'); setOcrResult(null); }}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="p-5">
              {/* idle */}
              {invoiceStep === 'idle' && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-10 flex flex-col items-center gap-3 hover:border-[#4F8EF7]/60 hover:bg-[#4F8EF7]/5 transition-colors"
                  >
                    <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                      <Camera className="w-6 h-6 text-amber-600" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-gray-700 text-sm">Take Photo or Upload</p>
                      <p className="text-xs text-gray-400 mt-1">JPG, PNG, PDF receipt / invoice</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Upload className="w-3 h-3" /> Select File
                    </div>
                  </button>
                  {ocrError && <p className="mt-3 text-xs text-red-500 text-center">{ocrError}</p>}
                </>
              )}

              {/* scanning */}
              {invoiceStep === 'scanning' && (
                <div className="py-10 flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-[#4F8EF7] animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-gray-700 text-sm">AI 正在识别单据...</p>
                    <p className="text-xs text-gray-400 mt-1">通常需要 5-10 秒</p>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-[#4F8EF7] h-full rounded-full animate-pulse" style={{ width: '65%' }} />
                  </div>
                </div>
              )}

              {/* review */}
              {invoiceStep === 'review' && ocrResult && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-gray-500 font-medium block mb-1">供应商</label>
                      <input
                        value={ocrResult.supplier || ''}
                        onChange={(e) => setOcrResult(p => p ? { ...p, supplier: e.target.value } : p)}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#4F8EF7]"
                        placeholder="Supplier name"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-500 font-medium block mb-1">日期</label>
                      <input
                        type="date"
                        value={ocrResult.date || ''}
                        onChange={(e) => setOcrResult(p => p ? { ...p, date: e.target.value } : p)}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#4F8EF7]"
                      />
                    </div>
                  </div>

                  <div className="border border-gray-100 rounded-xl overflow-hidden">
                    {ocrResult.items.length === 0 ? (
                      <p className="p-3 text-xs text-gray-400 text-center">未识别到明细，将以总金额记录</p>
                    ) : (
                      ocrResult.items.slice(0, 5).map((item, i) => (
                        <div key={i} className="flex items-center gap-2 p-3 border-b border-gray-50 last:border-0">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-800 truncate">{item.description}</p>
                            <p className="text-[10px] text-gray-400">{item.qty} {item.unit} × RM{item.unit_cost}</p>
                          </div>
                          <span className="text-xs font-bold text-gray-700 whitespace-nowrap">RM {(item.total ?? 0).toFixed(2)}</span>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex justify-between items-center bg-gray-50 rounded-xl px-4 py-3">
                    <span className="text-sm font-medium text-gray-600">Total</span>
                    <span className="font-bold text-gray-900">RM {(ocrResult.total_amount ?? 0).toFixed(2)}</span>
                  </div>

                  {ocrError && <p className="text-xs text-red-500 text-center">{ocrError}</p>}

                  <div className="flex gap-3">
                    <button
                      onClick={() => { setInvoiceStep('idle'); setOcrResult(null); }}
                      className="flex-1 py-3 border border-gray-200 rounded-2xl text-sm text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                    >
                      Retake
                    </button>
                    <button
                      onClick={handleSaveInvoice}
                      className="flex-1 py-3 bg-[#4F8EF7] text-white rounded-2xl text-sm font-bold hover:bg-[#4F8EF7]-hover transition-colors"
                    >
                      <Check className="w-4 h-4" /> Confirm Save
                    </button>
                  </div>
                </div>
              )}

              {/* saving */}
              {invoiceStep === 'saving' && (
                <div className="py-10 flex flex-col items-center gap-3">
                  <Loader2 className="w-10 h-10 text-[#4F8EF7] animate-spin" />
                  <p className="font-medium text-gray-700 text-sm">Saving to project...</p>
                </div>
              )}

              {/* done */}
              {invoiceStep === 'done' && (
                <div className="py-10 flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-gray-900">Saved!</p>
                    <p className="text-xs text-gray-500 mt-1">Invoice linked to {project.name}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
