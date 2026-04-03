import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { checkRateLimit } from '@/lib/ai/rate-limit';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

// Admin client to bypass RLS for cross-user team quota checks
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const PLAN_LIMITS: Record<string, number> = {
  free: 3,
  pro: 50,
  elite: Infinity,
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { max_tokens, messages, system, skipQuota } = body;

    // Secondary calls (Gantt params, trade hints) pass skipQuota: true — exempt from quota
    const isSecondaryCall = skipQuota === true;

    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;

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
      const { data: { user: sessionUser } } = await supabase.auth.getUser();
      userId = sessionUser?.id || null;
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
        .select('plan, team_id')
        .eq('user_id', userId)
        .single();

      let userPlan = profile?.plan || 'free';
      const teamId = (profile as { plan: string; team_id?: string } | null)?.team_id ?? null;

      // Check team Elite quota (shared pool)
      // Use admin client to bypass RLS — members can't read other members'
      // team_members or ai_usage rows through the anon client
      if (teamId) {
        const { data: team } = await supabaseAdmin
          .from('teams')
          .select('elite_slots, owner_user_id')
          .eq('id', teamId)
          .single();

        if (team) {
          const teamMonthlyLimit = ((team as { elite_slots: number; owner_user_id: string }).elite_slots ?? 1) * 250;
          const { data: teamMembersData } = await supabaseAdmin
            .from('team_members')
            .select('user_id')
            .eq('team_id', teamId)
            .eq('status', 'active');
          const memberIds = ((teamMembersData || []) as { user_id: string }[])
            .map((m) => m.user_id)
            .filter(Boolean);

          // Include owner in usage count (owner is not in team_members)
          const ownerUserId = (team as { owner_user_id: string }).owner_user_id;
          if (!memberIds.includes(ownerUserId)) {
            memberIds.push(ownerUserId);
          }

          const yearMonth = new Date().toISOString().slice(0, 7);
          const { data: usageRows } = await supabaseAdmin
            .from('ai_usage')
            .select('usage_count')
            .in('user_id', memberIds)
            .eq('year_month', yearMonth);

          const teamUsage = ((usageRows || []) as { usage_count: number }[]).reduce(
            (s, r) => s + r.usage_count,
            0
          );

          if (teamUsage >= teamMonthlyLimit) {
            return NextResponse.json(
              { error: `团队 AI 配额已用完 (${teamUsage}/${teamMonthlyLimit})。请购买更多 Elite 配套。` },
              { status: 429 }
            );
          }
          userPlan = 'elite'; // Team member has Elite access
        }
      }

      if (userPlan !== 'elite') {
        const limit = PLAN_LIMITS[userPlan] ?? 0;
        const yearMonth = new Date().toISOString().slice(0, 7);

        let totalUsage = 0;
        if (userPlan === 'free') {
          const { data: allUsage } = await supabase
            .from('ai_usage')
            .select('usage_count')
            .eq('user_id', userId);
          totalUsage = ((allUsage || []) as { usage_count: number }[]).reduce(
            (s, r) => s + r.usage_count,
            0
          );
        } else {
          const { data: usageRow } = await supabase
            .from('ai_usage')
            .select('usage_count')
            .eq('user_id', userId)
            .eq('year_month', yearMonth)
            .single();
          totalUsage = (usageRow as { usage_count: number } | null)?.usage_count || 0;
        }

        if (totalUsage >= limit) {
          return NextResponse.json(
            { error: `AI quota exceeded. Please upgrade your plan. (${totalUsage}/${limit === Infinity ? '∞' : limit} used)` },
            { status: 429 }
          );
        }
      }
    }

    // Build Gemini model
    const geminiModel = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      ...(system ? { systemInstruction: system } : {}),
      generationConfig: { maxOutputTokens: max_tokens || 16000 },
    });

    const contents = (messages as Array<{ role: string; content: string }>).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const result = await geminiModel.generateContent({ contents });
    const text = result.response.text();
    const inputTokens = result.response.usageMetadata?.promptTokenCount ?? 0;
    const outputTokens = result.response.usageMetadata?.candidatesTokenCount ?? 0;

    if (userId && !isSecondaryCall) {
      const yearMonth = new Date().toISOString().slice(0, 7);
      await supabase.rpc('increment_ai_usage', {
        p_user_id: userId,
        p_year_month: yearMonth,
        p_tokens_input: inputTokens,
        p_tokens_output: outputTokens,
      });
    }

    // Return in Anthropic-compatible shape so frontend needs no changes
    return NextResponse.json({
      content: [{ type: 'text', text }],
      usage: { input_tokens: inputTokens, output_tokens: outputTokens },
    });
  } catch (error: unknown) {
    console.error('Gemini API error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
