import { NextRequest } from 'next/server';
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

    // Quota check
    if (userId && !isSecondaryCall) {
      // Rate limit check (20-min window, max 10 calls → 60-min cooldown)
      const rateCheck = await checkRateLimit(supabase, userId);
      if (!rateCheck.allowed) {
        return new Response(
          JSON.stringify({ error: `请求过于频繁，请等待 ${rateCheck.cooldownMinutes} 分钟后再试。` }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
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

      let totalUsage = currentUsage;
      if (userPlan === 'free') {
        const { data: allUsage } = await supabase
          .from('ai_usage')
          .select('usage_count')
          .eq('user_id', userId);
        totalUsage = (allUsage || []).reduce((sum: number, row: { usage_count: number }) => sum + row.usage_count, 0);
      }

      if (totalUsage >= limit) {
        return new Response(
          JSON.stringify({ error: `AI quota exceeded. Please upgrade your plan. (${totalUsage}/${limit === Infinity ? '∞' : limit} used)` }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Stream from Anthropic
    const stream = await anthropic.messages.stream({
      model: model || 'claude-haiku-4-5-20251001',
      max_tokens: max_tokens || 16000,
      messages,
      ...(system ? { system } : {}),
    });

    const encoder = new TextEncoder();
    let inputTokens = 0;
    let outputTokens = 0;

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              // Send text chunks as SSE
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`));
            }
            // Capture token usage from stream events
            if (event.type === 'message_start' && event.message.usage) {
              inputTokens = event.message.usage.input_tokens;
            }
            if (event.type === 'message_delta' && event.usage) {
              outputTokens = event.usage.output_tokens;
            }
          }

          // Increment usage after successful completion (only for main analysis, not gantt)
          if (userId && !isSecondaryCall) {
            const yearMonth = new Date().toISOString().slice(0, 7);
            await supabase.rpc('increment_ai_usage', {
              p_user_id: userId,
              p_year_month: yearMonth,
              p_tokens_input: inputTokens,
              p_tokens_output: outputTokens,
            });
          }

          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Stream error';
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: unknown) {
    console.error('Claude stream API error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
