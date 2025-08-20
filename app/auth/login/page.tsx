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
import { supabase, signInWithGoogle } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation";

export default function Component() {
  const router = useRouter();

  const [email, setEmail] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
  // Error states
  const [emailError, setEmailError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [authError, setAuthError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  // Check for success message from URL parameters using useEffect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const message = urlParams.get('message');
      if (message) {
        setSuccessMessage(message);
      }
    }
  }, []);

  const validateForm = () => {
    let isValid = true;
    
    // Clear previous errors
    setEmailError("");
    setPasswordError("");
    setAuthError("");

    // Validate email
    if (!email.trim()) {
      setEmailError("メールアドレスを入力してください");
      isValid = false;
    }

    // Validate password
    if (!password.trim()) {
      setPasswordError("パスワードを入力してください");
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setAuthError("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: email.trim(), 
        password 
      });
      
      if (error) {
        // Handle specific Supabase auth errors
        if (error.message.includes("Invalid login credentials")) {
          setAuthError("メールアドレスまたはパスワードが正しくありません");
        } else if (error.message.includes("Email not confirmed")) {
          setAuthError("メールアドレスの確認が完了していません");
        } else {
          setAuthError("ログインに失敗しました");
        }
      } else {
        // Login successful
        router.push("/dashboard/overview");
      }
    } catch (error) {
      setAuthError("ログインに失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setAuthError("Googleでのログインに失敗しました");
      }
    } catch (error) {
      setAuthError("Googleでのログインに失敗しました");
    } finally {
      setIsGoogleLoading(false);
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

      {/* FXNote Logo and Title - horizontally aligned above the card */}
      <Link href={"/"}>
        <div className="relative z-10 flex items-center justify-center w-full mb-2">
            <Image src="/logo.svg" alt="FXNote Logo" width={40} height={40} />
            <span className="ml-3 text-4xl font-bold tracking-tight text-gray-900 dark:text-white">FXNote</span>
        </div>
      </Link>
      {/* Login Form Container - positioned above background images */}
      <div className="relative z-10 flex w-full items-center justify-center p-4 sm:p-6 md:p-8 lg:p-10">
        <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm shadow-lg dark:bg-gray-800/90">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl font-bold">サインイン</CardTitle>
          </CardHeader>
          <form onSubmit={handleLogin} noValidate>
            <CardContent className="grid gap-4">
              {/* Authentication Error Alert */}
              {authError && (
                <Alert variant="destructive">
                  <AlertDescription>{authError}</AlertDescription>
                </Alert>
              )}
              {successMessage && (
                <Alert>
                  <AlertDescription>{successMessage}</AlertDescription>
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
                  }}
                  className={emailError ? "border-red-500 focus:border-red-500" : ""}
                />
                {emailError && (
                  <p className="text-sm text-red-600 dark:text-red-400">{emailError}</p>
                )}
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">パスワード</Label>
                  <Link href="/auth/reset-password" className="ml-auto inline-block text-sm underline">
                    パスワードを忘れた場合
                  </Link>
                </div>
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
              
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  className="w-1/2 flex items-center justify-center gap-2" 
                  variant="outline"
                  onClick={handleGoogleLogin}
                  disabled={isGoogleLoading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5" fill="none"><g><path fill="#4285F4" d="M43.611 20.083H42V20H24v8h11.303C33.97 32.833 29.418 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c2.803 0 5.377.99 7.413 2.626l6.293-6.293C34.583 6.053 29.555 4 24 4 12.954 4 4 12.954 4 24s8.954 20 20 20c11.045 0 19.824-8.955 19.824-20 0-1.341-.138-2.651-.213-3.917z"/><path fill="#34A853" d="M6.306 14.691l6.571 4.819C14.655 16.084 19.002 13 24 13c2.803 0 5.377.99 7.413 2.626l6.293-6.293C34.583 6.053 29.555 4 24 4c-7.732 0-14.41 4.41-17.694 10.691z"/><path fill="#FBBC05" d="M24 44c5.318 0 10.13-1.82 13.857-4.945l-6.414-5.264C29.418 36 24 36 24 36c-5.418 0-9.97-3.167-11.303-8.083l-6.57 5.081C9.59 39.59 16.268 44 24 44z"/><path fill="#EA4335" d="M43.611 20.083H42V20H24v8h11.303C34.418 32.833 29.418 36 24 36c-5.418 0-9.97-3.167-11.303-8.083l-6.57 5.081C9.59 39.59 16.268 44 24 44c5.318 0 10.13-1.82 13.857-4.945l-6.414-5.264C29.418 36 24 36 24 36c-5.418 0-9.97-3.167-11.303-8.083l-6.57 5.081C9.59 39.59 16.268 44 24 44z"/></g></svg>
                  {isGoogleLoading ? "処理中..." : "Googleでログイン"}
                </Button>
                <Button type="submit" className="w-1/2" disabled={isLoading}>
                  {isLoading ? "ログイン中..." : "Login"}
                </Button>
              </div>
            </CardContent>
          </form>
          <CardFooter className="text-center text-sm">
            <Link href="/auth/signup" className="underline">
              新規登録
            </Link>
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}
