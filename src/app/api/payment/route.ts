import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const PRICE_IDS: Record<string, string | undefined> = {
  pro_MY: process.env.STRIPE_PRICE_PRO_MY,
  pro_SG: process.env.STRIPE_PRICE_PRO_SG,
  elite_MY: process.env.STRIPE_PRICE_ELITE_MY,
  elite_SG: process.env.STRIPE_PRICE_ELITE_SG,
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { plan, region } = body as { plan: string; region: string };

    const stripeKey = process.env.STRIPE_SECRET_KEY;

    // Demo mode if no Stripe key
    if (!stripeKey) {
      return NextResponse.json({
        demo: true,
        message: 'Demo mode: Stripe not configured',
        plan,
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/designer/pricing?success=1&plan=${plan}`,
      });
    }

    // Get authenticated user
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = session.user.id;
    const userEmail = session.user.email;

    // Get price ID
    const priceKey = `${plan}_${region || 'MY'}`;
    const priceId = PRICE_IDS[priceKey];
    if (!priceId) {
      return NextResponse.json({ error: `Price not configured for ${priceKey}` }, { status: 400 });
    }

    const stripe = new Stripe(stripeKey);

    // Find or create Stripe customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email, name')
      .eq('user_id', userId)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail || profile?.email,
        name: profile?.name || undefined,
        metadata: { user_id: userId },
      });
      customerId = customer.id;

      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', userId);
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/designer/pricing?success=1&plan=${plan}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/designer/pricing`,
      metadata: { user_id: userId, plan },
      subscription_data: {
        metadata: { user_id: userId, plan },
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: unknown) {
    console.error('Stripe checkout error:', error);
    const message = error instanceof Error ? error.message : 'Payment error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
