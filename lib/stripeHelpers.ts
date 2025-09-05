import type Stripe from 'stripe'

export function unixToIso(u?: number | null): string | null {
  if (!u) return null
  try {
    return new Date(u * 1000).toISOString()
  } catch {
    return null
  }
}

export type SubscriptionRow = {
  user_id?: string | null
  stripe_customer_id: string
  stripe_subscription_id?: string | null
  status: string
  price_id?: string | null
  product_id?: string | null
  quantity?: number | null
  current_period_start?: string | null
  current_period_end?: string | null
  trial_start?: string | null
  trial_end?: string | null
  cancel_at?: string | null
  canceled_at?: string | null
  ended_at?: string | null
  currency?: string | null
  latest_invoice_id?: string | null
  collection_method?: string | null
  updated_at?: string | null
}

export function mapStripeToRow(
  sub: Stripe.Subscription,
  latestInvoice?: Stripe.Invoice | null,
  userId?: string | null
): SubscriptionRow {
  const item = (sub.items?.data?.[0] ?? null) as Stripe.SubscriptionItem | null
  const price = item?.price ?? null
  const productId = typeof price?.product === 'string' ? price?.product : (price?.product as Stripe.Product | null)?.id
  const quantity = item?.quantity ?? null

  return {
    user_id: userId ?? null,
    stripe_customer_id: String(sub.customer),
    stripe_subscription_id: sub.id,
    status: sub.status,
    price_id: price?.id ?? null,
    product_id: productId ?? null,
    quantity: quantity ?? null,
    current_period_start: unixToIso((sub as any).current_period_start),
    current_period_end: unixToIso((sub as any).current_period_end),
    trial_start: unixToIso((sub as any).trial_start),
    trial_end: unixToIso((sub as any).trial_end),
    cancel_at: unixToIso(typeof (sub as any).cancel_at === 'number' ? (sub as any).cancel_at : null),
    canceled_at: unixToIso(typeof (sub as any).canceled_at === 'number' ? (sub as any).canceled_at : null),
    ended_at: unixToIso(typeof (sub as any).ended_at === 'number' ? (sub as any).ended_at : null),
    currency: latestInvoice?.currency ?? (sub.currency as string | undefined) ?? null,
    latest_invoice_id: (latestInvoice?.id ?? (typeof sub.latest_invoice === 'string' ? sub.latest_invoice : undefined)) ?? null,
    collection_method: latestInvoice?.collection_method ?? (sub.collection_method as string | undefined) ?? null,
    updated_at: new Date().toISOString(),
  }
}
