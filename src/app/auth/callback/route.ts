import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Admin client to update team_members without RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const teamJoin = searchParams.get('team_join'); // team_id if invited
  const errorParam = searchParams.get('error');
  const errorDesc = searchParams.get('error_description');

  // If Supabase returned an error directly
  if (errorParam) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDesc ?? errorParam)}`
    );
  }

  if (code) {
    const cookieStore = await cookies();
    // Mutable overlay so that cookies written by setAll are visible to
    // subsequent getAll calls within the same request (Next.js 15 fix)
    const cookieMap = new Map(
      cookieStore.getAll().map((c) => [c.name, c.value])
    );

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return Array.from(cookieMap.entries()).map(([name, value]) => ({ name, value }));
          },
          setAll(cookiesToSet: { name: string; value: string; options?: Parameters<typeof cookieStore.set>[2] }[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieMap.set(name, value);
              try { cookieStore.set(name, value, options); } catch { /* ignore in RSC */ }
            });
          },
        },
      }
    );

    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Handle team join: activate the pending team_members record
      const userEmail = data.user.email!;
      const userId = data.user.id;

      if (teamJoin) {
        // Explicit team_join param (from invite link)
        const { data: invite } = await supabaseAdmin
          .from('team_members')
          .select('id')
          .eq('team_id', teamJoin)
          .eq('email', userEmail)
          .eq('status', 'pending')
          .single();

        if (invite) {
          await supabaseAdmin.from('team_members').update({
            user_id: userId,
            status: 'active',
            joined_at: new Date().toISOString(),
          }).eq('id', invite.id);

          await supabaseAdmin.from('profiles').update({
            team_id: teamJoin,
            plan: 'elite',
          }).eq('user_id', userId);
        }
      } else {
        // Auto-detect: check if user has any pending team invite
        const { data: invite } = await supabaseAdmin
          .from('team_members')
          .select('id, team_id')
          .eq('email', userEmail)
          .eq('status', 'pending')
          .limit(1)
          .single();

        if (invite) {
          await supabaseAdmin.from('team_members').update({
            user_id: userId,
            status: 'active',
            joined_at: new Date().toISOString(),
          }).eq('id', invite.id);

          await supabaseAdmin.from('profiles').update({
            team_id: invite.team_id,
            plan: 'elite',
          }).eq('user_id', userId);
        }
      }

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

    // Exchange failed
    const msg = error?.message ?? 'Session exchange failed';
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(msg)}`
    );
  }

  // No code and no error — redirect to login
  return NextResponse.redirect(`${origin}/login`);
}
