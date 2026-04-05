import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'RS-';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

/** GET — returns the current user's referral code + stats */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Get or create referral code
    const { data: profile } = await supabase
      .from('profiles')
      .select('referral_code')
      .eq('user_id', user.id)
      .single();

    let code = profile?.referral_code;
    if (!code) {
      code = generateCode();
      await supabase
        .from('profiles')
        .update({ referral_code: code })
        .eq('user_id', user.id);
    }

    // Get referral stats
    const { data: referrals } = await supabase
      .from('referrals')
      .select('id, status, created_at')
      .eq('referrer_user_id', user.id);

    const stats = {
      total: referrals?.length || 0,
      converted: referrals?.filter(r => r.status === 'converted' || r.status === 'rewarded').length || 0,
      rewarded: referrals?.filter(r => r.status === 'rewarded').length || 0,
    };

    return NextResponse.json({ code, stats });
  } catch (error) {
    console.error('Referral GET error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/** POST — validate a referral code during registration */
export async function POST(req: NextRequest) {
  try {
    const { referral_code, referred_user_id } = await req.json();
    if (!referral_code || !referred_user_id) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
    );

    // Find referrer by code
    const { data: referrer } = await supabase
      .from('profiles')
      .select('user_id, plan')
      .eq('referral_code', referral_code)
      .single();

    if (!referrer) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });
    }

    // Prevent self-referral
    if (referrer.user_id === referred_user_id) {
      return NextResponse.json({ error: 'Cannot refer yourself' }, { status: 400 });
    }

    // Check for duplicate referral
    const { data: existing } = await supabase
      .from('referrals')
      .select('id')
      .eq('referred_user_id', referred_user_id)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Already referred' }, { status: 409 });
    }

    // Create referral record
    const { error } = await supabase.from('referrals').insert({
      referrer_user_id: referrer.user_id,
      referred_user_id,
      referral_code,
      status: 'pending',
    });

    if (error) throw error;

    return NextResponse.json({ success: true, referrer_plan: referrer.plan });
  } catch (error) {
    console.error('Referral POST error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
