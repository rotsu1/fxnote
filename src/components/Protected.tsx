"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export function Protected({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) router.replace('/auth/login')
    }
    run()
  }, [router])
  return <>{children}</>
}

