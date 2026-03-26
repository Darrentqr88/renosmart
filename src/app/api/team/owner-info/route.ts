import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Admin client to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * GET /api/team/owner-info?team_id=xxx
 * Returns team owner's company name and address for pre-filling registration.
 * Used when the user was already auto-joined (so invite-info won't find a 'pending' record).
 */
export async function GET(req: NextRequest) {
  try {
    const teamId = req.nextUrl.searchParams.get('team_id');
    if (!teamId) {
      return NextResponse.json({ found: false });
    }

    // Get team and owner
    const { data: team } = await supabaseAdmin
      .from('teams')
      .select('id, name, owner_user_id')
      .eq('id', teamId)
      .single();

    if (!team) {
      return NextResponse.json({ found: false });
    }

    // Get owner's profile
    const { data: ownerProfile } = await supabaseAdmin
      .from('profiles')
      .select('company, company_address, name')
      .eq('user_id', team.owner_user_id)
      .single();

    return NextResponse.json({
      found: true,
      teamName: team.name,
      ownerName: ownerProfile?.name || '',
      company: ownerProfile?.company || '',
      companyAddress: ownerProfile?.company_address || '',
    });
  } catch (err) {
    console.error('Owner info error:', err);
    return NextResponse.json({ found: false });
  }
}
