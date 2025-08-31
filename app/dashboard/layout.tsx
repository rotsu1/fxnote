"use client"

import AuthGuard from "@/components/layout/AuthGuard";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [access, setAccess] = useState<string | null>(null)

  useEffect(() => {
    try {
      const a = sessionStorage.getItem('fxnote.access')
      setAccess(a)
    } catch {}
  }, [])

  const showOverlay = access === 'limited'

  return (
    <AuthGuard>
      <div className="relative flex h-screen flex-col md:flex-row md:overflow-hidden">
        <div className="flex-grow md:overflow-y-auto">
          {children}
        </div>

        {showOverlay && (
          <div className="pointer-events-auto fixed inset-0 md:left-[16rem] bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-md w-full text-center space-y-3 mx-4">
              <p className="font-semibold">プランが非アクティブです</p>
              <p className="text-sm text-muted-foreground">設定から再購読するか、プランページへ移動してください。</p>
              <div className="flex gap-2 justify-center">
                <Button asChild variant="outline"><a href="/dashboard/settings">設定へ</a></Button>
                <Button asChild><a href="/subscription">プランに移動</a></Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  )
}
