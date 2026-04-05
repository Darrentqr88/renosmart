import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';

/** POST — create a shareable report link */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { report_data, project_id } = await req.json();
    if (!report_data) return NextResponse.json({ error: 'Missing report data' }, { status: 400 });

    const shareToken = randomBytes(16).toString('hex');

    // Store only summary data (no line items — those stay behind paywall)
    const summary = {
      score: report_data.score,
      projectType: report_data.projectType,
      client: report_data.client ? { company: report_data.client.company } : null,
      itemCount: report_data.items?.length || 0,
      alertCount: report_data.alerts?.length || 0,
      missingCount: report_data.missing?.length || 0,
      subtotalCount: report_data.subtotals?.length || 0,
      totalAmount: report_data.subtotals?.reduce((s: number, st: { amount?: number }) => s + (st.amount || 0), 0) || 0,
      alertSummary: (report_data.alerts || []).slice(0, 5).map((a: { severity: string; message: string }) => ({
        severity: a.severity,
        message: a.message,
      })),
    };

    const { error } = await supabase.from('shared_reports').insert({
      user_id: user.id,
      project_id: project_id || null,
      report_data: summary,
      share_token: shareToken,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    if (error) throw error;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://renosmart.vercel.app';
    return NextResponse.json({ share_url: `${baseUrl}/share/report/${shareToken}`, token: shareToken });
  } catch (error) {
    console.error('Share report error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/** GET — fetch a shared report by token (public, no auth required) */
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');
    if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
    );

    const { data: report } = await supabase
      .from('shared_reports')
      .select('report_data, expires_at, views')
      .eq('share_token', token)
      .single();

    if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });

    if (new Date(report.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Report expired' }, { status: 410 });
    }

    // Increment view count (best-effort, ignore errors)
    await supabase
      .from('shared_reports')
      .update({ views: (report.views || 0) + 1 })
      .eq('share_token', token);

    return NextResponse.json({ report: report.report_data });
  } catch (error) {
    console.error('Get shared report error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
