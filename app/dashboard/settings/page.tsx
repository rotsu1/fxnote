"use client"
import { useState, useEffect } from "react"

import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
  AlertCircle,
  CreditCard,
  Receipt,
  Crown,
  User,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger, AppSidebar } from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

// Sample user data
const initialUserData = {
  email: "trader@example.com",
  emailVerified: true,
  displayName: "田中太郎",
  bio: "FXトレーダー歴5年。主にUSD/JPYとEUR/USDを取引しています。",
  avatar: "/placeholder.svg?height=100&width=100",
  twoFactorEnabled: false,
}

// Sample billing data
const sampleBillingData = {
  currentPlan: {
    name: "FXNote Pro",
    price: "¥2,980",
    period: "月額",
    features: ["無制限の取引記録", "高度な分析ツール", "カスタムタグ", "データエクスポート"]
  },
  billingHistory: [
    { id: 1, date: "2024-01-15", amount: "¥2,980", status: "完了", description: "FXNote Pro - 1月分" },
    { id: 2, date: "2023-12-15", amount: "¥2,980", status: "完了", description: "FXNote Pro - 12月分" },
    { id: 3, date: "2023-11-15", amount: "¥2,980", status: "完了", description: "FXNote Pro - 11月分" },
  ],
  paymentMethod: {
    type: "クレジットカード",
    last4: "****1234",
    expiry: "12/25",
    brand: "Visa"
  }
}

