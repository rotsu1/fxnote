import { supabaseAdmin } from './supabaseAdmin';
import type { Stripe } from 'stripe';

export interface SubscriptionRow {
  id?: string;
  user_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Maps Stripe subscription data to our database row format
 */
export function mapStripeSubToRow(
  sub: Stripe.Subscription,
  latestInvoice?: Stripe.Invoice
): Omit<SubscriptionRow, 'id' | 'created_at' | 'updated_at'> {
  // Access properties safely with type assertion
  const subscription = sub as any;
  
  return {
    user_id: sub.metadata.user_id || '',
    stripe_subscription_id: sub.id,
    stripe_customer_id: sub.customer as string,
    status: sub.status,
    current_period_start:
      unixToIso(subscription.current_period_start) || new Date((sub.created ?? Math.floor(Date.now()/1000)) * 1000).toISOString(),
    current_period_end:
      unixToIso(subscription.current_period_end) || new Date((sub.created ?? Math.floor(Date.now()/1000)) * 1000).toISOString(),
    cancel_at_period_end: sub.cancel_at_period_end || false,
  };
}

/**
 * Checks if a subscription status is considered active
 */
export function isActiveStatus(status: string): status is 'active' | 'trialing' {
  return status === 'active' || status === 'trialing';
}

/**
 * Gets the latest subscription for a user
 */
export async function getLatestSubscriptionForUser(userId: string): Promise<SubscriptionRow | null> {
  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('Error fetching latest subscription:', error);
    return null;
  }

  return data;
}

/**
 * Gets the subscription state for a user
 */
export async function getUserSubscriptionState(userId: string): Promise<'never_subscribed' | 'active' | 'inactive'> {
  const subscription = await getLatestSubscriptionForUser(userId);
  
  if (!subscription) {
    return 'never_subscribed';
  }

  if (isActiveStatus(subscription.status)) {
    return 'active';
  }

  return 'inactive';
}

/**
 * Converts UNIX timestamp to ISO string
 */
export function unixToIso(sec?: number | null): string | null {
  if (sec === null || sec === undefined) return null;
  return new Date(sec * 1000).toISOString();
}
