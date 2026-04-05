'use client';

import { useState, useCallback, Suspense } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n/context';
import { TeamProvider } from '@/lib/team/TeamContext';
import { Sidebar } from './Sidebar';
import { Profile } from '@/types';
import {
  Menu, X, LayoutDashboard, FolderOpen, Users, Settings,
} from 'lucide-react';

interface DesignerShellProps {
  profile: Profile | null;
  aiUsed: number;
  aiLimit: number;
  isTeamMember?: boolean;
  children: React.ReactNode;
}

function DesignerShellInner({ profile, aiUsed, aiLimit, isTeamMember, children }: DesignerShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useI18n();

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  const NAV_ITEMS = [
    { href: '/designer', icon: LayoutDashboard, label: t.nav.dashboard },
    { href: '/designer/projects', icon: FolderOpen, label: t.nav.projects },
    { href: '/designer/workers', icon: Users, label: t.nav.workers },
    { href: '/designer/settings', icon: Settings, label: t.nav.settings },
  ];

  return (
    <div className="designer-layout" style={{ marginTop: 0 }}>
      {/* Hamburger — visible only on mobile via CSS */}
      <button
        className="mobile-hamburger"
        onClick={() => setSidebarOpen(prev => !prev)}
        aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Backdrop — visible only when sidebar open on mobile */}
      {sidebarOpen && (
        <div className="mobile-sidebar-backdrop" onClick={closeSidebar} />
      )}

      {/* Sidebar — always visible on desktop, overlay on mobile */}
      <Sidebar
        profile={profile}
        aiUsed={aiUsed}
        aiLimit={aiLimit}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />

      <main style={{ background: 'var(--bg)', overflowY: 'auto', minHeight: 'calc(100vh - 60px)' }}>
        {children}
      </main>

      {/* Bottom nav — visible only on mobile via CSS */}
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = href === '/designer'
            ? pathname === '/designer'
            : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`bottom-nav-item${active ? ' active' : ''}`}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function DesignerShell(props: DesignerShellProps) {
  return (
    <Suspense fallback={null}>
      <TeamProvider profile={props.profile}>
        <DesignerShellInner {...props} />
      </TeamProvider>
    </Suspense>
  );
}
