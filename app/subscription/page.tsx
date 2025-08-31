"use client"

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCheckout = async () => {
    setError(null)
    setLoading(true)
    try {
      const { data: sessionRes } = await supabase.auth.getSession()
      const token = sessionRes.session?.access_token
      if (!token) {
        setError('ログインが必要です')
        setLoading(false)
        return
      }
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const json = await res.json()
      if (!res.ok) {
        console.error('[subscription] checkout error', json)
        setError(json.error || 'エラーが発生しました')
        setLoading(false)
        return
      }
      if (json.url) {
        window.location.href = json.url
      } else {
        setError('Checkout URL が取得できませんでした')
        setLoading(false)
      }
    } catch (e) {
      console.error('[subscription] Unexpected', e)
      setError('予期しないエラー')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full border rounded-lg p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">FXNote プラン</h1>
          <p className="text-sm text-muted-foreground">月額 ¥490 ・初月無料</p>
        </div>
        <div className="text-4xl font-bold">¥490 <span className="text-base font-normal text-muted-foreground">/ 月</span></div>
        <ul className="list-disc pl-5 text-sm space-y-1">
          <li>初月無料トライアル</li>
          <li>全機能へのフルアクセス</li>
        </ul>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <Button onClick={handleCheckout} disabled={loading} className="w-full">
          {loading ? 'リダイレクト中...' : '購読する'}
        </Button>
      </div>
    </div>
  )
}
