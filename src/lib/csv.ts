// CSV safety helpers

const DANGEROUS_PREFIX = /^[=+\-@]/

export function sanitizeCell(value: string): string {
  if (typeof value !== 'string') return value as any
  return DANGEROUS_PREFIX.test(value) ? `'${value}` : value
}

export function validateHeaders(actual: string[], required: string[]): { ok: true } | { ok: false; missing: string[] } {
  const lower = new Set(actual.map(h => h.trim().toLowerCase()))
  const missing = required.filter(r => !lower.has(r.toLowerCase()))
  if (missing.length) return { ok: false, missing }
  return { ok: true }
}

