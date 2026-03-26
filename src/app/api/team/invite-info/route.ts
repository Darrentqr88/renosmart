import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Admin client to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * GET /api/team/invite-info?email=xxx
 * Returns team owner's company name and address for pre-filling
 * the registration form when an invited user signs up.
 * No auth required — only returns non-sensitive company info.
 */
export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get('email');
    if (!email) {
      return NextResponse.json({ found: false });
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
      return NextResponse.json({ found: false });
    }

    // Get team owner's user_id
    const { data: team } = await supabaseAdmin
      .from('teams')
      .select('id, name, owner_user_id')
      .eq('id', invite.team_id)
      .single();

    if (!team) {
      return NextResponse.json({ found: false });
    }

    // Get owner's profile (company name + address)
    const { data: ownerProfile } = await supabaseAdmin
      .from('profiles')
      .select('company, company_address, name')
      .eq('user_id', team.owner_user_id)
      .single();

    return NextResponse.json({
      found: true,
      teamId: team.id,
      teamName: team.name,
      ownerName: ownerProfile?.name || '',
      company: ownerProfile?.company || '',
      companyAddress: ownerProfile?.company_address || '',
    });
  } catch (err) {
    console.error('Invite info error:', err);
    return NextResponse.json({ found: false });
  }
}
