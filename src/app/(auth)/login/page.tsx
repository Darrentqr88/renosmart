'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, Phone } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

type LoginTab = 'email' | 'phone';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get('message');
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
      const { error } = await supabase.from('profiles').upsert({
        ...profileData,
        updated_at: new Date().toISOString(),
      });
      if (!error) {
        localStorage.removeItem('pending_profile');
      }
    } catch {
      // Non-critical — profile can be completed in settings
    }
  };

  const redirectByRole = (role?: string) => {
    if (role === 'owner') router.push('/owner');
    else if (role === 'worker') router.push('/worker');
    else router.push('/designer');
    router.refresh();
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await completePendingProfile();
      const role = data.user?.user_metadata?.role;
      redirectByRole(role);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Login failed';
      toast({ variant: 'destructive', title: 'Login failed', description: msg });
    } finally {
      setLoading(false);
    }
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
      const msg = error instanceof Error ? error.message : 'Failed to send OTP';
      toast({ variant: 'destructive', title: 'Error', description: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) return;
    setLoading(true);
    try {
      const fullPhone = `${phonePrefix}${phone}`;
      const { data, error } = await supabase.auth.verifyOtp({
        phone: fullPhone,
        token: otp,
        type: 'sms',
      });
      if (error) throw error;
      await completePendingProfile();
      const role = data.user?.user_metadata?.role;
      redirectByRole(role);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Invalid OTP';
      toast({ variant: 'destructive', title: 'Verification failed', description: msg });
    } finally {
      setLoading(false);
    }
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
      const msg = error instanceof Error ? error.message : 'Google login failed';
      toast({ variant: 'destructive', title: 'Error', description: msg });
      setGoogleLoading(false);
    }
  };

  // Check if already logged in and has profile → redirect
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      await completePendingProfile();
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();
      const role = profile?.role;
      if (role === 'owner') router.replace('/owner');
      else if (role === 'worker') router.replace('/worker');
      else router.replace('/designer');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0F1A] flex items-center justify-center px-4">
      <Toaster />
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#F0B90B] flex items-center justify-center">
            <span className="text-black font-bold">RS</span>
          </div>
          <span className="text-white font-bold text-2xl">RenoSmart</span>
        </div>

        {/* Email confirmation notice */}
        {message === 'check-email' && (
          <div className="mb-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-start gap-3">
            <Mail className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-blue-300 font-medium text-sm">Check your email</p>
              <p className="text-blue-400/70 text-xs mt-1">We sent a confirmation link. Click it, then sign in here to complete your account setup.</p>
            </div>
          </div>
        )}

        <Card className="bg-[#0F1923] border-white/10 text-white">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-white text-2xl">Welcome back</CardTitle>
            <CardDescription className="text-white/50">Sign in to your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Google OAuth */}
            <Button
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="w-full bg-white text-black hover:bg-white/90"
            >
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

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[#0F1923] px-2 text-white/40">or continue with</span>
              </div>
            </div>

            {/* Login method tabs */}
            <div className="auth-tab-row">
              <button
                className={`auth-tab${activeTab === 'email' ? ' active' : ''}`}
                onClick={() => { setActiveTab('email'); setOtpSent(false); }}
                type="button"
              >
                <Mail className="w-3.5 h-3.5 mr-1.5 inline" />
                Email
              </button>
              <button
                className={`auth-tab${activeTab === 'phone' ? ' active' : ''}`}
                onClick={() => { setActiveTab('phone'); setOtpSent(false); }}
                type="button"
              >
                <Phone className="w-3.5 h-3.5 mr-1.5 inline" />
                Phone
              </button>
            </div>

            {/* Email login form */}
            {activeTab === 'email' && (
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-white/70">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password" className="text-white/70">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 mt-1"
                    required
                  />
                </div>
                <Button type="submit" variant="gold" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Sign In
                </Button>
              </form>
            )}

            {/* Phone login form */}
            {activeTab === 'phone' && (
              <div className="space-y-4">
                {!otpSent ? (
                  <>
                    <div>
                      <Label className="text-white/70">Phone Number</Label>
                      <div className="auth-phone-row mt-1">
                        <select
                          value={phonePrefix}
                          onChange={(e) => setPhonePrefix(e.target.value)}
                          className="auth-phone-prefix"
                        >
                          <option value="+60">🇲🇾 +60</option>
                          <option value="+65">🇸🇬 +65</option>
                        </select>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                          placeholder="123456789"
                          className="auth-phone-input"
                        />
                      </div>
                      <p className="text-white/30 text-xs mt-1.5">We&apos;ll send a verification code via SMS</p>
                    </div>
                    <Button
                      onClick={handleSendOtp}
                      variant="gold"
                      className="w-full"
                      disabled={loading || phone.length < 8}
                    >
                      {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                      Send OTP
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="p-3 rounded-lg bg-[#F0B90B]/10 border border-[#F0B90B]/20 text-center">
                      <p className="text-[#F0B90B] text-sm font-medium">Code sent to {phonePrefix}{phone}</p>
                      <button
                        onClick={() => setOtpSent(false)}
                        className="text-white/40 text-xs mt-1 hover:text-white/70 transition-colors"
                      >
                        Change number
                      </button>
                    </div>
                    <div>
                      <Label className="text-white/70">Verification Code</Label>
                      <Input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="6-digit code"
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 mt-1 text-center text-2xl tracking-widest"
                        maxLength={6}
                      />
                    </div>
                    <Button
                      onClick={handleVerifyOtp}
                      variant="gold"
                      className="w-full"
                      disabled={loading || otp.length < 6}
                    >
                      {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                      Verify & Sign In
                    </Button>
                    <button
                      onClick={handleSendOtp}
                      disabled={loading}
                      className="w-full text-center text-sm text-white/40 hover:text-white/60 transition-colors"
                    >
                      Resend code
                    </button>
                  </>
                )}
              </div>
            )}

            <p className="text-center text-sm text-white/40">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-[#F0B90B] hover:underline">
                Sign up free
              </Link>
            </p>
          </CardContent>
        </Card>
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
