import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { stripe } from '@/lib/stripe'
import { mapStripeToRow } from '@/lib/stripeHelpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type CancelResponse = { ok?: true; error?: string }

export async function POST(req: NextRequest): Promise<NextResponse<CancelResponse>> {
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length).trim() : ''
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data: userRes, error: userErr } = await supabaseAdmin.auth.getUser(token)
    if (userErr || !userRes?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = userRes.user.id

    const { data: subs, error: subErr } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .not('stripe_subscription_id', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(1)

    if (subErr) {
      console.error('[cancel] fetch subscription error', subErr)
      return NextResponse.json({ error: 'DB error' }, { status: 500 })
    }
    const row = subs?.[0]
    if (!row?.stripe_subscription_id) {
      return NextResponse.json({ error: 'No subscription to cancel' }, { status: 400 })
    }

    const subId = row.stripe_subscription_id as string
    const updated = await stripe.subscriptions.update(subId, { cancel_at_period_end: true })

    // Try to capture latest invoice for mapping
    let latestInvoice: import('stripe').Stripe.Invoice | null = null
    try {
      if (updated.latest_invoice && typeof updated.latest_invoice === 'string') {
        latestInvoice = await stripe.invoices.retrieve(updated.latest_invoice)
      }
    } catch (e) {
      console.warn('[cancel] invoice retrieve failed (non-fatal)', e)
    }

    const mapped = mapStripeToRow(updated, latestInvoice, userId)
    const { error: upErr } = await supabaseAdmin
      .from('subscriptions')
      .upsert(mapped, { onConflict: 'stripe_subscription_id' })
    if (upErr) {
      console.warn('[cancel] upsert failed, relying on webhook', upErr)
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[cancel] Unexpected error', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

