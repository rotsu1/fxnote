"use client"

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
// Dialog no longer used for inline cancel; management goes via Stripe Portal

type Status = {
  route: '/subscription' | '/dashboard'
  access: 'none' | 'limited' | 'full'
  isActive: boolean
  hasHistory: boolean
  status: string | null
  reason: 'no_history' | 'inactive' | 'active'
  cancel_at?: string | null
  canceled_at?: string | null
}

export function CurrentPlan() {
  const [status, setStatus] = useState<Status | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const plan = { name: 'FXNote Pro', price: '¥490', period: '月額' }

  useEffect(() => {
    const run = async () => {
      const { data: s } = await supabase.auth.getSession()
      const token = s.session?.access_token
      if (!token) return
      try {
        const res = await fetch('/api/me/subscription-status', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
        const json: Status = await res.json()
        setStatus(json)
      } catch (e) {
        console.error('[CurrentPlan] status fetch failed', e)
      }
    }
    run()
  }, [])

  const goPortal = async () => {
    setLoading(true)
    try {
      const { data: s } = await supabase.auth.getSession()
      const token = s.session?.access_token
      if (!token) return
      const res = await fetch('/api/stripe/portal', { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
      const json = await res.json()
      if (json.url) {
        window.location.href = json.url
      } else {
        toast({ title: 'ポータル作成に失敗', description: json.error || 'エラー' })
      }
    } catch (e: any) {
      toast({ title: 'エラー', description: String(e?.message || e) })
    } finally {
      setLoading(false)
    }
  }

  // For inactive users: start Checkout to re-subscribe
  const goCheckout = async () => {
    setLoading(true)
    try {
      const { data: s } = await supabase.auth.getSession()
      const token = s.session?.access_token
      if (!token) return
      const res = await fetch('/api/stripe/checkout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
      const json = await res.json()
      if (json.url) {
        window.location.href = json.url
      } else {
        toast({ title: '開始できませんでした', description: json.error || 'エラー' })
      }
    } catch (e: any) {
      toast({ title: 'エラー', description: String(e?.message || e) })
    } finally {
      setLoading(false)
    }
  }

  const isFull = status?.access === 'full'
  // When active, management goes through Stripe Billing Portal

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-yellow-600" />
          現在のプラン
        </CardTitle>
        <CardDescription>あなたのサブスクリプションプラン</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <Crown className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{plan.name}</h3>
              <p className="text-2xl font-bold text-blue-600">
                {plan.price}<span className="text-sm font-normal text-muted-foreground">/{plan.period}</span>
              </p>
            </div>
          </div>
          {isFull ? (
            <Badge className="bg-blue-100 text-blue-800">アクティブ/トライアル</Badge>
          ) : (
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">非アクティブ</Badge>
          )}
        </div>

        <div className="flex gap-2">
          {isFull ? (
            // Active: open Billing Portal for cancel, payment methods, invoices
            <Button onClick={goPortal} disabled={loading} className="w-full">支払い管理・解約・請求書を見る</Button>
          ) : (
            // Inactive: start Checkout to re-subscribe (Billing Portal cannot create new subscriptions)
            <Button onClick={goCheckout} disabled={loading} className="w-full">再購読する</Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground">トライアル/アクティブ期間中の解約は、期間終了までご利用いただけます。</p>
      </CardContent>
    </Card>
  )
}
