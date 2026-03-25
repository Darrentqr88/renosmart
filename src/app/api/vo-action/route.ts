import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Service-role client — bypasses RLS (used for owner approvals)
const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { voId, action } = await req.json();

    if (!voId || !['approved', 'rejected'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Verify the caller is authenticated
    const cookieStore = await cookies();
    const authClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );

    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
      // Try Authorization header (owner dashboard passes token in header)
      const authHeader = req.headers.get('authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const token = authHeader.slice(7);
      const { data: { user: headerUser } } = await authClient.auth.getUser(token);
      if (!headerUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the VO to verify it exists
    const { data: vo, error: voErr } = await serviceClient
      .from('variation_orders')
      .select('id, status, project_id')
      .eq('id', voId)
      .single();

    if (voErr || !vo) {
      return NextResponse.json({ error: 'VO not found' }, { status: 404 });
    }

    // Guard: no-op if already in target status
    if (vo.status === action) {
      return NextResponse.json({ ok: true, message: 'No change needed' });
    }

    // Perform the update with service role (bypasses RLS)
    const updates: Record<string, unknown> = {
      status: action,
      ...(action === 'approved' ? { approved_at: new Date().toISOString() } : {}),
    };

    const { error: updateErr } = await serviceClient
      .from('variation_orders')
      .update(updates)
      .eq('id', voId);

    if (updateErr) {
      console.error('vo-action update error:', updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, status: action });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('vo-action error:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
