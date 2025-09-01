import { NextResponse, NextRequest } from 'next/server'
import { env } from '@/src/env'

export const config = {
  matcher: [
    // API that we want to rate limit
    '/api/contact',
    '/api/csv/:path*',
    '/api/auth/:path*',
    '/api/stripe/:path*',
    // Protect dashboard
    '/dashboard/:path*',
  ],
}

// Minimal in-memory limiter for Edge/dev fallback
const buckets = new Map<string, { count: number; ts: number }>()
const LIMIT = 5
const WINDOW_MS = 60_000

function rateLimit(key: string): boolean {
  const now = Date.now()
  const b = buckets.get(key)
  if (!b || now - b.ts > WINDOW_MS) {
    buckets.set(key, { count: 1, ts: now })
    return true
  }
  if (b.count >= LIMIT) return false
  b.count += 1
  return true
}

export async function middleware(req: NextRequest) {
  const url = new URL(req.url)
  const pathname = url.pathname
  const isApi = pathname.startsWith('/api')

  // CORS: allow only APP_URL for API routes
  if (isApi) {
    const res = NextResponse.next()
    res.headers.set('Vary', 'Origin')
    res.headers.set('Access-Control-Allow-Origin', env.APP_URL)
    res.headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    if (req.method === 'OPTIONS') return res
  }

  // Rate-limit abusive paths
  const shouldLimit =
    pathname.startsWith('/api/contact') ||
    pathname.startsWith('/api/csv/') ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/api/stripe/')

  if (shouldLimit) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.ip || 'unknown'
    const ok = rateLimit(`${pathname}:${ip}`)
    if (!ok) {
      return new NextResponse(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: { 'content-type': 'application/json' },
      })
    }
  }

  // Protect dashboard routes — basic check for Supabase session cookie presence
  if (pathname.startsWith('/dashboard')) {
    const hasToken = Boolean(req.cookies.get('sb-access-token')?.value)
    if (!hasToken) {
      const loginUrl = new URL('/auth/login', req.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

