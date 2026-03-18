'use client';

import { useState, useEffect } from 'react';
import { GanttTask, QuotationItem, TradeHint } from '@/types';
import { getPhaseChecklist, getPhaseById } from '@/lib/utils/gantt-rules';
import { buildTradeHintPrompt } from '@/lib/ai/quotation-prompt';
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
}

export function TaskDetailPanel({
  task,
  phaseId,
  onClose,
  onSubtaskToggle,
  onDurationChange,
  quotationItems = [],
  region = 'MY',
}: TaskDetailPanelProps) {
  const { lang } = useI18n();
  const [editDuration, setEditDuration] = useState(task.duration);
  const [prepChecks, setPrepChecks] = useState<Record<number, boolean>>({});
  const [aiPrepChecks, setAiPrepChecks] = useState<Record<number, boolean>>({});
  const [aiHint, setAiHint] = useState<TradeHint | null>(null);
  const [hintLoading, setHintLoading] = useState(false);

  const phase = getPhaseById(phaseId);
  const staticChecklist = getPhaseChecklist(phaseId);

  // Find related quotation items via keyword match
  const relatedItems = quotationItems.filter(item => {
    const name = item.name.toLowerCase();
    const trade = task.trade.toLowerCase();
    if (trade === 'tiling') return /tile|tiling|ceramic|porcelain|mosaic/.test(name);
    if (trade === 'electrical') return /elect|wir|db|socket|light|switch|fan|conduit/.test(name);
    if (trade === 'plumbing') return /plumb|pipe|basin|wc|toilet|shower|sanit|tap|floor trap/.test(name);
    if (trade === 'painting') return /paint|primer|coat|emulsion/.test(name);
    if (trade === 'carpentry') return /cabinet|carpent|wardrobe|joiner|wood|laminate/.test(name);
    if (trade === 'demolition') return /demol|hack|break|remov/.test(name);
    if (trade === 'waterproofing') return /waterproof/.test(name);
    if (trade === 'false ceiling') return /ceil|partition|gypsum|cornice/.test(name);
    if (trade === 'cleaning') return /clean/.test(name);
    if (trade === 'flooring') return /vinyl|timber|laminate floor/.test(name);
    if (trade === 'aluminium') return /alumin|window|sliding/.test(name);
    if (trade === 'air conditioning' || trade === 'aircon') return /air.?con|ac unit|daikin|mitsubishi/.test(name);
    return false;
  });

  // Generate AI hints on mount when quotation items are available
  useEffect(() => {
    if (relatedItems.length === 0) return;
    setHintLoading(true);
    const prompt = buildTradeHintPrompt(
      task.trade,
      relatedItems.slice(0, 12).map(i => ({
        name: i.name,
        qty: i.qty,
        unit: i.unit,
        unitPrice: i.unitPrice,
        total: i.total,
      })),
      region,
    );
    fetch('/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
      .then(r => r.json())
      .then(data => {
        const text = data.content?.[0]?.text || '';
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            const hint: TradeHint = JSON.parse(match[0]);
            setAiHint(hint);
          } catch { /* ignore parse error */ }
        }
      })
      .catch(() => { /* ignore network error */ })
      .finally(() => setHintLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        className="w-full max-w-[720px] bg-white rounded-t-2xl border border-[#D8DCE8] border-b-0 max-h-[82vh] overflow-y-auto shadow-2xl"
        style={{ animation: 'slideUp 0.22s ease' }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex items-start gap-3 px-5 py-4 border-b border-[#D8DCE8]">
          <div className="w-3 h-3 rounded-full flex-shrink-0 mt-1.5" style={{ background: task.color }} />
          <div className="flex-1 min-w-0">
            <div className="text-[16px] font-bold text-[#1B2336] leading-tight">
              {lang === 'ZH' && task.name_zh ? task.name_zh : task.name}
            </div>
            <div className="text-[12px] text-[#6B7A94] mt-1">
              {format(parseISO(task.start_date), 'dd MMM yyyy')} – {format(parseISO(task.end_date), 'dd MMM yyyy')}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#F0F2F7] flex items-center justify-center text-[#6B7A94] hover:bg-[#D8DCE8] transition-colors text-sm flex-shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          {/* Info chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold border border-[rgba(240,185,11,0.3)] text-[#F0B90B] bg-[rgba(240,185,11,0.07)]">
              {task.trade}
            </span>
            <span className="px-3 py-1 rounded-full text-[11px] font-bold border border-[#D8DCE8] text-[#6B7A94] bg-[#FAFBFC]">
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
          <div className="text-[10px] font-bold tracking-[1.5px] uppercase text-[#6B7A94] mb-2">
            {lang === 'ZH' ? '调整工期' : 'ADJUST DURATION'}
          </div>
          <div className="flex items-center gap-3 p-3 bg-[#FAFBFC] rounded-xl mb-5 border border-[#D8DCE8]">
            <div className="flex-1">
              <p className="text-[12px] text-[#3D4A60]">
                {lang === 'ZH' ? '工作天数（当前：' : 'Work days (current: '}
                <strong className="text-[#F0B90B]">{task.duration}</strong>
                {lang === 'ZH' ? ' 天）' : ' days)'}
              </p>
              <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                {lang === 'ZH' ? '修改后点击应用，甘特图自动更新' : 'Click Apply to update Gantt'}
              </p>
            </div>
            <input
              type="number" min={1} max={200} value={editDuration}
              onChange={(e) => setEditDuration(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 bg-white border border-[#D8DCE8] rounded-lg px-2 py-1.5 text-center text-[13px] font-mono text-[#1B2336] focus:outline-none focus:border-[#F0B90B]"
            />
            <button
              onClick={() => onDurationChange(editDuration)}
              className="px-3 py-1.5 text-[11px] font-semibold bg-[#F0B90B] text-[#1B2336] rounded-lg hover:bg-[#F8D33A] transition-all whitespace-nowrap"
            >
              {lang === 'ZH' ? '应用' : 'Apply'}
            </button>
          </div>

          {/* ── AI Hints section ── */}
          {relatedItems.length > 0 && (
            <>
              <div className="text-[10px] font-bold tracking-[1.5px] uppercase text-[#6B7A94] mb-2 flex items-center gap-2">
                ✦ {lang === 'ZH' ? '事前准备 & 注意事项' : 'PREP REMINDERS & NOTES'}
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[rgba(240,185,11,0.1)] text-[#F0B90B] border border-[rgba(240,185,11,0.2)] normal-case font-normal">
                  {lang === 'ZH' ? '基于报价单内容' : 'From quotation AI'}
                </span>
              </div>

              {/* Loading state */}
              {hintLoading && (
                <div className="flex items-center gap-2 px-3 py-3 rounded-xl bg-[rgba(240,185,11,0.05)] border border-[rgba(240,185,11,0.15)] mb-3">
                  <span className="text-[13px] animate-spin">⟳</span>
                  <p className="text-[11px] text-amber-700">
                    {lang === 'ZH' ? 'AI正在分析报价单内容...' : 'AI analyzing quotation content...'}
                  </p>
                </div>
              )}

              {/* AI quotation summary */}
              {aiHint?.quotationNotes && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl mb-2 border"
                  style={{ background: 'rgba(240,185,11,0.05)', borderColor: 'rgba(240,185,11,0.2)' }}>
                  <span className="text-[13px] flex-shrink-0">📋</span>
                  <p className="text-[11px] text-amber-800 leading-relaxed">{aiHint.quotationNotes}</p>
                </div>
              )}

              {/* AI warnings */}
              {aiHint?.warnings && aiHint.warnings.length > 0 && (
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

              {/* AI prep checklist */}
              {aiHint?.prepItems && aiHint.prepItems.length > 0 && (
                <div className="space-y-1.5 mb-4">
                  {aiHint.prepItems.map((item, idx) => {
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
                        <span className={`text-[#3D4A60] leading-snug ${checked ? 'line-through opacity-60' : ''}`}>
                          {item}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Fallback: static hint while AI loads or if no quotation items match */}
              {!hintLoading && !aiHint && staticHint && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl mb-4 border"
                  style={{ background: 'rgba(240,185,11,0.06)', borderColor: 'rgba(240,185,11,0.2)' }}>
                  <span className="text-[13px] flex-shrink-0">💡</span>
                  <p className="text-[11px] text-amber-800 leading-relaxed">{staticHint}</p>
                </div>
              )}

              {/* Static checklist — shown only when no AI hints loaded yet */}
              {!aiHint && staticChecklist.length > 0 && !hintLoading && (
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
                        <span className={`text-[#3D4A60] ${checked ? 'line-through opacity-60' : ''}`}>
                          {lang === 'ZH' ? item.text_zh : item.text}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* No quotation — show static checklist */}
          {relatedItems.length === 0 && staticChecklist.length > 0 && (
            <>
              <div className="text-[10px] font-bold tracking-[1.5px] uppercase text-[#6B7A94] mb-2">
                🛠 {lang === 'ZH' ? '开工前准备事项' : 'PREP CHECKLIST'}
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
                    <button key={idx} onClick={() => togglePrepCheck(idx)}
                      className={`w-full flex items-start gap-2 px-3 py-2 rounded-lg border text-[12px] text-left transition-all cursor-pointer hover:brightness-95 ${
                        checked ? 'bg-[rgba(22,163,74,0.08)] border-[rgba(22,163,74,0.25)]' : bgMap[item.type] || bgMap.info
                      }`}>
                      <span className="flex-shrink-0 text-[14px] mt-0.5">{checked ? '✅' : (iconMap[item.type] || '📋')}</span>
                      <span className={`text-[#3D4A60] ${checked ? 'line-through opacity-60' : ''}`}>
                        {lang === 'ZH' ? item.text_zh : item.text}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Quotation items from the quotation */}
          {relatedItems.length > 0 && (
            <>
              <div className="text-[10px] font-bold tracking-[1.5px] uppercase text-[#6B7A94] mb-2 flex items-center gap-2">
                {lang === 'ZH' ? '报价单明细' : 'QUOTATION ITEMS'}
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[rgba(240,185,11,0.1)] text-[#F0B90B] border border-[rgba(240,185,11,0.2)] normal-case font-normal">
                  {relatedItems.length} 项
                </span>
              </div>
              <div className="mb-4 space-y-1.5">
                {relatedItems.slice(0, 10).map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 px-3 py-2 rounded-lg bg-[rgba(240,185,11,0.04)] border border-[rgba(240,185,11,0.12)] text-[12px]">
                    <span className="w-[17px] h-[17px] rounded flex-shrink-0 border border-[rgba(240,185,11,0.3)] flex items-center justify-center text-[9px] text-[#F0B90B] mt-0.5 font-bold">
                      {idx + 1}
                    </span>
                    <span className="flex-1 text-[#3D4A60] leading-snug">{item.name}</span>
                    {item.total > 0 && (
                      <span className="font-mono text-[11px] text-[#F0B90B] whitespace-nowrap flex-shrink-0">
                        {region === 'SG' ? 'SGD' : 'RM'} {item.total.toLocaleString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Sub-tasks */}
          {task.subtasks.length > 0 && (
            <>
              <div className="text-[10px] font-bold tracking-[1.5px] uppercase text-[#6B7A94] mb-1">
                {lang === 'ZH' ? '施工步骤' : 'WORK STEPS'}
              </div>
              <div className="space-y-0 mb-4">
                {task.subtasks.map((sub) => (
                  <div key={sub.id} className="flex items-start gap-2 py-2 border-b border-[#D8DCE8] last:border-b-0">
                    <button
                      onClick={() => onSubtaskToggle(sub.id)}
                      className={`w-[17px] h-[17px] rounded flex-shrink-0 border-[1.5px] flex items-center justify-center text-[10px] mt-0.5 transition-all ${
                        sub.completed ? 'bg-[#00C9A7] border-[#00C9A7] text-[#1B2336]' : 'bg-[#FAFBFC] border-[#D8DCE8] text-transparent'
                      }`}
                    >✓</button>
                    <span className={`text-[12px] leading-relaxed ${sub.completed ? 'text-[#6B7A94] line-through' : 'text-[#3D4A60]'}`}>
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
              <div className="text-[10px] font-bold tracking-[1.5px] uppercase text-[#6B7A94] mb-2">
                {lang === 'ZH' ? '前置工序' : 'DEPENDENCIES'}
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {task.dependencies.map(depId => {
                  const depPhase = depId.replace(`${task.project_id}-`, '');
                  const depPhaseData = getPhaseById(depPhase);
                  return (
                    <span key={depId} className="px-2.5 py-1 rounded-full text-[10px] font-semibold border border-[#D8DCE8] text-[#6B7A94] bg-[#FAFBFC]">
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
