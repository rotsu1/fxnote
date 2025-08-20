import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { mapStripeSubToRow, unixToIso } from '@/lib/subscription';
import type { Stripe } from 'stripe';

// Disable body parsing for webhook signature verification
export const dynamic = 'force-dynamic';

/**
 * Helper function to upsert subscription data from Stripe
 */
async function upsertSubscriptionFromStripe(
  subscription: Stripe.Subscription,
  latestInvoice?: Stripe.Invoice,
  userId?: string
) {
  try {
    // Get customer ID from subscription
    const customerId = typeof subscription.customer === 'string' 
      ? subscription.customer 
      : subscription.customer.id;

    // Use provided userId or extract from metadata
    const finalUserId = userId || subscription.metadata?.userId || '';

    if (!finalUserId) {
      console.error('No userId found for subscription:', subscription.id);
      return;
    }

    // Update profiles.stripe_customer_id if not set
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', finalUserId)
      .is('stripe_customer_id', null);

    if (profileError) {
      console.error('Error updating profile stripe_customer_id:', profileError);
    }

    // Prepare subscription data for upsert
    const subscriptionData = {
      user_id: finalUserId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      status: subscription.status,
      price_id: subscription.items.data[0]?.price.id || null,
      product_id: subscription.items.data[0]?.price.product as string || null,
      quantity: subscription.items.data[0]?.quantity || 1,
      current_period_start: unixToIso((subscription as any).current_period_start),
      current_period_end: unixToIso((subscription as any).current_period_end),
      trial_start: unixToIso(subscription.trial_start),
      trial_end: unixToIso(subscription.trial_end),
      cancel_at: unixToIso(subscription.cancel_at),
      canceled_at: unixToIso(subscription.canceled_at),
      ended_at: unixToIso(subscription.ended_at),
      currency: subscription.currency,
      latest_invoice_id: latestInvoice?.id || null,
      collection_method: subscription.collection_method,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Upsert subscription
    const { error: upsertError } = await supabaseAdmin
      .from('subscriptions')
      .upsert(subscriptionData, {
        onConflict: 'stripe_subscription_id',
        ignoreDuplicates: false,
      });

    if (upsertError) {
      console.error('Error upserting subscription:', upsertError);
    }
  } catch (error) {
    console.error('Error in upsertSubscriptionFromStripe:', error);
  }
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature');
  
  if (!signature) {
    console.error('Missing Stripe signature header');
    return NextResponse.json(
      { error: 'Missing signature' },
      { status: 400 }
    );
  }

  try {
    // Read raw body for signature verification
    const rawBody = await request.text();
    
    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    // Deduplicate events using processed_stripe_events table
    const { error: dedupError } = await supabaseAdmin
      .from('processed_stripe_events')
      .insert({ event_id: event.id });

    if (dedupError && dedupError.code !== '23505') { // 23505 = unique_violation
      console.error('Error inserting event ID:', dedupError);
    }

    // Check if event was already processed
    const { data: existingEvent } = await supabaseAdmin
      .from('processed_stripe_events')
      .select('event_id')
      .eq('event_id', event.id)
      .single();

    if (existingEvent) {
      console.log('Event already processed:', event.id);
      return NextResponse.json({ received: true });
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string | null;
        const userId = session.metadata?.userId;

        if (!userId) {
          console.error('No userId in checkout session metadata:', session.id);
          break;
        }

        // Update profiles.stripe_customer_id if not set
        if (customerId) {
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({ stripe_customer_id: customerId })
            .eq('id', userId)
            .is('stripe_customer_id', null);

          if (profileError) {
            console.error('Error updating profile stripe_customer_id:', profileError);
          }
        }

        // Handle subscription if created
        if (subscriptionId) {
          try {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const latestInvoice = subscription.latest_invoice 
              ? await stripe.invoices.retrieve(subscription.latest_invoice as string)
              : undefined;

            await upsertSubscriptionFromStripe(subscription, latestInvoice, userId);
          } catch (error) {
            console.error('Error handling subscription in checkout session:', error);
          }
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      case 'customer.subscription.paused':
      case 'customer.subscription.resumed': {
        const subscription = event.data.object as Stripe.Subscription;
        
        try {
          // Get latest invoice if available
          let latestInvoice: Stripe.Invoice | undefined;
          if (subscription.latest_invoice) {
            try {
              latestInvoice = await stripe.invoices.retrieve(
                subscription.latest_invoice as string
              );
            } catch (invoiceError) {
              console.error('Error retrieving latest invoice:', invoiceError);
            }
          }

          await upsertSubscriptionFromStripe(subscription, latestInvoice);
        } catch (error) {
          console.error(`Error handling ${event.type}:`, error);
        }
        break;
      }

      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as any).subscription as string;

        if (subscriptionId) {
          try {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            
            // Update subscription with latest invoice info
            const { error: updateError } = await supabaseAdmin
              .from('subscriptions')
              .update({
                latest_invoice_id: invoice.id,
                currency: invoice.currency,
                updated_at: new Date().toISOString(),
              })
              .eq('stripe_subscription_id', subscriptionId);

            if (updateError) {
              console.error('Error updating subscription with invoice info:', updateError);
            }
          } catch (error) {
            console.error('Error handling invoice event:', error);
          }
        }
        break;
      }

      case 'checkout.session.expired':
      case 'checkout.session.async_payment_succeeded':
      case 'checkout.session.async_payment_failed': {
        // Log only - no action needed
        console.log(`Received ${event.type} event:`, event.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }
}
