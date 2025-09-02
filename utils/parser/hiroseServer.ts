import 'server-only'

// Production-grade helpers for server-side CSV -> DB mapping

export type HiroseCsvRow = Record<string, string>

export type MappedTrade = {
  symbolName: string
  entry_price: number
  exit_price: number
  lot_size: number
  trade_type: number // 0 = buy, 1 = sell
  entry_date: string // UTC YYYY-MM-DD
  entry_time: string // UTC HH:MM:SS
  exit_date: string  // UTC YYYY-MM-DD
  exit_time: string  // UTC HH:MM:SS
  profit_loss: number
  pips: number
  trade_memo: string
  hold_time: number // seconds
}

// Sanitize to prevent CSV formula injection
export function sanitizeCell(value: string | null | undefined): string {
  const v = String(value ?? '').trim()
  if (!v) return ''
  const dangerous = ['=', '+', '-', '@']
  if (dangerous.includes(v[0])) return "'" + v
  return v
}

export function parseJapaneseDateTime(dateTimeStr: string): string {
  const raw = sanitizeCell(dateTimeStr)
  const parts = raw.split(' ')
  if (parts.length < 2) throw new Error(`Invalid date format: ${raw}`)
  const datePart = parts[0]
  const timePart = parts[1]
  const [year, month, day] = datePart.split('/').map(Number)
  let [hours, minutes, seconds = '00'] = timePart.split(':')
  if (parts.length > 2) {
    const ampm = parts[2]
    const hour = parseInt(hours)
    if (ampm === '午後' && hour !== 12) hours = String(hour + 12)
    else if (ampm === '午前' && hour === 12) hours = '00'
  }
  const jst = Date.UTC(year, (month || 1) - 1, day || 1, parseInt(hours || '0'), parseInt(minutes || '0'), parseInt(String(seconds) || '0'))
  const utcMs = jst - 9 * 60 * 60 * 1000
  return new Date(utcMs).toISOString()
}

export function isoToUTCDateAndTime(iso: string): { date: string; time: string } {
  const d = new Date(iso)
  if (isNaN(d.getTime())) throw new Error(`Invalid ISO: ${iso}`)
  const yyyy = String(d.getUTCFullYear())
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  const HH = String(d.getUTCHours()).padStart(2, '0')
  const MM = String(d.getUTCMinutes()).padStart(2, '0')
  const SS = String(d.getUTCSeconds()).padStart(2, '0')
  return { date: `${yyyy}-${mm}-${dd}`, time: `${HH}:${MM}:${SS}` }
}

export function convertLotSize(lotSizeStr: string): number {
  const n = Number.parseFloat(sanitizeCell(lotSizeStr))
  if (!isFinite(n)) throw new Error(`Invalid lot size: ${lotSizeStr}`)
  // Hirose: 1 lot = 1,000; standardize to 10,000
  return n / 10
}

export function convertTradeType(buySellStr: string): number {
  const s = sanitizeCell(buySellStr)
  // 売 (sell) in their column means opening sell? Keep consistent with previous util (0 buy, 1 sell)
  return s === '売' ? 0 : 1
}

export function calculateHoldTime(entryIso: string, exitIso: string): number {
  const a = new Date(entryIso).getTime()
  const b = new Date(exitIso).getTime()
  if (!isFinite(a) || !isFinite(b)) throw new Error('Invalid hold time timestamps')
  return Math.max(0, Math.floor((b - a) / 1000))
}

// Map a parsed CSV row to our DB trade shape (without symbol id resolution)
export function mapHiroseRow(row: HiroseCsvRow): MappedTrade | null {
  const currency = sanitizeCell(row['通貨ペア'])
  const entryStr = sanitizeCell(row['新規約定日時'])
  const exitStr = sanitizeCell(row['決済約定日時'])
  const pnlStr = sanitizeCell(row['売買損益'])
  const entryPriceStr = sanitizeCell(row['新規約定値'])
  const exitPriceStr = sanitizeCell(row['決済約定値'])
  const pipsStr = sanitizeCell(row['pip損益'])
  const lotStr = sanitizeCell(row['Lot数'])
  const buySell = sanitizeCell(row['売買'])

  if (!currency || !entryStr || !exitStr) return null

  const entryIso = parseJapaneseDateTime(entryStr)
  const exitIso = parseJapaneseDateTime(exitStr)
  const { date: entry_date, time: entry_time } = isoToUTCDateAndTime(entryIso)
  const { date: exit_date, time: exit_time } = isoToUTCDateAndTime(exitIso)
  const lot_size = convertLotSize(lotStr)
  const trade_type = convertTradeType(buySell)
  const entry_price = Number.parseFloat(entryPriceStr)
  const exit_price = Number.parseFloat(exitPriceStr)
  const profit_loss = Number.parseFloat(pnlStr)
  const pips = (Number.parseFloat(pipsStr) || 0) / 10
  const hold_time = calculateHoldTime(entryIso, exitIso)

  const numericChecks = [entry_price, exit_price, profit_loss, pips, lot_size]
  if (numericChecks.some((n) => !isFinite(n))) throw new Error('Invalid numeric field')

  return {
    symbolName: currency,
    entry_price,
    exit_price,
    lot_size,
    trade_type,
    entry_date,
    entry_time,
    exit_date,
    exit_time,
    profit_loss,
    pips,
    trade_memo: '',
    hold_time,
  }
}

