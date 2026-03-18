'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Project } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Search, Plus, MapPin, MoreVertical, Pencil, Trash2, Check, X, FolderOpen } from 'lucide-react';

export default function ProjectsListPage() {
  const router = useRouter();
  const supabase = createClient();
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Menu state
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Rename state
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Delete confirm state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase.from('projects').select('*').eq('designer_id', session.user.id).order('updated_at', { ascending: false });
      setProjects(data || []);
      setLoading(false);
    })();
  }, []);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = projects
    .filter(p => statusFilter === 'all' || p.status === statusFilter)
    .filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.client_name.toLowerCase().includes(search.toLowerCase())
    );

  const handleRenameStart = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpenId(null);
    setRenamingId(project.id);
    setRenameValue(project.name);
  };

  const handleRenameSave = async (projectId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const trimmed = renameValue.trim();
    if (!trimmed) return;
    await supabase.from('projects').update({ name: trimmed }).eq('id', projectId);
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, name: trimmed } : p));
    setRenamingId(null);
  };

  const handleRenameCancel = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setRenamingId(null);
  };

  const handleDeleteConfirm = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpenId(null);
    setDeletingId(projectId);
  };

  const handleDeleteExecute = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!deletingId) return;
    await supabase.from('projects').delete().eq('id', deletingId);
    setProjects(prev => prev.filter(p => p.id !== deletingId));
    setDeletingId(null);
  };

  return (
    <div className="flex-1 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-500 mt-1">{projects.length} total projects</p>
        </div>
        <Button variant="gold" onClick={() => router.push('/designer')} className="gap-2">
          <Plus className="w-4 h-4" /> New Project
        </Button>
      </div>

      <div className="relative max-w-sm mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search projects..." className="pl-9" />
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-2 mb-4">
        {['all', 'pending', 'active', 'completed'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              statusFilter === s
                ? 'bg-gradient-to-r from-[#4F8EF7] via-[#8B5CF6] to-[#EC4899] text-white shadow-sm'
                : 'bg-[#F3F4F8] text-[#4A4A6A] hover:bg-[#E2E4EE]'
            }`}>
            {s === 'all' ? `All (${projects.length})` : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Statistics summary */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-[#ECEEF5] p-4">
          <div className="text-2xl font-bold text-[#1A1A2E]">{projects.length}</div>
          <div className="text-xs text-[#8B8BA8]">Total Projects</div>
        </div>
        <div className="bg-white rounded-xl border border-[#ECEEF5] p-4">
          <div className="text-2xl font-bold text-[#4F8EF7]">{projects.filter(p => p.status === 'active').length}</div>
          <div className="text-xs text-[#8B8BA8]">Active</div>
        </div>
        <div className="bg-white rounded-xl border border-[#ECEEF5] p-4">
          <div className="text-2xl font-bold text-[#22C55E]">{projects.filter(p => p.status === 'completed').length}</div>
          <div className="text-xs text-[#8B8BA8]">Completed</div>
        </div>
        <div className="bg-white rounded-xl border border-[#ECEEF5] p-4">
          <div className="text-2xl font-bold text-[#1A1A2E]">{formatCurrency(projects.reduce((s,p) => s + (p.contract_amount || 0), 0))}</div>
          <div className="text-xs text-[#8B8BA8]">Total Value</div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setDeletingId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
            onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-1">删除项目</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              确认删除「{projects.find(p => p.id === deletingId)?.name}」？此操作无法撤销。
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setDeletingId(null)}>取消</Button>
              <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white" onClick={handleDeleteExecute}>
                确认删除
              </Button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-gray-400">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" ref={menuRef}>
          {filtered.map((project) => (
            <div key={project.id}
              className="bg-white rounded-xl border border-[#ECEEF5] overflow-hidden hover:shadow-md transition-all cursor-pointer relative group"
              onClick={() => renamingId !== project.id && router.push(`/designer/projects/${project.id}`)}>
              {/* Gradient top decoration */}
              <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, #4F8EF7, #8B5CF6, #EC4899, #F97316)' }} />
              <div className="p-5">

              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0 pr-2">
                  {/* Rename inline editor */}
                  {renamingId === project.id ? (
                    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleRenameSave(project.id);
                          if (e.key === 'Escape') handleRenameCancel();
                        }}
                        className="flex-1 min-w-0 text-sm font-semibold border border-[#4F8EF7] rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#4F8EF7]"
                      />
                      <button onClick={e => handleRenameSave(project.id, e)}
                        className="w-7 h-7 bg-[#4F8EF7] rounded-lg flex items-center justify-center flex-shrink-0 hover:bg-[#3B7BE8]">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </button>
                      <button onClick={handleRenameCancel}
                        className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 hover:bg-gray-200">
                        <X className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                    </div>
                  ) : (
                    <h3 className="font-semibold text-gray-900 truncate">{project.name}</h3>
                  )}
                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{project.address}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Badge className={project.status === 'active' ? 'bg-amber-100 text-amber-700' : project.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}>
                    {project.status}
                  </Badge>

                  {/* ⋮ menu button */}
                  <div className="relative">
                    <button
                      onClick={e => { e.stopPropagation(); setMenuOpenId(menuOpenId === project.id ? null : project.id); }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {menuOpenId === project.id && (
                      <div className="absolute right-0 top-8 w-36 bg-white rounded-xl border border-gray-200 shadow-lg z-20 overflow-hidden"
                        onClick={e => e.stopPropagation()}>
                        <button
                          onClick={e => handleRenameStart(project, e)}
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5 text-gray-400" /> 改名
                        </button>
                        <button
                          onClick={e => handleDeleteConfirm(project.id, e)}
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> 删除
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-600 mb-3">
                <span className="font-medium">Client:</span> {project.client_name}
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">Progress</span>
                <span className="text-xs font-medium text-[#4F8EF7]">{project.progress}%</span>
              </div>
              <Progress value={project.progress} className="h-1.5 mb-3" />
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-gray-900">{formatCurrency(project.contract_amount)}</span>
                <span className="text-xs text-gray-400">{formatDate(project.updated_at)}</span>
              </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && !loading && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 px-8">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#4F8EF7]/10 via-[#8B5CF6]/10 to-[#EC4899]/10 flex items-center justify-center mb-6 border-2 border-dashed border-[#E2E4EE]">
                <FolderOpen className="w-12 h-12 text-[#8B8BA8]" />
              </div>
              <h3 className="text-lg font-bold text-[#1A1A2E] mb-2">
                {search ? '没有找到匹配的项目' : '还没有项目'}
              </h3>
              <p className="text-sm text-[#8B8BA8] mb-6 text-center max-w-sm">
                {search ? '尝试不同的搜索关键词' : '上传报价单来创建你的第一个项目，AI 将自动分析并生成施工计划'}
              </p>
              {!search && (
                <div className="flex items-center gap-6 mb-8">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className="w-10 h-10 rounded-lg bg-[#4F8EF7]/10 flex items-center justify-center">
                      <span className="text-lg">📄</span>
                    </div>
                    <span className="text-[10px] text-[#8B8BA8] max-w-[60px]">上传报价单</span>
                  </div>
                  <div className="text-[#E2E4EE]">→</div>
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className="w-10 h-10 rounded-lg bg-[#8B5CF6]/10 flex items-center justify-center">
                      <span className="text-lg">🤖</span>
                    </div>
                    <span className="text-[10px] text-[#8B8BA8] max-w-[60px]">AI 分析</span>
                  </div>
                  <div className="text-[#E2E4EE]">→</div>
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className="w-10 h-10 rounded-lg bg-[#EC4899]/10 flex items-center justify-center">
                      <span className="text-lg">📊</span>
                    </div>
                    <span className="text-[10px] text-[#8B8BA8] max-w-[60px]">自动甘特图</span>
                  </div>
                </div>
              )}
              <Button variant="gold" onClick={() => router.push('/designer/quotation')} className="gap-2">
                <Plus className="w-4 h-4" /> {search ? '创建新项目' : '上传报价单开始'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
