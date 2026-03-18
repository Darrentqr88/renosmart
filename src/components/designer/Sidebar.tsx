'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/lib/i18n/context';
import { createClient } from '@/lib/supabase/client';
import { Profile, Project } from '@/types';

interface SidebarProps {
  profile?: Profile | null;
  aiUsed?: number;
  aiLimit?: number;
}

const STATUS_BADGE: Record<string, string> = {
  pending:   'badge-draft',
  active:    'badge-active',
  confirmed: 'badge-active',
  completed: 'badge-done',
};

const STATUS_LABEL: Record<string, string> = {
  pending:   'Pending',
  active:    'Active',
  confirmed: 'Confirmed',
  completed: 'Done',
};

const navItems = [
  { href: '/designer',                icon: '📊', label: 'Dashboard',       labelZH: '工作台' },
  { href: '/designer/projects',       icon: '📁', label: 'Projects',        labelZH: '项目' },
  { href: '/designer/workers',        icon: '👷', label: 'Workers',         labelZH: '工人' },
  { href: '/designer/price-database', icon: '💰', label: 'Price Database',  labelZH: '价格库' },
  { href: '/designer/cost-database',  icon: '📈', label: 'Cost Database',   labelZH: '成本库' },
  { href: '/designer/settings',       icon: '⚙️', label: 'Settings',        labelZH: '设定' },
];

export function Sidebar({ profile, aiUsed = 0, aiLimit = 3 }: SidebarProps) {
  const { lang } = useI18n();
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
  const aiRemaining = aiLimit === Infinity ? '∞' : aiLimit - aiUsed;
  const aiBarColor = aiPercent >= 90 ? 'var(--red)' : aiPercent >= 70 ? 'var(--orange)' : 'var(--gold)';

  return (
    <aside className="designer-sidebar">
      {/* User info */}
      <div style={{ padding: '16px 16px 14px', borderBottom: '1px solid var(--border2)' }}>
        <div style={{ fontSize: 11, color: 'var(--text3)' }}>
          {lang === 'ZH' ? '登录身份' : 'Logged in as'}
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginTop: 3 }}>
          {profile?.company || profile?.name || 'Designer'}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>
          {profile?.plan === 'elite' ? '⚡ Elite' : profile?.plan === 'pro' ? '✦ Pro' : 'Free Plan'}
        </div>
      </div>

      {/* Navigation */}
      <div className="sidebar-nav">
        <div className="sidebar-label">
          {lang === 'ZH' ? '工作台' : 'WORKSPACE'}
        </div>
        <div className="sidebar-section">
          {navItems.slice(0, 3).map(({ href, icon, label, labelZH }) => {
            const active = pathname === href || (href !== '/designer' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`nav-item${active ? ' active' : ''}`}
              >
                <span className="nav-icon">{icon}</span>
                <span className="nav-label">{lang === 'ZH' ? labelZH : label}</span>
              </Link>
            );
          })}
        </div>

        <div className="sidebar-label" style={{ marginTop: 4 }}>
          {lang === 'ZH' ? '数据库' : 'DATABASES'}
        </div>
        <div className="sidebar-section">
          {navItems.slice(3, 5).map(({ href, icon, label, labelZH }) => {
            const active = pathname === href || pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`nav-item${active ? ' active' : ''}`}
              >
                <span className="nav-icon">{icon}</span>
                <span className="nav-label">{lang === 'ZH' ? labelZH : label}</span>
              </Link>
            );
          })}
        </div>

        {/* Recent Projects */}
        {recentProjects.length > 0 && (
          <>
            <div className="sidebar-label" style={{ marginTop: 4 }}>
              {lang === 'ZH' ? '最近项目' : 'RECENT PROJECTS'}
            </div>
            <div className="sidebar-section">
              {recentProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/designer/projects/${project.id}`}
                  className="sidebar-proj-item"
                >
                  <span style={{ fontSize: 12 }}>🏠</span>
                  <span className="sidebar-proj-name">{project.name}</span>
                  <span className={`sidebar-proj-badge ${STATUS_BADGE[project.status] || 'badge-draft'}`}>
                    {STATUS_LABEL[project.status] || project.status}
                  </span>
                </Link>
              ))}
              <Link href="/designer/projects" className="sidebar-proj-viewall">
                {lang === 'ZH' ? '查看全部项目 →' : 'View all projects →'}
              </Link>
            </div>
          </>
        )}

        <div className="sidebar-label" style={{ marginTop: 4 }}>
          {lang === 'ZH' ? '设置' : 'SETTINGS'}
        </div>
        <div className="sidebar-section">
          {navItems.slice(5).map(({ href, icon, label, labelZH }) => {
            const active = pathname === href || pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`nav-item${active ? ' active' : ''}`}
              >
                <span className="nav-icon">{icon}</span>
                <span className="nav-label">{lang === 'ZH' ? labelZH : label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom: AI usage meter + Upgrade CTA */}
      <div className="sidebar-bottom">
        <Link href="/designer/pricing" style={{ textDecoration: 'none', display: 'block' }}>
          <div className="sidebar-ai-card" style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)' }}>
                ✦ {lang === 'ZH' ? 'AI 额度' : 'AI Quota'}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text3)' }}>
                {profile?.plan === 'elite' ? (lang === 'ZH' ? '无限版' : 'Unlimited') : profile?.plan === 'pro' ? 'Pro' : (lang === 'ZH' ? '免费版' : 'Free')}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>
                {aiUsed}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>
                / {aiLimit === Infinity ? '∞' : aiLimit} {lang === 'ZH' ? '次已用' : 'used'}
              </span>
            </div>
            <div style={{ background: 'var(--surface3)', borderRadius: 3, height: 4, overflow: 'hidden', marginBottom: 8 }}>
              <div
                style={{
                  height: '100%',
                  borderRadius: 3,
                  background: aiBarColor,
                  width: `${aiPercent}%`,
                  transition: 'width 0.4s',
                }}
              />
            </div>
            {/* Upgrade CTA row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 8px',
              borderRadius: 7,
              background: 'rgba(240,185,11,0.08)',
              border: '1px solid rgba(240,185,11,0.2)',
            }}>
              <span style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 600 }}>
                {profile?.plan === 'elite'
                  ? (lang === 'ZH' ? '⚡ Elite 已激活' : '⚡ Elite Active')
                  : profile?.plan === 'pro'
                  ? (lang === 'ZH' ? '✦ Pro 已激活' : '✦ Pro Active')
                  : (lang === 'ZH' ? '⭐ 查看订阅套餐' : '⭐ View Pricing Plans')}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text3)' }}>→</span>
            </div>
          </div>
        </Link>
      </div>
    </aside>
  );
}
