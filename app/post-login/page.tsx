"use client"

import { useEffect, useState } from 'react'
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

export default function PostLogin() {
  const router = useRouter()
  const [message, setMessage] = useState('判定中...')

  useEffect(() => {
    const run = async () => {
      const { data: sessionRes } = await supabase.auth.getSession()
      const token = sessionRes.session?.access_token
      if (!token) {
        router.replace('/auth/login')
        return
      }
      try {
        const res = await fetch('/api/me/subscription-status', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const json: Status = await res.json()
        sessionStorage.setItem('fxnote.access', json.access)
        sessionStorage.setItem('fxnote.subReason', json.reason)
        setMessage(`リダイレクト中 (${json.route})...`)
        router.replace(json.route)
      } catch (e) {
        console.error('[post-login] failed', e)
        router.replace('/dashboard/overview')
      }
    }
    run()
  }, [router])

  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

