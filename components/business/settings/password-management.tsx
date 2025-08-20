import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Eye, EyeOff, Lock, Check, X, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function PasswordManagement() {
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