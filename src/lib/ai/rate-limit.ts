/**
 * AI Rate Limiter — 20-minute sliding window, max 10 calls → 60-minute cooldown.
 * Uses the ai_rate_limit table in Supabase (no Redis needed).
 */

import type { SupabaseClient } from '@supabase/supabase-js';

const WINDOW_MINUTES = 20;
const MAX_CALLS = 10;
const COOLDOWN_MINUTES = 60;

export async function checkRateLimit(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ allowed: boolean; cooldownMinutes?: number }> {
  const now = new Date();

  const { data: row } = await supabase
    .from('ai_rate_limit')
    .select('window_start, call_count, cooldown_until')
    .eq('user_id', userId)
    .single();

  // 1. Active cooldown?
  if (row?.cooldown_until && new Date(row.cooldown_until as string) > now) {
    const remaining = Math.ceil(
      (new Date(row.cooldown_until as string).getTime() - now.getTime()) / 60000,
    );
    return { allowed: false, cooldownMinutes: remaining };
  }

  // 2. Window expired or no record yet? Start fresh.
  const windowAge = row?.window_start
    ? (now.getTime() - new Date(row.window_start as string).getTime()) / 60000
    : Infinity;

  if (windowAge > WINDOW_MINUTES) {
    await supabase.from('ai_rate_limit').upsert({
      user_id: userId,
      window_start: now.toISOString(),
      call_count: 1,
      cooldown_until: null,
    });
    return { allowed: true };
  }

  // 3. Within window — check count.
  const newCount = ((row?.call_count as number) || 0) + 1;

  if (newCount > MAX_CALLS) {
    const cooldownUntil = new Date(now.getTime() + COOLDOWN_MINUTES * 60 * 1000);
    await supabase.from('ai_rate_limit').upsert({
      user_id: userId,
      window_start: row!.window_start,
      call_count: newCount,
      cooldown_until: cooldownUntil.toISOString(),
    });
    return { allowed: false, cooldownMinutes: COOLDOWN_MINUTES };
  }

  await supabase.from('ai_rate_limit').upsert({
    user_id: userId,
    window_start: row!.window_start,
    call_count: newCount,
    cooldown_until: null,
  });

  return { allowed: true };
}
