import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { mapHiroseRow, MappedTrade, sanitizeCell } from '@/utils/parser/hiroseServer'

// You will need: npm i csv-parse
import { parse } from 'csv-parse/sync'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type ImportResult = { successCount: number; errorCount: number }

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 })
}

export async function POST(req: NextRequest): Promise<NextResponse<ImportResult | { error: string }>> {
  try {
    // Auth: Get user from Bearer token
    const auth = req.headers.get('authorization') || ''
    const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length).trim() : ''
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: userRes, error: userErr } = await supabaseAdmin.auth.getUser(token)
    if (userErr || !userRes?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = userRes.user.id

    // Parse multipart/form-data
    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) return badRequest('Missing file')

    // Security: Validate file
    const MAX_BYTES = 5 * 1024 * 1024 // 5 MB
    if (file.size > MAX_BYTES) return badRequest('File too large (max 5MB)')
    const nameOk = file.name?.toLowerCase().endsWith('.csv')
    const typeOk = (file.type || '').includes('csv')
    if (!nameOk || !typeOk) return badRequest('Invalid file type (expect .csv, text/csv)')

    // Read file text. Try as UTF-8 first; fallback is omitted for brevity
    const text = await file.text()

    // Robust header detection: find the row with expected columns (Japanese headers)
    const lines = text.split(/\r?\n/)
    const headerIdx = lines.findIndex((l, i) => i < 20 && /決済約定日時/.test(l) && /通貨ペア/.test(l))
    if (headerIdx === -1) return badRequest('Could not locate header row')
    const sliced = lines.slice(headerIdx).join('\n')

    // CSV parse to objects using header line
    const records = parse(sliced, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Array<Record<string, string>>

    if (!records.length) return badRequest('No data rows found')

    // Map to internal shape; collect symbol names
    const mapped: MappedTrade[] = []
    const symbolSet = new Set<string>()
    let errorCount = 0
    for (const r of records) {
      try {
        const m = mapHiroseRow(r)
        if (!m) continue
        mapped.push(m)
        symbolSet.add(m.symbolName)
      } catch (e) {
        console.error('[import-trades] map row error', e)
        errorCount++
      }
    }

    if (!mapped.length) return NextResponse.json({ successCount: 0, errorCount }, { status: 200 })

    // Resolve symbol IDs for this user (create missing)
    const symbolNames = Array.from(symbolSet)
    // Fetch existing
    const { data: existing, error: selErr } = await supabaseAdmin
      .from('symbols')
      .select('id, symbol')
      .eq('user_id', userId)
      .in('symbol', symbolNames)
    if (selErr) {
      console.error('[import-trades] symbols select error', selErr)
      return NextResponse.json({ error: 'Failed to resolve symbols' }, { status: 500 })
    }
    const mapByName = new Map<string, number>()
    for (const row of existing || []) {
      mapByName.set(row.symbol, row.id)
    }
    const missing = symbolNames.filter((s) => !mapByName.has(s))
    if (missing.length) {
      // Insert missing symbols for this user
      const rows = missing.map((s) => ({ user_id: userId, symbol: s }))
      const { data: ins, error: insErr } = await supabaseAdmin
        .from('symbols')
        .insert(rows)
        .select('id, symbol')
      if (insErr) {
        console.error('[import-trades] symbols insert error', insErr)
        return NextResponse.json({ error: 'Failed to create symbols' }, { status: 500 })
      }
      for (const row of ins || []) mapByName.set(row.symbol, row.id)
    }

    // Build trade rows for insert, enforcing user_id
    const trades = mapped.map((m) => ({
      user_id: userId,
      symbol: mapByName.get(m.symbolName) ?? null,
      entry_price: m.entry_price,
      exit_price: m.exit_price,
      lot_size: m.lot_size,
      trade_type: m.trade_type,
      entry_date: m.entry_date,
      entry_time: m.entry_time,
      exit_date: m.exit_date,
      exit_time: m.exit_time,
      profit_loss: m.profit_loss,
      pips: m.pips,
      trade_memo: sanitizeCell(m.trade_memo),
      hold_time: m.hold_time,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))

    // Validate symbol ids resolved
    for (const t of trades) {
      if (t.symbol === null) {
        console.error('[import-trades] missing symbol id for', t)
        errorCount++
      }
    }
    const validTrades = trades.filter((t) => t.symbol !== null)

    // Batch insert (chunk to avoid payload limits)
    let successCount = 0
    const CHUNK = 500
    for (let i = 0; i < validTrades.length; i += CHUNK) {
      const slice = validTrades.slice(i, i + CHUNK)
      const { error: insErr } = await supabaseAdmin.from('trades').insert(slice)
      if (insErr) {
        console.error('[import-trades] insert chunk failed', insErr)
        errorCount += slice.length
      } else {
        successCount += slice.length
      }
    }

    return NextResponse.json({ successCount, errorCount }, { status: 200 })
  } catch (e: any) {
    console.error('[import-trades] unexpected', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

