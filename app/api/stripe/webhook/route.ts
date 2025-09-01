import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { mapStripeToRow } from '@/lib/stripeHelpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature')
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!sig || !whSecret) {
    console.error('[webhook] Missing signature or secret')
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 })
  }

  const raw = await req.text()
  let event: import('stripe').Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(raw, sig, whSecret)
  } catch (err) {
    console.error('[webhook] Signature verification failed', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Dedup: insert claim
  try {
    const { error: insErr } = await supabaseAdmin
      .from('processed_stripe_events')
      .insert({ event_id: event.id })

    if (insErr) {
      // unique_violation code 23505 in Postgres; Supabase returns details in code
      if ((insErr as any).code === '23505') {
        console.log('[webhook] Duplicate event, already processed', event.id)
        return NextResponse.json({ received: true })
      }
      console.error('[webhook] Failed to claim event', event.id, insErr)
      return NextResponse.json({ error: 'Event claim failed' }, { status: 500 })
    }
  } catch (e) {
    console.error('[webhook] Unexpected claim insert error', e)
    return NextResponse.json({ error: 'Event claim error' }, { status: 500 })
  }

  const releaseClaimOnError = async () => {
    try {
      const { error: delErr } = await supabaseAdmin
        .from('processed_stripe_events')
        .delete()
        .eq('event_id', event.id)
      if (delErr) {
        console.error('[webhook] Failed to release claim', event.id, delErr)
      } else {
        console.log('[webhook] Released claim for retry', event.id)
      }
    } catch (e) {
      console.error('[webhook] Unexpected release error', e)
    }
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any
        const customerId = String(session.customer)
        const userId = session.metadata?.userId as string | undefined

        // Ensure profile has customer id if null
        if (userId) {
          const { error: updErr } = await supabaseAdmin
            .from('profiles')
            .update({ stripe_customer_id: customerId })
            .eq('id', userId)
            .is('stripe_customer_id', null)
          if (updErr) {
            console.warn('[webhook] checkout.completed profile update skipped/failed', updErr)
          }
        }

        if (session.subscription) {
          const subId = String(session.subscription)
          const sub = await stripe.subscriptions.retrieve(subId)
          let latestInvoice: import('stripe').Stripe.Invoice | null = null
          if (sub.latest_invoice && typeof sub.latest_invoice === 'string') {
            try {
              latestInvoice = await stripe.invoices.retrieve(sub.latest_invoice)
            } catch (e) {
              console.warn('[webhook] invoice retrieve failed (non-fatal)', e)
            }
          } else if (sub.latest_invoice && typeof sub.latest_invoice !== 'string') {
            latestInvoice = sub.latest_invoice as any
          }

          const row = mapStripeToRow(sub, latestInvoice, userId)
          const { error: upErr } = await supabaseAdmin
            .from('subscriptions')
            .upsert(row, { onConflict: 'stripe_subscription_id' })
          if (upErr) {
            console.error('[webhook] upsert failed (checkout.completed)', upErr)
            throw upErr
          }
        }

        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as import('stripe').Stripe.Subscription

        let latestInvoice: import('stripe').Stripe.Invoice | null = null
        try {
          if (sub.latest_invoice && typeof sub.latest_invoice === 'string') {
            latestInvoice = await stripe.invoices.retrieve(sub.latest_invoice)
          }
        } catch (e) {
          console.warn('[webhook] invoice retrieve failed (non-fatal)', e)
        }

        // Try to get user from metadata when available (not always present on updates)
        let userId = (sub.metadata?.userId as string | undefined) || null
        if (!userId) {
          // Try to preserve existing mapping
          const { data: existing } = await supabaseAdmin
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', sub.id)
            .maybeSingle()
          userId = existing?.user_id ?? null
        }
        if (!userId) {
          // Map via profiles by customer id
          const customerId = String(sub.customer)
          const { data: prof } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .maybeSingle()
          userId = prof?.id ?? null
        }
        const row = mapStripeToRow(sub, latestInvoice, userId)

        const { error: upErr } = await supabaseAdmin
          .from('subscriptions')
          .upsert(row, { onConflict: 'stripe_subscription_id' })
        if (upErr) {
          console.error('[webhook] upsert failed (subscription.*)', upErr)
          throw upErr
        }
        break
      }
      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed': {
        const invoice = event.data.object as import('stripe').Stripe.Invoice
        const invAny = event.data.object as any
        let subId: string | null = null
        if (typeof invAny.subscription === 'string') {
          subId = invAny.subscription
        } else if (invAny.subscription && typeof invAny.subscription === 'object') {
          subId = (invAny.subscription as any).id ?? null
        }
        if (subId) {
          // Prefer full upsert using the current subscription snapshot to keep status in sync
          try {
            const sub = await stripe.subscriptions.retrieve(subId)

            // Try to capture a fresh invoice reference
            let latestInvoice: import('stripe').Stripe.Invoice | null = null
            try {
              if (sub.latest_invoice && typeof sub.latest_invoice === 'string') {
                latestInvoice = await stripe.invoices.retrieve(sub.latest_invoice)
              } else if (sub.latest_invoice && typeof sub.latest_invoice !== 'string') {
                latestInvoice = sub.latest_invoice as any
              }
            } catch (e) {
              // Non-fatal; fall back to the event's invoice
              latestInvoice = invoice
            }

            // Resolve user via profiles by customer id when possible
            let userId: string | null = null
            let customerId: string | null = null
            if (typeof invoice.customer === 'string') customerId = invoice.customer
            else if (invoice.customer && typeof invoice.customer === 'object') customerId = (invoice.customer as any).id ?? null
            else if (sub.customer) customerId = String(sub.customer)
            if (customerId) {
              const { data: prof } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .eq('stripe_customer_id', customerId)
                .maybeSingle()
              userId = prof?.id ?? null
            }

            const row = mapStripeToRow(sub, latestInvoice ?? invoice, userId)
            const { error: upErr } = await supabaseAdmin
              .from('subscriptions')
              .upsert(row, { onConflict: 'stripe_subscription_id' })
            if (upErr) {
              console.error('[webhook] invoice upsert failed', upErr)
              // Fallback to minimal update to not lose invoice linkage
              const { error: updErr } = await supabaseAdmin
                .from('subscriptions')
                .update({ latest_invoice_id: invoice.id, currency: invoice.currency ?? null, updated_at: new Date().toISOString() })
                .eq('stripe_subscription_id', subId)
              if (updErr) throw updErr
            }
          } catch (e) {
            console.warn('[webhook] invoice handler fallback (no sub fetch)', e)
            const { error: upErr } = await supabaseAdmin
              .from('subscriptions')
              .update({ latest_invoice_id: invoice.id, currency: invoice.currency ?? null, updated_at: new Date().toISOString() })
              .eq('stripe_subscription_id', subId)
            if (upErr) {
              console.error('[webhook] invoice update failed', upErr)
              throw upErr
            }
          }
        }
        break
      }
      default: {
        console.log('[webhook] Unhandled event', event.type)
      }
    }

    return NextResponse.json({ received: true })
  } catch (e) {
    console.error('[webhook] Processing error, releasing claim', e)
    await releaseClaimOnError()
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 })
  }
}
