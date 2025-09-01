"use client"

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Status = {
  route: '/subscription' | '/dashboard/overview'
  access: 'none' | 'limited' | 'full'
  isActive: boolean
  hasHistory: boolean
  status: string | null
  reason: 'no_history' | 'inactive' | 'active'
}

export default function SubscriptionSuccessPage() {
  const router = useRouter()
  const [state, setState] = useState<{ tries: number; message: string }>({ tries: 0, message: '最終処理中です...' })
  const timer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    let cancelled = false
    const poll = async () => {
      try {
        const { data: s } = await supabase.auth.getSession()
        const token = s.session?.access_token
        if (!token) {
          router.replace('/auth/login')
          return
        }
        const res = await fetch('/api/me/subscription-status', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        })
        const json: Status = await res.json()
        // Redirect only when the server says user has full access
        if (json.access === 'full') {
          router.replace('/dashboard/overview')
          return
        }
      } catch (e) {
        // Ignore and keep polling
        console.warn('[success] polling error', e)
      }

      if (!cancelled) {
        setState((prev) => ({ tries: prev.tries + 1, message: `最終処理中です... (${prev.tries + 1})` }))
        timer.current = setTimeout(poll, 1000)
      }
    }
    poll()
    return () => {
      cancelled = true
      if (timer.current) clearTimeout(timer.current)
    }
  }, [router])

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full border rounded-lg p-6 space-y-4 text-center">
        <h1 className="text-2xl font-semibold">ありがとうございます！</h1>
        <p className="text-sm text-muted-foreground">{state.message}</p>
        <p className="text-xs text-muted-foreground">数秒〜十数秒かかる場合があります。そのままお待ちください。</p>
      </div>
    </div>
  )
}
