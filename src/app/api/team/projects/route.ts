import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

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

    // Check if user owns a team
    const { data: profile } = await supabase
      .from('profiles')
      .select('team_id, plan')
      .eq('user_id', user.id)
      .single();

    let teamId = profile?.team_id;

    // Fallback: check if user owns a team
    if (!teamId) {
      const { data: ownedTeam } = await supabaseAdmin
        .from('teams')
        .select('id, owner_user_id')
        .eq('owner_user_id', user.id)
        .single();
      if (ownedTeam) teamId = ownedTeam.id;
    }

    if (!teamId) {
      return NextResponse.json({ projects: [] });
    }

    // Verify user is the team owner
    const { data: team } = await supabaseAdmin
      .from('teams')
      .select('id, owner_user_id')
      .eq('id', teamId)
      .single();

    if (!team || team.owner_user_id !== user.id) {
      return NextResponse.json({ projects: [] });
    }

    // Get all active team member user_ids + owner
    const { data: members } = await supabaseAdmin
      .from('team_members')
      .select('user_id')
      .eq('team_id', teamId)
      .eq('status', 'active');

    const memberIds = (members || [])
      .map((m: { user_id: string | null }) => m.user_id)
      .filter(Boolean) as string[];
    if (!memberIds.includes(user.id)) memberIds.push(user.id);

    // Fetch ALL projects for team members using admin (bypasses RLS)
    const { data: projects, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .in('designer_id', memberIds)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Team projects error:', error);
      return NextResponse.json({ projects: [] });
    }

    return NextResponse.json({ projects: projects || [] });
  } catch (err) {
    console.error('Team projects error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
