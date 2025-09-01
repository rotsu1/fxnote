import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length).trim() : ''
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: u, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !u?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = u.user.id

  const { data: subs } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
  const row = subs?.[0]
  const now = new Date()
  const parse = (s?: string | null) => (s ? new Date(s) : null)
  const currentEnd = parse(row?.current_period_end)
  const trialEnd = parse(row?.trial_end)
  const endedAt = parse(row?.ended_at)
  const status = row?.status ? String(row.status) : null
  const withinCurrent = currentEnd ? currentEnd > now : false
  const withinTrial = trialEnd ? trialEnd > now : false
  const notEnded = !endedAt
  const isActive = (
    ((status === 'active' || status === 'trialing') && (withinCurrent || withinTrial) && notEnded) ||
    (status === 'canceled' && withinCurrent)
  )

  return new NextResponse(
    JSON.stringify({ user: { id: userId }, subscription: { status, isActive } }),
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
  )
}

