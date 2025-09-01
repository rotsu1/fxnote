import { NextRequest, NextResponse } from 'next/server'
import { CSVRowSchema } from '@/src/lib/validation'
import { sanitizeCell, validateHeaders } from '@/src/lib/csv'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const REQUIRED_HEADERS = ['symbol','type','entry_price','entry_time']
const MAX_BYTES = 2 * 1024 * 1024 // 2MB
const MAX_ROWS = 200

export async function POST(req: NextRequest) {
  const contentType = req.headers.get('content-type') || ''
  if (!contentType.includes('multipart/form-data')) {
    return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 })
  }

  const form = await req.formData()
  const file = form.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'File too large' }, { status: 400 })

  const text = await file.text()
  const lines = text.split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) return NextResponse.json({ error: 'Empty CSV' }, { status: 400 })

  const headers = lines[0].split(',').map(h => h.trim())
  const hv = validateHeaders(headers, REQUIRED_HEADERS)
  if (!('ok' in hv) || !hv.ok) {
    return NextResponse.json({ error: 'Missing headers', missing: hv.missing }, { status: 400 })
  }

  const rows = [] as any[]
  for (let i = 1; i < Math.min(lines.length, MAX_ROWS + 1); i++) {
    const cols = lines[i].split(',').map(c => sanitizeCell(c.trim()))
    const obj: Record<string, string> = {}
    headers.forEach((h, idx) => { obj[h] = cols[idx] || '' })
    const parsed = CSVRowSchema.safeParse(obj)
    if (!parsed.success) continue
    rows.push(parsed.data)
  }

  return NextResponse.json({ headers, rows })
}

