import { supabaseAdmin } from './supabaseAdmin';
import { unixToIso } from '@/lib/subscription';
import { Stripe } from 'stripe';

export async function upsertSubscriptionFromStripe(
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
        cancel_at_period_end: subscription.cancel_at_period_end || false,
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
