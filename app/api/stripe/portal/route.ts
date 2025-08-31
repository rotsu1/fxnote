import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { stripe } from '@/lib/stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type PortalResponse = { url?: string; error?: string }

export async function POST(req: NextRequest): Promise<NextResponse<PortalResponse>> {
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length).trim() : ''
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin

  try {
    const { data: userRes, error: userErr } = await supabaseAdmin.auth.getUser(token)
    if (userErr || !userRes?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = userRes.user.id

    // Prefer profile link to customer id
    let customerId: string | null = null
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .maybeSingle()
    customerId = (profile?.stripe_customer_id as string | null) ?? null

    if (!customerId) {
      // Try to find via subscriptions
      const { data: subs } = await supabaseAdmin
        .from('subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
      customerId = subs?.[0]?.stripe_customer_id ?? null
    }

    if (!customerId) {
      return NextResponse.json({ error: 'No Stripe customer found' }, { status: 400 })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/dashboard/settings`,
    })
    return NextResponse.json({ url: session.url })
  } catch (e: any) {
    console.error('[portal] Unexpected error', e)
    const msg = e?.message || 'Internal error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

