export const runtime = 'nodejs'; // ← 念のため明示。Edge だと署名検証が落ちます
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { Stripe } from 'stripe';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { upsertSubscriptionFromStripe } from '@/lib/stripeFunctions';

export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature');
  if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });

  // 1) raw body を文字列で読む（App RouterはこれでOK）
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // 2) 先に「処理権」を獲得（ユニーク制約でロック）:
  let claimed = false;
  try {
    const { error: claimError } = await supabaseAdmin
      .from('processed_stripe_events')
      .insert({ event_id: event.id });

    if (claimError) {
      // 23505 = unique_violation（= 既に処理済み）
      if ((claimError as any).code === '23505') {
        console.log('Duplicate event; already processed:', event.id);
        return NextResponse.json({ received: true });
      }
      console.error('Error claiming event id:', claimError);
      return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }
    claimed = true;

    // 3) ここから “本来の処理”
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string | null;
        const subscriptionId = session.subscription as string | null;
        const userId = session.metadata?.userId;

        if (!userId) {
          console.error('No userId in checkout session metadata:', session.id);
          break;
        }

        if (customerId) {
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({ stripe_customer_id: customerId })
            .eq('id', userId)
            .is('stripe_customer_id', null);
          if (profileError) console.error('profiles update error:', profileError);
        }

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const latestInvoice = subscription.latest_invoice
            ? await stripe.invoices.retrieve(subscription.latest_invoice as string)
            : undefined;

          await upsertSubscriptionFromStripe(subscription, latestInvoice, userId);
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        // ※ Stripe は “paused/resumed” という専用イベントを送らず、
        //   pause/resume は updated に含まれるケースが一般的です
        const subscription = event.data.object as Stripe.Subscription;
        let latestInvoice: Stripe.Invoice | undefined;
        if (subscription.latest_invoice) {
          try {
            latestInvoice = await stripe.invoices.retrieve(subscription.latest_invoice as string);
          } catch (e) {
            console.error('latest invoice retrieve error:', e);
          }
        }
        await upsertSubscriptionFromStripe(subscription, latestInvoice);
        break;
      }

      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as any).subscription as string | null;
        if (subscriptionId) {
          const { error: updateError } = await supabaseAdmin
            .from('subscriptions')
            .update({
              latest_invoice_id: invoice.id,
              currency: invoice.currency,
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subscriptionId);
          if (updateError) console.error('update subscription with invoice error:', updateError);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // 4) 正常終了
    return NextResponse.json({ received: true });

  } catch (err) {
    console.error('Webhook handler error:', err);

    // 失敗したら “ロック” を解放して Stripe の再送を許す
    if (claimed) {
      try {
        await supabaseAdmin.from('processed_stripe_events').delete().eq('event_id', event.id);
      } catch (e) {
        console.error('Failed to rollback event claim:', e);
      }
    }
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 });
  }
}
