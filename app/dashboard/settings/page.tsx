"use client"
import { useState } from "react"
import type React from "react"

import {
  Mail,
  Lock,
  Shield,
  Eye,
  EyeOff,
  Check,
  X,
  AlertCircle,
  Smartphone,
  Key,
  Copy,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger, AppSidebar } from "@/components/ui/sidebar"

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

function EmailManagement() {
  const [email, setEmail] = useState(initialUserData.email)
  const [isVerified, setIsVerified] = useState(initialUserData.emailVerified)
  const [isEditing, setIsEditing] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const handleSaveEmail = () => {
    // Save email logic here
    setIsEditing(false)
    setIsVerified(false) // New email needs verification
  }

  const handleResendVerification = async () => {
    setIsSending(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsSending(false)
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

  const handleChangePassword = () => {
    if (passwordStrength >= 50 && passwordsMatch) {
      // Change password logic here
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
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

        <Button
          onClick={handleChangePassword}
          disabled={!currentPassword || passwordStrength < 50 || !passwordsMatch}
          className="w-full"
        >
          パスワードを変更
        </Button>
      </CardContent>
    </Card>
  )
}

function AuthenticationManagement() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(initialUserData.twoFactorEnabled)
  const [showBackupCodes, setShowBackupCodes] = useState(false)
  const [isSetupDialogOpen, setIsSetupDialogOpen] = useState(false)

  const backupCodes = [
    "1234-5678-9012",
    "2345-6789-0123",
    "3456-7890-1234",
    "4567-8901-2345",
    "5678-9012-3456",
    "6789-0123-4567",
    "7890-1234-5678",
    "8901-2345-6789",
  ]

  const handleToggle2FA = () => {
    if (!twoFactorEnabled) {
      setIsSetupDialogOpen(true)
    } else {
      setTwoFactorEnabled(false)
    }
  }

  const handleSetup2FA = () => {
    setTwoFactorEnabled(true)
    setIsSetupDialogOpen(false)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-orange-600" />
            認証方法管理
          </CardTitle>
          <CardDescription>アカウントのセキュリティを強化します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-medium">二段階認証 (2FA)</div>
              <div className="text-sm text-muted-foreground">
                アカウントのセキュリティを向上させるため、二段階認証を有効にすることを推奨します
              </div>
            </div>
            <Switch checked={twoFactorEnabled} onCheckedChange={handleToggle2FA} />
          </div>

          {twoFactorEnabled && (
            <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">二段階認証が有効です</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-green-600" />
                  <span className="text-sm">認証アプリ: Google Authenticator</span>
                </div>
                <div className="text-xs text-green-700">最終同期: 2024年1月15日 14:30</div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowBackupCodes(!showBackupCodes)}>
                  <Key className="mr-2 h-4 w-4" />
                  {showBackupCodes ? "バックアップコードを隠す" : "バックアップコードを表示"}
                </Button>
                <Button variant="outline" size="sm">
                  新しいバックアップコードを生成
                </Button>
              </div>

              {showBackupCodes && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">バックアップコード</div>
                  <div className="text-xs text-muted-foreground mb-2">
                    これらのコードは安全な場所に保管してください。各コードは一度のみ使用できます。
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {backupCodes.map((code, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-white rounded border">
                        <code className="flex-1 text-sm font-mono">{code}</code>
                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(code)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!twoFactorEnabled && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                二段階認証を有効にして、アカウントのセキュリティを向上させることを強く推奨します。
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Dialog open={isSetupDialogOpen} onOpenChange={setIsSetupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>二段階認証の設定</DialogTitle>
            <DialogDescription>認証アプリを使用して二段階認証を設定します</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-center">
              <div className="w-32 h-32 bg-gray-200 mx-auto mb-4 rounded-lg flex items-center justify-center">
                <div className="text-xs text-gray-500">QRコード</div>
              </div>
              <div className="text-sm text-muted-foreground">認証アプリでこのQRコードをスキャンしてください</div>
            </div>

            <div className="space-y-2">
              <Label>手動入力用キー</Label>
              <div className="flex items-center gap-2 p-2 bg-gray-100 rounded">
                <code className="flex-1 text-sm">JBSWY3DPEHPK3PXP</code>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard("JBSWY3DPEHPK3PXP")}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="verificationCode">認証コード</Label>
              <Input id="verificationCode" placeholder="6桁の認証コードを入力" maxLength={6} />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsSetupDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleSetup2FA}>設定完了</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
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

        <main className="flex-1 p-4 md:p-6 space-y-6">
          <div className="max-w-2xl space-y-6">
            <EmailManagement />
            <PasswordManagement />
            <AuthenticationManagement />
          </div>
          <div className="max-w-2xl mx-auto pt-8">
            <Button onClick={handleLogout} className="w-full" variant="destructive">
              ログアウト
            </Button>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
