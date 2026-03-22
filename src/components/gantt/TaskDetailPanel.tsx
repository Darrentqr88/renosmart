'use client';

import { useState, useEffect } from 'react';
import { GanttTask, QuotationItem, TradeHint } from '@/types';
import { getPhaseChecklist, getPhaseById, classifyItemTrade, tradeMatches } from '@/lib/utils/gantt-rules';
import { useI18n } from '@/lib/i18n/context';
import { format, parseISO, differenceInDays } from 'date-fns';

interface TaskDetailPanelProps {
  task: GanttTask;
  phaseId: string;
  onClose: () => void;
  onSubtaskToggle: (subtaskId: string) => void;
  onDurationChange: (newDuration: number) => void;
  quotationItems?: QuotationItem[];
  region?: 'MY' | 'SG';
  cachedHint?: TradeHint;
  hintsLoading?: boolean;
  /** AI-classified overrides: maps item name → trade (for items classifyItemTrade couldn't match) */
  classificationOverrides?: Record<string, string>;
}

export function TaskDetailPanel({
  task,
  phaseId,
  onClose,
  onSubtaskToggle,
  onDurationChange,
  quotationItems = [],
  region = 'MY',
  cachedHint,
  hintsLoading: parentHintsLoading,
  classificationOverrides = {},
}: TaskDetailPanelProps) {
  const { lang } = useI18n();
  const [editDuration, setEditDuration] = useState<string>(String(task.duration));
  const [prepChecks, setPrepChecks] = useState<Record<number, boolean>>({});
  const [aiPrepChecks, setAiPrepChecks] = useState<Record<number, boolean>>({});
  const [aiHint, setAiHint] = useState<TradeHint | null>(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [showAllItems, setShowAllItems] = useState(false);

  const phase = getPhaseById(phaseId);
  const staticChecklist = getPhaseChecklist(phaseId);

  // Find related quotation items — prefer source_items (exact match), fallback to regex + AI overrides
  const relatedItems = (() => {
    if (task.source_items?.length) {
      return quotationItems.filter(item => task.source_items!.includes(item.name));
    }
    return quotationItems.filter(item => {
      // Check AI classification overrides first
      if (classificationOverrides[item.name]) {
        return tradeMatches(task.trade, classificationOverrides[item.name]);
      }
      const classified = classifyItemTrade(item.section || '', item.name);
      return classified ? tradeMatches(task.trade, classified) : false;
    });
  })();

  // Use persisted hint (from DB) or batch-cached hint (from GanttAutoGenerator).
  // No per-panel API calls — hints are generated once during Gantt generation and saved.
  useEffect(() => {
    const hint = task.ai_hint ?? cachedHint ?? null;
    if (hint) {
      setAiHint(hint);
    }
    setHintLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task.ai_hint, cachedHint]);

  const togglePrepCheck = (idx: number) => setPrepChecks(prev => ({ ...prev, [idx]: !prev[idx] }));
  const toggleAiPrepCheck = (idx: number) => setAiPrepChecks(prev => ({ ...prev, [idx]: !prev[idx] }));

  const calDays = differenceInDays(parseISO(task.end_date), parseISO(task.start_date)) + 1;
  const completedSubs = task.subtasks.filter(s => s.completed).length;

  const staticHint = (() => {
    if (!phase) return '';
    if (lang === 'ZH' && phase.hint_zh) return phase.hint_zh;
    if (region === 'SG' && phase.hint_SG) return phase.hint_SG;
    return phase.hint_MY || phase.hint_SG || '';
  })();

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-[720px] bg-white rounded-t-2xl border border-rs-border border-b-0 max-h-[82vh] overflow-y-auto shadow-2xl"
        style={{ animation: 'slideUp 0.22s ease' }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex items-start gap-3 px-5 py-4 border-b border-rs-border">
          <div className="w-3 h-3 rounded-full flex-shrink-0 mt-1.5" style={{ background: task.color }} />
          <div className="flex-1 min-w-0">
            <div className="text-[16px] font-bold text-rs-text leading-tight">
              {lang === 'ZH' && task.name_zh ? task.name_zh : task.name}
            </div>
            <div className="text-[12px] text-rs-text3 mt-1">
              {format(parseISO(task.start_date), 'dd MMM yyyy')} – {format(parseISO(task.end_date), 'dd MMM yyyy')}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#F0F2F7] flex items-center justify-center text-rs-text3 hover:bg-rs-border transition-colors text-sm flex-shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          {/* Info chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold border border-[rgba(79,142,247,0.3)] text-[#4F8EF7] bg-[rgba(79,142,247,0.07)]">
              {task.trade}
            </span>
            <span className="px-3 py-1 rounded-full text-[11px] font-bold border border-rs-border text-rs-text3 bg-[#FAFBFC]">
              {task.duration} {lang === 'ZH' ? '工作日' : 'workdays'} ({calDays} {lang === 'ZH' ? '日历日' : 'calendar days'})
            </span>
            {task.is_critical && (
              <span className="px-3 py-1 rounded-full text-[11px] font-bold border border-[rgba(248,113,113,0.3)] text-[#EF4444] bg-[rgba(248,113,113,0.07)]">
                {lang === 'ZH' ? '关键路径' : 'Critical Path'}
              </span>
            )}
            {completedSubs > 0 && (
              <span className="px-3 py-1 rounded-full text-[11px] font-bold border border-[rgba(74,222,128,0.3)] text-[#16A34A] bg-[rgba(22,163,74,0.07)]">
                {completedSubs}/{task.subtasks.length} {lang === 'ZH' ? '完成' : 'done'}
              </span>
            )}
            <span className={`px-3 py-1 rounded-full text-[11px] font-bold border ${
              region === 'SG'
                ? 'border-red-100 text-red-600 bg-red-50'
                : 'border-blue-100 text-blue-600 bg-blue-50'
            }`}>
              {region === 'SG' ? '🇸🇬 SG' : '🇲🇾 MY'}
            </span>
          </div>

          {/* ── Duration editor ── */}
          <div className="text-[10px] font-bold tracking-[1.5px] uppercase text-rs-text3 mb-2">
            {lang === 'ZH' ? '调整工期' : 'ADJUST DURATION'}
          </div>
          <div className="flex items-center gap-3 p-3 bg-[#FAFBFC] rounded-xl mb-5 border border-rs-border">
            <div className="flex-1">
              <p className="text-[12px] text-rs-text2">
                {lang === 'ZH' ? '工作天数（当前：' : 'Work days (current: '}
                <strong className="text-[#4F8EF7]">{task.duration}</strong>
                {lang === 'ZH' ? ' 天）' : ' days)'}
              </p>
              <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                {lang === 'ZH' ? '修改后点击应用，甘特图自动更新' : 'Click Apply to update Gantt'}
              </p>
            </div>
            <input
              type="number" min={1} max={200} value={editDuration}
              onChange={(e) => setEditDuration(e.target.value)}
              className="w-16 bg-white border border-rs-border rounded-lg px-2 py-1.5 text-center text-[13px] font-mono text-rs-text focus:outline-none focus:border-[#4F8EF7]"
            />
            <button
              onClick={() => { const v = Math.max(1, Math.min(200, parseInt(editDuration) || 1)); setEditDuration(String(v)); onDurationChange(v); }}
              className="px-3 py-1.5 text-[11px] font-semibold bg-[#4F8EF7] text-white rounded-lg hover:bg-[#3B7BE8] transition-all whitespace-nowrap"
            >
              {lang === 'ZH' ? '应用' : 'Apply'}
            </button>
          </div>

          {/* ── Prep Reminders & Notes section ── */}
          {(relatedItems.length > 0 || staticChecklist.length > 0 || task.trade) && (
            <>
              <div className="text-[10px] font-bold tracking-[1.5px] uppercase text-rs-text3 mb-3 flex items-center gap-2">
                ✦ {lang === 'ZH' ? '事前准备 & 注意事项' : 'PREP REMINDERS & NOTES'}
              </div>

              {/* AI hints section — always rendered, shows status inline */}
              <div className="mb-3">
                <div className="text-[10px] font-semibold tracking-[1px] uppercase text-rs-text3 mb-1.5 flex items-center gap-2">
                  🤖 {lang === 'ZH' ? 'AI建议（基于报价单）' : 'AI HINTS (FROM QUOTATION)'}
                  {(parentHintsLoading && !aiHint) && (
                    <span className="text-[9px] animate-pulse text-[#4F8EF7] normal-case font-normal">
                      {lang === 'ZH' ? '生成中...' : 'generating...'}
                    </span>
                  )}
                </div>

                {/* AI content */}
                {aiHint && (
                  <>
                    {aiHint.quotationNotes && (
                      <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl mb-2 border"
                        style={{ background: 'rgba(79,142,247,0.05)', borderColor: 'rgba(79,142,247,0.2)' }}>
                        <span className="text-[13px] flex-shrink-0">📋</span>
                        <p className="text-[11px] text-amber-800 leading-relaxed">{aiHint.quotationNotes}</p>
                      </div>
                    )}
                    {aiHint.warnings && aiHint.warnings.length > 0 && (
                      <div className="mb-2 space-y-1.5">
                        {aiHint.warnings.map((w, idx) => (
                          <div key={idx} className="flex items-start gap-2 px-3 py-2 rounded-xl border"
                            style={{ background: 'rgba(239,68,68,0.04)', borderColor: 'rgba(239,68,68,0.18)' }}>
                            <span className="text-[13px] flex-shrink-0">⚠️</span>
                            <p className="text-[11px] text-red-800 leading-relaxed">{w}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {aiHint.prepItems && aiHint.prepItems.length > 0 && (
                      <div className="space-y-1.5">
                        {aiHint.prepItems.slice(0, 5).map((item, idx) => {
                          const checked = aiPrepChecks[idx] || false;
                          return (
                            <button
                              key={idx}
                              onClick={() => toggleAiPrepCheck(idx)}
                              className={`w-full flex items-start gap-2 px-3 py-2 rounded-lg border text-[12px] text-left transition-all cursor-pointer ${
                                checked
                                  ? 'bg-[rgba(22,163,74,0.07)] border-[rgba(22,163,74,0.25)]'
                                  : 'bg-[rgba(96,165,250,0.05)] border-[rgba(96,165,250,0.18)] hover:bg-[rgba(96,165,250,0.09)]'
                              }`}
                            >
                              <span className="flex-shrink-0 text-[14px] mt-0.5">{checked ? '✅' : '🛒'}</span>
                              <span className={`text-rs-text2 leading-snug ${checked ? 'line-through opacity-60' : ''}`}>{item}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}

                {/* No hints yet — subtle placeholder */}
                {!aiHint && !parentHintsLoading && (
                  staticHint ? (
                    <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl mb-2 border"
                      style={{ background: 'rgba(79,142,247,0.06)', borderColor: 'rgba(79,142,247,0.2)' }}>
                      <span className="text-[13px] flex-shrink-0">💡</span>
                      <p className="text-[11px] text-amber-800 leading-relaxed">{staticHint}</p>
                    </div>
                  ) : (
                    <div className="text-[11px] text-rs-text3 px-3 py-2 rounded-lg border border-dashed border-rs-border">
                      {lang === 'ZH' ? '暂无AI建议（无匹配报价单条目）' : 'No AI hints — no matching quotation items'}
                    </div>
                  )
                )}
              </div>

              {/* Static checklist — ALWAYS shown with consistent label */}
              {staticChecklist.length > 0 && (
                <>
                  <div className="text-[10px] font-semibold tracking-[1px] uppercase text-rs-text3 mb-1.5">
                    🛠 {lang === 'ZH' ? '通用施工准备' : 'PREP CHECKLIST'}
                  </div>
                  <div className="space-y-1.5 mb-4">
                    {staticChecklist.map((item, idx) => {
                      const checked = prepChecks[idx] || false;
                      const bgMap: Record<string, string> = {
                        warn:  'bg-[rgba(248,113,113,0.07)] border-[rgba(248,113,113,0.18)]',
                        order: 'bg-[rgba(96,165,250,0.07)] border-[rgba(96,165,250,0.18)]',
                        check: 'bg-[rgba(22,163,74,0.07)] border-[rgba(74,222,128,0.18)]',
                        info:  'bg-[rgba(251,146,60,0.07)] border-[rgba(251,146,60,0.18)]',
                      };
                      const iconMap: Record<string, string> = { warn: '⚠️', order: '🛒', check: '🔲', info: '📋' };
                      return (
                        <button
                          key={idx}
                          onClick={() => togglePrepCheck(idx)}
                          className={`w-full flex items-start gap-2 px-3 py-2 rounded-lg border text-[12px] text-left transition-all cursor-pointer hover:brightness-95 ${
                            checked ? 'bg-[rgba(22,163,74,0.08)] border-[rgba(22,163,74,0.25)]' : bgMap[item.type] || bgMap.info
                          }`}
                        >
                          <span className="flex-shrink-0 text-[14px] mt-0.5">{checked ? '✅' : (iconMap[item.type] || '📋')}</span>
                          <span className={`text-rs-text2 ${checked ? 'line-through opacity-60' : ''}`}>
                            {lang === 'ZH' ? item.text_zh : item.text}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}

          {/* Quotation items from the quotation — collapsible (first 5 visible) */}
          {relatedItems.length > 0 && (
            <>
              <div className="text-[10px] font-bold tracking-[1.5px] uppercase text-rs-text3 mb-2 flex items-center gap-2">
                {lang === 'ZH' ? '报价单明细' : 'QUOTATION ITEMS'}
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[rgba(79,142,247,0.1)] text-[#4F8EF7] border border-[rgba(79,142,247,0.2)] normal-case font-normal">
                  {relatedItems.length} {lang === 'ZH' ? '项' : 'items'}
                </span>
              </div>
              <div className="mb-2 space-y-1.5">
                {(showAllItems ? relatedItems : relatedItems.slice(0, 5)).map((item, idx) => {
                  const isFlag = item.status === 'flag';
                  const isWarn = item.status === 'warn';
                  return (
                    <div key={idx} className={`flex items-start gap-2.5 px-3 py-2 rounded-lg border text-[12px] ${
                      isFlag
                        ? 'bg-[rgba(239,68,68,0.04)] border-[rgba(239,68,68,0.2)]'
                        : isWarn
                          ? 'bg-[rgba(251,146,60,0.05)] border-[rgba(251,146,60,0.2)]'
                          : 'bg-[rgba(79,142,247,0.04)] border-[rgba(79,142,247,0.12)]'
                    }`}>
                      <span className={`w-[17px] h-[17px] rounded flex-shrink-0 border flex items-center justify-center text-[9px] mt-0.5 font-bold ${
                        isFlag ? 'border-red-300 text-red-500' : isWarn ? 'border-orange-300 text-orange-500' : 'border-[rgba(79,142,247,0.3)] text-[#4F8EF7]'
                      }`}>
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-rs-text2 leading-snug">{item.name}</div>
                        {isFlag && (
                          <div className="text-[10px] text-red-600 mt-0.5 leading-snug">
                            ⚠️ {lang === 'ZH' ? '价格偏高，材料及做法须与承包商确认' : 'Price high — confirm materials & method with contractor'}
                          </div>
                        )}
                        {isWarn && !isFlag && (
                          <div className="text-[10px] text-orange-600 mt-0.5 leading-snug">
                            注意：检查是否有漏算，或与承包商确认实际做法
                          </div>
                        )}
                      </div>
                      {item.total > 0 && (
                        <span className={`font-mono text-[11px] whitespace-nowrap flex-shrink-0 ${isFlag ? 'text-red-500' : isWarn ? 'text-orange-500' : 'text-[#4F8EF7]'}`}>
                          {region === 'SG' ? 'SGD' : 'RM'} {(item.total ?? 0).toLocaleString()}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              {relatedItems.length > 5 && (
                <button
                  onClick={() => setShowAllItems(v => !v)}
                  className="w-full text-[11px] text-[#4F8EF7] py-1.5 mb-3 rounded-lg border border-[rgba(79,142,247,0.2)] bg-[rgba(79,142,247,0.04)] hover:bg-[rgba(79,142,247,0.08)] transition-colors"
                >
                  {showAllItems
                    ? (lang === 'ZH' ? '▲ 收起' : '▲ Show less')
                    : (lang === 'ZH' ? `▼ 查看全部 ${relatedItems.length} 项` : `▼ Show all ${relatedItems.length} items`)}
                </button>
              )}
            </>
          )}

          {/* Sub-tasks */}
          {task.subtasks.length > 0 && (
            <>
              <div className="text-[10px] font-bold tracking-[1.5px] uppercase text-rs-text3 mb-1">
                {lang === 'ZH' ? '施工步骤' : 'WORK STEPS'}
              </div>
              <div className="space-y-0 mb-4">
                {task.subtasks.map((sub) => (
                  <div key={sub.id} className="flex items-start gap-2 py-2 border-b border-rs-border last:border-b-0">
                    <button
                      onClick={() => onSubtaskToggle(sub.id)}
                      className={`w-[17px] h-[17px] rounded flex-shrink-0 border-[1.5px] flex items-center justify-center text-[10px] mt-0.5 transition-all ${
                        sub.completed ? 'bg-[#00C9A7] border-[#00C9A7] text-rs-text' : 'bg-[#FAFBFC] border-rs-border text-transparent'
                      }`}
                    >✓</button>
                    <span className={`text-[12px] leading-relaxed ${sub.completed ? 'text-rs-text3 line-through' : 'text-rs-text2'}`}>
                      {lang === 'ZH' && sub.name_zh ? sub.name_zh : sub.name}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Dependencies */}
          {task.dependencies.length > 0 && (
            <>
              <div className="text-[10px] font-bold tracking-[1.5px] uppercase text-rs-text3 mb-2">
                {lang === 'ZH' ? '前置工序' : 'DEPENDENCIES'}
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {task.dependencies.map(depId => {
                  const depPhase = depId.replace(`${task.project_id}-`, '');
                  const depPhaseData = getPhaseById(depPhase);
                  return (
                    <span key={depId} className="px-2.5 py-1 rounded-full text-[10px] font-semibold border border-rs-border text-rs-text3 bg-[#FAFBFC]">
                      {depPhaseData ? (lang === 'ZH' ? depPhaseData.name_zh : depPhaseData.name) : depPhase}
                    </span>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
