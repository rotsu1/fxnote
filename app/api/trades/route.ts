import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { TradeSchema } from '@/src/lib/validation'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SYMBOL_WHITELIST = ['USDJPY','EURUSD','GBPUSD','AUDUSD','USDCHF','USDCAD','NZDUSD']

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length).trim() : ''
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const parsed = TradeSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Bad Request' }, { status: 400 })
  const data = parsed.data

  if (!SYMBOL_WHITELIST.includes(data.symbol)) {
    return NextResponse.json({ error: 'Unsupported symbol' }, { status: 400 })
  }

  const { data: u, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !u?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = u.user.id

  // Map type to numeric if your DB expects it; here we keep a simple mapping.
  const trade_type = data.type === 'buy' ? 1 : 2

  const insert = {
    user_id: userId,
    symbol_name: data.symbol,
    trade_type,
    entry_price: data.entry_price,
    exit_price: data.exit_price,
    lot_size: data.lot_size,
    pips: data.pips,
    profit_loss: data.profit_loss,
    entry_time: data.entry_time,
    exit_time: data.exit_time,
    trade_memo: data.trade_memo ?? null,
  }

  const { error: insErr } = await supabaseAdmin.from('trades').insert(insert)
  if (insErr) return NextResponse.json({ error: 'DB insert failed' }, { status: 500 })

  return NextResponse.json({ ok: true })
}

