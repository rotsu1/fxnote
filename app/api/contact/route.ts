import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { ContactSchema } from '@/src/lib/validation'
import { rateLimit } from '@/src/lib/rateLimit'
import { env } from '@/src/env'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function verifyCaptcha(token: string | undefined) {
  try {
    if (env.TURNSTILE_SECRET_KEY && token) {
      const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token }),
      })
      const json: any = await res.json()
      return Boolean(json.success)
    }
    if (env.HCAPTCHA_SECRET && token) {
      const res = await fetch('https://api.hcaptcha.com/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ secret: env.HCAPTCHA_SECRET, response: token }),
      })
      const json: any = await res.json()
      return Boolean(json.success)
    }
  } catch {
    return false
  }
  // No captcha configured -> treat as pass (dev)
  return true
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rl = await rateLimit(req, `/api/contact:${ip}`)
  if (!rl.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const parsed = ContactSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Bad Request' }, { status: 400 })

  const ok = await verifyCaptcha(parsed.data.token)
  if (!ok) return NextResponse.json({ error: 'Captcha failed' }, { status: 400 })

  // Prevent header injection: fixed subject/from
  const { name, email, message } = parsed.data
  const { error } = await supabaseAdmin.from('contact_messages').insert({
    name, email, message,
  })
  if (error) return NextResponse.json({ error: 'Failed to submit' }, { status: 500 })

  // Do not echo raw input back
  return NextResponse.json({ ok: true })
}

