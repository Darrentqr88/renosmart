import { createClient } from '@/lib/supabase/server';
import { DesignerHeader } from '@/components/designer/DesignerHeader';
import { DesignerShell } from '@/components/designer/DesignerShell';

export default async function DesignerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  let profile = null;
  let aiUsed = 0;
  let aiLimit = 3;

  if (session) {
    const { data: p } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single();
    profile = p;

    const yearMonth = new Date().toISOString().slice(0, 7);
    const { data: usage } = await supabase
      .from('ai_usage')
      .select('usage_count')
      .eq('user_id', session.user.id)
      .eq('year_month', yearMonth)
      .single();

    aiUsed = usage?.usage_count || 0;

    const limits: Record<string, number> = { free: 3, pro: 50, elite: Infinity };
    let basePlan = p?.plan || 'free';

    // If user belongs to an Elite team, show team shared quota
    if (p?.team_id) {
      const { data: team } = await supabase
        .from('teams')
        .select('elite_slots')
        .eq('id', p.team_id)
        .single();
      if (team) {
        aiLimit = (team.elite_slots ?? 1) * 250;
        basePlan = 'elite_team';
      }
    }

    if (basePlan !== 'elite_team') {
      aiLimit = limits[basePlan] || 3;
    }

    // Elite owner: show team shared quota (elite_slots * 250) if they own a team
    if (basePlan === 'elite' && aiLimit === Infinity) {
      const { data: ownedTeam } = await supabase
        .from('teams')
        .select('elite_slots')
        .eq('owner_user_id', session.user.id)
        .single();
      if (ownedTeam) {
        aiLimit = (ownedTeam.elite_slots ?? 1) * 250;
      }
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
