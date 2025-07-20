"use client";

import Image from "next/image"
import Link from "next/link"
import { FormEvent, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [authError, setAuthError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const validateForm = () => {
    setEmailError("");
    setAuthError("");
    setSuccessMessage("");

    if (!email.trim()) {
      setEmailError("メールアドレスを入力してください");
      return false;
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setEmailError("有効なメールアドレスを入力してください");
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
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/update-password`
      });

      if (error) {
        if (error.message.includes("User not found")) {
          setAuthError("このメールアドレスは登録されていません");
        } else {
          setAuthError("パスワード再設定メールの送信に失敗しました");
        }
      } else {
        setSuccessMessage("パスワード再設定用のメールを送信しました");
        setEmail("");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      setAuthError("パスワード再設定メールの送信に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

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

      {/* Reset Password Form Container */}
      <div className="relative z-10 flex w-full items-center justify-center p-4 sm:p-6 md:p-8 lg:p-10">
        <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm shadow-lg dark:bg-gray-800/90">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl font-bold">パスワード再設定</CardTitle>
            <CardDescription>
              登録済みのメールアドレスを入力してください
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit} noValidate>
            <CardContent className="grid gap-4">
              {/* Success Message */}
              {successMessage && (
                <Alert>
                  <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
              )}

              {/* Authentication Error Alert */}
              {authError && (
                <Alert variant="destructive">
                  <AlertDescription>{authError}</AlertDescription>
                </Alert>
              )}

              <div className="grid gap-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="m@example.com" 
                  value={email} 
                  onChange={e => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError("");
                    if (authError) setAuthError("");
                    if (successMessage) setSuccessMessage("");
                  }}
                  className={emailError ? "border-red-500 focus:border-red-500" : ""}
                />
                {emailError && (
                  <p className="text-sm text-red-600 dark:text-red-400">{emailError}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "送信中..." : "パスワード再設定メールを送信"}
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
