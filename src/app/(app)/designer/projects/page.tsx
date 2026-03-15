'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Project } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Search, Plus, MapPin, ArrowRight } from 'lucide-react';

export default function ProjectsListPage() {
  const router = useRouter();
  const supabase = createClient();
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase.from('projects').select('*').eq('designer_id', session.user.id).order('updated_at', { ascending: false });
      setProjects(data || []);
      setLoading(false);
    })();
  }, []);

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.client_name.toLowerCase().includes(search.toLowerCase())
  );

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

      {loading ? (
        <div className="text-gray-400">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((project) => (
            <div key={project.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-all cursor-pointer"
              onClick={() => router.push(`/designer/projects/${project.id}`)}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{project.name}</h3>
                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                    <MapPin className="w-3 h-3" /> {project.address}
                  </div>
                </div>
                <Badge className={project.status === 'active' ? 'bg-amber-100 text-amber-700' : project.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}>
                  {project.status}
                </Badge>
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
