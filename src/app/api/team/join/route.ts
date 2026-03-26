import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

    // Find pending invite for this email
    const { data: invite } = await supabase
      .from('team_members')
      .select('id, team_id')
      .eq('email', userEmail)
      .eq('status', 'pending')
      .single();

    if (!invite) return NextResponse.json({ joined: false, message: 'No pending invite' });

    // Activate invite
    await supabase.from('team_members').update({
      user_id: userId,
      status: 'active',
      joined_at: new Date().toISOString(),
    }).eq('id', invite.id);

    // Link profile to team
    await supabase.from('profiles').update({ team_id: invite.team_id }).eq('user_id', userId);

    return NextResponse.json({ joined: true, teamId: invite.team_id });
  } catch (err) {
    console.error('Team join error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
