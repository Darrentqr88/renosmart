import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const PRICE_IDS: Record<string, string | undefined> = {
  pro_MY_monthly:     process.env.STRIPE_PRICE_PRO_MY_MONTHLY,
  pro_MY_quarterly:   process.env.STRIPE_PRICE_PRO_MY_QUARTERLY,
  pro_MY_yearly:      process.env.STRIPE_PRICE_PRO_MY_YEARLY,
  elite_MY_monthly:   process.env.STRIPE_PRICE_ELITE_MY_MONTHLY,
  elite_MY_quarterly: process.env.STRIPE_PRICE_ELITE_MY_QUARTERLY,
  elite_MY_yearly:    process.env.STRIPE_PRICE_ELITE_MY_YEARLY,
  pro_SG_monthly:     process.env.STRIPE_PRICE_PRO_SG_MONTHLY,
  pro_SG_quarterly:   process.env.STRIPE_PRICE_PRO_SG_QUARTERLY,
  pro_SG_yearly:      process.env.STRIPE_PRICE_PRO_SG_YEARLY,
  elite_SG_monthly:   process.env.STRIPE_PRICE_ELITE_SG_MONTHLY,
  elite_SG_quarterly: process.env.STRIPE_PRICE_ELITE_SG_QUARTERLY,
  elite_SG_yearly:    process.env.STRIPE_PRICE_ELITE_SG_YEARLY,
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { plan, region, interval = 'monthly', stack = false } = body as {
      plan: string;
      region: string;
      interval?: string;
      stack?: boolean;
    };

    const stripeKey = process.env.STRIPE_SECRET_KEY;

    // Get authenticated user
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = session.user.id;
    const userEmail = session.user.email;

    // Demo mode if no Stripe key
    if (!stripeKey) {
      // In demo mode, also handle stacking by incrementing elite_slots
      if (stack && plan === 'elite') {
        const { data: team } = await supabase
          .from('teams')
          .select('id, elite_slots')
          .eq('owner_user_id', userId)
          .single();
        if (team) {
          await supabase.from('teams').update({
            elite_slots: (team.elite_slots ?? 1) + 1,
            updated_at: new Date().toISOString(),
          }).eq('id', team.id);
        }
      }
      return NextResponse.json({
        demo: true,
        message: 'Demo mode: Stripe not configured',
        plan,
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/designer/pricing?success=1&plan=${plan}`,
      });
    }

    // Get price ID: e.g. "pro_MY_monthly"
    const priceKey = `${plan}_${region || 'MY'}_${interval}`;
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

    // Determine new slot count for stacking
    let newSlots = 1;
    if (stack && plan === 'elite') {
      const { data: team } = await supabase
        .from('teams')
        .select('elite_slots')
        .eq('owner_user_id', userId)
        .single();
      newSlots = (team?.elite_slots ?? 1) + 1;
    }

    // Build success URL
    const successUrl = stack
      ? `${process.env.NEXT_PUBLIC_APP_URL}/designer/settings?tab=team&stack_success=1`
      : `${process.env.NEXT_PUBLIC_APP_URL}/designer/pricing?success=1&plan=${plan}`;

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: stack
        ? `${process.env.NEXT_PUBLIC_APP_URL}/designer/pricing?stack=elite`
        : `${process.env.NEXT_PUBLIC_APP_URL}/designer/pricing`,
      metadata: {
        user_id: userId,
        plan,
        stack: stack ? 'true' : 'false',
        new_elite_slots: String(newSlots),
      },
      subscription_data: {
        metadata: {
          user_id: userId,
          plan,
          stack: stack ? 'true' : 'false',
          new_elite_slots: String(newSlots),
        },
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: unknown) {
    console.error('Stripe checkout error:', error);
    const message = error instanceof Error ? error.message : 'Payment error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
