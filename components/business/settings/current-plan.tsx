"use client"

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Status = {
  route: '/subscription' | '/dashboard'
  access: 'none' | 'limited' | 'full'
  isActive: boolean
  hasHistory: boolean
  status: string | null
  reason: 'no_history' | 'inactive' | 'active'
}

export function CurrentPlan() {
  const [status, setStatus] = useState<Status | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
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

  const handleCancel = async () => {
    setLoading(true)
    try {
      const { data: s } = await supabase.auth.getSession()
      const token = s.session?.access_token
      if (!token) return
      const res = await fetch('/api/stripe/cancel', { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
      const json = await res.json()
      if (!res.ok) {
        toast({ title: '解約に失敗', description: json.error || 'エラー' })
      } else {
        toast({ title: '解約を受け付けました', description: '現在の期間終了までは利用できます。' })
        setOpen(false)
        // Refresh status
        const res2 = await fetch('/api/me/subscription-status', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
        const json2: Status = await res2.json()
        setStatus(json2)
      }
    } catch (e: any) {
      toast({ title: 'エラー', description: String(e?.message || e) })
    } finally {
      setLoading(false)
    }
  }

  const isFull = status?.access === 'full'

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
            <>
              <Button variant="outline" onClick={goPortal} disabled={loading}>請求の管理</Button>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" disabled={loading}>解約する</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>解約の確認</DialogTitle>
                    <DialogDescription>現在の請求期間の終了時にサブスクリプションが停止します。よろしいですか？</DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>キャンセル</Button>
                    <Button variant="destructive" onClick={handleCancel} disabled={loading}>{loading ? '処理中...' : '解約する'}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          ) : (
            <>
              <Button onClick={goPortal} disabled={loading} className="w-full">再購読・支払い管理へ</Button>
            </>
          )}
        </div>

        <p className="text-xs text-muted-foreground">トライアル中の解約も同様に、期間終了までご利用いただけます。</p>
      </CardContent>
    </Card>
  )
}
