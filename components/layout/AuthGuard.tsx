"use client";

import { useAuth } from "@/hooks/useAuth";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type SubStatus = {
  route: '/subscription' | '/dashboard/overview'
  access: 'none' | 'limited' | 'full'
  reason: 'no_history' | 'inactive' | 'active'
}

export default function AuthGuard({ children }: { children: ReactNode }) {
  const user = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      // After we know if user exists
      if (user === undefined) return
      if (user === null) {
        setIsLoading(false)
        router.push("/auth/login");
        return
      }

      try {
        const { data: s } = await supabase.auth.getSession()
        const token = s.session?.access_token
        if (token) {
          const res = await fetch('/api/me/subscription-status', {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
          })
          const json: SubStatus = await res.json()
          // Persist for overlay and other client checks
          sessionStorage.setItem('fxnote.access', json.access)
          sessionStorage.setItem('fxnote.subReason', json.reason)

          // If user has no subscription history and is trying to access dashboard, send to subscription page
          if (json.reason === 'no_history' && pathname?.startsWith('/dashboard')) {
            router.replace('/subscription')
            setIsLoading(false)
            return
          }
        }
      } catch (e) {
        // Non-fatal, proceed with limited UI; login is already confirmed
        console.warn('[AuthGuard] subscription check failed', e)
      }

      setIsLoading(false)
    }

    check()
  }, [user, router, pathname])

  // Avoid rendering a blocking loading UI; render nothing during brief checks
  if (isLoading) return null;

  if (user) {
    return <>{children}</>;
  }

  return null;
}
