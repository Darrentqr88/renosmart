'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, Phone } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

type LoginTab = 'email' | 'phone';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get('message');
  const errorMsg = searchParams.get('error');
  const roleHint = searchParams.get('role'); // 'worker' | 'owner' | 'designer'
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<LoginTab>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [phonePrefix, setPhonePrefix] = useState('+60');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const completePendingProfile = async () => {
    try {
      const pending = localStorage.getItem('pending_profile');
      if (!pending) return;
      const profileData = JSON.parse(pending);
      const { error } = await supabase.from('profiles').upsert({ ...profileData, updated_at: new Date().toISOString() });
      if (!error) localStorage.removeItem('pending_profile');
    } catch { /* non-critical */ }
  };

  const getRoleAndRedirect = async (userId: string) => {
    // Always read role from profiles table (user_metadata.role not set for Google users)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .single();
    const role = profile?.role;
    if (role === 'owner')  { router.push('/owner');    router.refresh(); return; }
    if (role === 'worker') { router.push('/worker');   router.refresh(); return; }
    // No profile yet (Google new user) → complete registration
    if (!role) { router.push('/register?step=2');      return; }
    router.push('/designer');
    router.refresh();
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await completePendingProfile();
      await getRoleAndRedirect(data.user.id);
    } catch (error: unknown) {
      toast({ variant: 'destructive', title: 'Login failed', description: error instanceof Error ? error.message : 'Login failed' });
    } finally { setLoading(false); }
  };

  const handleSendOtp = async () => {
    if (!phone) return;
    setLoading(true);
    try {
      const fullPhone = `${phonePrefix}${phone}`;
      const { error } = await supabase.auth.signInWithOtp({ phone: fullPhone });
      if (error) throw error;
      setOtpSent(true);
      toast({ title: 'OTP sent', description: `Verification code sent to ${fullPhone}` });
    } catch (error: unknown) {
      toast({ variant: 'destructive', title: 'Error', description: error instanceof Error ? error.message : 'Failed to send OTP' });
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (!otp) return;
    setLoading(true);
    try {
      const fullPhone = `${phonePrefix}${phone}`;
      const { data, error } = await supabase.auth.verifyOtp({ phone: fullPhone, token: otp, type: 'sms' });
      if (error) throw error;
      await completePendingProfile();
      if (data.user) await getRoleAndRedirect(data.user.id);
    } catch (error: unknown) {
      toast({ variant: 'destructive', title: 'Verification failed', description: error instanceof Error ? error.message : 'Invalid OTP' });
    } finally { setLoading(false); }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch (error: unknown) {
      toast({ variant: 'destructive', title: 'Error', description: error instanceof Error ? error.message : 'Google login failed' });
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      await completePendingProfile();
      await getRoleAndRedirect(session.user.id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0B0F1A' }}>
      <Toaster />

      <style>{`
        @keyframes loginFade { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .login-fade { animation: loginFade 0.4s ease-out both; }
        .login-input { width:100%; padding:10px 14px; border-radius:10px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.04); color:#F1F5F9; font-size:14px; outline:none; transition:border-color 0.2s; }
        .login-input:focus { border-color:rgba(232,163,23,0.5); }
        .login-input::placeholder { color:rgba(255,255,255,0.25); }
        .login-tab { flex:1; padding:10px; text-align:center; font-size:13px; font-weight:500; border-radius:10px; border:none; cursor:pointer; transition:all 0.2s; display:flex; align-items:center; justify-content:center; gap:6px; }
        .login-tab.active { background:rgba(232,163,23,0.12); color:#E8A317; }
        .login-tab:not(.active) { background:transparent; color:#64748B; }
        @media (max-width:768px) { .login-left-panel { display:none !important; } }
      `}</style>

      {/* Left panel */}
      <div className="login-left-panel" style={{
        position: 'relative', width: '45%', minHeight: '100vh', overflow: 'hidden', flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url("https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80")',
          backgroundSize: 'cover', backgroundPosition: 'center',
          filter: 'brightness(0.35) saturate(0.7)',
        }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(11,15,26,0.4) 0%, rgba(11,15,26,0.85) 100%)' }} />

        <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 48 }}>
          <Link href="/" style={{ position: 'absolute', top: 32, left: 48, display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#F1F5F9' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #E8A317, #D4940F)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: '#0B0F1A', fontFamily: 'var(--font-dm-mono)' }}>RS</div>
            <span style={{ fontSize: 18, fontWeight: 700 }}>RenoSmart</span>
          </Link>

          <h2 style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-playfair), serif', lineHeight: 1.15, marginBottom: 12, color: '#F1F5F9' }}>
            Welcome back to smarter renovations.
          </h2>
          <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.6, marginBottom: 24 }}>
            Pick up where you left off — your projects, schedules, and analytics are waiting.
          </p>
          <div style={{ display: 'flex', gap: 24 }}>
            {[{ v: '500+', l: 'Firms' }, { v: '10K+', l: 'Projects' }, { v: '95%', l: 'Accuracy' }].map((s) => (
              <div key={s.l}>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#E8A317', fontFamily: 'var(--font-dm-mono)' }}>{s.v}</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(24px, 5vw, 48px)' }}>
        <div style={{ width: '100%', maxWidth: 400 }} className="login-fade">
          {/* Mobile logo */}
          <div className="md:hidden" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 32 }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#F1F5F9' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #E8A317, #D4940F)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: '#0B0F1A', fontFamily: 'var(--font-dm-mono)' }}>RS</div>
              <span style={{ fontSize: 18, fontWeight: 700 }}>RenoSmart</span>
            </Link>
          </div>

          {/* Auth error from callback */}
          {errorMsg && (
            <div style={{ marginBottom: 20, padding: 16, borderRadius: 14, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 2 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#FCA5A5' }}>Login error</p>
                <p style={{ fontSize: 12, color: '#F87171', marginTop: 4 }}>{decodeURIComponent(errorMsg)}</p>
              </div>
            </div>
          )}

          {/* Email confirmation notice */}
          {message === 'check-email' && (
            <div style={{ marginBottom: 20, padding: 16, borderRadius: 14, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <Mail size={18} style={{ color: '#60A5FA', marginTop: 2, flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#93C5FD' }}>Check your email</p>
                <p style={{ fontSize: 12, color: '#60A5FA', marginTop: 4, lineHeight: 1.5 }}>We sent a confirmation link. Click it, then sign in here.</p>
              </div>
            </div>
          )}

          {/* Role hint banner */}
          {roleHint && (
            <div style={{
              marginBottom: 20, padding: '12px 16px', borderRadius: 14,
              background: roleHint === 'worker' ? 'rgba(99,102,241,0.08)' : roleHint === 'owner' ? 'rgba(20,184,166,0.08)' : 'rgba(232,163,23,0.08)',
              border: `1px solid ${roleHint === 'worker' ? 'rgba(99,102,241,0.2)' : roleHint === 'owner' ? 'rgba(20,184,166,0.2)' : 'rgba(232,163,23,0.2)'}`,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 20 }}>{roleHint === 'worker' ? '🔧' : roleHint === 'owner' ? '🏠' : '🏗'}</span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: roleHint === 'worker' ? '#A5B4FC' : roleHint === 'owner' ? '#5EEAD4' : '#FCD34D' }}>
                  {roleHint === 'worker' ? 'Contractor Portal' : roleHint === 'owner' ? 'Homeowner Portal' : 'Designer Portal'}
                </p>
                <p style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
                  {roleHint === 'worker' ? 'Sign in to view your tasks and upload receipts' : roleHint === 'owner' ? 'Sign in to track your renovation progress' : 'Sign in to manage your projects'}
                </p>
              </div>
            </div>
          )}

          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6, color: '#F1F5F9' }}>
            {roleHint === 'worker' ? 'Welcome back, Contractor' : roleHint === 'owner' ? 'Welcome back, Homeowner' : 'Sign in'}
          </h1>
          <p style={{ fontSize: 14, color: '#94A3B8', marginBottom: 28 }}>Welcome back to RenoSmart</p>

          {/* Google */}
          <Button onClick={handleGoogleLogin} disabled={googleLoading} className="w-full bg-white text-black hover:bg-white/90 h-11 rounded-xl mb-4">
            {googleLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : (
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Continue with Google
          </Button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>or continue with</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          </div>

          {/* Tab toggle */}
          <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 12, background: 'rgba(255,255,255,0.04)', marginBottom: 20 }}>
            <button className={`login-tab ${activeTab === 'email' ? 'active' : ''}`} onClick={() => { setActiveTab('email'); setOtpSent(false); }}>
              <Mail size={14} /> Email
            </button>
            <button className={`login-tab ${activeTab === 'phone' ? 'active' : ''}`} onClick={() => { setActiveTab('phone'); setOtpSent(false); }}>
              <Phone size={14} /> Phone
            </button>
          </div>

          {/* Email login */}
          {activeTab === 'email' && (
            <form onSubmit={handleEmailLogin}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#94A3B8', display: 'block', marginBottom: 6 }}>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="login-input" required />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#94A3B8', display: 'block', marginBottom: 6 }}>Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="login-input" required />
              </div>
              <Button type="submit" variant="gold" className="w-full h-11 rounded-xl" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Sign In
              </Button>
            </form>
          )}

          {/* Phone login */}
          {activeTab === 'phone' && (
            <div>
              {!otpSent ? (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 13, fontWeight: 500, color: '#94A3B8', display: 'block', marginBottom: 6 }}>Phone Number</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <select value={phonePrefix} onChange={(e) => setPhonePrefix(e.target.value)}
                        style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#F1F5F9', fontSize: 14 }}>
                        <option value="+60">🇲🇾 +60</option>
                        <option value="+65">🇸🇬 +65</option>
                      </select>
                      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} placeholder="123456789" className="login-input" style={{ flex: 1 }} />
                    </div>
                  </div>
                  <Button onClick={handleSendOtp} variant="gold" className="w-full h-11 rounded-xl" disabled={loading || phone.length < 8}>
                    {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Send OTP
                  </Button>
                </>
              ) : (
                <>
                  <div style={{ padding: 14, borderRadius: 12, background: 'rgba(232,163,23,0.08)', border: '1px solid rgba(232,163,23,0.15)', textAlign: 'center', marginBottom: 16 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#E8A317' }}>Code sent to {phonePrefix}{phone}</p>
                    <button onClick={() => setOtpSent(false)} style={{ fontSize: 12, color: '#64748B', background: 'none', border: 'none', cursor: 'pointer', marginTop: 4 }}>Change number</button>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 13, fontWeight: 500, color: '#94A3B8', display: 'block', marginBottom: 6 }}>Verification Code</label>
                    <input type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit code" className="login-input" style={{ textAlign: 'center', fontSize: 24, letterSpacing: '0.2em' }} maxLength={6} />
                  </div>
                  <Button onClick={handleVerifyOtp} variant="gold" className="w-full h-11 rounded-xl" disabled={loading || otp.length < 6}>
                    {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Verify & Sign In
                  </Button>
                  <button onClick={handleSendOtp} disabled={loading} style={{ width: '100%', textAlign: 'center', marginTop: 12, fontSize: 13, color: '#64748B', background: 'none', border: 'none', cursor: 'pointer' }}>Resend code</button>
                </>
              )}
            </div>
          )}

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#64748B' }}>
            Don&apos;t have an account? <Link href="/register" style={{ color: '#E8A317', textDecoration: 'none', fontWeight: 500 }}>Sign up free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0F1A] flex items-center justify-center"><div className="text-white">Loading...</div></div>}>
      <LoginPageContent />
    </Suspense>
  );
}
