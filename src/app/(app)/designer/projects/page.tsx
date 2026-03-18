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
import { Search, Plus, MapPin, MoreVertical, Pencil, Trash2, Check, X } from 'lucide-react';

export default function ProjectsListPage() {
  const router = useRouter();
  const supabase = createClient();
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

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

  const filtered = projects.filter(p =>
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

      <div className="relative max-w-sm mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search projects..." className="pl-9" />
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
              className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-all cursor-pointer relative"
              onClick={() => renamingId !== project.id && router.push(`/designer/projects/${project.id}`)}>

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
                        className="flex-1 min-w-0 text-sm font-semibold border border-[#F0B90B] rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#F0B90B]"
                      />
                      <button onClick={e => handleRenameSave(project.id, e)}
                        className="w-7 h-7 bg-[#F0B90B] rounded-lg flex items-center justify-center flex-shrink-0 hover:bg-[#d4a20a]">
                        <Check className="w-3.5 h-3.5 text-black" />
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
                <span className="text-xs font-medium text-[#F0B90B]">{project.progress}%</span>
              </div>
              <Progress value={project.progress} className="h-1.5 mb-3" />
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-gray-900">{formatCurrency(project.contract_amount)}</span>
                <span className="text-xs text-gray-400">{formatDate(project.updated_at)}</span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16 text-gray-400">
              No projects found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
