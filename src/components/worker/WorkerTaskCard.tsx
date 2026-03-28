'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, ChevronUp, Camera, Receipt, CheckCircle2, Clock, Timer, Pencil, X, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { differenceInDays, parseISO } from 'date-fns';
import { createClient } from '@/lib/supabase/client';

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
}

// Trade-specific special indicators
const TRADE_WARNINGS: Record<string, { icon: string; text: string; color: string }> = {
  Waterproofing: { icon: '\u{1F4A7}', text: '\u6C34\u538B\u6D4B\u8BD5\u7167\u7247\u5FC5\u987B\u4E0A\u4F20', color: '#3B82F6' },
  Electrical: { icon: '\u26A1', text: '\u5C01\u5899\u524D\u9700\u9690\u853D\u9A8C\u6536\u7167\u7247', color: '#F59E0B' },
  Plumbing: { icon: '\u{1F527}', text: '\u6C34\u7BA1\u538B\u529B\u6D4B\u8BD5\u9700\u8BB0\u5F55', color: '#06B6D4' },
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
}: WorkerTaskCardProps) {
  const supabase = createClient();
  const [expanded, setExpanded] = useState(false);
  const [workItemsExpanded, setWorkItemsExpanded] = useState(false);
  const [pendingProgress, setPendingProgress] = useState(task.progress);
  const [editingDuration, setEditingDuration] = useState(false);
  const [newDays, setNewDays] = useState('');
  const [showCompletionBanner, setShowCompletionBanner] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setPendingProgress(task.progress);
  }, [task.progress]);

  const subtasks = task.subtasks || [];
  const completedCount = subtasks.filter(s => s.completed).length;
  const allSubtasksDone = subtasks.length > 0 && completedCount === subtasks.length;
  const warning = TRADE_WARNINGS[task.trade];
  const carpentryCountdown = getCarpentryCountdown(task);
  const isComplete = task.progress === 100;
  const durationDays = differenceInDays(parseISO(task.end_date), parseISO(task.start_date)) + 1;
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

  // Handle duration change
  const handleDurationSave = async () => {
    const days = parseInt(newDays);
    if (isNaN(days) || days < 1) return;

    // Calculate new end_date (simple: add days to start_date, skipping weekends)
    const start = parseISO(task.start_date);
    let date = new Date(start);
    let added = 0;
    while (added < days) {
      date.setDate(date.getDate() + 1);
      const day = date.getDay();
      if (day !== 0 && day !== 6) added++;
    }
    const newEndDate = date.toISOString().split('T')[0];

    // Update in DB — only this task, no cascade
    await supabase.from('gantt_tasks').update({
      end_date: newEndDate,
    }).eq('id', task.id);

    // Notify designer
    fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: task.project_id,
        event_type: 'duration_changed',
        worker_name: profileName,
        message: `${profileName} changed "${task.name}" duration from ${durationDays} to ${days} days`,
        exclude_user_id: sessionUserId,
      }),
    }).catch(() => {});

    setEditingDuration(false);
    setNewDays('');
  };

  // Handle completion with notification
  const handleComplete = () => {
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
      className="bg-white rounded-2xl shadow-sm overflow-hidden"
      style={{ borderLeft: `4px solid ${task.color}` }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide truncate">{task.project_name}</p>
            <h3 className="font-semibold text-gray-900 text-sm leading-tight mt-0.5">{task.name}</h3>
            {task.name_zh && task.name_zh !== task.name && (
              <p className="text-[11px] text-gray-400 mt-0.5">{task.name_zh}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <Badge
              className="text-[10px] px-2 py-0.5 font-medium"
              style={{ backgroundColor: `${task.color}18`, color: task.color, border: `1px solid ${task.color}30` }}
            >
              {task.trade}
            </Badge>
            {isComplete && (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            )}
          </div>
        </div>

        {/* Date range + duration + edit */}
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-2">
          <Clock className="w-3 h-3" />
          <span>{formatDate(task.start_date)} — {formatDate(task.end_date)}</span>
          <span className="text-gray-300">·</span>
          <span className="font-medium text-gray-500">{durationDays} days</span>
          {!isComplete && !editingDuration && (
            <button
              onClick={() => { setEditingDuration(true); setNewDays(String(durationDays)); }}
              className="ml-1 p-0.5 rounded hover:bg-gray-100 transition-colors"
            >
              <Pencil className="w-3 h-3 text-gray-400" />
            </button>
          )}
        </div>

        {/* Duration edit inline */}
        {editingDuration && (
          <div className="flex items-center gap-2 mb-3 bg-blue-50 rounded-lg px-3 py-2">
            <span className="text-[11px] text-blue-600 font-medium whitespace-nowrap">New duration:</span>
            <input
              type="number"
              min={1}
              value={newDays}
              onChange={(e) => setNewDays(e.target.value)}
              className="w-16 text-center text-sm border border-blue-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
              autoFocus
            />
            <span className="text-[11px] text-blue-500">days</span>
            <button onClick={handleDurationSave} className="p-1 bg-blue-500 text-white rounded-md hover:bg-blue-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setEditingDuration(false)} className="p-1 text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Trade-specific badges */}
        {warning && !isComplete && (
          <div
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 mb-3 text-[11px] font-medium"
            style={{ backgroundColor: `${warning.color}12`, color: warning.color }}
          >
            <span>{warning.icon}</span>
            <span>{warning.text}</span>
          </div>
        )}

        {/* Carpentry factory countdown */}
        {carpentryCountdown && !isComplete && (
          <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 mb-3 bg-indigo-50 text-indigo-600 text-[11px] font-medium">
            <Timer className="w-3 h-3" />
            <span>{'\u5DE5\u5382\u751F\u4EA7\u4E2D'} — {'\u7B2C'} {carpentryCountdown.day}/{carpentryCountdown.total} {'\u5929'}</span>
          </div>
        )}

        {/* Progress bar + slider */}
        <div className="mb-1">
          <div className="flex justify-between text-[11px] mb-1.5">
            <span className="text-gray-400">Progress</span>
            <span className={`font-semibold ${isComplete ? 'text-green-600' : 'text-gray-700'}`}>
              {pendingProgress}%
            </span>
          </div>
          <div className="relative">
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1">
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
              className="w-full h-1 opacity-0 absolute top-0 cursor-pointer"
              style={{ WebkitAppearance: 'none' }}
            />
          </div>
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
              Work Items
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

      {/* Subtask checklist */}
      {subtasks.length > 0 && (
        <div className="border-t border-gray-50">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors"
          >
            <span className="text-[11px] font-semibold text-gray-600 flex items-center gap-1.5">
              {'\u{1F4CB}'} Task Checklist
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${completedCount === subtasks.length ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                {completedCount}/{subtasks.length}
              </span>
            </span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
          </button>

          {expanded && (
            <div className="px-4 pb-3 space-y-1.5 max-h-52 overflow-y-auto">
              {subtasks.map((sub) => (
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
                    {sub.name_zh || sub.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Completion banner — shows when all subtasks done */}
      {showCompletionBanner && (
        <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-yellow-50 border-t border-amber-100">
          <button
            onClick={handleComplete}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#F0B90B] to-[#F7D060] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.98] animate-pulse"
          >
            {'\u{1F389}'} All tasks done! Confirm completion?
          </button>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 px-4 pb-4 pt-2">
        <button
          onClick={() => onPhotoClick(task)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[12px] font-medium text-gray-600 hover:bg-gray-100 transition-colors active:scale-95"
        >
          <Camera className="w-3.5 h-3.5" />
          Photo
        </button>
        <button
          onClick={() => onReceiptClick(task)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[12px] font-medium text-amber-700 hover:bg-amber-100 transition-colors active:scale-95"
        >
          <Receipt className="w-3.5 h-3.5" />
          Invoice
        </button>
        {!showCompletionBanner && (
          <button
            onClick={handleComplete}
            disabled={isComplete}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-semibold transition-colors active:scale-95 ${
              isComplete
                ? 'bg-green-100 text-green-600 border border-green-200'
                : 'bg-[#4F8EF7] text-white hover:bg-[#3B7BE8]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {isComplete ? 'Done' : 'Complete'}
          </button>
        )}
      </div>
    </div>
  );
}
