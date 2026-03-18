'use client';

import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/context';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/types';
import { LogOut, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

interface DesignerHeaderProps {
  profile?: Profile | null;
}

export function DesignerHeader({ profile }: DesignerHeaderProps) {
  const { lang, setLang } = useI18n();
  const router = useRouter();
  const supabase = createClient();
  const [showUser, setShowUser] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <nav className="portal-bar">
      {/* Brand */}
      <div className="brand">
        RenoSmart
        <span>PLATFORM</span>
      </div>

      {/* Right side: Lang + User */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Language toggle */}
        <div className="lang-toggle">
          {(['EN', 'BM', 'ZH'] as const).map((l) => (
            <button
              key={l}
              className={`lang-btn${lang === l ? ' active' : ''}`}
              onClick={() => setLang(l)}
            >
              {l === 'BM' ? 'BM' : l}
            </button>
          ))}
        </div>

        {/* User menu */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowUser(!showUser)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '5px 10px',
              borderRadius: 8,
              border: '1px solid var(--border2)',
              background: 'var(--surface)',
              cursor: 'pointer',
              fontSize: 12,
              color: 'var(--text2)',
              transition: 'all 0.15s',
            }}
          >
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                background: 'rgba(240,185,11,0.12)',
                border: '1px solid rgba(240,185,11,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--gold)',
              }}
            >
              {profile?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <span className="portal-username" style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile?.name || 'Designer'}
            </span>
            <ChevronDown size={12} />
          </button>

          {showUser && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 6,
                background: 'var(--surface)',
                border: '1px solid var(--border2)',
                borderRadius: 10,
                boxShadow: '0 8px 24px rgba(27,35,54,.12)',
                minWidth: 180,
                zIndex: 200,
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border2)' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                  {profile?.name || 'Designer'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>
                  {profile?.email || ''}
                </div>
              </div>
              <Link
                href="/designer/settings"
                onClick={() => setShowUser(false)}
                style={{
                  display: 'block',
                  padding: '9px 14px',
                  fontSize: 13,
                  color: 'var(--text2)',
                  textDecoration: 'none',
                  transition: 'background 0.15s',
                }}
                className="hover:bg-[var(--surface2)]"
              >
                ⚙️ Settings
              </Link>
              <button
                onClick={handleSignOut}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '9px 14px',
                  fontSize: 13,
                  color: 'var(--red)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s',
                }}
                className="hover:bg-red-50"
              >
                <LogOut size={13} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
