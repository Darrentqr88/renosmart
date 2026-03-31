'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, ChevronUp, Camera, Receipt, CheckCircle2, Clock, Timer, Pencil, X, FileText, Loader2, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { differenceInDays, parseISO } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { useI18n } from '@/lib/i18n/context';

export interface TaskSubtask {
  id: string;
  name: string;
  name_zh?: string;
  completed: boolean;
}

export interface QuotationItem {
  name: string;
  unit?: string;
  qty?: number;
}

export interface WorkerTask {
  id: string;
  name: string;
  name_zh?: string;
  project_id: string;
  project_name: string;
  project_address?: string;
  trade: string;
  start_date: string;
  end_date: string;
  progress: number;
  color: string;
  subtasks?: TaskSubtask[];
  quotation_items?: QuotationItem[];
}

interface WorkerTaskCardProps {
  task: WorkerTask;
  sessionUserId: string;
  profileName: string;
  onProgressChange: (taskId: string, progress: number) => void;
  onSubtaskToggle: (taskId: string, subtaskId: string) => void;
  onComplete: (taskId: string) => void;
  onPhotoClick: (task: WorkerTask) => void;
  onReceiptClick: (task: WorkerTask) => void;
  onPhotoUploaded?: () => void;
}

// Trade-specific special indicators — keys for i18n
const TRADE_WARNINGS: Record<string, { icon: string; textEN: string; textZH: string; textBM: string; color: string }> = {
  Waterproofing: { icon: '\u{1F4A7}', textEN: 'Water pressure test photos required', textZH: '\u6C34\u538B\u6D4B\u8BD5\u7167\u7247\u5FC5\u987B\u4E0A\u4F20', textBM: 'Foto ujian tekanan air diperlukan', color: '#3B82F6' },
  Electrical: { icon: '\u26A1', textEN: 'Concealed wiring inspection photos needed', textZH: '\u5C01\u5899\u524D\u9700\u9690\u853D\u9A8C\u6536\u7167\u7247', textBM: 'Foto pemeriksaan pendawaian tersembunyi diperlukan', color: '#F59E0B' },
  Plumbing: { icon: '\u{1F527}', textEN: 'Pipe pressure test records required', textZH: '\u6C34\u7BA1\u538B\u529B\u6D4B\u8BD5\u9700\u8BB0\u5F55', textBM: 'Rekod ujian tekanan paip diperlukan', color: '#06B6D4' },
};

// Detect carpentry factory phase
function getCarpentryCountdown(task: WorkerTask): { day: number; total: number } | null {
  if (task.trade !== 'Carpentry') return null;
  const name = task.name.toLowerCase();
  if (!name.includes('manufactur') && !name.includes('factory') && !name.includes('\u5DE5\u5382') && !name.includes('\u751F\u4EA7')) return null;
  const start = parseISO(task.start_date);
  const today = new Date();
  const elapsed = differenceInDays(today, start) + 1;
  const total = differenceInDays(parseISO(task.end_date), start) + 1;
  return { day: Math.max(1, Math.min(elapsed, total)), total };
}

