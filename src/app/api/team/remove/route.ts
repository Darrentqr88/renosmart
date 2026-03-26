import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { memberId } = await req.json();
    if (!memberId) return NextResponse.json({ error: 'memberId required' }, { status: 400 });

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
    );

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = session.user.id;

    // Verify caller owns the team that contains this member
    const { data: member } = await supabase
      .from('team_members').select('id, user_id, team_id').eq('id', memberId).single();
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

    const { data: team } = await supabase
      .from('teams').select('owner_user_id').eq('id', member.team_id).single();
    if (team?.owner_user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Mark removed + clear team_id from profile
    await supabase.from('team_members').update({ status: 'removed' }).eq('id', memberId);
    if (member.user_id) {
      await supabase.from('profiles').update({ team_id: null }).eq('user_id', member.user_id);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Team remove error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
