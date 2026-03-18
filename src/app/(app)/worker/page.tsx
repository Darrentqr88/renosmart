'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { CheckCircle2, Clock, Camera, LogOut, Wrench, Calendar, Receipt, X, Upload, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface TaskSubtask {
  id: string;
  name: string;
  name_zh?: string;
  completed: boolean;
}

interface Task {
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

interface OcrItem {
  description: string;
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

interface ReceiptModalContext {
  taskId: string;
  projectId: string;
  trade: string;
  workItem: string;
}

type OcrState = 'idle' | 'scanning' | 'review' | 'saving' | 'done';

export default function WorkerDashboard() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkedIn, setCheckedIn] = useState(false);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);

  // Subtask checklist expanded state
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // Receipt modal state
  const [receiptModal, setReceiptModal] = useState<ReceiptModalContext | null>(null);
  const [ocrState, setOcrState] = useState<OcrState>('idle');
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setSessionUserId(session.user.id);

      const { data: p } = await supabase.from('profiles').select('*').eq('user_id', session.user.id).single();
      setProfile(p);

      // Get assigned tasks
      const { data: t } = await supabase
        .from('gantt_tasks')
        .select('*, projects(name)')
        .contains('assigned_workers', [session.user.id])
        .gte('end_date', new Date().toISOString().split('T')[0])
        .order('start_date');

      setTasks((t || []).map((task: Record<string, unknown>) => ({
        ...task,
        project_name: (task.projects as Record<string, unknown>)?.name || 'Unknown Project',
      })) as Task[]);

      setLoading(false);
    })();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        subtasks: (t.subtasks || []).map(s =>
          s.id === subtaskId ? { ...s, completed: !s.completed } : s
        ),
      };
    }));
  };

  const openReceiptModal = (task: Task) => {
    setReceiptModal({ taskId: task.id, projectId: task.project_id, trade: task.trade, workItem: task.name });
    setOcrState('idle');
    setOcrResult(null);
    setOcrError(null);
  };

  const closeReceiptModal = () => {
    setReceiptModal(null);
    setOcrState('idle');
    setOcrResult(null);
    setOcrError(null);
  };

  const handleFileSelect = async (file: File) => {
    if (!receiptModal) return;
    setOcrError(null);
    setOcrState('scanning');

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
        setOcrState('review');
      } catch {
        setOcrError('OCR 扫描失败，请重试');
        setOcrState('idle');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!receiptModal || !ocrResult || !sessionUserId) return;
    setOcrState('saving');

    try {
      const itemsToSave = ocrResult.items.length > 0 ? ocrResult.items : [{
        description: '单据明细',
        qty: 1,
        unit: 'lot',
        unit_cost: ocrResult.total_amount,
        total: ocrResult.total_amount,
      }];

      for (const item of itemsToSave) {
        await supabase.from('cost_records').insert({
          project_id: receiptModal.projectId,
          user_id: sessionUserId,
          uploaded_by: sessionUserId,
          supplier: ocrResult.supplier || '未知供应商',
          receipt_date: ocrResult.date || new Date().toISOString().split('T')[0],
          category: receiptModal.trade + '_material',
          description: item.description,
          total_amount: item.total,
          trade: receiptModal.trade,
          work_item: receiptModal.workItem,
        });
      }

      setOcrState('done');
      setTimeout(() => closeReceiptModal(), 1500);
    } catch {
      setOcrError('保存失败，请重试');
      setOcrState('review');
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(t => t.start_date <= today && t.end_date >= today);
  const upcomingTasks = tasks.filter(t => t.start_date > today);

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden min-h-[780px] flex flex-col">
        {/* Header */}
        <div className="bg-[#0F1923] text-white px-5 pt-12 pb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white/50 text-xs">Good morning,</p>
              <h1 className="font-bold text-lg">{(profile?.name as string) || 'Worker'}</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex flex-wrap gap-1 justify-end">
                {((profile?.trades as string[]) || []).slice(0, 2).map(t => (
                  <Badge key={t} className="bg-[#F0B90B]/20 text-[#F0B90B] text-xs border-0">{t}</Badge>
                ))}
              </div>
              <button onClick={handleSignOut} className="p-2 rounded-xl hover:bg-white/10">
                <LogOut className="w-4 h-4 text-white/50" />
              </button>
            </div>
          </div>

          {/* Check in/out */}
          <button
            onClick={() => setCheckedIn(!checkedIn)}
            className={`w-full py-3 rounded-2xl font-semibold text-sm transition-all ${
              checkedIn
                ? 'bg-green-500 text-white'
                : 'bg-[#F0B90B] text-black'
            }`}
          >
            {checkedIn ? '✓ Checked In — Tap to Check Out' : '⏰ Tap to Check In'}
          </button>
        </div>

        {/* Today's tasks */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-[#F0B90B]" />
            <h2 className="font-semibold text-gray-900 text-sm">Today&apos;s Tasks ({todayTasks.length})</h2>
          </div>

          {loading ? (
            <div className="text-center text-gray-400 text-sm py-6">Loading tasks...</div>
          ) : todayTasks.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-10 h-10 text-green-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No tasks today!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayTasks.map(task => (
                <div key={task.id} className="bg-gray-50 rounded-xl p-4 border-l-4" style={{ borderColor: task.color }}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-xs text-gray-500">{task.project_name}</div>
                      <div className="font-medium text-gray-900 text-sm">{task.name}</div>
                    </div>
                    <Badge className="bg-amber-100 text-amber-700 text-xs">{task.trade}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(task.start_date)} — {formatDate(task.end_date)}</span>
                  </div>
                  {/* Progress slider */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">Progress</span>
                      <span className="font-medium text-gray-700">{task.progress}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={10}
                      value={task.progress}
                      onChange={(e) => setTasks(prev => prev.map(t => t.id === task.id ? { ...t, progress: parseInt(e.target.value) } : t))}
                      className="w-full accent-[#F0B90B]"
                    />
                  </div>
                  {/* Subtask checklist toggle */}
                  {task.subtasks && task.subtasks.length > 0 && (
                    <div className="mt-3">
                      <button
                        onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                        className="w-full flex items-center justify-between text-xs py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <span className="font-medium text-gray-700">
                          📋 工序清单 ({task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} 完成)
                        </span>
                        <span className="text-gray-400">{expandedTaskId === task.id ? '▲' : '▼'}</span>
                      </button>
                      {expandedTaskId === task.id && (
                        <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto">
                          {task.subtasks.map((sub) => (
                            <button
                              key={sub.id}
                              onClick={() => toggleSubtask(task.id, sub.id)}
                              className="w-full flex items-start gap-2 py-1.5 px-1 rounded-lg hover:bg-gray-50 text-left transition-colors"
                            >
                              <span
                                className={`w-4 h-4 rounded flex-shrink-0 border-[1.5px] flex items-center justify-center text-[10px] mt-0.5 transition-all ${
                                  sub.completed
                                    ? 'bg-[#00C9A7] border-[#00C9A7] text-white'
                                    : 'bg-white border-gray-300 text-transparent'
                                }`}
                              >
                                ✓
                              </span>
                              <span className={`text-xs leading-relaxed ${sub.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                {sub.name_zh || sub.name}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions — 3 buttons */}
                  <div className="flex gap-2 mt-3">
                    <button className="flex-1 flex items-center justify-center gap-1 text-xs py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                      <Camera className="w-3 h-3" /> 拍照
                    </button>
                    <button
                      onClick={() => openReceiptModal(task)}
                      className="flex-1 flex items-center justify-center gap-1 text-xs py-2 bg-white border border-[#F0B90B]/40 rounded-lg hover:bg-[#F0B90B]/5 text-amber-700"
                    >
                      <Receipt className="w-3 h-3" /> 上传单据
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-1 text-xs py-2 bg-[#F0B90B] text-black rounded-lg font-medium">
                      <CheckCircle2 className="w-3 h-3" /> 完成
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Receipt upload shortcut */}
          <div className="mt-5">
            <Link href="/worker/receipts">
              <div className="flex items-center gap-3 p-4 bg-[#F0B90B]/10 border border-[#F0B90B]/20 rounded-xl hover:bg-[#F0B90B]/15 transition-colors cursor-pointer">
                <div className="w-9 h-9 bg-[#F0B90B] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Receipt className="w-4 h-4 text-black" />
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-900">Upload Receipt</p>
                  <p className="text-xs text-gray-500">Submit material purchase receipts</p>
                </div>
              </div>
            </Link>
          </div>

          {upcomingTasks.length > 0 && (
            <div className="mt-5">
              <div className="flex items-center gap-2 mb-3">
                <Wrench className="w-4 h-4 text-gray-400" />
                <h2 className="font-semibold text-gray-700 text-sm">Upcoming ({upcomingTasks.length})</h2>
              </div>
              <div className="space-y-2">
                {upcomingTasks.slice(0, 3).map(task => (
                  <div key={task.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: task.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{task.name}</div>
                      <div className="text-xs text-gray-400">{formatDate(task.start_date)}</div>
                    </div>
                    <Badge className="bg-gray-100 text-gray-500 text-xs">{task.trade}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Receipt OCR Modal */}
      {receiptModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900">📋 上传单据</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  工序: <span className="text-amber-700 font-medium">{receiptModal.workItem}</span>
                  <span className="mx-1">·</span>
                  <span className="capitalize">{receiptModal.trade}</span>
                </p>
              </div>
              <button onClick={closeReceiptModal} className="p-2 rounded-xl hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="p-5">
              {/* State: idle */}
              {ocrState === 'idle' && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-10 flex flex-col items-center gap-3 hover:border-[#F0B90B]/50 hover:bg-[#F0B90B]/5 transition-colors"
                  >
                    <Upload className="w-8 h-8 text-gray-400" />
                    <div className="text-center">
                      <p className="font-medium text-gray-700 text-sm">拍照 / 选择图片或PDF</p>
                      <p className="text-xs text-gray-400 mt-1">支持 JPG、PNG、PDF 格式</p>
                    </div>
                  </button>
                  {ocrError && (
                    <p className="mt-3 text-xs text-red-500 text-center">{ocrError}</p>
                  )}
                </>
              )}

              {/* State: scanning */}
              {ocrState === 'scanning' && (
                <div className="py-10 flex flex-col items-center gap-4">
                  <Loader2 className="w-10 h-10 text-[#F0B90B] animate-spin" />
                  <div className="text-center">
                    <p className="font-medium text-gray-700 text-sm">AI 正在识别单据...</p>
                    <p className="text-xs text-gray-400 mt-1">通常需要 5-10 秒</p>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-[#F0B90B] h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
                  </div>
                </div>
              )}

              {/* State: review */}
              {ocrState === 'review' && ocrResult && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500">供应商</label>
                      <input
                        value={ocrResult.supplier || ''}
                        onChange={(e) => setOcrResult(prev => prev ? { ...prev, supplier: e.target.value } : prev)}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 mt-1 focus:outline-none focus:border-[#F0B90B]"
                        placeholder="供应商名称"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">日期</label>
                      <input
                        type="date"
                        value={ocrResult.date || ''}
                        onChange={(e) => setOcrResult(prev => prev ? { ...prev, date: e.target.value } : prev)}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 mt-1 focus:outline-none focus:border-[#F0B90B]"
                      />
                    </div>
                  </div>

                  {/* Items list */}
                  <div>
                    <label className="text-xs text-gray-500 mb-2 block">品项明细</label>
                    <div className="border border-gray-100 rounded-xl overflow-hidden">
                      {ocrResult.items.length === 0 ? (
                        <div className="p-3 text-xs text-gray-400 text-center">未识别到明细，将以总金额记录</div>
                      ) : (
                        ocrResult.items.map((item, i) => (
                          <div key={i} className="flex items-center gap-2 p-3 border-b border-gray-50 last:border-0">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-800 truncate">{item.description}</p>
                              <p className="text-xs text-gray-400">{item.qty} {item.unit} × RM{item.unit_cost}</p>
                            </div>
                            <span className="text-xs font-bold text-gray-700 whitespace-nowrap">RM {item.total.toFixed(2)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="flex justify-between items-center bg-gray-50 rounded-xl px-4 py-3">
                    <span className="text-sm text-gray-600">合计</span>
                    <span className="font-bold text-gray-900">RM {ocrResult.total_amount.toFixed(2)}</span>
                  </div>

                  {ocrError && (
                    <p className="text-xs text-red-500 text-center">{ocrError}</p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={closeReceiptModal}
                      className="flex-1 py-3 border border-gray-200 rounded-2xl text-sm text-gray-600 font-medium hover:bg-gray-50"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleSave}
                      className="flex-1 py-3 bg-[#F0B90B] text-black rounded-2xl text-sm font-bold hover:bg-[#d9a50a]"
                    >
                      ✓ 确认保存
                    </button>
                  </div>
                </div>
              )}

              {/* State: saving */}
              {ocrState === 'saving' && (
                <div className="py-10 flex flex-col items-center gap-4">
                  <Loader2 className="w-10 h-10 text-[#F0B90B] animate-spin" />
                  <p className="font-medium text-gray-700 text-sm">正在保存...</p>
                </div>
              )}

              {/* State: done */}
              {ocrState === 'done' && (
                <div className="py-10 flex flex-col items-center gap-4">
                  <CheckCircle2 className="w-14 h-14 text-green-500" />
                  <div className="text-center">
                    <p className="font-bold text-gray-900">保存成功！</p>
                    <p className="text-xs text-gray-500 mt-1">单据已关联到 {receiptModal.workItem}</p>
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
