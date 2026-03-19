import { NextRequest } from 'next/server';
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
    const { model, max_tokens, messages, system, skipQuota } = body;

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

    // Quota check (skip for gantt params call)
    if (userId && !skipQuota) {
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
          JSON.stringify({ error: `AI quota exceeded. Please upgrade your plan. (${totalUsage}/${limit === Infinity ? '\u221e' : limit} used)` }),
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

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              // Send text chunks as SSE
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`));
            }
          }

          // Increment usage after successful completion (only for main analysis, not gantt)
          if (userId && !skipQuota) {
            const yearMonth = new Date().toISOString().slice(0, 7);
            await supabase.rpc('increment_ai_usage', { p_user_id: userId, p_year_month: yearMonth });
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
