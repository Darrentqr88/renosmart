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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = user.id;
    const userEmail = user.email;

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

    // --- Stack: update existing subscription quantity instead of creating new one ---
    if (stack && plan === 'elite') {
      // Find existing active Elite subscription for this customer
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 10,
      });

      const eliteSub = subscriptions.data.find(
        (s) => s.metadata?.plan === 'elite' && s.metadata?.user_id === userId
      );

      if (eliteSub) {
        // Update quantity on existing subscription (+1 bundle)
        const currentQty = eliteSub.items.data[0]?.quantity ?? 1;
        const newQty = currentQty + 1;

        await stripe.subscriptions.update(eliteSub.id, {
          items: [{
            id: eliteSub.items.data[0].id,
            quantity: newQty,
          }],
          metadata: {
            ...eliteSub.metadata,
            elite_slots: String(newQty),
          },
          proration_behavior: 'create_prorations', // charge prorated diff immediately
        });

        // Update team elite_slots in DB
        await supabase
          .from('teams')
          .update({ elite_slots: newQty, updated_at: new Date().toISOString() })
          .eq('owner_user_id', userId);

        return NextResponse.json({
          success: true,
          newQuantity: newQty,
          redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/designer/settings?tab=team&stack_success=1`,
        });
      }
      // No existing elite subscription — fall through to create new one with quantity 1
    }

    // Build success URL
    const successUrl = stack
      ? `${process.env.NEXT_PUBLIC_APP_URL}/designer/settings?tab=team&stack_success=1`
      : `${process.env.NEXT_PUBLIC_APP_URL}/designer/pricing?success=1&plan=${plan}`;

    // Create new checkout session (first-time purchase)
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/designer/pricing`,
      metadata: { user_id: userId, plan },
      subscription_data: {
        metadata: {
          user_id: userId,
          plan,
          elite_slots: '1',
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
