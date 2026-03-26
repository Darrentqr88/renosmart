import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
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

    // Get team owned by this user
    const { data: team } = await supabase
      .from('teams')
      .select('id, name, elite_slots')
      .eq('owner_user_id', userId)
      .single();

    if (!team) return NextResponse.json({ team: null, members: [], usage: {} });

    // Get all non-removed members
    const { data: members } = await supabase
      .from('team_members')
      .select('id, user_id, email, role, status, invited_at, joined_at')
      .eq('team_id', team.id)
      .neq('status', 'removed')
      .order('invited_at', { ascending: true });

    // Get current month usage for each active member
    const yearMonth = new Date().toISOString().slice(0, 7);
    const activeIds = (members || [])
      .filter((m: { user_id: string | null; status: string }) => m.user_id && m.status === 'active')
      .map((m: { user_id: string }) => m.user_id);

    // Include owner's own usage
    activeIds.push(userId);

    const { data: usageRows } = await supabase
      .from('ai_usage')
      .select('user_id, usage_count')
      .in('user_id', activeIds)
      .eq('year_month', yearMonth);

    const usageMap: Record<string, number> = {};
    for (const row of usageRows || []) {
      usageMap[(row as { user_id: string; usage_count: number }).user_id] =
        (row as { usage_count: number }).usage_count;
    }

    const teamUsage = Object.values(usageMap).reduce((s, v) => s + v, 0);
    const teamMonthlyLimit = (team.elite_slots ?? 1) * 250;
    const maxMembers = (team.elite_slots ?? 1) * 5;

    return NextResponse.json({
      team: { ...team, maxMembers, teamMonthlyLimit, teamUsage },
      members: members || [],
      usageMap,
    });
  } catch (err) {
    console.error('Team members error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
