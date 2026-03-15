import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

    if (userId) {
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

      let totalUsage = currentUsage;
      if (userPlan === 'free') {
        const { data: allUsage } = await supabase
          .from('ai_usage')
          .select('usage_count')
          .eq('user_id', userId);
        totalUsage = (allUsage || []).reduce((sum: number, row: { usage_count: number }) => sum + row.usage_count, 0);
      }

      if (totalUsage >= limit) {
        return NextResponse.json(
          { error: `AI quota exceeded. Please upgrade your plan. (${totalUsage}/${limit === Infinity ? '\u221e' : limit} used)` },
          { status: 429 }
        );
      }
    }

    const response = await anthropic.messages.create({
      model: model || 'claude-haiku-4-5-20251001',
      max_tokens: max_tokens || 8000,
      messages,
      ...(system ? { system } : {}),
    });

    if (userId) {
      const yearMonth = new Date().toISOString().slice(0, 7);
      await supabase.rpc('increment_ai_usage', { p_user_id: userId, p_year_month: yearMonth });
    }

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('Claude API error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
