'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Check, ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { UserRole } from '@/types';

type Step = 1 | 2 | 4;

const ROLE_DATA = {
  designer: {
    label: 'Interior Designer',
    desc: 'Manage projects, audit quotations, track profit',
    photo: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80',
    color: '#E8A317',
    features: ['AI quotation audit', 'Auto Gantt scheduling', 'Price database', 'Profit tracking'],
  },
  owner: {
    label: 'Property Owner',
    desc: 'Track renovation progress, approve work',
    photo: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80',
    color: '#14B8A6',
    features: ['Progress tracking', 'Document access', 'Payment overview', 'Photo approvals'],
  },
  worker: {
    label: 'Contractor',
    desc: 'View tasks, upload receipts, check in/out',
    photo: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&q=80',
    color: '#6366F1',
    features: ['Daily task list', 'Check-in / out', 'Receipt upload + OCR', 'Site photos'],
  },
};

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteId = searchParams.get('invite');
  const teamIdParam = searchParams.get('team_id'); // from auth callback when invite auto-joined
  const preselectedRole = searchParams.get('role') as UserRole | null;
  const referralCode = searchParams.get('ref');
  const supabase = createClient();

  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [isInvitedUser, setIsInvitedUser] = useState(false);
  const [inviteTeamId, setInviteTeamId] = useState<string | null>(teamIdParam);
  const [inviteTeamName, setInviteTeamName] = useState('');

  // Fetch invite info (team owner's company/address) for pre-filling
  const fetchInviteInfo = async (userEmail: string) => {
    try {
      const res = await fetch(`/api/team/invite-info?email=${encodeURIComponent(userEmail)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.found) {
          setIsInvitedUser(true);
          setInviteTeamId(data.teamId);
          setInviteTeamName(data.teamName || '');
          // Pre-fill company name and address from team owner
          if (data.company) setCompany(data.company);
          if (data.companyAddress) setCompanyAddress(data.companyAddress);
        }
      }
    } catch { /* non-critical */ }
  };

  // If team_id was passed from auth callback, fetch owner info for pre-fill
  const fetchTeamOwnerInfo = async (teamId: string) => {
    try {
      // We can use the auto-join endpoint info, but let's query the invite-info
      // which only needs the team_id. For now, call a simpler approach:
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser?.email) return;
      // The user was already auto-joined in the callback, so we need to get
      // the owner's company info from the team
      const res = await fetch(`/api/team/invite-info?email=${encodeURIComponent(authUser.email)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.found) {
          setIsInvitedUser(true);
          setInviteTeamName(data.teamName || '');
          if (data.company) setCompany(data.company);
          if (data.companyAddress) setCompanyAddress(data.companyAddress);
        } else if (teamId) {
          // Already joined (status changed from 'pending' to 'active'),
          // so invite-info won't find it. Fetch owner info directly.
          setIsInvitedUser(true);
          try {
            const teamRes = await fetch(`/api/team/owner-info?team_id=${encodeURIComponent(teamId)}`);
            if (teamRes.ok) {
              const teamData = await teamRes.json();
              if (teamData.company) setCompany(teamData.company);
              if (teamData.companyAddress) setCompanyAddress(teamData.companyAddress);
              if (teamData.teamName) setInviteTeamName(teamData.teamName);
            }
          } catch { /* fallback */ }
        }
      }
    } catch { /* non-critical */ }
  };

  // Store referral code for post-registration
  useEffect(() => {
    if (referralCode) localStorage.setItem('rs_referral', referralCode);
  }, [referralCode]);

  // Auth state check on mount
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user: authUser } }) => {
      if (!authUser) return;

      // User has a session — check if they already have a profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, plan, team_id')
        .eq('user_id', authUser.id)
        .single();

      if (profile?.role) {
        // Already registered → redirect to correct dashboard
        if (profile.role === 'owner') { router.push('/owner'); return; }
        if (profile.role === 'worker') { router.push('/worker'); return; }
        router.push('/designer');
        return;
      }

      // If profile exists with team_id/plan already set (from auth callback), use those
      if (profile?.team_id) {
        setInviteTeamId(profile.team_id);
        setIsInvitedUser(true);
      }

      // Has session but no profile role (e.g. Google OAuth new user, or ?step=2 return)
      // Check for pending team invite to pre-fill company info
      if (authUser.email) {
        if (teamIdParam || profile?.team_id) {
          await fetchTeamOwnerInfo(teamIdParam || profile?.team_id);
        } else {
          await fetchInviteInfo(authUser.email);
        }
      }
      setStep(2);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signedUpUserId, setSignedUpUserId] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [phonePrefix, setPhonePrefix] = useState('+60');
  const [role, setRole] = useState<UserRole>(preselectedRole || 'designer');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [trades, setTrades] = useState<string[]>([]);

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback?step=2` },
      });
      if (error) throw error;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error';
      toast({ variant: 'destructive', title: 'Error', description: msg });
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (data.user) setSignedUpUserId(data.user.id);
      setStep(2);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error';
      toast({ variant: 'destructive', title: 'Registration failed', description: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProfile = async () => {
    setLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const userId = authUser?.id ?? signedUpUserId;
      const userEmail = authUser?.email ?? email;
      if (!userId) throw new Error('Not authenticated. Please try signing in again.');

      if (!authUser) {
        const pendingPlan = isInvitedUser || inviteTeamId ? 'elite' : 'free';
        localStorage.setItem('pending_profile', JSON.stringify({
          user_id: userId, email: userEmail, role,
          phone: `${phonePrefix}${phone}`,
          region: phonePrefix === '+65' ? 'SG' : 'MY',
          name,
          company: role === 'designer' ? company : null,
          company_address: role === 'designer' ? companyAddress : null,
          trades: role === 'worker' ? trades : null,
          plan: pendingPlan,
          team_id: inviteTeamId || null,
        }));
        toast({ title: 'Check your email!', description: 'Please confirm your email address to complete registration.' });
        router.push('/login?message=check-email');
        return;
      }

      // Check if profile already exists with team/plan set (from auth callback auto-join)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('plan, team_id')
        .eq('user_id', userId)
        .single();

      // Preserve elite plan and team_id if already set by auth callback
      const plan = (isInvitedUser || inviteTeamId || existingProfile?.plan === 'elite') ? 'elite' : 'free';
      const teamId = inviteTeamId || existingProfile?.team_id || null;

      const profileData: Record<string, unknown> = {
        user_id: userId, email: userEmail, role,
        phone: `${phonePrefix}${phone}`,
        region: phonePrefix === '+65' ? 'SG' : 'MY',  // ← auto-detect from phone prefix
        name,
        company: role === 'designer' ? company : null,
        company_address: role === 'designer' ? companyAddress : null,
        trades: role === 'worker' ? trades : null,
        plan,
        updated_at: new Date().toISOString(),
      };

      // Only set team_id if we have one (avoid overwriting with null)
      if (teamId) {
        profileData.team_id = teamId;
      }

      const { error } = await supabase.from('profiles').upsert(profileData, { onConflict: 'user_id' });
      if (error) throw new Error(error.message);

      // Sync role into auth user_metadata so it's available without DB lookup
      await supabase.auth.updateUser({ data: { role } });

      // Auto-join team if there's a pending invite
      if (!inviteTeamId && userEmail) {
        try {
          const joinRes = await fetch('/api/team/auto-join', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, email: userEmail }),
          });
          if (joinRes.ok) {
            const joinData = await joinRes.json();
            if (joinData.joined) {
              toast({ title: `Joined team: ${joinData.teamName}`, description: 'Elite plan activated.' });
            }
          }
        } catch { /* non-critical */ }
      }

      // Track referral if present
      const storedRef = localStorage.getItem('rs_referral');
      if (storedRef) {
        try {
          await fetch('/api/referral', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ referral_code: storedRef, referred_user_id: userId }),
          });
          localStorage.removeItem('rs_referral');
        } catch { /* non-critical */ }
      }

      if (inviteId && role === 'worker') {
        await supabase.from('designer_workers').insert({
          designer_id: inviteId, profile_id: userId, name,
          phone: `${phonePrefix}${phone}`, trades, status: 'active',
        });
      }

      // Send welcome email (fire-and-forget)
      fetch('/api/email/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, name }),
      }).catch(() => {});

      const welcomeMsg = isInvitedUser || inviteTeamId
        ? 'Account created and joined team with Elite plan!'
        : 'Account created successfully.';
      toast({ title: 'Welcome to RenoSmart!', description: welcomeMsg });
      if (role === 'designer') router.push('/designer');
      else if (role === 'owner') router.push('/owner');
      else router.push('/worker');
      router.refresh();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error';
      toast({ variant: 'destructive', title: 'Error', description: msg });
    } finally {
      setLoading(false);
    }
  };


  // Determine which photo to show based on role selection
  const currentRole = role ? ROLE_DATA[role] : null;
  const bgPhoto = currentRole?.photo || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80';
  const accentColor = currentRole?.color || '#E8A317';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0B0F1A' }}>
      <Toaster />

      <style>{`
        @keyframes regFadeIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .reg-fade { animation: regFadeIn 0.4s ease-out both; }
        .reg-role-btn { position:relative; width:100%; text-align:left; padding:16px; border-radius:16px; border:1px solid rgba(255,255,255,0.08); background:transparent; cursor:pointer; transition:all 0.25s; overflow:hidden; color:#F1F5F9; }
        .reg-role-btn:hover { border-color:rgba(255,255,255,0.18); background:rgba(255,255,255,0.03); }
        .reg-role-btn.active { border-color:var(--accent); background:color-mix(in srgb, var(--accent) 8%, transparent); }
        .reg-input { width:100%; padding:10px 14px; border-radius:10px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.04); color:#F1F5F9; font-size:14px; outline:none; transition:border-color 0.2s; }
        .reg-input:focus { border-color:rgba(232,163,23,0.5); }
        .reg-input::placeholder { color:rgba(255,255,255,0.25); }
        @media (max-width:768px) { .reg-left-panel { display:none !important; } }
      `}</style>

      {/* Left panel — photo + branding */}
      <div className="reg-left-panel" style={{
        position: 'relative', width: '45%', minHeight: '100vh', overflow: 'hidden',
        flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url("${bgPhoto}")`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          transition: 'background-image 0.6s ease',
          filter: 'brightness(0.4) saturate(0.7)',
        }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(11,15,26,0.3) 0%, rgba(11,15,26,0.8) 100%)' }} />

        {/* Content overlay */}
        <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 48 }}>
          {/* Logo */}
          <Link href="/" style={{ position: 'absolute', top: 32, left: 48, display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#F1F5F9' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #E8A317, #D4940F)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: '#0B0F1A', fontFamily: 'var(--font-dm-mono)' }}>RS</div>
            <span style={{ fontSize: 18, fontWeight: 700 }}>RenoSmart</span>
          </Link>

          {/* Role-specific content */}
          {currentRole ? (
            <div className="reg-fade" key={role}>
              <div style={{
                display: 'inline-block', padding: '5px 14px', borderRadius: 100,
                background: `${accentColor}20`, color: accentColor,
                fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', marginBottom: 16,
                border: `1px solid ${accentColor}30`,
              }}>
                {currentRole.label.toUpperCase()}
              </div>
              <h2 style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-playfair), serif', lineHeight: 1.15, marginBottom: 12 }}>
                {role === 'designer' ? 'Audit smarter.\nProfit more.' : role === 'owner' ? 'Track your\nrenovation live.' : 'Tasks, check-ins\n& receipts.'}
              </h2>
              <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.6, marginBottom: 24 }}>
                {currentRole.desc}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {currentRole.features.map((f) => (
                  <span key={f} style={{
                    padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 500,
                    background: 'rgba(255,255,255,0.06)', color: '#CBD5E1',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}>
                    {f}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <h2 style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-playfair), serif', lineHeight: 1.15, marginBottom: 12 }}>
                Join 500+ renovation firms across MY & SG
              </h2>
              <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.6 }}>
                AI-powered quotation auditing, smart scheduling, and real-time project tracking.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(24px, 5vw, 48px)',
        overflowY: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: 440 }}>
          {/* Mobile logo */}
          <div className="md:hidden" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 32 }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#F1F5F9' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #E8A317, #D4940F)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: '#0B0F1A', fontFamily: 'var(--font-dm-mono)' }}>RS</div>
              <span style={{ fontSize: 18, fontWeight: 700 }}>RenoSmart</span>
            </Link>
          </div>

          {/* Step indicator — 3 visual steps mapped to actual steps 1, 2, 4 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 32 }}>
            {([1, 2, 4] as const).map((s, i, arr) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < arr.length - 1 ? 1 : undefined }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, flexShrink: 0,
                  background: s < step ? accentColor : s === step ? `${accentColor}20` : 'rgba(255,255,255,0.06)',
                  color: s < step ? '#0B0F1A' : s === step ? accentColor : 'rgba(255,255,255,0.3)',
                  border: s === step ? `1.5px solid ${accentColor}` : '1.5px solid transparent',
                }}>
                  {s < step ? <Check size={14} /> : i + 1}
                </div>
                {i < arr.length - 1 && <div style={{ flex: 1, height: 2, margin: '0 6px', borderRadius: 1, background: s < step ? accentColor : 'rgba(255,255,255,0.06)' }} />}
              </div>
            ))}
          </div>

          {/* Step 1: Auth */}
          {step === 1 && (
            <div className="reg-fade">
              <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6, color: '#F1F5F9' }}>Create your account</h1>
              <p style={{ fontSize: 14, color: '#94A3B8', marginBottom: 28 }}>Get started in under 2 minutes</p>

              <Button onClick={handleGoogleAuth} disabled={loading} className="w-full bg-white text-black hover:bg-white/90 h-11 rounded-xl mb-4">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : (
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
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>or with email</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
              </div>

              <form onSubmit={handleEmailAuth}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#94A3B8', display: 'block', marginBottom: 6 }}>Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="reg-input" required />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#94A3B8', display: 'block', marginBottom: 6 }}>Password</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" className="reg-input" minLength={8} required />
                </div>
                <Button type="submit" variant="gold" className="w-full h-11 rounded-xl" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Continue
                </Button>
              </form>

              <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#64748B' }}>
                Already have an account? <Link href="/login" style={{ color: '#E8A317', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
              </p>
            </div>
          )}

          {/* Step 2: Phone */}
          {step === 2 && (
            <div className="reg-fade">
              {!isInvitedUser && (
                <button onClick={() => setStep(1)} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94A3B8', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20 }}>
                  <ArrowLeft size={14} /> Back
                </button>
              )}

              {/* Team invite banner */}
              {isInvitedUser && (
                <div style={{
                  marginBottom: 20, padding: 16, borderRadius: 14,
                  background: 'rgba(232,163,23,0.08)', border: '1px solid rgba(232,163,23,0.2)',
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(232,163,23,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E8A317" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#E8A317' }}>
                      Team Invitation
                    </p>
                    <p style={{ fontSize: 12, color: '#D4940F', marginTop: 4, lineHeight: 1.5 }}>
                      You&apos;ve been invited to join {inviteTeamName || 'a team'}. Complete your profile to get started with Elite access.
                    </p>
                  </div>
                </div>
              )}

              <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6, color: '#F1F5F9' }}>
                {isInvitedUser ? 'Complete your profile' : 'Phone number'}
              </h1>
              <p style={{ fontSize: 14, color: '#94A3B8', marginBottom: 28 }}>
                {isInvitedUser ? 'Just a few details to get started' : 'For project notifications and team communication'}
              </p>

              {/* For invited users, also show name field in this step */}
              {isInvitedUser && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#94A3B8', display: 'block', marginBottom: 6 }}>Full Name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" className="reg-input" required />
                </div>
              )}

              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#94A3B8', display: 'block', marginBottom: 6 }}>Mobile Number</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <select value={phonePrefix} onChange={(e) => setPhonePrefix(e.target.value)}
                    style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#F1F5F9', fontSize: 14 }}>
                    <option value="+60">🇲🇾 +60</option>
                    <option value="+65">🇸🇬 +65</option>
                  </select>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="123456789" className="reg-input" style={{ flex: 1 }} />
                </div>
              </div>
              <Button onClick={() => setStep(4)} variant="gold" className="w-full h-11 rounded-xl" disabled={!phone || (isInvitedUser && !name)}>Continue</Button>
            </div>
          )}


          {/* Step 4: Profile */}
          {step === 4 && (
            <div className="reg-fade">
              <button onClick={() => setStep(2)} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94A3B8', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20 }}>
                <ArrowLeft size={14} /> Back
              </button>
              <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6, color: '#F1F5F9' }}>
                {role === 'designer' ? 'Your design firm' : role === 'owner' ? 'Your profile' : 'Your profile'}
              </h1>
              <p style={{ fontSize: 14, color: '#94A3B8', marginBottom: 28 }}>
                {isInvitedUser ? 'Review your company details (pre-filled from team)' : 'One last step to complete your profile'}
              </p>

              {/* Name field for non-invited users */}
              {!isInvitedUser && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#94A3B8', display: 'block', marginBottom: 6 }}>Full Name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" className="reg-input" required />
                </div>
              )}

              {/* Designer: Company fields */}
              {role === 'designer' && (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 13, fontWeight: 500, color: '#94A3B8', display: 'block', marginBottom: 6 }}>
                      Company Name
                      {isInvitedUser && <span style={{ color: '#E8A317', fontSize: 11, marginLeft: 8 }}>(from team)</span>}
                    </label>
                    <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Elegant Spaces Sdn Bhd" className="reg-input" />
                  </div>
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ fontSize: 13, fontWeight: 500, color: '#94A3B8', display: 'block', marginBottom: 6 }}>
                      Company Address
                      {isInvitedUser && <span style={{ color: '#E8A317', fontSize: 11, marginLeft: 8 }}>(from team)</span>}
                    </label>
                    <input value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} placeholder="Business address" className="reg-input" />
                  </div>
                </>
              )}

              {/* Worker: Trades selection */}
              {role === 'worker' && (
                <div style={{ marginBottom: 24 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#94A3B8', display: 'block', marginBottom: 10 }}>Your Trades</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {['Plumbing', 'Electrical', 'Tiling', 'False Ceiling', 'Carpentry', 'Painting',
                      'Demolition/Hacking', 'Glass Work', 'Aluminium Work', 'Metal Work/Ironwork',
                      'Flooring (Timber/Vinyl)', 'Stone/Marble', 'Waterproofing', 'Air Conditioning',
                      'Cleaning', 'Alarm & CCTV', 'Landscaping', 'Other'].map(t => (
                      <button key={t} type="button"
                        onClick={() => setTrades(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}
                        style={{
                          padding: '6px 14px', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                          border: `1px solid ${trades.includes(t) ? accentColor + '80' : 'rgba(255,255,255,0.1)'}`,
                          background: trades.includes(t) ? accentColor + '18' : 'transparent',
                          color: trades.includes(t) ? accentColor : '#94A3B8',
                          transition: 'all 0.2s',
                        }}
                      >
                        {trades.includes(t) && <Check size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />}
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Owner: just name is enough, no extra fields needed */}

              <Button onClick={handleCompleteProfile} variant="gold" className="w-full h-11 rounded-xl" disabled={loading || !name}>
                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {isInvitedUser ? 'Join Team & Create Account' : 'Create Account'}
              </Button>
            </div>
          )}

          {/* Trust badges */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 32 }}>
            {['🔒 Secure', '🇲🇾 Malaysia', '🇸🇬 Singapore'].map((b) => (
              <span key={b} style={{ fontSize: 11, color: '#475569', padding: '4px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0F1A] flex items-center justify-center"><div className="text-white">Loading...</div></div>}>
      <RegisterPageContent />
    </Suspense>
  );
}
