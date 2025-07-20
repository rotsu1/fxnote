"use client";

import Image from "next/image"
import Link from "next/link"
import { FormEvent, useState, useEffect } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [authError, setAuthError] = useState("");
  const [isSessionValid, setIsSessionValid] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Check if user has a valid session for password update
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session check error:", error);
          setAuthError("セッションの確認に失敗しました");
        } else if (!session) {
          setAuthError("パスワード更新のための有効なセッションが見つかりません");
        } else {
          setIsSessionValid(true);
        }
      } catch (error) {
        console.error("Unexpected error during session check:", error);
        setAuthError("セッションの確認に失敗しました");
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkSession();
  }, []);

  const validateForm = () => {
    setPasswordError("");
    setConfirmPasswordError("");
    setAuthError("");

    if (!password.trim()) {
      setPasswordError("パスワードを入力してください");
      return false;
    }

    if (password.length < 6) {
      setPasswordError("パスワードは6文字以上で入力してください");
      return false;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError("パスワードが一致しません");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ 
        password: password 
      });

      if (error) {
        if (error.message.includes("Password should be at least")) {
          setPasswordError("パスワードは6文字以上で入力してください");
        } else {
          setAuthError("パスワードの更新に失敗しました");
        }
      } else {
        // Success - redirect to login with success message
        router.push("/login?message=パスワードが正常に更新されました");
      }
    } catch (error) {
      console.error("Update password error:", error);
      setAuthError("パスワードの更新に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking session
  if (isCheckingSession) {
    return (
      <main className="relative flex flex-col min-h-screen items-center justify-center overflow-hidden bg-white dark:bg-gray-900">
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">セッションを確認中...</p>
        </div>
      </main>
    );
  }

  // Show error if no valid session
  if (!isSessionValid) {
    return (
      <main className="relative flex flex-col min-h-screen items-center justify-center overflow-hidden bg-white dark:bg-gray-900">
        <div className="relative z-10 flex w-full items-center justify-center p-4 sm:p-6 md:p-8 lg:p-10">
          <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm shadow-lg dark:bg-gray-800/90">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-3xl font-bold">エラー</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <Alert variant="destructive">
                <AlertDescription>{authError}</AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="text-center text-sm">
              <Link href="/reset-password" className="underline">
                パスワード再設定を再度行う
              </Link>
            </CardFooter>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex flex-col min-h-screen items-center justify-center overflow-hidden bg-white dark:bg-gray-900">
      {/* Left Background Image - visible on large screens and up */}
      <div className="absolute left-0 top-0 hidden h-full w-1/2 lg:block">
        <Image
          src="/login-left.webp"
          alt="Abstract background image for the left side of the login page"
          width={960}
          height={1080}
          className="h-full w-full object-cover"
          priority
        />
      </div>
      {/* Right Background Image - visible on large screens and up */}
      <div className="absolute right-0 top-0 hidden h-full w-1/2 lg:block">
        <Image
          src="/login-right.webp"
          alt="Abstract background image for the right side of the login page"
          width={960}
          height={1080}
          className="h-full w-full object-cover"
          priority
        />
      </div>

      {/* FXNote Logo and Title */}
      <Link href={"/"}>
        <div className="relative z-10 flex items-center justify-center w-full mb-2">
            <Image src="/logo.svg" alt="FXNote Logo" width={40} height={40} />
            <span className="ml-3 text-4xl font-bold tracking-tight text-gray-900 dark:text-white">FXNote</span>
        </div>
      </Link>

      {/* Update Password Form Container */}
      <div className="relative z-10 flex w-full items-center justify-center p-4 sm:p-6 md:p-8 lg:p-10">
        <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm shadow-lg dark:bg-gray-800/90">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl font-bold">新しいパスワードを設定</CardTitle>
            <CardDescription>
              新しいパスワードを入力してください
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit} noValidate>
            <CardContent className="grid gap-4">
              {/* Authentication Error Alert */}
              {authError && (
                <Alert variant="destructive">
                  <AlertDescription>{authError}</AlertDescription>
                </Alert>
              )}

              <div className="grid gap-2">
                <Label htmlFor="password">新しいパスワード</Label>
                <div className="relative group">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError("");
                      if (authError) setAuthError("");
                    }}
                    className={`pr-10 ${passwordError ? "border-red-500 focus:border-red-500" : ""}`}
                    placeholder="6文字以上で入力"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
                    onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示"}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-sm text-red-600 dark:text-red-400">{passwordError}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirm-password">パスワードの確認</Label>
                <div className="relative group">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={e => {
                      setConfirmPassword(e.target.value);
                      if (confirmPasswordError) setConfirmPasswordError("");
                      if (authError) setAuthError("");
                    }}
                    className={`pr-10 ${confirmPasswordError ? "border-red-500 focus:border-red-500" : ""}`}
                    placeholder="パスワードを再入力"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
                    onClick={() => setShowConfirmPassword(v => !v)}
                    aria-label={showConfirmPassword ? "パスワードを隠す" : "パスワードを表示"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {confirmPasswordError && (
                  <p className="text-sm text-red-600 dark:text-red-400">{confirmPasswordError}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "更新中..." : "パスワードを更新"}
              </Button>
            </CardContent>
          </form>

          <CardFooter className="text-center text-sm">
            <Link href="/login" className="underline">
              ログインページに戻る
            </Link>
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}
