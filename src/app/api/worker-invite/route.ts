import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const projectId = body.project_id || null;

    // Generate a cryptographically random token (64 hex chars)
    const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');

    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(); // 72 hours

    const { error } = await supabase.from('invite_tokens').insert({
      token,
      created_by: session.user.id,
      project_id: projectId,
      role: 'worker',
      status: 'pending',
      expires_at: expiresAt,
    });

    if (error) {
      console.error('invite_tokens insert error:', error);
      return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 });
    }

    const origin = req.nextUrl.origin;
    const url = `${origin}/join?token=${token}`;

    return NextResponse.json({ token, url, expires_at: expiresAt });
  } catch (err) {
    console.error('worker-invite error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
