import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // step=2 means user came here via the registration Google OAuth flow
  const step = searchParams.get('step');

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Look up profile to determine role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', data.user.id)
        .single();

      // No profile yet → send to finish registration
      if (!profile?.role) {
        return NextResponse.redirect(`${origin}/register?step=2`);
      }

      // Existing profile → send to correct dashboard
      if (profile.role === 'owner')  return NextResponse.redirect(`${origin}/owner`);
      if (profile.role === 'worker') return NextResponse.redirect(`${origin}/worker`);
      return NextResponse.redirect(`${origin}/designer`);
    }
  }

  // Something went wrong
  const errorMsg = searchParams.get('error_description') ?? 'Authentication failed';
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent(errorMsg)}`
  );
}
