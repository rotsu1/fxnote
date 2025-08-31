"use client"

import {
  CreditCard,
  User,
} from "lucide-react"

import { Button } from "@/components/ui/button" 
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger, AppSidebar } from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { EmailManagement } from "@/components/business/settings/email-management"
import { PasswordManagement } from "@/components/business/settings/password-management"
import { CurrentPlan } from "@/components/business/settings/current-plan"
import { useEffect, useState } from "react";

export default function Settings() {
  const { toast } = useToast();
  const router = useRouter();
  const [sub, setSub] = useState<{
    access: 'none' | 'limited' | 'full'
    reason: 'no_history' | 'inactive' | 'active'
    status: string | null
  } | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const run = async () => {
      const { data: s } = await supabase.auth.getSession()
      const token = s.session?.access_token
      if (!token) return
      try {
        const res = await fetch('/api/me/subscription-status', { headers: { Authorization: `Bearer ${token}` }})
        const json = await res.json()
        setSub(json)
      } catch (e) {
        console.error('[settings] status error', e)
      }
    }
    run()
  }, [])

  const handleResubscribe = async () => {
    setLoading(true)
    try {
      const { data: s } = await supabase.auth.getSession()
      const token = s.session?.access_token
      if (!token) return
      const res = await fetch('/api/stripe/checkout', { method: 'POST', headers: { Authorization: `Bearer ${token}` }})
      const json = await res.json()
      if (json.url) {
        window.location.href = json.url
      } else {
        toast({ title: '開始できませんでした', description: json.error || 'エラー' })
      }
    } catch (e: any) {
      console.error('[settings] resubscribe error', e)
      toast({ title: 'エラー', description: String(e?.message || e) })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ title: "ログアウト失敗", description: error.message });
    } else {
      toast({ title: "ログアウトしました" });
      router.push("/auth/login");
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 md:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">設定</h1>
          </div>
        </header>

        <main className="flex-1 px-4 md:px-6 pt-6">
          <div className="max-w-4xl mx-auto">
            <Tabs defaultValue="account" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="account" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  アカウント & プロフィール
                </TabsTrigger>
                <TabsTrigger value="billing" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  請求 & サブスクリプション
                </TabsTrigger>
              </TabsList>

              <TabsContent value="account" className="space-y-6">
                <EmailManagement />
                <PasswordManagement />
              </TabsContent>

              <TabsContent value="billing" className="space-y-6">
                <div className="space-y-4">
                  <CurrentPlan />
                  <div className="border rounded-lg p-4">
                    <p className="font-medium mb-2">サブスクリプション状態</p>
                    <div className="text-sm text-muted-foreground mb-4">現在の状態に基づき操作できます。</div>
                    {sub ? (
                      <div className="flex flex-col gap-2">
                        <div className="text-sm">access: <span className="font-mono">{sub.access}</span> / status: <span className="font-mono">{sub.status ?? 'null'}</span></div>
                        {sub.access !== 'full' ? (
                          <Button onClick={handleResubscribe} disabled={loading}>
                            {loading ? 'リダイレクト中...' : '再購読する'}
                          </Button>
                        ) : (
                          <a className="text-blue-600 underline text-sm" href="#" onClick={(e) => e.preventDefault()}>請求の管理（準備中）</a>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm">読み込み中...</div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="pt-8 border-t mt-8">
              <Button onClick={handleLogout} className="w-full" variant="destructive">
                ログアウト
              </Button>
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
