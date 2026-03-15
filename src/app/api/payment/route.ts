import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { plan, amount, name, email, phone } = body;

    const billplzKey = process.env.BILLPLZ_API_KEY;
    const collectionId = process.env.BILLPLZ_COLLECTION_ID;
    const isSandbox = process.env.BILLPLZ_SANDBOX === 'true';

    // Demo mode if no Billplz key
    if (!billplzKey || !collectionId) {
      return NextResponse.json({
        demo: true,
        message: 'Demo mode: Payment gateway not configured',
        plan,
        amount,
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/designer/pricing?success=1&plan=${plan}`,
      });
    }

    const baseUrl = isSandbox
      ? 'https://www.billplz-sandbox.com/api/v3'
      : 'https://www.billplz.com/api/v3';

    const res = await fetch(`${baseUrl}/bills`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${billplzKey}:`).toString('base64')}`,
      },
      body: JSON.stringify({
        collection_id: collectionId,
        email,
        mobile: phone,
        name,
        amount: amount * 100, // Billplz uses cents
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment-callback`,
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/designer/pricing?success=1&plan=${plan}`,
        description: `RenoSmart ${plan} Plan Subscription`,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error?.message || 'Payment creation failed');
    }

    return NextResponse.json({ url: data.url });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Payment error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
