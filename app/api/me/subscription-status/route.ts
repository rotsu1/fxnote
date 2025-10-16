import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Access = 'none' | 'limited' | 'full'
type Route = '/subscription' | '/dashboard/overview'
type Reason = 'no_history' | 'inactive' | 'active' | 'staff'

export type SubscriptionStatusResponse = {
  route: Route
  access: Access
  isActive: boolean
  hasHistory: boolean
  status: string | null
  reason: Reason
  cancel_at?: string | null
  canceled_at?: string | null
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

    // Staff bypass: staff has full access regardless of subscription
    try {
      const { data: profile, error: profileErr } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle()
      if (!profileErr && profile?.role === 'staff') {
        const res: SubscriptionStatusResponse = {
          route: '/dashboard/overview',
          access: 'full',
          isActive: true,
          hasHistory: true,
          status: 'staff',
          reason: 'staff',
          cancel_at: null,
          canceled_at: null,
        }
        return NextResponse.json(res)
      }
    } catch {}

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
        route: '/dashboard/overview',
        access: 'limited',
        isActive: false,
        hasHistory: false,
        status: null,
        reason: 'no_history',
        cancel_at: null,
        canceled_at: null,
      }
      console.log('[me/subscription-status] no history (freemium) ->', res)
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
        route: '/dashboard/overview',
        access: 'full',
        isActive: true,
        hasHistory: true,
        status,
        reason: 'active',
        cancel_at: row.cancel_at ?? null,
        canceled_at: row.canceled_at ?? null,
      }
      console.log('[me/subscription-status] active ->', res)
      return NextResponse.json(res)
    }

    res = {
      route: '/dashboard/overview',
      access: 'limited',
      isActive: false,
      hasHistory: true,
      status,
      reason: 'inactive',
      cancel_at: row.cancel_at ?? null,
      canceled_at: row.canceled_at ?? null,
    }
    console.log('[me/subscription-status] inactive ->', res)
    return NextResponse.json(res)
  } catch (e) {
    console.error('[me/subscription-status] Unexpected error', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
