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

export default function Settings() {
  const { toast } = useToast();
  const router = useRouter();

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
                <CurrentPlan />
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
