type Level = 'info' | 'warn' | 'error'

function log(level: Level, msg: string, meta?: Record<string, unknown>) {
  const entry = { level, msg, ...meta, ts: new Date().toISOString() }
  // eslint-disable-next-line no-console
  console[level](JSON.stringify(entry))
}

export const logger = {
  info: (msg: string, meta?: Record<string, unknown>) => log('info', msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => log('warn', msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => log('error', msg, meta),
  // Sentry hook placeholder
  // captureException: (e: unknown) => { /* add Sentry here */ },
}