export default function WorkerTaskCard({
  task,
  sessionUserId,
  profileName,
  onProgressChange,
  onSubtaskToggle,
  onComplete,
  onPhotoClick,
  onReceiptClick,
  onPhotoUploaded,
}: WorkerTaskCardProps) {
  const supabase = createClient();
  const { lang, t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const [workItemsExpanded, setWorkItemsExpanded] = useState(false);
  const [pendingProgress, setPendingProgress] = useState(task.progress);
  const [editingDuration, setEditingDuration] = useState(false);
  const [newDays, setNewDays] = useState('');
  const [showCompletionBanner, setShowCompletionBanner] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Inline photo upload
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoDone, setPhotoDone] = useState(false);

  const [photoError, setPhotoError] = useState<string | null>(null);

  const handlePhotoUpload = async (file: File) => {
    setPhotoUploading(true);
    setPhotoError(null);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${sessionUserId}/${Date.now()}.${ext}`;
      const { error: storageError } = await supabase.storage
        .from('site-photos')
        .upload(path, file, { contentType: file.type, upsert: false });

      if (storageError) {
        console.error('Storage upload error:', storageError.message);
        setPhotoError(storageError.message);
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from('site-photos').getPublicUrl(path);

      const { error: dbError } = await supabase.from('site_photos').insert({
        project_id: task.project_id,
        user_id: sessionUserId,
        uploaded_by: sessionUserId,
        uploader_id: sessionUserId,
        url: publicUrl,
        file_url: publicUrl,
        caption: `[during] ${task.name}`,
        trade: task.trade || null,
        approved: false,
      });

      if (dbError) {
        console.error('DB insert error:', dbError.message);
        setPhotoError(dbError.message);
        return;
      }

      setPhotoDone(true);
      onPhotoUploaded?.();
      setTimeout(() => setPhotoDone(false), 2000);
    } catch (err) {
      console.error('Photo upload failed:', err);
      setPhotoError('Upload failed');
    } finally {
      setPhotoUploading(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  useEffect(() => {
    setPendingProgress(task.progress);
  }, [task.progress]);

  const subtasks = task.subtasks || [];
  const completedCount = subtasks.filter(s => s.completed).length;
  const allSubtasksDone = subtasks.length > 0 && completedCount === subtasks.length;
  const warning = TRADE_WARNINGS[task.trade];
  const carpentryCountdown = getCarpentryCountdown(task);
  const isComplete = task.progress === 100;
  // Count workdays (excluding weekends) for display consistency with input
  const durationDays = (() => {
    const start = parseISO(task.start_date);
    const end = parseISO(task.end_date);
    let count = 0;
    let d = new Date(start);
    while (d <= end) {
      const day = d.getDay();
      if (day !== 0 && day !== 6) count++;
      d.setDate(d.getDate() + 1);
    }
    return count || 1;
  })();
  const quotationItems = task.quotation_items || [];

  // Show completion banner when all subtasks are done
  useEffect(() => {
    if (allSubtasksDone && !isComplete) {
      setShowCompletionBanner(true);
    } else {
      setShowCompletionBanner(false);
    }
  }, [allSubtasksDone, isComplete]);

  // Auto-save subtask toggle with debounce
  const handleSubtaskToggle = useCallback((subtaskId: string) => {
    onSubtaskToggle(task.id, subtaskId);

    // Debounced auto-save to DB
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      // The parent handles the actual DB save through onSubtaskToggle
      // Progress auto-calculates based on completed subtasks
      const newCompleted = subtasks.filter(s =>
        s.id === subtaskId ? !s.completed : s.completed
      ).length;
      const newProgress = subtasks.length > 0 ? Math.round((newCompleted / subtasks.length) * 100) : 0;
      onProgressChange(task.id, newProgress);
    }, 300);
  }, [task.id, subtasks, onSubtaskToggle, onProgressChange]);

  // Handle duration change — saves to DB and triggers designer Gantt cascade
  const handleDurationSave = async () => {
    const days = parseInt(newDays);
    if (isNaN(days) || days < 1 || days === durationDays) {
      setEditingDuration(false);
      return;
    }

    // Calculate new end_date (start_date counts as day 1, skip weekends)
    const start = parseISO(task.start_date);
    let date = new Date(start);
    let added = 1; // start_date is day 1
    while (added < days) {
      date.setDate(date.getDate() + 1);
      const day = date.getDay();
      if (day !== 0 && day !== 6) added++;
    }
    const newEndDate = date.toISOString().split('T')[0];

    // Update this task in DB (duration + end_date + updated_at)
    const { error } = await supabase.from('gantt_tasks').update({
      end_date: newEndDate,
      duration: days,
      updated_at: new Date().toISOString(),
    }).eq('id', task.id);

    if (error) {
      console.error('Duration update failed:', error.message);
      return;
    }

    // Also cascade: update all dependent tasks' start/end dates
    // Fetch all project tasks to recalculate
    const { data: allTasks } = await supabase
      .from('gantt_tasks')
      .select('id, start_date, end_date, duration, dependencies, sort_order')
      .eq('project_id', task.project_id)
      .order('sort_order');

    if (allTasks && allTasks.length > 1) {
      // Update this task in the local list
      const taskMap = new Map(allTasks.map(t => [t.id, { ...t }]));
      const thisTask = taskMap.get(task.id);
      if (thisTask) {
        thisTask.end_date = newEndDate;
        thisTask.duration = days;
      }

      // Forward cascade: shift all tasks that depend on this one
      const updates: { id: string; start_date: string; end_date: string }[] = [];
      const visited = new Set<string>();

      const cascadeFrom = (changedId: string) => {
        if (visited.has(changedId)) return;
        visited.add(changedId);
        const changedTask = taskMap.get(changedId);
        if (!changedTask) return;

        for (const [tid, t] of taskMap) {
          if (tid === changedId) continue;
          const deps = (t.dependencies as string[]) || [];
          if (!deps.includes(changedId)) continue;

          // This task depends on the changed one — recalculate start
          const depEnds = deps.map(d => taskMap.get(d)?.end_date).filter(Boolean) as string[];
          const latestDepEnd = depEnds.sort().pop();
          if (!latestDepEnd) continue;

          // Next workday after latest dep end
          let newStart = parseISO(latestDepEnd);
          newStart.setDate(newStart.getDate() + 1);
          while (newStart.getDay() === 0 || newStart.getDay() === 6) {
            newStart.setDate(newStart.getDate() + 1);
          }
          const newStartStr = newStart.toISOString().split('T')[0];

          // Calculate new end from duration (start counts as day 1)
          const dur = (t.duration as number) || 3;
          let endDate = new Date(newStart);
          let count = 1; // start date is day 1
          while (count < dur) {
            endDate.setDate(endDate.getDate() + 1);
            if (endDate.getDay() !== 0 && endDate.getDay() !== 6) count++;
          }
          const newEndStr = endDate.toISOString().split('T')[0];

          if (newStartStr !== t.start_date || newEndStr !== t.end_date) {
            t.start_date = newStartStr;
            t.end_date = newEndStr;
            updates.push({ id: tid, start_date: newStartStr, end_date: newEndStr });
            cascadeFrom(tid); // Continue cascading
          }
        }
      };

      cascadeFrom(task.id);

      // Batch update dependent tasks
      for (const u of updates) {
        await supabase.from('gantt_tasks').update({
          start_date: u.start_date,
          end_date: u.end_date,
          updated_at: new Date().toISOString(),
        }).eq('id', u.id);
      }
    }

    // Notify designer about the change
    fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: task.project_id,
        event_type: 'duration_changed',
        worker_name: profileName,
        message: `${profileName} adjusted "${task.name}" from ${durationDays} to ${days} days. Dependent tasks auto-updated.`,
        exclude_user_id: sessionUserId,
      }),
    }).catch(() => {});

    setEditingDuration(false);
    setNewDays('');

    // Reload to reflect cascaded changes
    window.location.reload();
  };

  const [showConfirm, setShowConfirm] = useState(false);

  // Handle completion with confirmation + notification
  const handleComplete = () => {
    if (isComplete) {
      // Undo: revert to 90%
      onProgressChange(task.id, 90);
      setPendingProgress(90);
      return;
    }
    setShowConfirm(true);
  };

  const confirmComplete = () => {
    setShowConfirm(false);
    onComplete(task.id);
    fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: task.project_id,
        event_type: 'task_completed',
        worker_name: profileName,
        message: `${profileName} completed "${task.name}"`,
        exclude_user_id: sessionUserId,
      }),
    }).catch(() => {});
  };

  return (
    <div
      className="rounded-xl overflow-hidden bg-gray-50/70 border border-gray-100"
      style={{ borderLeft: `3px solid ${task.color}` }}
    >
      {/* Header — task name + trade badge + progress */}
      <div className="px-3.5 pt-3 pb-2.5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-[13px] leading-tight">
              {task.name}
            </h3>
            {task.name_zh && task.name_zh !== task.name && (
              <p className="text-[10px] text-gray-400 mt-0.5">{task.name_zh}</p>
            )}
          </div>
          <Badge
            className="text-[9px] px-2 py-0.5 font-medium flex-shrink-0"
            style={{ backgroundColor: `${task.color}12`, color: task.color, border: `1px solid ${task.color}25` }}
          >
            {task.trade}
          </Badge>
        </div>

        {/* Date + duration row */}
        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mb-2.5">
          <Clock className="w-3 h-3" />
          <span>{formatDate(task.start_date)} — {formatDate(task.end_date)}</span>
          <span className="text-gray-200">·</span>
          <span className="font-medium text-gray-500">{durationDays}d</span>
          {!isComplete && !editingDuration && (
            <button
              onClick={() => { setEditingDuration(true); setNewDays(String(durationDays)); }}
              className="ml-0.5 p-0.5 rounded hover:bg-gray-200 transition-colors"
            >
              <Pencil className="w-2.5 h-2.5 text-gray-400" />
            </button>
          )}
        </div>

        {/* Duration edit inline */}
        {editingDuration && (
          <div className="flex items-center gap-2 mb-2.5 bg-blue-50 rounded-lg px-3 py-2">
            <input
              type="number"
              min={1}
              value={newDays}
              onChange={(e) => setNewDays(e.target.value)}
              className="w-14 text-center text-xs border border-blue-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
              autoFocus
            />
            <span className="text-[10px] text-blue-500">days</span>
            <button onClick={handleDurationSave} className="p-1 bg-blue-500 text-white rounded-md hover:bg-blue-600">
              <CheckCircle2 className="w-3 h-3" />
            </button>
            <button onClick={() => setEditingDuration(false)} className="p-1 text-gray-400 hover:text-gray-600">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Trade warnings */}
        {warning && !isComplete && (
          <div
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 mb-2.5 text-[10px] font-medium"
            style={{ backgroundColor: `${warning.color}08`, color: warning.color, border: `1px solid ${warning.color}15` }}
          >
            <span>{warning.icon}</span>
            <span>{lang === 'ZH' ? warning.textZH : lang === 'BM' ? warning.textBM : warning.textEN}</span>
          </div>
        )}

        {/* Carpentry factory countdown */}
        {carpentryCountdown && !isComplete && (
          <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 mb-2.5 bg-indigo-50/60 text-indigo-600 text-[10px] font-medium border border-indigo-100">
            <Timer className="w-3 h-3" />
            <span>
              {lang === 'ZH' ? '\u5DE5\u5382\u751F\u4EA7\u4E2D' : 'Factory'} — {lang === 'ZH' ? '\u7B2C' : 'Day'} {carpentryCountdown.day}/{carpentryCountdown.total}
            </span>
          </div>
        )}

        {/* Progress — compact inline */}
        <div className="flex items-center gap-2.5">
          <div className="flex-1 relative">
            <div className="h-[6px] bg-gray-200/60 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${pendingProgress}%`,
                  background: isComplete ? '#22C55E' : task.color,
                }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={pendingProgress}
              onChange={(e) => setPendingProgress(parseInt(e.target.value))}
              onMouseUp={() => onProgressChange(task.id, pendingProgress)}
              onTouchEnd={() => onProgressChange(task.id, pendingProgress)}
              className="w-full h-2 opacity-0 absolute top-[-2px] cursor-pointer"
              style={{ WebkitAppearance: 'none' }}
            />
          </div>
          <span className={`text-[11px] font-bold tabular-nums min-w-[32px] text-right ${isComplete ? 'text-green-600' : 'text-gray-600'}`}>
            {pendingProgress}%
          </span>
        </div>
      </div>

      {/* Quotation work items (no prices) */}
      {quotationItems.length > 0 && (
        <div className="border-t border-gray-50">
          <button
            onClick={() => setWorkItemsExpanded(!workItemsExpanded)}
            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors"
          >
            <span className="text-[11px] font-semibold text-gray-600 flex items-center gap-1.5">
              <FileText className="w-3 h-3" />
              {t.worker.workItems || 'Work Items'}
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-blue-50 text-blue-600">
                {quotationItems.length}
              </span>
            </span>
            {workItemsExpanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
          </button>

          {workItemsExpanded && (
            <div className="px-4 pb-3 space-y-1">
              {quotationItems.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 py-0.5">
                  <span className="text-gray-300 text-[11px] mt-0.5">{'\u2022'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-gray-700 leading-relaxed">{item.name}</p>
                    {(item.qty || item.unit) && (
                      <p className="text-[10px] text-gray-400">{item.qty} {item.unit}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Subtask checklist — first 3 visible, expand for more */}
      {subtasks.length > 0 && (
        <div className="border-t border-gray-50 px-4 pt-2.5 pb-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-gray-600 flex items-center gap-1.5">
              {'\u{1F4CB}'} {t.worker.taskChecklist || 'Task Checklist'}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${completedCount === subtasks.length ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                {completedCount}/{subtasks.length}
              </span>
            </span>
          </div>

          {/* Always show first 3 */}
          <div className="space-y-1.5">
            {subtasks.slice(0, 3).map((sub) => (
              <button
                key={sub.id}
                onClick={() => handleSubtaskToggle(sub.id)}
                className="w-full flex items-start gap-2.5 py-1 text-left group"
              >
                <div className={`w-4 h-4 rounded flex-shrink-0 border flex items-center justify-center mt-0.5 transition-all ${
                  sub.completed
                    ? 'bg-[#00C9A7] border-[#00C9A7]'
                    : 'bg-white border-gray-300 group-hover:border-gray-400'
                }`}>
                  {sub.completed && (
                    <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                      <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span className={`text-[12px] leading-relaxed ${sub.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                  {lang === 'ZH' ? (sub.name_zh || sub.name) : sub.name}
                </span>
              </button>
            ))}
          </div>

          {/* Expand for items beyond 3 */}
          {subtasks.length > 3 && (
            <>
              {expanded && (
                <div className="space-y-1.5 mt-1">
                  {subtasks.slice(3).map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => handleSubtaskToggle(sub.id)}
                      className="w-full flex items-start gap-2.5 py-1 text-left group"
                    >
                      <div className={`w-4 h-4 rounded flex-shrink-0 border flex items-center justify-center mt-0.5 transition-all ${
                        sub.completed
                          ? 'bg-[#00C9A7] border-[#00C9A7]'
                          : 'bg-white border-gray-300 group-hover:border-gray-400'
                      }`}>
                        {sub.completed && (
                          <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                            <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <span className={`text-[12px] leading-relaxed ${sub.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                        {lang === 'ZH' ? (sub.name_zh || sub.name) : sub.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-[#4F8EF7] hover:text-[#3B7BE8] transition-colors"
              >
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {expanded
                  ? (lang === 'ZH' ? '收起' : lang === 'BM' ? 'Tunjuk kurang' : 'Show less')
                  : (lang === 'ZH' ? `展开更多 (${subtasks.length - 3})`
                    : lang === 'BM' ? `Tunjuk ${subtasks.length - 3} lagi`
                    : `Show ${subtasks.length - 3} more`)}
              </button>
            </>
          )}
        </div>
      )}

      {/* Completion banner — shows when all subtasks done */}
      {showCompletionBanner && (
        <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-yellow-50 border-t border-amber-100">
          <button
            onClick={() => setShowConfirm(true)}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#F0B90B] to-[#F7D060] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.98] animate-pulse"
          >
            {t.worker.allDone || 'All tasks done! Confirm completion?'}
          </button>
        </div>
      )}

      {/* Confirm dialog */}
      {showConfirm && (
        <div className="px-3.5 py-3 bg-amber-50 border-t border-amber-100">
          <p className="text-xs text-gray-700 font-medium text-center mb-2.5">
            {lang === 'ZH' ? '确认标记为完工？' : lang === 'BM' ? 'Sahkan siap?' : 'Mark as completed?'}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowConfirm(false)}
              className="flex-1 py-2 rounded-lg bg-white border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
            >
              {lang === 'ZH' ? '取消' : lang === 'BM' ? 'Batal' : 'Cancel'}
            </button>
            <button
              onClick={confirmComplete}
              className="flex-1 py-2 rounded-lg bg-green-500 text-white text-xs font-bold hover:bg-green-600 transition-colors"
            >
              {lang === 'ZH' ? '确认完工' : lang === 'BM' ? 'Sahkan' : 'Confirm'}
            </button>
          </div>
        </div>
      )}

      {/* Hidden file input for photo */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); }}
      />

      {/* Photo error message */}
      {photoError && (
        <div className="mx-3.5 mb-1 px-3 py-1.5 bg-red-50 border border-red-100 rounded-lg">
          <p className="text-[10px] text-red-600 font-medium">Upload error: {photoError}</p>
        </div>
      )}

      {/* Action bar */}
      <div className="border-t border-gray-100 px-3.5 py-2.5 flex items-center gap-2">
        {/* Photo — inline upload, no tab switch */}
        <button
          onClick={() => { setPhotoError(null); photoInputRef.current?.click(); }}
          disabled={photoUploading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors active:scale-95 disabled:opacity-50"
        >
          {photoUploading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#4F8EF7]" />
          ) : photoDone ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <Camera className="w-4 h-4" />
          )}
          {photoUploading ? 'Uploading...' : photoDone ? 'Done!' : t.worker.photo}
        </button>
        <button
          onClick={() => onReceiptClick(task)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium text-amber-600 hover:bg-amber-50 transition-colors active:scale-95"
        >
          <Receipt className="w-4 h-4" />
          {t.worker.invoice}
        </button>

        {/* Primary action — pushed to right */}
        {!showCompletionBanner && (
          <button
            onClick={handleComplete}
            className={`ml-auto flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-semibold transition-all active:scale-95 ${
              isComplete
                ? 'bg-green-50 text-green-600 border border-green-200 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200'
                : 'bg-[#4F8EF7] text-white shadow-sm shadow-blue-200/50 hover:bg-[#3B7BE8]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {isComplete ? (lang === 'ZH' ? '已完工 ↩' : lang === 'BM' ? 'Siap ↩' : 'Done ↩') : t.worker.confirmComplete}
          </button>
        )}
      </div>
    </div>
  );
}
