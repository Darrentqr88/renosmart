import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Use service role client to bypass RLS
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  const stripe = new Stripe(stripeKey);
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = getServiceClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const plan = session.metadata?.plan;

        if (userId && plan) {
          await supabase
            .from('profiles')
            .update({
              plan,
              stripe_customer_id: session.customer as string,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId);

          // For Elite: ensure team has elite_slots = 1 (first purchase)
          if (plan === 'elite') {
            const { data: existingTeam } = await supabase
              .from('teams')
              .select('id')
              .eq('owner_user_id', userId)
              .single();
            if (!existingTeam) {
              // Auto-create team on first Elite purchase
              await supabase.from('teams').insert({
                owner_user_id: userId,
                name: 'My Team',
                elite_slots: 1,
              });
            }
          }
        }
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;
        const plan = subscription.metadata?.plan;

        if (userId && plan && subscription.status === 'active') {
          await supabase
            .from('profiles')
            .update({
              plan,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;
        const plan = subscription.metadata?.plan;

        if (userId) {
          // Downgrade to free
          await supabase
            .from('profiles')
            .update({ plan: 'free', updated_at: new Date().toISOString() })
            .eq('user_id', userId);

          // If Elite subscription cancelled, reset team elite_slots
          if (plan === 'elite') {
            await supabase
              .from('teams')
              .update({ elite_slots: 0, updated_at: new Date().toISOString() })
              .eq('owner_user_id', userId);

            // Remove team_id from all members (they lose Elite access)
            const { data: team } = await supabase
              .from('teams')
              .select('id')
              .eq('owner_user_id', userId)
              .single();
            if (team) {
              await supabase
                .from('profiles')
                .update({ team_id: null, plan: 'free', updated_at: new Date().toISOString() })
                .eq('team_id', team.id);
              await supabase
                .from('team_members')
                .update({ status: 'removed' })
                .eq('team_id', team.id)
                .eq('status', 'active');
            }
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;
        const plan = subscription.metadata?.plan;

        if (userId && subscription.status === 'active') {
          if (plan) {
            await supabase
              .from('profiles')
              .update({ plan, updated_at: new Date().toISOString() })
              .eq('user_id', userId);
          }

          // Sync quantity → elite_slots (for bundle stacking)
          if (plan === 'elite') {
            const quantity = subscription.items.data[0]?.quantity ?? 1;
            await supabase
              .from('teams')
              .update({
                elite_slots: quantity,
                updated_at: new Date().toISOString(),
              })
              .eq('owner_user_id', userId);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.warn('Payment failed for customer:', invoice.customer);
        break;
      }
    }
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
