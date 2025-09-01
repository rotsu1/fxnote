import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { rateLimit } from '@/src/lib/rateLimit'
import { CSVRowSchema } from '@/src/lib/validation'
import { sanitizeCell, validateHeaders } from '@/src/lib/csv'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const REQUIRED_HEADERS = ['symbol','type','entry_price','entry_time']
const MAX_ROWS = 2000

export async function POST(req: NextRequest) {
  // Rate limit by IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rl = await rateLimit(req, `/api/csv/import:${ip}`)
  if (!rl.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length).trim() : ''
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: u, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !u?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = u.user.id

  let text: string
  try { text = await req.text() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }
  const lines = text.split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) return NextResponse.json({ error: 'Empty CSV' }, { status: 400 })

  const headers = lines[0].split(',').map(h => h.trim())
  const hv = validateHeaders(headers, REQUIRED_HEADERS)
  if (!('ok' in hv) || !hv.ok) return NextResponse.json({ error: 'Missing headers', missing: hv.missing }, { status: 400 })

  if (lines.length - 1 > MAX_ROWS) return NextResponse.json({ error: 'Too many rows' }, { status: 400 })

  // Parse and validate rows
  const parsedRows: any[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => sanitizeCell(c.trim()))
    const obj: Record<string, string> = {}
    headers.forEach((h, idx) => { obj[h] = cols[idx] || '' })
    const parsed = CSVRowSchema.safeParse(obj)
    if (!parsed.success) continue

    // Basic transforms
    parsedRows.push({
      user_id: userId,
      symbol_name: parsed.data.symbol,
      trade_type: parsed.data.type.toLowerCase() === 'buy' ? 1 : 2,
      entry_price: Number(parsed.data.entry_price) || 0,
      exit_price: parsed.data.exit_price ? Number(parsed.data.exit_price) : null,
      lot_size: parsed.data.lot_size ? Number(parsed.data.lot_size) : null,
      pips: parsed.data.pips ? Number(parsed.data.pips) : null,
      profit_loss: parsed.data.profit_loss ? Number(parsed.data.profit_loss) : null,
      entry_time: parsed.data.entry_time,
      exit_time: parsed.data.exit_time || null,
      trade_memo: parsed.data.trade_memo || null,
    })
  }

  if (!parsedRows.length) return NextResponse.json({ error: 'No valid rows' }, { status: 400 })

  // Batch insert in chunks
  const chunkSize = 500
  for (let i = 0; i < parsedRows.length; i += chunkSize) {
    const chunk = parsedRows.slice(i, i + chunkSize)
    const { error: insErr } = await supabaseAdmin.from('trades').insert(chunk)
    if (insErr) return NextResponse.json({ error: 'Insert failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, inserted: parsedRows.length })
}

