'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/lib/i18n/context';
import { createClient } from '@/lib/supabase/client';
import { Profile, Project } from '@/types';
import {
  LayoutDashboard, FolderOpen, Users,
  TrendingUp, Receipt, Settings, Sparkles, ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  profile?: Profile | null;
  aiUsed?: number;
  aiLimit?: number;
}

const STATUS_DOT: Record<string, string> = {
  pending: '#4F8EF7',
  active: '#F97316',
  confirmed: '#F97316',
  completed: '#22C55E',
};

/* Quotation removed from sidebar per user request — page still accessible via URL */
const NAV_KEYS: { href: string; icon: typeof LayoutDashboard; key: string }[] = [
  { href: '/designer',                icon: LayoutDashboard, key: 'dashboard' },
  { href: '/designer/projects',       icon: FolderOpen,      key: 'projects' },
  { href: '/designer/workers',        icon: Users,           key: 'workers' },
  { href: '/designer/price-database', icon: TrendingUp,      key: 'priceDb' },
  { href: '/designer/cost-database',  icon: Receipt,         key: 'costDb' },
];

export function Sidebar({ profile, aiUsed = 0, aiLimit = 3 }: SidebarProps) {
  const { lang, t } = useI18n();
  const pathname = usePathname();
  const supabase = createClient();

  const [recentProjects, setRecentProjects] = useState<Project[]>([]);

  useEffect(() => {
    const loadProjects = async () => {
      const { data } = await supabase
        .from('projects')
        .select('id, name, status, progress')
        .order('updated_at', { ascending: false })
        .limit(5);
      if (data) setRecentProjects(data as Project[]);
    };
    loadProjects();
  }, [supabase]);

  const aiPercent = aiLimit === Infinity ? 10 : Math.min((aiUsed / aiLimit) * 100, 100);

  return (
    <aside className="designer-sidebar" role="navigation" aria-label="Main navigation">
      {/* User info — compact */}
      <div className="px-4 py-4 border-b border-[#E2E4EE]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4F8EF7] to-[#8B5CF6] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
            {(profile?.name || 'D')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-[#1A1A2E] truncate leading-tight">
              {profile?.company || profile?.name || 'Designer'}
            </div>
            <div className="text-[11px] text-[#8B8BA8] mt-0.5">
              {profile?.plan === 'elite' ? 'Elite' : profile?.plan === 'pro' ? 'Pro' : 'Free'}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="sidebar-nav">
        <div className="sidebar-label">
          {lang === 'ZH' ? '工作台' : lang === 'BM' ? 'RUANG KERJA' : 'WORKSPACE'}
        </div>
        <div className="sidebar-section">
          {NAV_KEYS.slice(0, 3).map(({ href, icon: Icon, key }) => {
            const active = pathname === href || (href !== '/designer' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`nav-item${active ? ' active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={1.6} />
                <span className="nav-label">{key === 'costDb' ? t.costDb : (t.nav as Record<string, string>)[key] || key}</span>
              </Link>
            );
          })}
        </div>

        <div className="sidebar-label" style={{ marginTop: 4 }}>
          {lang === 'ZH' ? '数据库' : lang === 'BM' ? 'PANGKALAN DATA' : 'DATABASES'}
        </div>
        <div className="sidebar-section">
          {NAV_KEYS.slice(3, 5).map(({ href, icon: Icon, key }) => {
            const active = pathname === href || pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`nav-item${active ? ' active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={1.6} />
                <span className="nav-label">{key === 'costDb' ? t.costDb : (t.nav as Record<string, string>)[key] || key}</span>
              </Link>
            );
          })}
        </div>

        {/* Recent Projects */}
        {recentProjects.length > 0 && (
          <>
            <div className="sidebar-label" style={{ marginTop: 4 }}>
              {lang === 'ZH' ? '最近项目' : lang === 'BM' ? 'TERKINI' : 'RECENT'}
            </div>
            <div className="sidebar-section">
              {recentProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/designer/projects/${project.id}`}
                  className="sidebar-proj-item"
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: STATUS_DOT[project.status] || '#E2E4EE' }}
                  />
                  <span className="sidebar-proj-name">{project.name}</span>
                </Link>
              ))}
              <Link href="/designer/projects" className="sidebar-proj-viewall">
                {lang === 'ZH' ? '查看全部 →' : lang === 'BM' ? 'Lihat semua →' : 'View all →'}
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Bottom: AI usage + Settings */}
      <div className="sidebar-bottom">
        <Link href="/designer/pricing" className="block no-underline">
          <div className="sidebar-ai-card">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#4F8EF7]" strokeWidth={1.8} />
                <span className="text-[11px] font-semibold text-[#4F8EF7] tracking-wide">
                  {lang === 'ZH' ? 'AI 额度' : lang === 'BM' ? 'Kuota AI' : 'AI Quota'}
                </span>
              </div>
              <span className="text-[10px] text-[#8B8BA8]">
                {aiUsed}/{aiLimit === Infinity ? '∞' : aiLimit}
              </span>
            </div>
            {/* Gradient progress bar */}
            <div className="h-1.5 bg-[#ECEEF5] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${aiPercent}%`,
                  background: 'linear-gradient(90deg, #4F8EF7, #8B5CF6, #EC4899)',
                }}
              />
            </div>
          </div>
        </Link>

        {/* Settings link */}
        <Link
          href="/designer/settings"
          className={`nav-item${pathname === '/designer/settings' ? ' active' : ''}`}
          aria-current={pathname === '/designer/settings' ? 'page' : undefined}
        >
          <Settings className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={1.6} />
          <span className="nav-label">{t.nav.settings}</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#C7C7CC] ml-auto" />
        </Link>
      </div>
    </aside>
  );
}
