'use client';

import { useState, useEffect } from 'react';
import { QuotationAnalysis, GanttTask } from '@/types';
import { generateGanttTasks } from '@/lib/utils/gantt-rules';
import { GanttChart } from './GanttChart';
import { Button } from '@/components/ui/button';
import { Loader2, BarChart2, RefreshCw, Download } from 'lucide-react';
import { format } from 'date-fns';

interface GanttAutoGeneratorProps {
  analysis: QuotationAnalysis;
  projectId?: string;
  onSave?: (tasks: GanttTask[]) => void;
}

export function GanttAutoGenerator({ analysis, projectId = 'temp', onSave }: GanttAutoGeneratorProps) {
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [generating, setGenerating] = useState(true);
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    generateTasks();
  }, [analysis]);

  const generateTasks = () => {
    setGenerating(true);

    // Extract sqft from analysis items
    let sqft = 1000;
    for (const item of analysis.items) {
      const name = item.name.toLowerCase();
      if ((name.includes('tiling') || name.includes('floor') || name.includes('wall')) && item.unit === 'sqft') {
        sqft = Math.max(sqft, item.qty);
      }
    }

    // Check if demolition is in scope
    const hasDemolition = analysis.items.some(i =>
      i.name.toLowerCase().includes('demolition') ||
      i.name.toLowerCase().includes('hacking') ||
      i.section?.toLowerCase().includes('demolition')
    );

    const generatedTasks = generateGanttTasks(
      projectId,
      new Date(startDate),
      sqft,
      hasDemolition
    );

    setTasks(generatedTasks);
    setGenerating(false);
  };

  const handleTaskUpdate = (taskId: string, updates: Partial<GanttTask>) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
  };

  const handleSave = () => {
    onSave?.(tasks);
  };

  if (generating) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#F0B90B] mx-auto mb-3" />
        <p className="text-gray-600 font-medium">Generating Gantt Chart...</p>
        <p className="text-sm text-gray-400 mt-1">Based on quotation scope and MY/SG workflow</p>
      </div>
    );
  }

  const projectEnd = tasks.length > 0 ? tasks[tasks.length - 1].end_date : '';

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      {/* Gantt header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <BarChart2 className="w-5 h-5 text-[#F0B90B]" />
          <div>
            <h2 className="font-semibold text-gray-900">Auto-Generated Gantt Chart</h2>
            <p className="text-xs text-gray-500">
              {tasks.length} tasks · Est. completion: {projectEnd ? format(new Date(projectEnd), 'dd MMM yyyy') : 'N/A'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Start Date:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-sm border border-gray-200 rounded px-2 py-1"
            />
          </div>
          <Button variant="outline" size="sm" onClick={generateTasks} className="gap-2">
            <RefreshCw className="w-3 h-3" /> Regenerate
          </Button>
          {onSave && (
            <Button variant="gold" size="sm" onClick={handleSave} className="gap-2">
              <Download className="w-3 h-3" /> Save Gantt
            </Button>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="px-5 py-3 border-b border-gray-100 flex flex-wrap gap-3">
        {[
          { color: '#EF4444', label: 'Demolition' },
          { color: '#F59E0B', label: 'Electrical' },
          { color: '#3B82F6', label: 'Plumbing' },
          { color: '#8B5CF6', label: 'Waterproofing' },
          { color: '#10B981', label: 'Tiling' },
          { color: '#6366F1', label: 'False Ceiling' },
          { color: '#EC4899', label: 'Painting' },
          { color: '#D97706', label: 'Carpentry' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs text-gray-600">
            <div className="w-3 h-3 rounded-sm" style={{ background: color }} />
            {label}
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-xs text-gray-600 ml-auto">
          <div className="w-3 h-3 rounded-sm border border-gray-900 bg-transparent" />
          Critical Path
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <div className="w-3 h-0.5 bg-[#F0B90B]" style={{ borderTop: '2px dashed #F0B90B' }} />
          Today
        </div>
      </div>

      {/* Gantt chart */}
      <div className="p-4">
        <GanttChart tasks={tasks} onTaskUpdate={handleTaskUpdate} />
      </div>

      {/* Summary */}
      <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-sm">
        <span className="text-gray-600">
          Project Duration: <strong className="text-gray-900">
            {tasks.length > 0
              ? Math.ceil((new Date(tasks[tasks.length - 1].end_date).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24 * 7))
              : 0} weeks
          </strong>
        </span>
        <span className="text-xs text-gray-400">Drag bars to adjust dates · Click to expand sub-tasks</span>
      </div>
    </div>
  );
}
