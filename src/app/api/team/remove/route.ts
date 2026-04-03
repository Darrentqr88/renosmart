import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Admin client to bypass RLS for clearing removed member's profile
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = user.id;

    // Verify caller owns the team that contains this member
    const { data: member } = await supabase
      .from('team_members').select('id, user_id, team_id').eq('id', memberId).single();
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

    const { data: team } = await supabase
      .from('teams').select('owner_user_id').eq('id', member.team_id).single();
    if (team?.owner_user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Mark removed
    await supabase.from('team_members').update({ status: 'removed' }).eq('id', memberId);

    // Clear team_id and downgrade plan from the removed member's profile
    // Use admin client — owner can't update another user's profile via RLS
    if (member.user_id) {
      await supabaseAdmin.from('profiles').update({
        team_id: null,
        plan: 'free',
      }).eq('user_id', member.user_id);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Team remove error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
