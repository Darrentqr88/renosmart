import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { checkRateLimit } from '@/lib/ai/rate-limit';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PLAN_LIMITS: Record<string, number> = {
  free: 3,
  pro: 50,
  elite: Infinity,
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { model, max_tokens, messages, system } = body;

    // Server-side quota skip: secondary AI calls (gantt params, task details) use haiku
    // with small token limits. These should not count against the user's quota.
    const isSecondaryCall = model === 'claude-haiku-4-5-20251001' && (max_tokens || 16000) <= 4000;

    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    let userPlan = 'free';

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
    );

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    } else {
      const { data: { session } } = await supabase.auth.getSession();
      userId = session?.user?.id || null;
    }

    if (userId && !isSecondaryCall) {
      // Rate limit check (20-min window, max 10 calls → 60-min cooldown)
      const rateCheck = await checkRateLimit(supabase, userId);
      if (!rateCheck.allowed) {
        return NextResponse.json(
          { error: `请求过于频繁，请等待 ${rateCheck.cooldownMinutes} 分钟后再试。` },
          { status: 429 }
        );
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('user_id', userId)
        .single();

      userPlan = profile?.plan || 'free';
      const limit = PLAN_LIMITS[userPlan];

      const yearMonth = new Date().toISOString().slice(0, 7);
      const { data: usageRow } = await supabase
        .from('ai_usage')
        .select('usage_count')
        .eq('user_id', userId)
        .eq('year_month', yearMonth)
        .single();

      const currentUsage = usageRow?.usage_count || 0;

      if (currentUsage >= limit) {
        return NextResponse.json(
          { error: `AI quota exceeded. Please upgrade your plan. (${currentUsage}/${limit === Infinity ? '∞' : limit} used this month)` },
          { status: 429 }
        );
      }
    }

    const response = await anthropic.messages.create({
      model: model || 'claude-haiku-4-5-20251001',
      max_tokens: max_tokens || 16000,
      messages,
      ...(system ? { system } : {}),
    });

    if (userId && !isSecondaryCall) {
      const yearMonth = new Date().toISOString().slice(0, 7);
      await supabase.rpc('increment_ai_usage', {
        p_user_id: userId,
        p_year_month: yearMonth,
        p_tokens_input: response.usage?.input_tokens ?? 0,
        p_tokens_output: response.usage?.output_tokens ?? 0,
      });
    }

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('Claude API error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
