import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { DesignerHeader } from '@/components/designer/DesignerHeader';
import { DesignerShell } from '@/components/designer/DesignerShell';

export default async function DesignerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile = null;
  let aiUsed = 0;
  let aiLimit = 3;

  if (user) {
    const { data: p } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    profile = p;

    const yearMonth = new Date().toISOString().slice(0, 7);
    const limits: Record<string, number> = { free: 3, pro: 50, elite: Infinity };
    let basePlan = p?.plan || 'free';

    // If user belongs to a team (via profile.team_id), show TEAM shared quota
    if (p?.team_id) {
      try {
        const admin = createAdminClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { autoRefreshToken: false, persistSession: false } }
        );
        const { data: team } = await admin
          .from('teams')
          .select('elite_slots, owner_user_id')
          .eq('id', p.team_id)
          .single();
        if (team) {
          aiLimit = (team.elite_slots ?? 1) * 250;
          basePlan = 'elite_team';

          // Get ALL team member user_ids + owner for shared usage
          const { data: members } = await admin
            .from('team_members')
            .select('user_id')
            .eq('team_id', p.team_id)
            .eq('status', 'active');
          const memberIds = (members || []).map((m: { user_id: string }) => m.user_id).filter(Boolean);
          if (!memberIds.includes(team.owner_user_id)) memberIds.push(team.owner_user_id);

          // Sum all members' usage for this month
          const { data: usageRows } = await admin
            .from('ai_usage')
            .select('usage_count')
            .in('user_id', memberIds)
            .eq('year_month', yearMonth);
          aiUsed = (usageRows || []).reduce((sum: number, r: { usage_count: number }) => sum + (r.usage_count || 0), 0);
        }
      } catch { /* fallback to personal usage */ }
    }

    // Non-team users: personal usage
    if (basePlan !== 'elite_team') {
      aiLimit = limits[basePlan] || 3;
      const { data: usage } = await supabase
        .from('ai_usage')
        .select('usage_count')
        .eq('user_id', user.id)
        .eq('year_month', yearMonth)
        .single();
      aiUsed = usage?.usage_count || 0;
    }

    // Elite owner without team_id on profile: check if they own a team
    // Must also sum all team members' usage (not just personal)
    if (basePlan === 'elite' && aiLimit === Infinity) {
      try {
        const admin = createAdminClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { autoRefreshToken: false, persistSession: false } }
        );
        const { data: ownedTeam } = await admin
          .from('teams')
          .select('id, elite_slots')
          .eq('owner_user_id', user.id)
          .single();
        if (ownedTeam) {
          aiLimit = (ownedTeam.elite_slots ?? 1) * 250;

          // Sum all team members' usage for this month (same logic as team_id branch)
          const { data: members } = await admin
            .from('team_members')
            .select('user_id')
            .eq('team_id', ownedTeam.id)
            .eq('status', 'active');
          const memberIds = (members || []).map((m: { user_id: string }) => m.user_id).filter(Boolean);
          if (!memberIds.includes(user.id)) memberIds.push(user.id);

          const { data: usageRows } = await admin
            .from('ai_usage')
            .select('usage_count')
            .in('user_id', memberIds)
            .eq('year_month', yearMonth);
          aiUsed = (usageRows || []).reduce((sum: number, r: { usage_count: number }) => sum + (r.usage_count || 0), 0);
        }
      } catch { /* keep Infinity */ }
    }
  }

  return (
    <>
      <DesignerHeader profile={profile} />
      <DesignerShell profile={profile} aiUsed={aiUsed} aiLimit={aiLimit}>
        {children}
      </DesignerShell>
    </>
  );
}
