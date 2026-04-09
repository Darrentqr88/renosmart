import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(req: NextRequest) {
  try {
    // Authenticate the user via their session
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Single project fetch (for import)
    const projectId = req.nextUrl.searchParams.get('id');
    if (projectId) {
      // Verify this project belongs to the owner
      const { data: proj } = await supabaseAdmin
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .or(`owner_user_id.eq.${user.id},owner_email.eq.${user.email}`)
        .maybeSingle();

      if (!proj) {
        // Also check via invite_tokens
        const { data: token } = await supabaseAdmin
          .from('invite_tokens')
          .select('project_id')
          .eq('claimed_by_user_id', user.id)
          .eq('project_id', projectId)
          .eq('status', 'accepted')
          .maybeSingle();

        if (!token) {
          return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // Fetch via admin
        const { data: tokenProj } = await supabaseAdmin
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single();

        if (!tokenProj) {
          return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // Load related data + designer
        return NextResponse.json({ project: await enrichProject(tokenProj) });
      }

      return NextResponse.json({ project: await enrichProject(proj) });
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

async function enrichProject(proj: Record<string, unknown>) {
  const id = proj.id as string;
  const designerId = proj.designer_id as string | null;

  const [vos, photos, tasks, phases, quots, designerProfile] = await Promise.all([
    supabaseAdmin.from('variation_orders').select('*').eq('project_id', id).order('created_at', { ascending: false }),
    supabaseAdmin.from('site_photos').select('id, url, caption, trade, created_at').eq('project_id', id).eq('approved', true).order('created_at', { ascending: false }),
    supabaseAdmin.from('gantt_tasks').select('id, name, progress, sort_order').eq('project_id', id).order('sort_order', { ascending: true }),
    supabaseAdmin.from('payment_phases').select('*').eq('project_id', id).order('phase_number', { ascending: true }),
    supabaseAdmin.from('project_quotations').select('id, version, file_url, file_name, is_active, created_at, total_amount').eq('project_id', id).order('version', { ascending: false }),
    designerId
      ? supabaseAdmin.from('profiles').select('name, company').eq('user_id', designerId).single()
      : Promise.resolve({ data: null }),
  ]);

  return {
    ...proj,
    designer: designerProfile.data || null,
    variation_orders: vos.data || [],
    site_photos: photos.data || [],
    gantt_tasks: tasks.data || [],
    payment_phases: phases.data || [],
    quotations: quots.data || [],
  };
}
