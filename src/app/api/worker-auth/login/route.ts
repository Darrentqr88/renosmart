import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'crypto';
import { normalizePhone } from '@/lib/utils/phone';

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

// Rate limiting
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
 * Flexible phone search — tries multiple normalized formats
 * to handle phones stored as "0176663150", "+60176663150", "60176663150", etc.
 */
async function findWorkerByPhone(phone: string, countryCode: string) {
  const normalizedPhone = normalizePhone(phone, countryCode);
  const cleaned = phone.replace(/[\s\-()]/g, '');

  // Build search patterns: normalized, raw, with/without prefix
  const patterns = new Set<string>();
  patterns.add(normalizedPhone);       // +60176663150
  patterns.add(cleaned);               // 0176663150 (as entered)

  const codeDigits = countryCode.replace('+', ''); // "60"

  // Strip +code → local number
  if (normalizedPhone.startsWith(countryCode)) {
    const local = normalizedPhone.slice(countryCode.length);
    patterns.add(local);                          // 176663150
    patterns.add('0' + local);                    // 0176663150
    patterns.add(codeDigits + local);             // 60176663150
  }

  // Try each pattern — search for both worker and owner roles
  for (const pattern of patterns) {
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('user_id, role, email, phone')
      .in('role', ['worker', 'owner'])
      .eq('phone', pattern)
      .single();

    if (data) return data;
  }

  // Last resort: ilike search on last 8 digits
  const last8 = normalizedPhone.replace('+', '').slice(-8);
  if (last8.length >= 8) {
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('user_id, role, email, phone')
      .in('role', ['worker', 'owner'])
      .ilike('phone', `%${last8}%`)
      .single();

    if (data) return data;
  }

  return null;
}

/**
 * POST /api/worker-auth/login
 * Public — returning worker login by phone number only.
 *
 * Body: { phone: string, countryCode: string }
 * Returns: { email, password } for client-side signInWithPassword
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, countryCode = '+60' } = body;

    if (!phone) {
      return NextResponse.json({ error: 'Missing phone number' }, { status: 400 });
    }

    // Rate limit: 5 attempts per phone per hour
    const normalizedPhone = normalizePhone(phone, countryCode);
    if (!checkRateLimit(`worker-login:${normalizedPhone}`, 5, 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 });
    }

    // Rate limit by IP
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(`worker-login-ip:${ip}`, 15, 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 });
    }

    // Flexible phone search
    const profile = await findWorkerByPhone(phone, countryCode);

    if (!profile) {
      return NextResponse.json({ error: 'No account found with this phone number.' }, { status: 404 });
    }

    // Get the actual auth user to find their real email
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(profile.user_id);

    if (!authUser?.user) {
      return NextResponse.json({ error: 'Account error. Please contact your boss.' }, { status: 500 });
    }

    const actualEmail = authUser.user.email!;
    const password = derivePassword(normalizedPhone);

    // Set derived password on the auth user (works for both synthetic and real email accounts)
    await supabaseAdmin.auth.admin.updateUserById(profile.user_id, { password });

    // Also normalize the phone in the profile if it wasn't already
    if (profile.phone !== normalizedPhone) {
      await supabaseAdmin
        .from('profiles')
        .update({ phone: normalizedPhone })
        .eq('user_id', profile.user_id);
    }

    // Return the user's actual email + derived password + role
    return NextResponse.json({ email: actualEmail, password, role: profile.role });
  } catch (err) {
    console.error('worker-auth/login error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
