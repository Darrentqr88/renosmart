'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push('/designer');
      router.refresh();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Login failed';
      toast({ variant: 'destructive', title: 'Login failed', description: msg });
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

        <Card className="bg-[#0F1923] border-white/10 text-white">
          <CardHeader className="text-center">
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
                <span className="bg-[#0F1923] px-2 text-white/40">or continue with email</span>
              </div>
            </div>

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
