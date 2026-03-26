import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Admin client to bypass RLS for activating team membership
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Called when a registered user visits the app and has a pending invite matching their email
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
    );

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = session.user.id;
    const userEmail = session.user.email;

    // Find pending invite for this email (use admin to bypass RLS)
    const { data: invite } = await supabaseAdmin
      .from('team_members')
      .select('id, team_id')
      .eq('email', userEmail)
      .eq('status', 'pending')
      .single();

    if (!invite) return NextResponse.json({ joined: false, message: 'No pending invite' });

    // Activate invite (use admin — member doesn't have UPDATE on team_members yet)
    const { error: memberErr } = await supabaseAdmin.from('team_members').update({
      user_id: userId,
      status: 'active',
      joined_at: new Date().toISOString(),
    }).eq('id', invite.id);

    if (memberErr) {
      console.error('Failed to activate team member:', memberErr);
      return NextResponse.json({ joined: false, error: memberErr.message });
    }

    // Link profile to team + set elite plan (use admin to ensure it works)
    const { error: profileErr } = await supabaseAdmin.from('profiles').update({
      team_id: invite.team_id,
      plan: 'elite',
    }).eq('user_id', userId);

    if (profileErr) {
      console.error('Failed to update profile:', profileErr);
    }

    return NextResponse.json({ joined: true, teamId: invite.team_id });
  } catch (err) {
    console.error('Team join error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
