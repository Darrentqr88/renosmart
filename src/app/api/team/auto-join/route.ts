import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Admin client to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * POST /api/team/auto-join
 * Called on login — checks if the user has any pending team invites
 * and auto-activates them. No auth header needed since we verify by userId + email.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, email } = await req.json();
    if (!userId || !email) {
      return NextResponse.json({ joined: false });
    }

    // Find pending invite for this email
    const { data: invite } = await supabaseAdmin
      .from('team_members')
      .select('id, team_id')
      .eq('email', email)
      .eq('status', 'pending')
      .limit(1)
      .single();

    if (!invite) {
      return NextResponse.json({ joined: false });
    }

    // Get team name
    const { data: team } = await supabaseAdmin
      .from('teams')
      .select('name')
      .eq('id', invite.team_id)
      .single();

    // Activate the member
    await supabaseAdmin.from('team_members').update({
      user_id: userId,
      status: 'active',
      joined_at: new Date().toISOString(),
    }).eq('id', invite.id);

    // Set team_id + elite plan on profile
    await supabaseAdmin.from('profiles').update({
      team_id: invite.team_id,
      plan: 'elite',
      updated_at: new Date().toISOString(),
    }).eq('user_id', userId);

    return NextResponse.json({
      joined: true,
      teamName: team?.name || 'Team',
      teamId: invite.team_id,
    });
  } catch (err) {
    console.error('Auto-join error:', err);
    return NextResponse.json({ joined: false });
  }
}
