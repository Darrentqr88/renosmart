import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'crypto';
import { normalizePhone, phoneToSyntheticEmail } from '@/lib/utils/phone';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function getWorkerSecret(): string {
  const secret = process.env.WORKER_AUTH_SECRET;
  if (!secret) throw new Error('WORKER_AUTH_SECRET environment variable is required');
  return secret;
}

function derivePassword(normalizedPhone: string): string {
  return createHmac('sha256', getWorkerSecret())
    .update(normalizedPhone)
    .digest('hex')
    .slice(0, 32);
}

// Rate limiting: simple in-memory store
const rateLimits = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimits.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

/**
 * GET /api/worker-auth?token=xxx
 * Public — validates invite token & returns designer/project info for display.
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');
    if (!token) {
      return NextResponse.json({ valid: false, error: 'Missing token' });
    }

    const { data, error } = await supabaseAdmin
      .from('invite_tokens')
      .select('id, status, expires_at, created_by, project_id')
      .eq('token', token)
      .single();

    if (error || !data) {
      return NextResponse.json({ valid: false, error: 'Invalid link' });
    }

    if (data.status === 'accepted') {
      return NextResponse.json({ valid: false, error: 'already_claimed' });
    }

    if (new Date(data.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, error: 'expired' });
    }

    // Fetch designer info
    const { data: designer } = await supabaseAdmin
      .from('profiles')
      .select('name, company')
      .eq('user_id', data.created_by)
      .single();

    // Fetch project info if linked
    let projectName: string | null = null;
    if (data.project_id) {
      const { data: project } = await supabaseAdmin
        .from('projects')
        .select('name')
        .eq('id', data.project_id)
        .single();
      projectName = project?.name || null;
    }

    return NextResponse.json({
      valid: true,
      designer_name: designer?.name || 'Your boss',
      designer_company: designer?.company || null,
      project_name: projectName,
    });
  } catch (err) {
    console.error('worker-auth GET error:', err);
    return NextResponse.json({ valid: false, error: 'Server error' }, { status: 500 });
  }
}

/**
 * POST /api/worker-auth
 * Public — claims invite token with phone number, creates/finds user, returns sign-in credentials.
 *
 * Body: { token: string, phone: string, countryCode: string }
 * Returns: { email, password } for client-side signInWithPassword
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, phone, countryCode = '+60' } = body;

    if (!token || !phone) {
      return NextResponse.json({ error: 'Missing token or phone' }, { status: 400 });
    }

    // Rate limit by IP
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(`worker-auth:${ip}`, 10, 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 });
    }

    // 1. Validate token
    const { data: tokenData, error: tokenErr } = await supabaseAdmin
      .from('invite_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (tokenErr || !tokenData) {
      return NextResponse.json({ error: 'Invalid link' }, { status: 400 });
    }

    if (tokenData.status === 'accepted') {
      return NextResponse.json({ error: 'This link has already been used.' }, { status: 400 });
    }

    if (new Date(tokenData.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This link has expired. Ask your boss for a new one.' }, { status: 400 });
    }

    // 2. Normalize phone
    const normalizedPhone = normalizePhone(phone, countryCode);
    const email = phoneToSyntheticEmail(normalizedPhone);
    const password = derivePassword(normalizedPhone);

    // 3. Find or create Supabase auth user
    let userId: string;

    // Try to create user first — if email already exists, Supabase returns an error
    const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: 'worker', phone: normalizedPhone },
    });

    if (newUser?.user) {
      userId = newUser.user.id;
    } else if (createErr?.message?.includes('already') || createErr?.message?.includes('exists')) {
      // User already exists — find by profile email and update password
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('user_id')
        .eq('email', email)
        .single();

      if (existingProfile) {
        userId = existingProfile.user_id;
      } else {
        // Fallback: list users to find by email (rare case)
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
        const found = listData?.users?.find(u => u.email === email);
        if (!found) {
          return NextResponse.json({ error: 'Failed to find or create account' }, { status: 500 });
        }
        userId = found.id;
      }
      // Update password in case WORKER_AUTH_SECRET changed
      await supabaseAdmin.auth.admin.updateUserById(userId, { password });
    } else {
      console.error('Create user error:', createErr);
      return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
    }

    // 4. Upsert profile
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existingProfile) {
      await supabaseAdmin
        .from('profiles')
        .update({ phone: normalizedPhone, role: 'worker' })
        .eq('user_id', userId);
    } else {
      await supabaseAdmin
        .from('profiles')
        .insert({
          user_id: userId,
          email,
          phone: normalizedPhone,
          role: 'worker',
          plan: 'free',
          name: '',
        });
    }

    // 5. Link to designer via designer_workers
    const { data: existingLink } = await supabaseAdmin
      .from('designer_workers')
      .select('id')
      .eq('designer_id', tokenData.created_by)
      .eq('profile_id', userId)
      .single();

    if (!existingLink) {
      // Check if there's a row with matching phone but no profile_id
      const { data: phoneLink } = await supabaseAdmin
        .from('designer_workers')
        .select('id')
        .eq('designer_id', tokenData.created_by)
        .ilike('phone', `%${normalizedPhone.slice(-8)}%`)
        .is('profile_id', null)
        .single();

      if (phoneLink) {
        // Update existing row with profile_id
        await supabaseAdmin
          .from('designer_workers')
          .update({ profile_id: userId, status: 'active' })
          .eq('id', phoneLink.id);
      } else {
        // Insert new designer_workers row
        await supabaseAdmin
          .from('designer_workers')
          .insert({
            designer_id: tokenData.created_by,
            profile_id: userId,
            name: '',
            phone: normalizedPhone,
            trades: [],
            status: 'active',
          });
      }
    }

    // 6. Mark token as accepted
    await supabaseAdmin
      .from('invite_tokens')
      .update({
        status: 'accepted',
        claimed_by_phone: normalizedPhone,
        claimed_by_user_id: userId,
        claimed_at: new Date().toISOString(),
      })
      .eq('id', tokenData.id);

    // 7. Return credentials for client-side sign-in
    return NextResponse.json({ email, password });
  } catch (err) {
    console.error('worker-auth POST error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
