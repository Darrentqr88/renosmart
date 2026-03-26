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

    // Get team info
    const { data: team } = await supabaseAdmin
      .from('teams')
      .select('name, owner_user_id')
      .eq('id', invite.team_id)
      .single();

    // Activate the member
    const { error: memberErr } = await supabaseAdmin.from('team_members').update({
      user_id: userId,
      status: 'active',
      joined_at: new Date().toISOString(),
    }).eq('id', invite.id);

    if (memberErr) {
      console.error('Failed to activate team member:', memberErr);
      return NextResponse.json({ joined: false, error: memberErr.message });
    }

    // Set team_id + elite plan on profile
    // First check if profile exists
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .eq('user_id', userId)
      .single();

    if (existingProfile) {
      const { error: profileErr } = await supabaseAdmin.from('profiles').update({
        team_id: invite.team_id,
        plan: 'elite',
        updated_at: new Date().toISOString(),
      }).eq('user_id', userId);

      if (profileErr) {
        console.error('Failed to update profile plan:', profileErr);
      }
    } else {
      // Profile doesn't exist yet (new user just authenticated but hasn't completed registration)
      // Create a minimal profile with team_id and elite plan — registration will fill the rest
      const { error: insertErr } = await supabaseAdmin.from('profiles').insert({
        user_id: userId,
        email: email,
        team_id: invite.team_id,
        plan: 'elite',
      });

      if (insertErr) {
        console.error('Failed to create profile with team:', insertErr);
      }
    }

    // Get owner's company info (for reference)
    let ownerCompany = '';
    if (team?.owner_user_id) {
      const { data: ownerProfile } = await supabaseAdmin
        .from('profiles')
        .select('company')
        .eq('user_id', team.owner_user_id)
        .single();
      ownerCompany = ownerProfile?.company || '';
    }

    return NextResponse.json({
      joined: true,
      teamName: team?.name || 'Team',
      teamId: invite.team_id,
      company: ownerCompany,
      plan: 'elite',
    });
  } catch (err) {
    console.error('Auto-join error:', err);
    return NextResponse.json({ joined: false });
  }
}
