import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Admin client for sending invite emails (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = user.id;

    // Check owner has Elite plan
    const { data: profile } = await supabase
      .from('profiles').select('plan').eq('user_id', userId).single();
    if (profile?.plan !== 'elite') {
      return NextResponse.json({ error: 'Elite plan required for team features' }, { status: 403 });
    }

    // Get or create team
    let { data: team } = await supabase
      .from('teams').select('id, elite_slots').eq('owner_user_id', userId).single();

    if (!team) {
      const { data: newTeam, error } = await supabase
        .from('teams').insert({ owner_user_id: userId, name: 'My Team', elite_slots: 1 })
        .select().single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      team = newTeam;
    }

    // Count current active + pending members (including owner)
    const { count } = await supabase
      .from('team_members')
      .select('id', { count: 'exact' })
      .eq('team_id', team!.id)
      .in('status', ['active', 'pending']);

    const maxMembers = (team!.elite_slots ?? 1) * 5;
    const currentCount = (count ?? 0) + 1; // +1 for owner
    if (currentCount >= maxMembers) {
      return NextResponse.json(
        { error: `团队已满 (${maxMembers} 人上限)。购买更多配套以扩充团队。` },
        { status: 400 }
      );
    }

    // Check if already invited
    const { data: existing } = await supabase
      .from('team_members').select('id, status').eq('team_id', team!.id).eq('email', email).single();
    if (existing && existing.status !== 'removed') {
      return NextResponse.json({ error: '该邮箱已在团队中或已邀请' }, { status: 400 });
    }

    // Insert or re-activate invite
    if (existing?.status === 'removed') {
      await supabase.from('team_members')
        .update({ status: 'pending', invited_at: new Date().toISOString(), joined_at: null })
        .eq('id', existing.id);
    } else {
      await supabase.from('team_members').insert({
        team_id: team!.id,
        email,
        role: 'member',
        status: 'pending',
      });
    }

    // Send invite email via Supabase Admin API
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    const redirectTo = `${appUrl}/auth/callback?team_join=${team!.id}`;

    // Try inviteUserByEmail first (works for new users — Supabase sends the email)
    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: { team_id: team!.id },
    });

    if (inviteError) {
      if (inviteError.message.includes('already registered') || inviteError.message.includes('already been registered')) {
        // Existing user — they'll be auto-joined on their next login
        return NextResponse.json({
          success: true,
          existingUser: true,
          message: `${email} 已有账号，对方下次登入时将自动加入团队`,
        });
      }
      console.error('inviteUserByEmail error:', inviteError);
      return NextResponse.json({ error: inviteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `邀请邮件已发送至 ${email}` });
  } catch (err) {
    console.error('Team invite error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
