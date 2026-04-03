import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Admin client to bypass RLS for cross-user team queries
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = user.id;

    // Step 1: Check profile.team_id FIRST — this is the authoritative team link
    // (covers both owners and invited members)
    const { data: profile } = await supabase
      .from('profiles')
      .select('team_id')
      .eq('user_id', userId)
      .single();

    let team: { id: string; name: string; elite_slots: number; owner_user_id: string } | null = null;
    let isOwner = false;
    let ownerEmail = '';
    let ownerName = '';

    if (profile?.team_id) {
      // Load the team this user belongs to
      const { data: memberTeam } = await supabaseAdmin
        .from('teams')
        .select('id, name, elite_slots, owner_user_id')
        .eq('id', profile.team_id)
        .single();

      if (memberTeam) {
        team = memberTeam;
        isOwner = memberTeam.owner_user_id === userId;

        if (!isOwner) {
          // Get owner info for member view
          const { data: ownerProfile } = await supabaseAdmin
            .from('profiles')
            .select('name, email')
            .eq('user_id', memberTeam.owner_user_id)
            .single();
          ownerEmail = ownerProfile?.email || '';
          ownerName = ownerProfile?.name || '';
        }
      }
    }

    // Step 2: Fallback — if no team_id on profile, check if user owns a team
    if (!team) {
      const { data: ownedTeam } = await supabaseAdmin
        .from('teams')
        .select('id, name, elite_slots, owner_user_id')
        .eq('owner_user_id', userId)
        .single();
      if (ownedTeam) {
        team = ownedTeam;
        isOwner = true;
      }
    }

    if (!team) return NextResponse.json({ team: null, members: [], usageMap: {}, isOwner: false });

    // Get all non-removed members (use admin — member can only see own record via RLS)
    const { data: members } = await supabaseAdmin
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
    const ownerUserId = team.owner_user_id;
    if (!activeIds.includes(ownerUserId)) {
      activeIds.push(ownerUserId);
    }

    // Use admin to read all team members' ai_usage (RLS blocks cross-user reads)
    const { data: usageRows } = await supabaseAdmin
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

    // Get owner email if this is owner viewing
    if (isOwner) {
      ownerEmail = user.email || '';
    }

    return NextResponse.json({
      team: { ...team, maxMembers, teamMonthlyLimit, teamUsage },
      members: members || [],
      usageMap,
      isOwner,
      ownerEmail,
      ownerName,
    });
  } catch (err) {
    console.error('Team members error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