function EmailManagement() {
  const [email, setEmail] = useState("")
  const [isVerified, setIsVerified] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch user data from Supabase on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (user && !error) {
          setEmail(user.email || "")
          setIsVerified(user.email_confirmed_at !== null)
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [])

  const handleSaveEmail = async () => {
    try {
      const { error } = await supabase.auth.updateUser({ email: email })
      if (error) {
        throw error
      }
      setIsEditing(false)
      setIsVerified(false) // New email needs verification
      // You can add a toast notification here for success
    } catch (error) {
      console.error("Error updating email:", error)
      // You can add a toast notification here for error
    }
  }

  const handleResendVerification = async () => {
    setIsSending(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      })
      if (error) {
        throw error
      }
      // You can add a toast notification here for success
    } catch (error) {
      console.error("Error resending verification:", error)
      // You can add a toast notification here for error
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-blue-600" />
          メールアドレス管理
        </CardTitle>
        <CardDescription>アカウントのメールアドレスを管理します</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!isEditing}
                  className="flex-1"
                />
            <Button
              variant={isEditing ? "default" : "outline"}
              onClick={isEditing ? handleSaveEmail : () => setIsEditing(true)}
            >
              {isEditing ? "保存" : "編集"}
            </Button>
            {isEditing && (
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                キャンセル
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            {isVerified ? (
              <>
                <Check className="h-4 w-4 text-green-600" />
                <Badge variant="default" className="bg-green-100 text-green-800">
                  認証済み
                </Badge>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <Badge variant="outline" className="border-orange-500 text-orange-700">
                  未認証
                </Badge>
              </>
            )}
          </div>
          {!isVerified && (
            <Button variant="outline" size="sm" onClick={handleResendVerification} disabled={isSending}>
              {isSending ? "送信中..." : "認証メール再送信"}
            </Button>
          )}
        </div>

        {!isVerified && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>メールアドレスの認証が完了していません。認証メールを確認してください。</AlertDescription>
          </Alert>
        )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

function PasswordManagement() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const getPasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength += 25
    if (/[A-Z]/.test(password)) strength += 25
    if (/[a-z]/.test(password)) strength += 25
    if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) strength += 25
    return strength
  }

  const getStrengthLabel = (strength: number) => {
    if (strength < 25) return { label: "弱い", color: "text-red-600" }
    if (strength < 50) return { label: "普通", color: "text-orange-600" }
    if (strength < 75) return { label: "良い", color: "text-yellow-600" }
    return { label: "強い", color: "text-green-600" }
  }

  const passwordStrength = getPasswordStrength(newPassword)
  const strengthInfo = getStrengthLabel(passwordStrength)
  const passwordsMatch = newPassword === confirmPassword && confirmPassword !== ""

  const handleChangePassword = async () => {
    if (passwordStrength < 50) {
      setError("パスワードが弱すぎます。より強力なパスワードを選択してください。")
      return
    }
    
    if (!passwordsMatch) {
      setError("新しいパスワードが一致しません。")
      return
    }

    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      // First, re-authenticate the user with their current password
      const { error: reAuthError } = await supabase.auth.signInWithPassword({
        email: (await supabase.auth.getUser()).data.user?.email || "",
        password: currentPassword,
      })

      if (reAuthError) {
        throw new Error("現在のパスワードが正しくありません。")
      }

      // Then update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) {
        throw updateError
      }

      // Success - clear form and show success message
      setSuccess("パスワードが正常に変更されました。")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(""), 5000)
      
    } catch (error: any) {
      setError(error.message || "パスワードの変更中にエラーが発生しました。")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-green-600" />
          パスワード管理
        </CardTitle>
        <CardDescription>アカウントのパスワードを変更します</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="currentPassword">現在のパスワード</Label>
          <div className="relative">
            <Input
              id="currentPassword"
              type={showCurrentPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="現在のパスワードを入力"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            >
              {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="newPassword">新しいパスワード</Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="新しいパスワードを入力"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowNewPassword(!showNewPassword)}
            >
              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          {newPassword && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Progress value={passwordStrength} className="flex-1 h-2" />
                <span className={`text-sm font-medium ${strengthInfo.color}`}>{strengthInfo.label}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                パスワードは8文字以上で、大文字・小文字・数字・記号を含むことを推奨します
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">パスワード確認</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="新しいパスワードを再入力"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          {confirmPassword && (
            <div className="flex items-center gap-2">
              {passwordsMatch ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">パスワードが一致しています</span>
                </>
              ) : (
                <>
                  <X className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-600">パスワードが一致しません</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Error and Success Messages */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <Check className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleChangePassword}
          disabled={!currentPassword || passwordStrength < 50 || !passwordsMatch || isLoading}
          className="w-full"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              変更中...
            </div>
          ) : (
            "パスワードを変更"
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

function CurrentPlan() {
  const { currentPlan } = sampleBillingData

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
              <h3 className="font-semibold text-lg">{currentPlan.name}</h3>
              <p className="text-2xl font-bold text-blue-600">
                {currentPlan.price}<span className="text-sm font-normal text-muted-foreground">/{currentPlan.period}</span>
              </p>
            </div>
          </div>
          <Badge variant="default" className="bg-blue-100 text-blue-800">
            アクティブ
          </Badge>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">含まれる機能</h4>
          <ul className="space-y-1">
            {currentPlan.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <Button variant="outline" className="w-full">
          プランを変更
        </Button>
      </CardContent>
    </Card>
  )
}

function BillingHistory() {
  const { billingHistory } = sampleBillingData

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-green-600" />
          請求履歴
        </CardTitle>
        <CardDescription>過去の支払い履歴</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {billingHistory.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <p className="font-medium">{item.description}</p>
                <p className="text-sm text-muted-foreground">{item.date}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold">{item.amount}</span>
                <Badge variant="outline" className="text-xs">
                  {item.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <Button variant="outline" className="w-full">
            請求書をダウンロード
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function PaymentMethod() {
  const { paymentMethod } = sampleBillingData

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-purple-600" />
          支払い方法
        </CardTitle>
        <CardDescription>現在の支払い方法を管理します</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 border rounded-lg bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded border">
              <CreditCard className="h-5 w-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{paymentMethod.brand} •••• {paymentMethod.last4}</p>
              <p className="text-sm text-muted-foreground">有効期限: {paymentMethod.expiry}</p>
            </div>
            <Badge variant="default" className="bg-green-100 text-green-800">
              デフォルト
            </Badge>
          </div>
        </div>

        <div className="space-y-3">
          <Button variant="outline" className="w-full">
            支払い方法を更新
          </Button>
          <Button variant="outline" className="w-full">
            新しいカードを追加
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function SettingsPage() {
  const { toast } = useToast();
  const router = useRouter();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ title: "ログアウト失敗", description: error.message });
    } else {
      toast({ title: "ログアウトしました" });
      router.push("/login");
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">設定</h1>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
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
                <BillingHistory />
                <PaymentMethod />
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
