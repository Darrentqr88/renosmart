'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n/context';
import { Project } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Search, Bell, Plus, MapPin, User, Clock, MoreHorizontal, Eye, Edit, Archive } from 'lucide-react';

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  const { prices } = useI18n();

  const statusColors: Record<string, string> = {
    pending: 'bg-blue-100 text-blue-700',
    active: 'bg-amber-100 text-amber-700',
    completed: 'bg-green-100 text-green-700',
  };

  return (
    <div
      className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{project.name}</h3>
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{project.address}</span>
          </div>
        </div>
        <button className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-100 transition-all">
          <MoreHorizontal className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
          <User className="w-3 h-3 text-gray-500" />
        </div>
        <span className="text-xs text-gray-600">{project.client_name}</span>
        <span className="ml-auto text-xs font-semibold text-gray-700">
          {formatCurrency(project.contract_amount, prices.currency)}
        </span>
      </div>

      {project.status === 'active' && (
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500">Progress</span>
            <span className="text-[#F0B90B] font-medium">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-1.5" />
        </div>
      )}

      <div className="flex items-center justify-between">
        <Badge className={statusColors[project.status]}>
          {project.status === 'pending' ? '待开工' : project.status === 'active' ? '在施工' : '已完工'}
        </Badge>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Clock className="w-3 h-3" />
          {formatDate(project.updated_at)}
        </div>
      </div>
    </div>
  );
}

export default function DesignerDashboard() {
  const { t } = useI18n();
  const router = useRouter();
  const supabase = createClient();
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectAddress, setNewProjectAddress] = useState('');
  const [newProjectClient, setNewProjectClient] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('designer_id', session.user.id)
      .order('updated_at', { ascending: false });

    setProjects(data || []);
    setLoading(false);
  };

  const handleCreateProject = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase.from('projects').insert({
      designer_id: session.user.id,
      user_id: session.user.id,
      name: newProjectName,
      address: newProjectAddress,
      client_name: newProjectClient,
      contract_amount: 0,
      status: 'pending',
      progress: 0,
    }).select().single();

    if (!error && data) {
      setProjects((prev) => [data, ...prev]);
      setShowNewProject(false);
      setNewProjectName('');
      setNewProjectAddress('');
      setNewProjectClient('');
      router.push(`/designer/projects/${data.id}`);
    }
  };

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.client_name.toLowerCase().includes(search.toLowerCase())
  );

  const pending = filteredProjects.filter((p) => p.status === 'pending');
  const active = filteredProjects.filter((p) => p.status === 'active');
  const completed = filteredProjects.filter((p) => p.status === 'completed');

  const columns = [
    { key: 'pending', label: '待开工 Pending', projects: pending, color: 'text-blue-600 bg-blue-50', dot: 'bg-blue-500' },
    { key: 'active', label: '在施工 Active', projects: active, color: 'text-amber-600 bg-amber-50', dot: 'bg-amber-500' },
    { key: 'completed', label: '已完工 Done', projects: completed, color: 'text-green-600 bg-green-50', dot: 'bg-green-500' },
  ];

  return (
    <div className="flex-1 flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4">
        <div className="flex-1 relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="pl-9 border-gray-200"
          />
        </div>
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#F0B90B] rounded-full" />
        </button>
        <Button variant="gold" onClick={() => setShowNewProject(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          {t.buttons.newProject}
        </Button>
      </div>

      {/* Kanban board */}
      <div className="flex-1 p-6 overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-400">Loading projects...</div>
          </div>
        ) : (
          <div className="flex gap-6 min-w-max">
            {columns.map(({ key, label, projects: colProjects, color, dot }) => (
              <div key={key} className="w-80 flex-shrink-0">
                {/* Column header */}
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-2 h-2 rounded-full ${dot}`} />
                  <h2 className="font-semibold text-gray-700 text-sm">{label}</h2>
                  <Badge className={`${color} ml-auto text-xs`}>{colProjects.length}</Badge>
                </div>

                {/* Cards */}
                <div className="space-y-3">
                  {colProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onClick={() => router.push(`/designer/projects/${project.id}`)}
                    />
                  ))}
                  {colProjects.length === 0 && (
                    <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center">
                      <p className="text-sm text-gray-400">No projects here</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New project modal */}
      {showNewProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-6">New Project</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Project Name</label>
                <Input value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. Bangsar Condo Renovation" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Project Address</label>
                <Input value={newProjectAddress} onChange={(e) => setNewProjectAddress(e.target.value)}
                  placeholder="Full address" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Client Name</label>
                <Input value={newProjectClient} onChange={(e) => setNewProjectClient(e.target.value)}
                  placeholder="Client&apos;s full name" className="mt-1" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowNewProject(false)} className="flex-1">Cancel</Button>
              <Button variant="gold" onClick={handleCreateProject} className="flex-1" disabled={!newProjectName}>
                Create Project
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
