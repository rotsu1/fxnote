import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { CheckoutSchema } from '@/src/lib/validation'
import { env } from '@/src/env'
import { logger } from '@/src/lib/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length).trim() : ''
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = CheckoutSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  try {
    const { data: userRes, error: userErr } = await supabaseAdmin.auth.getUser(token)
    if (userErr || !userRes?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = userRes.user

    // Fetch or create Stripe customer id
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle()
    if (profileErr) return NextResponse.json({ error: 'Profile fetch error' }, { status: 500 })

    let customerId = profile?.stripe_customer_id as string | null
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email || undefined, metadata: { userId: user.id } })
      customerId = customer.id
      await supabaseAdmin.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id).is('stripe_customer_id', null)
    }

    const origin = env.APP_URL
    const price = env.STRIPE_PRICE_ID_BASIC
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId!,
      metadata: { userId: user.id },
      line_items: [{ price, quantity: 1 }],
      subscription_data: { metadata: { userId: user.id } },
      success_url: `${origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/subscription`,
    })

    return NextResponse.json({ url: session.url || undefined })
  } catch (e) {
    logger.error('checkout_error', { error: (e as Error).message })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

