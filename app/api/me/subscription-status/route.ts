import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Access = 'none' | 'limited' | 'full'
type Route = '/subscription' | '/dashboard'
type Reason = 'no_history' | 'inactive' | 'active'

export type SubscriptionStatusResponse = {
  route: Route
  access: Access
  isActive: boolean
  hasHistory: boolean
  status: string | null
  reason: Reason
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length).trim() : ''

  if (!token) {
    console.warn('[me/subscription-status] Missing Bearer token')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: userRes, error: userErr } = await supabaseAdmin.auth.getUser(token)
    if (userErr || !userRes?.user) {
      console.error('[me/subscription-status] getUser error', userErr)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = userRes.user.id

    const { data: subs, error: subErr } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)

    if (subErr) {
      console.error('[me/subscription-status] DB error', subErr)
      return NextResponse.json({ error: 'DB error' }, { status: 500 })
    }

    const row = subs?.[0]
    if (!row) {
      const res: SubscriptionStatusResponse = {
        route: '/subscription',
        access: 'none',
        isActive: false,
        hasHistory: false,
        status: null,
        reason: 'no_history',
      }
      console.log('[me/subscription-status] no history ->', res)
      return NextResponse.json(res)
    }

    const now = new Date()
    const parse = (s?: string | null) => (s ? new Date(s) : null)
    const currentEnd = parse(row.current_period_end)
    const trialEnd = parse(row.trial_end)
    const endedAt = parse(row.ended_at)
    const status = String(row.status)

    const withinCurrent = currentEnd ? currentEnd > now : false
    const withinTrial = trialEnd ? trialEnd > now : false
    const notEnded = !endedAt

    // Active if:
    // - status active OR trialing AND (current_period_end in future OR trial_end in future) AND not ended
    // - status canceled BUT current_period_end in the future
    const isActive = (
      ((status === 'active' || status === 'trialing') && (withinCurrent || withinTrial) && notEnded) ||
      (status === 'canceled' && withinCurrent)
    )

    let res: SubscriptionStatusResponse
    if (isActive) {
      res = {
        route: '/dashboard',
        access: 'full',
        isActive: true,
        hasHistory: true,
        status,
        reason: 'active',
      }
      console.log('[me/subscription-status] active ->', res)
      return NextResponse.json(res)
    }

    res = {
      route: '/dashboard',
      access: 'limited',
      isActive: false,
      hasHistory: true,
      status,
      reason: 'inactive',
    }
    console.log('[me/subscription-status] inactive ->', res)
    return NextResponse.json(res)
  } catch (e) {
    console.error('[me/subscription-status] Unexpected error', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
