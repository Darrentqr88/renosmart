'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin, ChevronDown, ChevronUp, Receipt, Loader2, CheckCircle2, X, Upload, Camera, Check, Navigation } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { watchGeofence } from '@/lib/utils/geofence';
import { useI18n } from '@/lib/i18n/context';
import WorkerTaskCard, { WorkerTask } from './WorkerTaskCard';

export interface ProjectSummary {
  id: string;
  name: string;
  address?: string;
  site_lat?: number | null;
  site_lng?: number | null;
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
  onPhotoUploaded?: () => void;
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
  onPhotoUploaded,
}: WorkerProjectCardProps) {
  const supabase = createClient();
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const today = new Date().toISOString().split('T')[0];

  const [tasksExpanded, setTasksExpanded] = useState(true);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceTrade, setInvoiceTrade] = useState<string | null>(null);

  // Check-in state (persisted per project in localStorage)
  const storageKey = `checkin_${project.id}_${today}`;
  const [checkin, setCheckin] = useState<CheckinState>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey);
      if (stored) return JSON.parse(stored);
    }
    return { status: 'idle' };
  });

  // Recover check-in state from DB if localStorage is empty
  useEffect(() => {
    if (checkin.status !== 'idle') return; // already have state from localStorage
    (async () => {
      const { data: events } = await supabase
        .from('project_events')
        .select('event_type, notes')
        .eq('project_id', project.id)
        .eq('user_id', sessionUserId)
        .eq('event_date', today)
        .in('event_type', ['worker_checkin', 'worker_checkout'])
        .order('created_at', { ascending: false });
      if (!events || events.length === 0) return;
      const hasCheckout = events.some(e => e.event_type === 'worker_checkout');
      const checkinEvent = events.find(e => e.event_type === 'worker_checkin');
      const checkoutEvent = events.find(e => e.event_type === 'worker_checkout');
      const extractTime = (notes?: string) => {
        const match = notes?.match(/at (\d{1,2}:\d{2}\s*[AP]?M?)/i);
        return match ? match[1] : undefined;
      };
      if (hasCheckout) {
        const state: CheckinState = { status: 'checked_out', time: extractTime(checkinEvent?.notes), checkoutTime: extractTime(checkoutEvent?.notes) };
        setCheckin(state);
        localStorage.setItem(storageKey, JSON.stringify(state));
      } else if (checkinEvent) {
        const state: CheckinState = { status: 'checked_in', time: extractTime(checkinEvent.notes) };
        setCheckin(state);
        localStorage.setItem(storageKey, JSON.stringify(state));
      }
    })();
  }, [project.id, sessionUserId, today]);

  // Auto checkout timeout ref
  const autoCheckoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Use ref to track checkin status inside geofence callbacks (avoids stale closures & re-subscriptions)
  const checkinRef = useRef(checkin);
  checkinRef.current = checkin;

  // Geofence auto check-in / auto check-out — runs once per coordinate set
  useEffect(() => {
    if (!project.site_lat || !project.site_lng) return;

    const cleanup = watchGeofence(project.site_lat, project.site_lng, {
      radiusMeters: 200,
      onEnter: async () => {
        // Auto check-in only if idle (not checked_in or checked_out)
        if (checkinRef.current.status !== 'idle') return;
        // Clear any pending auto-checkout timer
        if (autoCheckoutTimerRef.current) clearTimeout(autoCheckoutTimerRef.current);
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' });
        const state: CheckinState = { status: 'checked_in', time: timeStr };
        setCheckin(state);
        localStorage.setItem(storageKey, JSON.stringify(state));
        await supabase.from('project_events').insert({
          project_id: project.id,
          user_id: sessionUserId,
          event_type: 'worker_checkin',
          title: `${profileName} auto checked in`,
          event_date: today,
          notes: `Auto check-in at ${timeStr} (geofence)`,
        });
        fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: project.id,
            event_type: 'worker_checkin',
            worker_name: profileName,
            message: `${profileName} arrived at ${project.name}`,
            exclude_user_id: sessionUserId,
          }),
        }).catch(() => {});
      },
      onLeave: () => {
        // Worker left site — start 15-min auto checkout timer only if checked_in
        if (checkinRef.current.status !== 'checked_in') return;
        autoCheckoutTimerRef.current = setTimeout(async () => {
          // Double-check status hasn't changed during the 15 min wait
          if (checkinRef.current.status !== 'checked_in') return;
          const now = new Date();
          const timeStr = now.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' });
          const state: CheckinState = { status: 'checked_out', time: checkinRef.current.time, checkoutTime: timeStr };
          setCheckin(state);
          localStorage.setItem(storageKey, JSON.stringify(state));
          await supabase.from('project_events').insert({
            project_id: project.id,
            user_id: sessionUserId,
            event_type: 'worker_checkout',
            title: `${profileName} auto checked out`,
            event_date: today,
            notes: `Auto check-out at ${timeStr} (auto_checkout)`,
          });
          fetch('/api/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              project_id: project.id,
              event_type: 'worker_checkout',
              worker_name: profileName,
              message: `${profileName} left ${project.name} (auto)`,
              exclude_user_id: sessionUserId,
            }),
          }).catch(() => {});
        }, 15 * 60 * 1000); // 15 minutes
      },
    });

    return () => {
      cleanup();
      if (autoCheckoutTimerRef.current) clearTimeout(autoCheckoutTimerRef.current);
    };
    // Only re-subscribe when coordinates change, not on every status change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.site_lat, project.site_lng]);

  // Invoice (receipt) state
  const [invoiceStep, setInvoiceStep] = useState<InvoiceStep>('idle');
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);

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

      await supabase.from('project_events').insert({
        project_id: project.id,
        user_id: sessionUserId,
        event_type: 'worker_checkin',
        title: `${profileName} checked in`,
        event_date: today,
        notes: `Checked in at ${timeStr} · GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
      });

      // Save GPS as site coordinates if not set
      if (!project.site_lat || !project.site_lng) {
        await supabase.from('projects').update({
          site_lat: pos.coords.latitude,
          site_lng: pos.coords.longitude,
        }).eq('id', project.id);
      }

      // Notify designer + owner
      fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: project.id,
          event_type: 'worker_checkin',
          worker_name: profileName,
          message: `${profileName} checked in at ${project.name}`,
          exclude_user_id: sessionUserId,
        }),
      }).catch(() => {});
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

      fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: project.id,
          event_type: 'worker_checkin',
          worker_name: profileName,
          message: `${profileName} checked in at ${project.name}`,
          exclude_user_id: sessionUserId,
        }),
      }).catch(() => {});
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

    fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: project.id,
        event_type: 'worker_checkout',
        worker_name: profileName,
        message: `${profileName} checked out from ${project.name}`,
        exclude_user_id: sessionUserId,
      }),
    }).catch(() => {});
  };

  // Invoice OCR flow
  const handleFileSelect = async (file: File) => {
    setOcrError(null);
    setInvoiceFile(file);
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
          setOcrError(t.worker.scanFailed);
          setInvoiceStep('idle');
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setOcrError(t.worker.readFailed);
      setInvoiceStep('idle');
    }
  };

  // Category mapping for Cost Database learning
  const CATEGORY_MAP: Record<string, string> = {
    tiling_material: 'Tiling', electrical_material: 'Electrical',
    plumbing_material: 'Plumbing', carpentry_material: 'Carpentry',
    paint: 'Painting', cement: 'Construction', steel: 'Metal Work',
    general_labour: 'Cleaning', waterproofing: 'Waterproofing',
    ceiling: 'False Ceiling', flooring: 'Flooring', ac: 'Air Conditioning',
    glass: 'Glass', aluminium: 'Aluminium', roofing: 'Roofing',
    landscape: 'Landscape', construction: 'Construction',
    demolition: 'Demolition', other: 'Other',
  };

  const handleSaveInvoice = async () => {
    if (!ocrResult) return;
    setInvoiceStep('saving');
    try {
      // 1. Upload receipt file to Supabase Storage
      let receiptUrl: string | null = null;
      if (invoiceFile) {
        const ext = invoiceFile.name.split('.').pop() || 'jpg';
        const filePath = `${sessionUserId}/${project.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('receipts')
          .upload(filePath, invoiceFile, { contentType: invoiceFile.type });
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(filePath);
          receiptUrl = urlData?.publicUrl || null;
        } else {
          console.warn('[receipt] Storage upload failed:', uploadErr.message);
        }
      }

      // 2. Map category for Cost Database learning — use most frequent across all items
      const categoryCounts: Record<string, number> = {};
      for (const item of ocrResult.items) {
        const cat = item.category || 'other';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      }
      const rawCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'other';
      const mappedCategory = CATEGORY_MAP[rawCategory] || 'Other';

      // 3. Insert cost record with receipt_url, trade from task, and proper categorization
      await supabase.from('cost_records').insert({
        project_id: project.id,
        user_id: sessionUserId,
        uploaded_by: sessionUserId,
        supplier: ocrResult.supplier || 'Unknown Supplier',
        receipt_date: ocrResult.date || today,
        receipt_number: ocrResult.receipt_number || null,
        category: rawCategory,
        subcategory: mappedCategory,
        trade: invoiceTrade || null,
        work_item: invoiceTrade || null,
        description: ocrResult.supplier || 'Receipt',
        amount: ocrResult.total_amount,
        items: ocrResult.items,
        receipt_url: receiptUrl,
      });
      setInvoiceStep('done');
      setTimeout(() => {
        setInvoiceOpen(false);
        setInvoiceStep('idle');
        setOcrResult(null);
        setInvoiceFile(null);
      }, 1800);
    } catch {
      setOcrError(t.worker.saveFailed);
      setInvoiceStep('review');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-3">
      {/* Project header — name + address with navigation */}
      <div className="px-4 pt-3.5 pb-3">
        <div className="flex items-center gap-2 mb-1.5">
          <h2 className="font-bold text-gray-900 text-[15px] truncate">{project.name}</h2>
          <span className="text-[10px] font-medium text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded flex-shrink-0">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''}
          </span>
        </div>
        {project.address && (
          <div className="flex items-start gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#4F8EF7] flex-shrink-0 mt-0.5" />
            <p className="text-[12px] text-gray-600 leading-relaxed flex-1">{project.address}</p>
          </div>
        )}
        {/* Navigation buttons — use geo: intent to open native map apps */}
        {project.address && (
          <div className="flex items-center gap-2 mt-2">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(project.address || '')}`}
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-lg text-[10px] font-semibold text-blue-600 hover:bg-blue-100 transition-colors active:scale-95"
            >
              <Navigation className="w-3 h-3" />
              Google Maps
            </a>
            <a
              href={`https://waze.com/ul?q=${encodeURIComponent(project.address || '')}&navigate=yes`}
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#33CCFF]/10 rounded-lg text-[10px] font-semibold text-[#05C8F7] hover:bg-[#33CCFF]/20 transition-colors active:scale-95"
            >
              <Navigation className="w-3 h-3" />
              Waze
            </a>
            {/* Check-in status pill */}
            {checkin.status === 'checked_in' && (
              <div className="ml-auto flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-100 rounded-lg">
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                <span className="text-[10px] font-semibold text-green-600">{checkin.time}</span>
              </div>
            )}
            {checkin.status === 'checked_out' && (
              <div className="ml-auto flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-lg">
                <CheckCircle2 className="w-3 h-3 text-gray-400" />
                <span className="text-[10px] text-gray-400">{checkin.time}–{checkin.checkoutTime}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Task cards — directly embedded, no toggle */}
      {tasks.length > 0 && (
        <div className="px-3 pb-2 space-y-2">
          {tasks.map(task => (
            <WorkerTaskCard
              key={task.id}
              task={task}
              sessionUserId={sessionUserId}
              profileName={profileName}
              onProgressChange={onProgressChange}
              onSubtaskToggle={onSubtaskToggle}
              onComplete={onComplete}
              onPhotoClick={onPhotoClick}
              onReceiptClick={() => { setInvoiceOpen(true); setInvoiceStep('idle'); setOcrError(null); setInvoiceTrade(task.trade || null); }}
              onPhotoUploaded={onPhotoUploaded}
            />
          ))}
        </div>
      )}

      {/* Check-in / Check-out bar */}
      <div className="px-3 pb-3">
        {checkin.status === 'idle' && (
          <button
            onClick={handleCheckin}
            style={{ touchAction: 'manipulation' }}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#4F8EF7] text-white rounded-xl text-[12px] font-semibold transition-all active:scale-[0.97] shadow-sm shadow-[#4F8EF7]/20"
          >
            <MapPin className="w-4 h-4" />
            {t.worker.checkIn}
          </button>
        )}
        {checkin.status === 'detecting' && (
          <div className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-50 border border-amber-200/50 rounded-xl text-[12px] font-medium text-amber-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            {'Detecting location...'}
          </div>
        )}
        {checkin.status === 'checked_in' && (
          <button
            onClick={handleCheckout}
            style={{ touchAction: 'manipulation' }}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-100 rounded-xl text-[12px] font-semibold text-gray-600 transition-all active:scale-[0.97] hover:bg-gray-200"
          >
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            {t.worker.checkOut} · {checkin.time}
          </button>
        )}
        {checkin.status === 'checked_out' && (
          <div className="w-full flex items-center justify-center gap-2 py-2 bg-gray-50 rounded-xl text-[11px] text-gray-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {t.worker.checkIn} {checkin.time} — {t.worker.checkOut} {checkin.checkoutTime}
          </div>
        )}
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
                  <h3 className="font-bold text-gray-900">{t.worker.uploadInvoice}</h3>
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
                      <p className="font-semibold text-gray-700 text-sm">{t.worker.takePhotoOrUpload}</p>
                      <p className="text-xs text-gray-400 mt-1">JPG, PNG, PDF</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Upload className="w-3 h-3" /> {t.worker.selectFile}
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
                    <p className="font-semibold text-gray-700 text-sm">{t.worker.scanningReceipt}</p>
                    <p className="text-xs text-gray-400 mt-1">{t.worker.scanningWait}</p>
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
                      <label className="text-[11px] text-gray-500 font-medium block mb-1">{t.worker.supplier}</label>
                      <input
                        value={ocrResult.supplier || ''}
                        onChange={(e) => setOcrResult(p => p ? { ...p, supplier: e.target.value } : p)}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#4F8EF7]"
                        placeholder={t.worker.supplier}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-500 font-medium block mb-1">{t.worker.date}</label>
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
                      <p className="p-3 text-xs text-gray-400 text-center">{t.worker.noItemsDetected}</p>
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
                    <span className="text-sm font-medium text-gray-600">{t.worker.total}</span>
                    <span className="font-bold text-gray-900">RM {(ocrResult.total_amount ?? 0).toFixed(2)}</span>
                  </div>

                  {ocrError && <p className="text-xs text-red-500 text-center">{ocrError}</p>}

                  <div className="flex gap-3">
                    <button
                      onClick={() => { setInvoiceStep('idle'); setOcrResult(null); }}
                      className="flex-1 py-3 border border-gray-200 rounded-2xl text-sm text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                    >
                      {t.worker.retake}
                    </button>
                    <button
                      onClick={handleSaveInvoice}
                      className="flex-1 py-3 bg-[#4F8EF7] text-white rounded-2xl text-sm font-bold hover:bg-[#4F8EF7]-hover transition-colors"
                    >
                      <Check className="w-4 h-4" /> {t.worker.confirmSave}
                    </button>
                  </div>
                </div>
              )}

              {/* saving */}
              {invoiceStep === 'saving' && (
                <div className="py-10 flex flex-col items-center gap-3">
                  <Loader2 className="w-10 h-10 text-[#4F8EF7] animate-spin" />
                  <p className="font-medium text-gray-700 text-sm">{t.worker.savingProject}</p>
                </div>
              )}

              {/* done */}
              {invoiceStep === 'done' && (
                <div className="py-10 flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-gray-900">{t.worker.saved}</p>
                    <p className="text-xs text-gray-500 mt-1">{t.worker.invoiceLinked} {project.name}</p>
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
