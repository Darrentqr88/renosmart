'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Camera, Receipt, CheckCircle2, Clock, AlertTriangle, Timer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { differenceInDays, parseISO } from 'date-fns';

export interface TaskSubtask {
  id: string;
  name: string;
  name_zh?: string;
  completed: boolean;
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
}

interface WorkerTaskCardProps {
  task: WorkerTask;
  onProgressChange: (taskId: string, progress: number) => void;
  onSubtaskToggle: (taskId: string, subtaskId: string) => void;
  onComplete: (taskId: string) => void;
  onPhotoClick: (task: WorkerTask) => void;
  onReceiptClick: (task: WorkerTask) => void;
}

// Trade-specific special indicators
const TRADE_WARNINGS: Record<string, { icon: string; text: string; color: string }> = {
  Waterproofing: { icon: '💧', text: '水压测试照片必须上传', color: '#3B82F6' },
  Electrical: { icon: '⚡', text: '封墙前需隐蔽验收照片', color: '#F59E0B' },
  Plumbing: { icon: '🔧', text: '水管压力测试需记录', color: '#06B6D4' },
};

// Detect carpentry factory phase
function getCarpentryCountdown(task: WorkerTask): { day: number; total: number } | null {
  if (task.trade !== 'Carpentry') return null;
  const name = task.name.toLowerCase();
  if (!name.includes('manufactur') && !name.includes('factory') && !name.includes('工厂') && !name.includes('生产')) return null;
  const start = parseISO(task.start_date);
  const today = new Date();
  const elapsed = differenceInDays(today, start) + 1;
  const total = differenceInDays(parseISO(task.end_date), start) + 1;
  return { day: Math.max(1, Math.min(elapsed, total)), total };
}

export default function WorkerTaskCard({
  task,
  onProgressChange,
  onSubtaskToggle,
  onComplete,
  onPhotoClick,
  onReceiptClick,
}: WorkerTaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [pendingProgress, setPendingProgress] = useState(task.progress);

  useEffect(() => {
    setPendingProgress(task.progress);
  }, [task.progress]);

  const subtasks = task.subtasks || [];
  const completedCount = subtasks.filter(s => s.completed).length;
  const warning = TRADE_WARNINGS[task.trade];
  const carpentryCountdown = getCarpentryCountdown(task);
  const isComplete = task.progress === 100;

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

        {/* Date range */}
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-3">
          <Clock className="w-3 h-3" />
          <span>{formatDate(task.start_date)} — {formatDate(task.end_date)}</span>
        </div>

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
            <span>工厂生产中 — 第 {carpentryCountdown.day}/{carpentryCountdown.total} 天</span>
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
            {/* Background track */}
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

      {/* Subtask checklist */}
      {subtasks.length > 0 && (
        <div className="border-t border-gray-50">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors"
          >
            <span className="text-[11px] font-semibold text-gray-600 flex items-center gap-1.5">
              📋 工序清单
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${completedCount === subtasks.length ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                {completedCount}/{subtasks.length}
              </span>
            </span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
          </button>

          {expanded && (
            <div className="px-4 pb-3 space-y-1.5 max-h-44 overflow-y-auto">
              {subtasks.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => onSubtaskToggle(task.id, sub.id)}
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
        <button
          onClick={() => onComplete(task.id)}
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
      </div>
    </div>
  );
}
