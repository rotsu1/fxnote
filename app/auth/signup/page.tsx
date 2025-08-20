"use client";

import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useState, FormEvent, useEffect } from "react"
import { Eye, EyeOff } from "lucide-react"
import { supabase, signInWithGoogle } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation";
import { Profile } from "@/utils/types";

export default function Component() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmationMessage, setShowConfirmationMessage] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Check if user is returning from email confirmation
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // User is authenticated, check if they have a profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single() as { data: Profile | null };

        if (!profile) {
          // User is confirmed but no profile exists, create one
          const { error: profileError } = await supabase.from("profiles").insert([
            {
              id: session.user.id,
              timezone: "Asia/Tokyo",
              preferred_currency: "JPY",
            },
          ]);

          if (profileError) {
            // Profile creation failed silently
          }
        }

        // Redirect to dashboard
        router.push("/dashboard/overview");
      }
    };

    checkSession();
  }, [router]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (passwordError) setPasswordError("");
    if (message) setMessage("");
    if (confirmPassword && e.target.value !== confirmPassword) {
      setPasswordError("パスワードが一致しません");
    } else {
      setPasswordError("");
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    if (passwordError) setPasswordError("");
    if (message) setMessage("");
    if (password && e.target.value !== password) {
      setPasswordError("パスワードが一致しません");
    } else {
      setPasswordError("");
    }
  };

  const validateForm = () => {
    let isValid = true;
    
    // Clear previous errors
    setEmailError("");
    setPasswordError("");
    setMessage("");

    // Validate email
    if (!email.trim()) {
      setEmailError("メールアドレスを入力してください");
      isValid = false;
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email.trim() && !emailRegex.test(email.trim())) {
      setEmailError("有効なメールアドレスを入力してください");
      isValid = false;
    }

    // Validate password
    if (!password.trim()) {
      setPasswordError("パスワードを入力してください");
      isValid = false;
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      setPasswordError("パスワードが一致しません");
      isValid = false;
    }

    return isValid;
  };

  const handleSignUp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setMessage("");
    setEmailError("");
    setShowConfirmationMessage(false);

    try {
      // 1. Sign up user in Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });
    
      if (error) {
        // Handle specific Supabase auth errors
        if (error.message.includes("User already registered")) {
          setEmailError("このメールアドレスは既に登録されています");
        } else if (error.message.includes("Invalid email")) {
          setEmailError("有効なメールアドレスを入力してください");
        } else if (error.message.includes("Password should be at least")) {
          setPasswordError("パスワードは6文字以上で入力してください");
        } else {
          setMessage("サインアップに失敗しました");
        }
        return;
      }
    
      const user = data.user;
    
      if (!user) {
        setMessage("サインアップは成功しましたが、ユーザー情報が取得できませんでした。");
        return;
      }

      // Check if email confirmation is required
      if (!user.email_confirmed_at) {
        // Email confirmation is required
        setConfirmationEmail(email.trim());
        setShowConfirmationMessage(true);
        setMessage("確認メールを送信しました。メール内のリンクをクリックして登録を完了してください。");
        return;
      }

      // User is already confirmed, proceed with profile creation
      const { error: profileError } = await supabase.from("profiles").insert([
        {
          id: user.id, // must match auth.users.id
          timezone: "Asia/Tokyo", // optional - customize as needed
          preferred_currency: "JPY", // optional
        },
      ]);
    
      if (profileError) {
        setMessage("アカウントは作成されましたが、プロフィールの保存に失敗しました。");
        return;
      }
    
      setMessage("サインアップに成功しました。");
      router.push("/dashboard/overview");
    } catch (error) {
      setMessage("サインアップに失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setMessage("Googleでのサインアップに失敗しました");
      }
    } catch (error) {
      setMessage("Googleでのサインアップに失敗しました");
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
          priority // Preload this image as it's a primary visual element [^1][^2]
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
          priority // Preload this image as it's a primary visual element [^1][^2]
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
          {showConfirmationMessage ? (
            // Email Confirmation Message
            <>
              <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-3xl font-bold">メール確認</CardTitle>
                <CardDescription className="text-center">
                  確認メールを送信しました
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertDescription>
                    確認メールを送信しました。メール内のリンクをクリックして登録を完了してください。
                  </AlertDescription>
                </Alert>
                <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                  <p>送信先: {confirmationEmail}</p>
                </div>
                <div className="text-center text-xs text-gray-500 dark:text-gray-500">
                  <p>メールが届かない場合は、スパムフォルダをご確認ください。</p>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowConfirmationMessage(false);
                    setMessage("");
                    setConfirmationEmail("");
                  }}
                  className="w-full"
                >
                  別のメールアドレスで登録
                </Button>
                <Link href="/auth/login" className="w-full">
                  <Button variant="ghost" className="w-full">
                    ログインページに戻る
                  </Button>
                </Link>
              </CardFooter>
            </>
          ) : (
            // Signup Form
            <>
              <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-3xl font-bold">新規登録</CardTitle>
              </CardHeader>
              <form onSubmit={handleSignUp} noValidate>
                <CardContent className="grid gap-4">
                  {/* General Message Alert */}
                  {message && (
                    <Alert variant={message.includes("成功") ? "default" : "destructive"}>
                      <AlertDescription>{message}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="flex gap-2">
                    <div className="flex-1 grid gap-2">
                      <Label htmlFor="firstName">名</Label>
                      <Input 
                        id="firstName" 
                        type="text" 
                        placeholder="名" 
                        value={firstName} 
                        onChange={e => setFirstName(e.target.value)} 
                        required 
                      />
                    </div>
                    <div className="flex-1 grid gap-2">
                      <Label htmlFor="lastName">姓</Label>
                      <Input 
                        id="lastName" 
                        type="text" 
                        placeholder="姓" 
                        value={lastName} 
                        onChange={e => setLastName(e.target.value)} 
                        required 
                      />
                    </div>
                  </div>
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
                        if (message) setMessage("");
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
                    </div>
                    <div className="relative group">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={handlePasswordChange}
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
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">パスワード（確認）</Label>
                    <div className="relative group">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={handleConfirmPasswordChange}
                        className={`pr-10 ${passwordError ? "border-red-500 focus:border-red-500" : ""}`}
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
                    {passwordError && (
                      <p className="text-sm text-red-600 dark:text-red-400">{passwordError}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      className="w-1/2 flex items-center justify-center gap-2" 
                      variant="outline"
                      onClick={handleGoogleSignUp}
                      disabled={isGoogleLoading}
                    >
                      {/* Google Icon (optional) */}
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5" fill="none"><g><path fill="#4285F4" d="M43.611 20.083H42V20H24v8h11.303C33.97 32.833 29.418 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c2.803 0 5.377.99 7.413 2.626l6.293-6.293C34.583 6.053 29.555 4 24 4 12.954 4 4 12.954 4 24s8.954 20 20 20c11.045 0 19.824-8.955 19.824-20 0-1.341-.138-2.651-.213-3.917z"/><path fill="#34A853" d="M6.306 14.691l6.571 4.819C14.655 16.084 19.002 13 24 13c2.803 0 5.377.99 7.413 2.626l6.293-6.293C34.583 6.053 29.555 4 24 4c-7.732 0-14.41 4.41-17.694 10.691z"/><path fill="#FBBC05" d="M24 44c5.318 0 10.13-1.82 13.857-4.945l-6.414-5.264C29.418 36 24 36 24 36c-5.418 0-9.97-3.167-11.303-8.083l-6.57 5.081C9.59 39.59 16.268 44 24 44z"/><path fill="#EA4335" d="M43.611 20.083H42V20H24v8h11.303C34.418 32.833 29.418 36 24 36c-5.418 0-9.97-3.167-11.303-8.083l-6.57 5.081C9.59 39.59 16.268 44 24 44c5.318 0 10.13-1.82 13.857-4.945l-6.414-5.264C29.418 36 24 36 24 36c-5.418 0-9.97-3.167-11.303-8.083l-6.57 5.081C9.59 39.59 16.268 44 24 44z"/></g></svg>
                      {isGoogleLoading ? "処理中..." : "Googleでサインアップ"}
                    </Button>
                    <Button type="submit" className="w-1/2" disabled={isLoading}>
                      {isLoading ? "登録中..." : "新規登録"}
                    </Button>
                  </div>
                </CardContent>
              </form>
              <CardFooter className="text-center text-sm">
                <Link href="/auth/login" className="underline">
                  サインイン
                </Link>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    </main>
  )
}
