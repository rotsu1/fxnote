import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type CheckoutResponse = { url?: string; error?: string }

export async function POST(req: NextRequest): Promise<NextResponse<CheckoutResponse>> {
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length).trim() : ''
  if (!token) {
    console.warn('[checkout] Missing Bearer token')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL || req.headers.get('origin') || ''
  if (!process.env.STRIPE_PRICE_ID) {
    console.error('[checkout] STRIPE_PRICE_ID missing')
    return NextResponse.json({ error: 'Server config error' }, { status: 500 })
  }

  try {
    const { data: userRes, error: userErr } = await supabaseAdmin.auth.getUser(token)
    if (userErr || !userRes?.user) {
      console.error('[checkout] getUser error', userErr)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = userRes.user

    // Find or create customer
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle()
    if (profileErr) {
      console.error('[checkout] profile fetch error', profileErr)
      return NextResponse.json({ error: 'Profile fetch error' }, { status: 500 })
    }

    let customerId = profile?.stripe_customer_id as string | null
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: { userId: user.id },
      })
      customerId = customer.id
      console.log('[checkout] Created Stripe customer', customerId)

      const { error: updateErr } = await supabaseAdmin
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
        .is('stripe_customer_id', null)

      if (updateErr) {
        console.error('[checkout] Failed to persist customer id (non-fatal)', updateErr)
      }
    }

    // Determine trial eligibility: no prior subscriptions for this user or customer
    const { data: priorByUser, error: priorErr1 } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
    if (priorErr1) {
      console.error('[checkout] prior check error (user)', priorErr1)
      return NextResponse.json({ error: 'DB error' }, { status: 500 })
    }

    const { data: priorByCustomer, error: priorErr2 } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .limit(1)
    if (priorErr2) {
      console.error('[checkout] prior check error (customer)', priorErr2)
      return NextResponse.json({ error: 'DB error' }, { status: 500 })
    }

    const isNew = (priorByUser?.length ?? 0) === 0 && (priorByCustomer?.length ?? 0) === 0
    console.log('[checkout] isNew trial eligible?', isNew)

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId!,
      metadata: { userId: user.id },
      line_items: [
        { price: process.env.STRIPE_PRICE_ID!, quantity: 1 },
      ],
      subscription_data: {
        trial_period_days: isNew ? 30 : undefined,
        metadata: { userId: user.id },
      },
      allow_promotion_codes: false,
      success_url: `${origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/subscription`,
    })

    console.log('[checkout] Created session', session.id)
    return NextResponse.json({ url: session.url || undefined })
  } catch (e: any) {
    const msg = e?.message || String(e)
    console.error('[checkout] Unexpected error', msg, e)
    // Surface a slightly more descriptive error for debugging, without leaking secrets
    const isStripeErr = e && typeof e === 'object' && 'type' in e && 'raw' in e
    return NextResponse.json({ error: isStripeErr ? 'Stripe error' : 'Internal error' }, { status: 500 })
  }
}
