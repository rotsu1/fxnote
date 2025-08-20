"use client";

import { useState } from "react";
import { CreditCard, Crown, Settings, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger, AppSidebar } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface SettingsContentProps {
  featuresLocked: boolean;
  subscriptionState: 'never_subscribed' | 'active' | 'inactive';
  userId: string;
}

function SubscriptionManagement({ subscriptionState, userId }: { subscriptionState: string; userId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create portal session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error creating portal session:', error);
      toast({
        title: 'エラー',
        description: error instanceof Error ? error.message : 'ポータルセッションの作成に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResubscribe = () => {
    window.location.href = '/subscribe';
  };

  const getStatusBadge = () => {
    switch (subscriptionState) {
      case 'active':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            アクティブ
          </Badge>
        );
      case 'inactive':
        return (
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            非アクティブ
          </Badge>
        );
      case 'never_subscribed':
        return (
          <Badge variant="outline" className="border-gray-300 text-gray-600">
            未購読
          </Badge>
        );
      default:
        return null;
    }
  };

  const getPlanInfo = () => {
    switch (subscriptionState) {
      case 'active':
        return {
          name: "FXNote Pro",
          price: "¥490",
          period: "月額",
          features: ["無制限の取引記録", "高度な分析ツール", "カレンダー表示", "カスタムタグ", "データエクスポート"]
        };
      default:
        return {
          name: "無料プラン",
          price: "¥0",
          period: "月額",
          features: ["基本的な取引記録", "シンプルなテーブル表示"]
        };
    }
  };

  const planInfo = getPlanInfo();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-yellow-600" />
          サブスクリプション管理
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
              <h3 className="font-semibold text-lg">{planInfo.name}</h3>
              <p className="text-2xl font-bold text-blue-600">
                {planInfo.price}<span className="text-sm font-normal text-muted-foreground">/{planInfo.period}</span>
              </p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">含まれる機能</h4>
          <ul className="space-y-1">
            {planInfo.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex gap-2">
          {subscriptionState === 'active' && (
            <Button
              onClick={handleManageSubscription}
              disabled={isLoading}
              className="flex-1"
              variant="outline"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {isLoading ? '読み込み中...' : '支払いを管理'}
            </Button>
          )}
          
          {subscriptionState !== 'active' && (
            <Button
              onClick={handleResubscribe}
              className="flex-1"
            >
              <Crown className="h-4 w-4 mr-2" />
              サブスクを再開
            </Button>
          )}
        </div>

        {subscriptionState !== 'active' && (
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-800">
              プレミアム機能を利用するには、サブスクリプションが必要です。
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AccountSettings() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      toast({ title: "ログアウトしました" });
      window.location.href = "/login";
    } catch (error: any) {
      toast({ 
        title: "ログアウト失敗", 
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-blue-600" />
          アカウント設定
        </CardTitle>
        <CardDescription>アカウントの基本設定</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg border">
          <p className="text-sm text-gray-600 mb-2">
            現在のアカウント設定は、Supabase Auth で管理されています。
          </p>
          <p className="text-sm text-gray-600">
            メールアドレスの変更やパスワードのリセットは、ログイン画面から行えます。
          </p>
        </div>

        <Button
          onClick={handleLogout}
          disabled={isLoading}
          className="w-full"
          variant="destructive"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {isLoading ? 'ログアウト中...' : 'ログアウト'}
        </Button>
      </CardContent>
    </Card>
  );
}

export function SettingsContent({ featuresLocked, subscriptionState, userId }: SettingsContentProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 md:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">設定</h1>
            {featuresLocked && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
                <Crown className="h-3 w-3 mr-1" />
                プレミアム機能
              </Badge>
            )}
          </div>
        </header>

        <main className="flex-1 px-4 md:px-6 pt-6">
          <div className="max-w-4xl mx-auto">
            <Tabs defaultValue="subscription" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="subscription" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  サブスクリプション
                </TabsTrigger>
                <TabsTrigger value="account" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  アカウント
                </TabsTrigger>
              </TabsList>

              <TabsContent value="subscription" className="space-y-6">
                <SubscriptionManagement subscriptionState={subscriptionState} userId={userId} />
              </TabsContent>

              <TabsContent value="account" className="space-y-6">
                <AccountSettings />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
