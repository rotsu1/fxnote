"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabaseClient'

type Props = {
  open: boolean
  onClose: () => void
  featureLabel?: string // e.g., "CSVインポート", "メモ"
}

async function createCheckout(): Promise<string | null> {
  const { data: s } = await supabase.auth.getSession()
  const token = s.session?.access_token
  if (!token) return null
  const res = await fetch('/api/stripe/checkout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
  const json = await res.json()
  return json?.url ?? null
}

export function FreemiumDialog({ open, onClose, featureLabel = 'この機能' }: Props) {
  const [loading, setLoading] = useState(false)

  const goCheckout = async () => {
    setLoading(true)
    try {
      const url = await createCheckout()
      if (url) window.location.href = url
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{featureLabel}は有料機能です</DialogTitle>
          <DialogDescription>
            この機能はご購読者さま限定です。ご利用にはプランのご購読が必要です。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            サブスクに加入すると、{featureLabel}がご利用いただけます。
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>あとで</Button>
            <Button onClick={goCheckout} disabled={loading}>{loading ? 'リダイレクト中...' : 'プランに加入する'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function FreemiumCard({ onClose, featureLabel = 'この機能' }: { onClose: () => void; featureLabel?: string }) {
  const [loading, setLoading] = useState(false)

  const goCheckout = async () => {
    setLoading(true)
    try {
      const url = await createCheckout()
      if (url) window.location.href = url
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg p-6 max-w-md w-full text-center space-y-3 mx-4 shadow-md">
      <p className="font-semibold">{featureLabel}は有料機能です</p>
      <p className="text-sm text-muted-foreground">この機能はご購読者さま限定です。ご利用にはプランのご購読が必要です。</p>
      <div className="flex gap-2 justify-center pt-2">
        <Button variant="outline" onClick={onClose}>あとで</Button>
        <Button onClick={goCheckout} disabled={loading}>{loading ? 'リダイレクト中...' : 'プランに加入する'}</Button>
      </div>
    </div>
  )
}

