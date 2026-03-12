const { createClient } = require('@supabase/supabase-js');

// Service role client — bypasses RLS, used only for ai_usage writes
const supa = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const LIMITS = { free: 3, pro: 50, elite: Infinity };

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  // ── 1. Auth: verify user token sent from frontend ──────────
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: { message: 'Missing auth token' } });
  }

  const { data: { user }, error: authErr } = await supa.auth.getUser(token);
  if (authErr || !user) {
    return res.status(401).json({ error: { message: 'Invalid or expired token' } });
  }

  // ── 2. Quota check: read from ai_usage table ────────────────
  const yearMonth = new Date().toISOString().slice(0, 7); // e.g. '2026-03'

  // Get user's plan from profiles table
  const { data: profile } = await supa
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single();
  const plan = profile?.plan || 'free';
  const limit = LIMITS[plan] ?? 3;

  // Get current month usage
  const { data: usage } = await supa
    .from('ai_usage')
    .select('usage_count')
    .eq('user_id', user.id)
    .eq('year_month', yearMonth)
    .single();
  const count = usage?.usage_count || 0;

  if (count >= limit) {
    return res.status(429).json({
      error: {
        message: `Quota exceeded: ${count}/${limit === Infinity ? '∞' : limit} uses this month`,
        plan,
        used: count,
        limit: limit === Infinity ? null : limit,
        upgrade_required: plan !== 'elite'
      }
    });
  }

  // ── 3. Forward request to Anthropic API ────────────────────
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    // ── 4. Increment usage only on successful response ──────
    if (response.ok) {
      await supa.from('ai_usage').upsert(
        {
          user_id: user.id,
          year_month: yearMonth,
          usage_count: count + 1,
          plan,
        },
        { onConflict: 'user_id,year_month' }
      );
    }

    return res.status(response.status).json(data);

  } catch (err) {
    return res.status(500).json({ error: { message: err.message } });
  }
};
