// Lightweight rate limiter with optional Upstash (if available) and in-memory fallback.
import { NextRequest } from 'next/server'

type Result = { success: true } | { success: false; retryAfter: number }

const buckets = new Map<string, { count: number; ts: number }>()

export async function rateLimit(req: NextRequest, key: string, limit = 5, windowMs = 60_000): Promise<Result> {
  try {
    // Attempt Upstash when env present and module is available at runtime
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      // Use dynamic import with any to avoid TS type resolution when package is not installed
      const mod1: any = await import('@upstash/ratelimit')
      const mod2: any = await import('@upstash/redis')
      const redis = new mod2.Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      })
      const limiter = new mod1.Ratelimit({ redis, limiter: mod1.Ratelimit.slidingWindow(limit, `${windowMs} ms`) })
      const id = key
      const { success, reset } = await limiter.limit(id)
      if (!success) {
        const retryAfter = Math.max(0, Math.ceil((reset - Date.now()) / 1000))
        return { success: false, retryAfter }
      }
      return { success: true }
    }
  } catch {
    // fall through to memory
  }

  // In-memory fallback
  const now = Date.now()
  const b = buckets.get(key)
  if (!b || now - b.ts > windowMs) {
    buckets.set(key, { count: 1, ts: now })
    return { success: true }
  }
  if (b.count >= limit) {
    const retryAfter = Math.max(0, Math.ceil((b.ts + windowMs - now) / 1000))
    return { success: false, retryAfter }
  }
  b.count += 1
  return { success: true }
}
