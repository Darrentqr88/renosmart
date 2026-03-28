import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface NotifyBody {
  project_id?: string | null;
  event_type: string;
  worker_name: string;
  message: string;
  exclude_user_id?: string;
  target_user_id?: string; // direct target (e.g. worker_added notification)
}

export async function POST(req: NextRequest) {
  try {
    // Auth check — caller must be a logged-in user
    const supabase = await createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: NotifyBody = await req.json();
    const { project_id, event_type, worker_name, message, exclude_user_id, target_user_id } = body;

    if (!event_type) {
      return NextResponse.json({ error: 'Missing event_type' }, { status: 400 });
    }

    const notifications: { user_id: string; project_id: string | null; type: string; title: string; body: string }[] = [];

    // If target_user_id is specified (e.g. worker_added), notify that user directly
    if (target_user_id) {
      notifications.push({
        user_id: target_user_id,
        project_id: project_id || null,
        type: event_type,
        title: `${worker_name}: ${event_type.replace(/_/g, ' ')}`,
        body: message,
      });
    }

    // If project_id is provided, notify project stakeholders
    if (project_id) {
      const { data: project } = await supabaseAdmin
        .from('projects')
        .select('user_id, designer_id, client_name')
        .eq('id', project_id)
        .single();

      if (project) {
        const designerId = project.designer_id || project.user_id;

        // Notify designer (always, unless they are the actor)
        if (designerId && designerId !== exclude_user_id) {
          notifications.push({
            user_id: designerId,
            project_id,
            type: event_type,
            title: `${worker_name}: ${event_type.replace(/_/g, ' ')}`,
            body: message,
          });
        }

        // Notify owner for check-in/checkout/completion events
        // Look up owner by client_name in profiles (best-effort)
        if (['worker_checkin', 'worker_checkout', 'task_completed'].includes(event_type) && project.client_name) {
          const { data: ownerProfiles } = await supabaseAdmin
            .from('profiles')
            .select('user_id')
            .eq('role', 'owner')
            .eq('name', project.client_name)
            .limit(1);

          const ownerId = ownerProfiles?.[0]?.user_id;
          if (ownerId && ownerId !== exclude_user_id && ownerId !== designerId) {
            notifications.push({
              user_id: ownerId,
              project_id,
              type: event_type,
              title: `${worker_name}: ${event_type.replace(/_/g, ' ')}`,
              body: message,
            });
          }
        }
      }
    }

    // Insert all notifications
    if (notifications.length > 0) {
      await supabaseAdmin.from('notifications').insert(notifications);
    }

    return NextResponse.json({ ok: true, notified: notifications.length });
  } catch (err) {
    console.error('[notify] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
