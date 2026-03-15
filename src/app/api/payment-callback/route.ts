import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData();
    const billId = body.get('id') as string;
    const paid = body.get('paid') as string;
    const userId = body.get('reference_1') as string;
    const plan = body.get('reference_2') as string;

    if (paid === 'true' && userId && plan) {
      const supabase = await createClient();
      await supabase
        .from('profiles')
        .update({ plan, updated_at: new Date().toISOString() })
        .eq('user_id', userId);
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error: unknown) {
    console.error('Payment callback error:', error);
    return NextResponse.json({ error: 'Callback failed' }, { status: 500 });
  }
}
