"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Status = {
  access: 'none' | 'limited' | 'full'
}

export default function RequireActiveSub({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [ok, setOk] = useState<boolean | null>(null)

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
        if (json.access === 'full') setOk(true)
        else {
          setOk(false)
          router.replace('/dashboard')
        }
      } catch (e) {
        console.error('[RequireActiveSub] error', e)
        setOk(false)
        router.replace('/dashboard')
      }
    }
    run()
  }, [router])

  if (ok) return <>{children}</>
  return null
}

