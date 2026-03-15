'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/context';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  LayoutDashboard, FolderOpen, FileText, Users, Database,
  CreditCard, Settings, LogOut, Zap, Building2,
} from 'lucide-react';
import { Profile } from '@/types';

interface SidebarProps {
  profile?: Profile | null;
  aiUsed?: number;
  aiLimit?: number;
}

export function Sidebar({ profile, aiUsed = 0, aiLimit = 3 }: SidebarProps) {
  const { t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const navItems = [
    { href: '/designer', icon: LayoutDashboard, label: t.nav.dashboard },
    { href: '/designer/projects', icon: FolderOpen, label: t.nav.projects },
    { href: '/designer/quotation', icon: FileText, label: t.nav.quotation },
    { href: '/designer/workers', icon: Users, label: t.nav.workers },
    { href: '/designer/pricing', icon: CreditCard, label: t.nav.pricing },
    { href: '/designer/settings', icon: Settings, label: t.nav.settings },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const planColors: Record<string, string> = {
    free: 'text-white/50 bg-white/10',
    pro: 'text-[#F0B90B] bg-[#F0B90B]/20',
    elite: 'text-purple-400 bg-purple-400/20',
  };

  const aiPercent = aiLimit === Infinity ? 100 : Math.min((aiUsed / aiLimit) * 100, 100);
  const aiRemaining = aiLimit === Infinity ? '∞' : aiLimit - aiUsed;

  return (
    <aside className="w-[280px] bg-[#0F1923] border-r border-white/5 flex flex-col h-screen fixed left-0 top-0 z-30">
      {/* Brand */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#F0B90B] flex items-center justify-center flex-shrink-0">
            <span className="text-black font-bold text-sm">RS</span>
          </div>
          <div className="min-w-0">
            <div className="font-bold text-white truncate">RenoSmart</div>
            <div className="text-xs text-white/40 truncate">
              {profile?.company || profile?.name || 'Designer'}
            </div>
          </div>
        </div>

        {/* Plan badge */}
        <div className="flex items-center gap-2">
          <Badge className={cn('text-xs', planColors[profile?.plan || 'free'])}>
            {profile?.plan === 'elite' ? <Zap className="w-3 h-3 mr-1" /> : null}
            {(profile?.plan || 'free').toUpperCase()}
          </Badge>
          <span className="text-xs text-white/40">{profile?.name || 'User'}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/designer' && pathname.startsWith(href));
          return (
            <Link key={href} href={href}>
              <div className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
                active
                  ? 'bg-[#F0B90B]/15 text-[#F0B90B] font-medium'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              )}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* AI Usage meter */}
      <div className="p-4 border-t border-white/5">
        <div className="bg-white/5 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-white/50">AI Analyses</span>
            <span className="text-xs text-white/70">
              {typeof aiRemaining === 'number' ? `${aiRemaining} left` : '∞'}
            </span>
          </div>
          <Progress
            value={aiPercent}
            className="h-1.5 bg-white/10"
          />
          <div className="flex justify-between mt-2">
            <span className="text-xs text-white/30">{aiUsed} used</span>
            <span className="text-xs text-white/30">
              {aiLimit === Infinity ? 'Unlimited' : `${aiLimit} total`}
            </span>
          </div>
          {profile?.plan === 'free' && (
            <Link href="/designer/pricing">
              <div className="mt-3 flex items-center gap-1 text-xs text-[#F0B90B] hover:underline cursor-pointer">
                <Zap className="w-3 h-3" />
                Upgrade for more
              </div>
            </Link>
          )}
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 mt-2 rounded-lg text-sm text-white/40 hover:text-white hover:bg-white/5 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
