'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Phone, AlertCircle, CheckCircle2 } from 'lucide-react';

const COUNTRY_CODES = [
  { code: '+60', flag: '🇲🇾', label: 'MY' },
  { code: '+65', flag: '🇸🇬', label: 'SG' },
  { code: '+62', flag: '🇮🇩', label: 'ID' },
];

function JoinPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const supabase = createClient();

  const [countryCode, setCountryCode] = useState('+60');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState('');
  const [designerName, setDesignerName] = useState('');
  const [designerCompany, setDesignerCompany] = useState('');
  const [projectName, setProjectName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setValidating(false);
      setTokenError('invalid');
      return;
    }

    fetch(`/api/worker-auth?token=${encodeURIComponent(token)}`)
      .then(res => res.json())
      .then(data => {
        if (data.valid) {
          setTokenValid(true);
          setDesignerName(data.designer_name || '');
          setDesignerCompany(data.designer_company || '');
          setProjectName(data.project_name || '');
        } else {
          setTokenError(data.error || 'invalid');
        }
      })
      .catch(() => setTokenError('invalid'))
      .finally(() => setValidating(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim() || !token) return;

    setLoading(true);
    setError('');

    try {
      // 1. Call worker-auth API to validate token + create/find user
      const res = await fetch('/api/worker-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, phone: phoneNumber, countryCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        setLoading(false);
        return;
      }

      // 2. Sign in with returned credentials
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (signInErr) {
        console.error('Sign-in error:', signInErr);
        setError('Failed to sign in. Please try again.');
        setLoading(false);
        return;
      }

      // 3. Success! Redirect to worker dashboard
      setSuccess(true);
      setTimeout(() => {
        router.push('/worker');
        router.refresh();
      }, 500);
    } catch (err) {
      console.error('Join error:', err);
      setError('Network error. Please check your connection.');
      setLoading(false);
    }
  };

  // Error states
  const renderError = () => {
    let title = 'Invalid Link';
    let desc = 'This invite link is not valid. Please ask your boss for a new one.';

    if (tokenError === 'expired') {
      title = 'Link Expired';
      desc = 'This invite link has expired. Ask your boss to generate a new one.';
    } else if (tokenError === 'already_claimed') {
      title = 'Link Already Used';
      desc = 'This invite link has already been used. If you need access, ask your boss for a new link.';
    }

    return (
      <div style={{ textAlign: 'center', padding: '0 20px' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%', margin: '0 auto 20px',
          background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <AlertCircle size={32} style={{ color: '#F87171' }} />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#F1F5F9', marginBottom: 8 }}>{title}</h2>
        <p style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.6 }}>{desc}</p>
        <Link href="/login" style={{
          display: 'inline-block', marginTop: 24, padding: '10px 24px', borderRadius: 10,
          background: 'rgba(255,255,255,0.06)', color: '#94A3B8', fontSize: 14, textDecoration: 'none',
        }}>
          Go to Login
        </Link>
      </div>
    );
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: '#0B0F1A', padding: '24px 16px',
    }}>
      <style>{`
        @keyframes joinFade { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .join-fade { animation: joinFade 0.4s ease-out both; }
        .join-input { width:100%; padding:12px 14px; border-radius:12px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.04); color:#F1F5F9; font-size:16px; outline:none; transition:border-color 0.2s; }
        .join-input:focus { border-color:rgba(232,163,23,0.5); }
        .join-input::placeholder { color:rgba(255,255,255,0.25); }
        .join-select { padding:12px 8px; border-radius:12px 0 0 12px; border:1px solid rgba(255,255,255,0.1); border-right:none; background:rgba(255,255,255,0.06); color:#F1F5F9; font-size:15px; outline:none; cursor:pointer; min-width:90px; }
        .join-select:focus { border-color:rgba(232,163,23,0.5); }
        .join-phone { border-radius:0 12px 12px 0 !important; }
      `}</style>

      {/* Logo */}
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#F1F5F9', marginBottom: 32 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg, #E8A317, #D4940F)', fontWeight: 800, fontSize: 15, color: '#0B0F1A',
          fontFamily: 'var(--font-dm-mono)',
        }}>RS</div>
        <span style={{ fontSize: 20, fontWeight: 700 }}>RenoSmart</span>
      </Link>

      <div style={{ width: '100%', maxWidth: 380 }} className="join-fade">
        {/* Loading */}
        {validating && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Loader2 size={32} style={{ color: '#E8A317', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: '#94A3B8', marginTop: 16, fontSize: 14 }}>Verifying invite link...</p>
          </div>
        )}

        {/* Token error */}
        {!validating && !tokenValid && renderError()}

        {/* Success animation */}
        {success && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', margin: '0 auto 20px',
              background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CheckCircle2 size={32} style={{ color: '#10B981' }} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F1F5F9', marginBottom: 8 }}>Welcome!</h2>
            <p style={{ fontSize: 14, color: '#94A3B8' }}>Redirecting to your dashboard...</p>
          </div>
        )}

        {/* Phone form */}
        {!validating && tokenValid && !success && (
          <>
            {/* Designer info */}
            <div style={{
              padding: 16, borderRadius: 14, marginBottom: 24,
              background: 'rgba(232,163,23,0.06)', border: '1px solid rgba(232,163,23,0.15)',
            }}>
              <p style={{ fontSize: 13, color: '#E8A317', fontWeight: 600, marginBottom: 4 }}>
                Invited by
              </p>
              <p style={{ fontSize: 16, color: '#F1F5F9', fontWeight: 600 }}>
                {designerName}
              </p>
              {designerCompany && (
                <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 2 }}>{designerCompany}</p>
              )}
              {projectName && (
                <p style={{ fontSize: 12, color: '#64748B', marginTop: 6 }}>
                  Project: {projectName}
                </p>
              )}
            </div>

            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#F1F5F9', marginBottom: 6, textAlign: 'center' }}>
              Enter your phone number
            </h1>
            <p style={{ fontSize: 14, color: '#94A3B8', marginBottom: 28, textAlign: 'center', lineHeight: 1.5 }}>
              No password needed — just your phone number
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', marginBottom: 20 }}>
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="join-select"
                >
                  {COUNTRY_CODES.map(c => (
                    <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                  ))}
                </select>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => {
                    // Only allow digits
                    const val = e.target.value.replace(/[^\d]/g, '');
                    setPhoneNumber(val);
                  }}
                  placeholder="0176543210"
                  className="join-input join-phone"
                  required
                  autoFocus
                  inputMode="tel"
                  maxLength={15}
                />
              </div>

              {error && (
                <div style={{
                  padding: 12, borderRadius: 10, marginBottom: 16,
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                  fontSize: 13, color: '#F87171', display: 'flex', gap: 8, alignItems: 'center',
                }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !phoneNumber.trim()}
                style={{
                  width: '100%', padding: '13px 0', borderRadius: 12, border: 'none',
                  background: loading || !phoneNumber.trim()
                    ? 'rgba(232,163,23,0.3)'
                    : 'linear-gradient(135deg, #E8A317, #D4940F)',
                  color: '#0B0F1A', fontSize: 16, fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'opacity 0.2s',
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Phone size={18} />
                    Continue
                  </>
                )}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
              By continuing, you agree to use RenoSmart for project collaboration with your team.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#0B0F1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={32} style={{ color: '#E8A317', animation: 'spin 1s linear infinite' }} />
      </div>
    }>
      <JoinPageContent />
    </Suspense>
  );
}
