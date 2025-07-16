"use client";

import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"

export default function Component() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (confirmPassword && e.target.value !== confirmPassword) {
      setPasswordError("パスワードが一致しません");
    } else {
      setPasswordError("");
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    if (password && e.target.value !== password) {
      setPasswordError("パスワードが一致しません");
    } else {
      setPasswordError("");
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gray-100 dark:bg-gray-900">
      {/* Left Background Image - visible on large screens and up */}
      <div className="absolute left-0 top-0 hidden h-full w-1/2 lg:block">
        <Image
          src="/placeholder.svg?height=1080&width=960"
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
          src="/placeholder.svg?height=1080&width=960"
          alt="Abstract background image for the right side of the login page"
          width={960}
          height={1080}
          className="h-full w-full object-cover"
          priority // Preload this image as it's a primary visual element [^1][^2]
        />
      </div>

      {/* Login Form Container - positioned above background images */}
      <div className="relative z-10 flex w-full items-center justify-center p-4 sm:p-6 md:p-8 lg:p-10">
        <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm shadow-lg dark:bg-gray-800/90">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl font-bold">新規登録</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex gap-2">
              <div className="flex-1 grid gap-2">
                <Label htmlFor="firstName">名</Label>
                <Input id="firstName" type="text" placeholder="名" value={firstName} onChange={e => setFirstName(e.target.value)} required />
              </div>
              <div className="flex-1 grid gap-2">
                <Label htmlFor="lastName">姓</Label>
                <Input id="lastName" type="text" placeholder="姓" value={lastName} onChange={e => setLastName(e.target.value)} required />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input id="email" type="email" placeholder="m@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
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
                  required
                  className="pr-10"
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
                  required
                  className="pr-10"
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
                <span className="text-sm text-red-600">{passwordError}</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" className="w-1/2 flex items-center justify-center gap-2" variant="outline">
                {/* Google Icon (optional) */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5" fill="none"><g><path fill="#4285F4" d="M43.611 20.083H42V20H24v8h11.303C33.97 32.833 29.418 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c2.803 0 5.377.99 7.413 2.626l6.293-6.293C34.583 6.053 29.555 4 24 4 12.954 4 4 12.954 4 24s8.954 20 20 20c11.045 0 19.824-8.955 19.824-20 0-1.341-.138-2.651-.213-3.917z"/><path fill="#34A853" d="M6.306 14.691l6.571 4.819C14.655 16.084 19.002 13 24 13c2.803 0 5.377.99 7.413 2.626l6.293-6.293C34.583 6.053 29.555 4 24 4c-7.732 0-14.41 4.41-17.694 10.691z"/><path fill="#FBBC05" d="M24 44c5.318 0 10.13-1.82 13.857-4.945l-6.414-5.264C29.418 36 24 36 24 36c-5.418 0-9.97-3.167-11.303-8.083l-6.57 5.081C9.59 39.59 16.268 44 24 44z"/><path fill="#EA4335" d="M43.611 20.083H42V20H24v8h11.303C34.418 32.833 29.418 36 24 36c-5.418 0-9.97-3.167-11.303-8.083l-6.57 5.081C9.59 39.59 16.268 44 24 44c5.318 0 10.13-1.82 13.857-4.945l-6.414-5.264C29.418 36 24 36 24 36c-5.418 0-9.97-3.167-11.303-8.083l-6.57 5.081C9.59 39.59 16.268 44 24 44z"/></g></svg>
                Googleでサインイン
              </Button>
              <Button type="submit" className="w-1/2">
                Login
              </Button>
            </div>
          </CardContent>
          <CardFooter className="text-center text-sm">
            <Link href="/login" className="underline">
              サインイン
            </Link>
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}
