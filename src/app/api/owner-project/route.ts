import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET() {
  try {
    // Authenticate the user via their session
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Check projects linked to this owner (bypass RLS with admin)
    const { data: projects } = await supabaseAdmin
      .from('projects')
      .select('id, name, address, client_name, contract_amount, status, progress, designer_id, created_at')
      .or(`owner_user_id.eq.${user.id},owner_email.eq.${user.email}`)
      .order('created_at', { ascending: false })
      .limit(5);

    if (projects && projects.length > 0) {
      // Fetch designer info for each project
      const designerIds = [...new Set(projects.map(p => p.designer_id).filter(Boolean))];
      let designers: Record<string, { name: string; company: string }> = {};
      if (designerIds.length > 0) {
        const { data: profiles } = await supabaseAdmin
          .from('profiles')
          .select('user_id, name, company')
          .in('user_id', designerIds);
        if (profiles) {
          designers = Object.fromEntries(profiles.map(p => [p.user_id, { name: p.name, company: p.company }]));
        }
      }

      const result = projects.map(p => ({
        ...p,
        designer: designers[p.designer_id] || null,
      }));

      return NextResponse.json({ projects: result });
    }

    // 2. Fallback: check invite_tokens for accepted invites with project_id
    const { data: tokens } = await supabaseAdmin
      .from('invite_tokens')
      .select('project_id')
      .eq('claimed_by_user_id', user.id)
      .eq('role', 'owner')
      .eq('status', 'accepted')
      .not('project_id', 'is', null)
      .limit(5);

    if (tokens && tokens.length > 0) {
      const projectIds = tokens.map(t => t.project_id).filter(Boolean);
      const { data: invitedProjects } = await supabaseAdmin
        .from('projects')
        .select('id, name, address, client_name, contract_amount, status, progress, designer_id, created_at')
        .in('id', projectIds);

      if (invitedProjects && invitedProjects.length > 0) {
        const designerIds = [...new Set(invitedProjects.map(p => p.designer_id).filter(Boolean))];
        let designers: Record<string, { name: string; company: string }> = {};
        if (designerIds.length > 0) {
          const { data: profiles } = await supabaseAdmin
            .from('profiles')
            .select('user_id, name, company')
            .in('user_id', designerIds);
          if (profiles) {
            designers = Object.fromEntries(profiles.map(p => [p.user_id, { name: p.name, company: p.company }]));
          }
        }

        const result = invitedProjects.map(p => ({
          ...p,
          designer: designers[p.designer_id] || null,
        }));

        return NextResponse.json({ projects: result });
      }
    }

    return NextResponse.json({ projects: [] });
  } catch (err) {
    console.error('owner-project error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
