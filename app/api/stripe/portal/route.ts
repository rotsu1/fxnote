import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { stripe } from '@/lib/stripe'
import { env } from '@/src/env'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length).trim() : ''
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: u, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !u?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = u.user.id

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .maybeSingle()

  const customerId = (profile?.stripe_customer_id as string | null) || null
  if (!customerId) return NextResponse.json({ error: 'No Stripe customer' }, { status: 400 })

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${env.APP_URL}/dashboard/settings`,
  })
  return NextResponse.json({ url: session.url })
}

