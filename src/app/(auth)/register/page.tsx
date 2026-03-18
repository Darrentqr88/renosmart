'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { UserRole, WORKER_TRADES } from '@/types';

type Step = 1 | 2 | 3 | 4;

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteId = searchParams.get('invite');
  const supabase = createClient();

  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Auth
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signedUpUserId, setSignedUpUserId] = useState<string | null>(null);

  // Step 2: Phone
  const [phone, setPhone] = useState('');
  const [phonePrefix, setPhonePrefix] = useState('+60');

  // Step 3: Role
  const [role, setRole] = useState<UserRole | null>(null);

  // Step 4: Profile
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
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id ?? signedUpUserId;
      const userEmail = session?.user?.email ?? email;
      if (!userId) throw new Error('Not authenticated. Please try signing in again.');

      // If no session (email confirmation pending), store profile data in localStorage
      // and redirect to a confirmation notice. Profile will be completed after confirmation.
      if (!session) {
        localStorage.setItem('pending_profile', JSON.stringify({
          user_id: userId, email: userEmail, role,
          phone: `${phonePrefix}${phone}`, name,
          company: role === 'designer' ? company : null,
          company_address: role === 'designer' ? companyAddress : null,
          trades: role === 'worker' ? trades : null,
          plan: 'free',
        }));
        toast({ title: 'Check your email!', description: 'Please confirm your email address to complete registration.' });
        router.push('/login?message=check-email');
        return;
      }

      const profileData = {
        user_id: userId,
        email: userEmail,
        role,
        phone: `${phonePrefix}${phone}`,
        name,
        company: role === 'designer' ? company : null,
        company_address: role === 'designer' ? companyAddress : null,
        trades: role === 'worker' ? trades : null,
        plan: 'free',
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('profiles').upsert(profileData, { onConflict: 'user_id' });
      if (error) throw new Error(error.message);

      // If invited by designer
      if (inviteId && role === 'worker') {
        await supabase.from('designer_workers').insert({
          designer_id: inviteId,
          profile_id: userId,
          name,
          phone: `${phonePrefix}${phone}`,
          trades,
          status: 'active',
        });
      }

      toast({ title: 'Welcome to RenoSmart!', description: 'Account created successfully.' });

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

  const toggleTrade = (trade: string) => {
    setTrades((prev) => prev.includes(trade) ? prev.filter((t) => t !== trade) : [...prev, trade]);
  };

  return (
    <div className="min-h-screen bg-[#0A0F1A] flex items-center justify-center px-4 py-8">
      <Toaster />
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#F0B90B] flex items-center justify-center">
            <span className="text-black font-bold">RS</span>
          </div>
          <span className="text-white font-bold text-2xl">RenoSmart</span>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={`flex items-center ${s < 4 ? 'flex-1' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                s < step ? 'bg-[#F0B90B] text-black' :
                s === step ? 'bg-[#F0B90B]/20 text-[#F0B90B] border border-[#F0B90B]' :
                'bg-white/10 text-white/40'
              }`}>
                {s < step ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 4 && <div className={`flex-1 h-0.5 mx-2 ${s < step ? 'bg-[#F0B90B]' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>

        <Card className="bg-[#0F1923] border-white/10 text-white">
          {/* Step 1: Auth */}
          {step === 1 && (
            <>
              <CardHeader>
                <CardTitle className="text-white text-xl">Create your account</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handleGoogleAuth} disabled={loading} className="w-full bg-white text-black hover:bg-white/90">
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
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10" /></div>
                  <div className="relative flex justify-center text-xs"><span className="bg-[#0F1923] px-2 text-white/40">or with email</span></div>
                </div>
                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <div>
                    <Label className="text-white/70">Email</Label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com" className="bg-white/5 border-white/10 text-white placeholder:text-white/30 mt-1" required />
                  </div>
                  <div>
                    <Label className="text-white/70">Password</Label>
                    <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters" className="bg-white/5 border-white/10 text-white placeholder:text-white/30 mt-1" minLength={8} required />
                  </div>
                  <Button type="submit" variant="gold" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Continue
                  </Button>
                </form>
                <p className="text-center text-sm text-white/40">
                  Already have an account? <Link href="/login" className="text-[#F0B90B] hover:underline">Sign in</Link>
                </p>
              </CardContent>
            </>
          )}

          {/* Step 2: Phone */}
          {step === 2 && (
            <>
              <CardHeader>
                <CardTitle className="text-white text-xl">Your phone number</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-white/70">Country Code</Label>
                  <div className="flex gap-2 mt-1">
                    <select
                      value={phonePrefix}
                      onChange={(e) => setPhonePrefix(e.target.value)}
                      className="bg-white/5 border border-white/10 text-white rounded-md px-3 py-2 text-sm"
                    >
                      <option value="+60">🇲🇾 +60 Malaysia</option>
                      <option value="+65">🇸🇬 +65 Singapore</option>
                    </select>
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="123456789"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 flex-1"
                      required
                    />
                  </div>
                </div>
                <Button onClick={() => setStep(3)} variant="gold" className="w-full" disabled={!phone}>
                  Continue
                </Button>
              </CardContent>
            </>
          )}

          {/* Step 3: Role */}
          {step === 3 && (
            <>
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-white text-xl">What is your role?</CardTitle>
                <p className="text-white/40 text-sm mt-1">Choose how you&apos;ll use RenoSmart</p>
              </CardHeader>
              <CardContent className="space-y-3 pt-2">
                {[
                  {
                    role: 'designer' as UserRole,
                    icon: '🏠',
                    label: 'Interior Designer',
                    desc: 'Manage projects and clients',
                    features: ['AI quotation audit', 'Auto Gantt generation', 'Multi-project dashboard', 'Price database'],
                    accent: '#F0B90B',
                    bg: 'rgba(240,185,11,0.08)',
                    border: 'rgba(240,185,11,0.3)',
                  },
                  {
                    role: 'owner' as UserRole,
                    icon: '👤',
                    label: 'Property Owner',
                    desc: 'Track your renovation',
                    features: ['Live progress tracking', 'Document access', 'Payment schedule', 'Photo approvals'],
                    accent: '#00C9A7',
                    bg: 'rgba(0,201,167,0.08)',
                    border: 'rgba(0,201,167,0.3)',
                  },
                  {
                    role: 'worker' as UserRole,
                    icon: '🔨',
                    label: 'Contractor / Worker',
                    desc: 'View tasks and updates',
                    features: ['Daily task list', 'Check-in / check-out', 'Receipt uploads', 'Site photos'],
                    accent: '#2E6BE6',
                    bg: 'rgba(46,107,230,0.08)',
                    border: 'rgba(46,107,230,0.3)',
                  },
                ].map(({ role: r, icon, label, desc, features, accent, bg, border }) => (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    style={role === r ? { background: bg, borderColor: accent } : {}}
                    className={`w-full text-left p-4 rounded-2xl border transition-all ${
                      role === r
                        ? 'shadow-lg scale-[1.01]'
                        : 'border-white/10 hover:border-white/20 hover:bg-white/3'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                        style={{ background: `${accent}20` }}
                      >
                        {icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-base">{label}</span>
                          {role === r && (
                            <span
                              className="text-xs px-2 py-0.5 rounded-full font-semibold"
                              style={{ background: accent, color: '#000' }}
                            >
                              Selected
                            </span>
                          )}
                        </div>
                        <div className="text-white/50 text-sm mt-0.5">{desc}</div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {features.map((f) => (
                            <span
                              key={f}
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{
                                background: role === r ? `${accent}20` : 'rgba(255,255,255,0.06)',
                                color: role === r ? accent : 'rgba(255,255,255,0.45)',
                                border: `1px solid ${role === r ? border : 'rgba(255,255,255,0.08)'}`,
                              }}
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
                <Button onClick={() => setStep(4)} variant="gold" className="w-full mt-2" disabled={!role}>
                  Continue
                </Button>
              </CardContent>
            </>
          )}

          {/* Step 4: Profile details */}
          {step === 4 && (
            <>
              <CardHeader>
                <CardTitle className="text-white text-xl">
                  {role === 'designer' ? 'Your design firm details' : role === 'worker' ? 'Your trade skills' : 'Your details'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-white/70">Full Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name" className="bg-white/5 border-white/10 text-white placeholder:text-white/30 mt-1" required />
                </div>

                {role === 'designer' && (
                  <>
                    <div>
                      <Label className="text-white/70">Company Name</Label>
                      <Input value={company} onChange={(e) => setCompany(e.target.value)}
                        placeholder="e.g. Elegant Spaces Sdn Bhd" className="bg-white/5 border-white/10 text-white placeholder:text-white/30 mt-1" />
                    </div>
                    <div>
                      <Label className="text-white/70">Company Address</Label>
                      <Input value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)}
                        placeholder="Business address" className="bg-white/5 border-white/10 text-white placeholder:text-white/30 mt-1" />
                    </div>
                  </>
                )}

                {role === 'worker' && (
                  <div>
                    <Label className="text-white/70 mb-2 block">Select your trades (multi-select)</Label>
                    <div className="flex flex-wrap gap-2">
                      {WORKER_TRADES.map((trade) => (
                        <button
                          key={trade}
                          type="button"
                          onClick={() => toggleTrade(trade)}
                          className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                            trades.includes(trade)
                              ? 'bg-[#F0B90B] text-black border-[#F0B90B]'
                              : 'border-white/20 text-white/60 hover:border-white/40'
                          }`}
                        >
                          {trade}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <Button onClick={handleCompleteProfile} variant="gold" className="w-full" disabled={loading || !name}>
                  {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Create Account
                </Button>
              </CardContent>
            </>
          )}
        </Card>

        {/* Trust badges */}
        <div className="flex justify-center gap-4 mt-6">
          <Badge variant="outline" className="border-white/10 text-white/30 text-xs">🔒 Secure Auth</Badge>
          <Badge variant="outline" className="border-white/10 text-white/30 text-xs">🇲🇾 Malaysia</Badge>
          <Badge variant="outline" className="border-white/10 text-white/30 text-xs">🇸🇬 Singapore</Badge>
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
