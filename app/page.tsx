"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BarChart3, Calendar, Table, TrendingUp, FileText } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"

export default function Component() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0)

  // Feature data with corresponding images
  const features = [
    {
      icon: BarChart3,
      title: "ダッシュボード",
      description: "トレードの概要とパフォーマンスを一目で確認できる包括的なダッシュボード",
      image: "/dashboard.webp"
    },
    {
      icon: Calendar,
      title: "カレンダーページ",
      description: "トレードのスケジュールと履歴をカレンダー形式で管理",
      image: "/calendar.webp"
    },
    {
      icon: Table,
      title: "テーブルページ",
      description: "Excelライクな形式でトレード記録を保存・閲覧・管理",
      image: "/table.webp"
    },
    {
      icon: FileText,
      title: "メモページ",
      description: "トレードの振り返りと学習のためのメモ機能",
      image: "/memo.webp"
    },
    {
      icon: TrendingUp,
      title: "分析ページ",
      description: "詳細な分析とレポートでトレード戦略を最適化",
      image: "/analysis.webp"
    }
  ]

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          // Session check error - silently handle
        } else if (session) {
          // User is authenticated, redirect to dashboard
          router.push("/dashboard/overview")
          return
        }
      } catch (error) {
        // Unexpected error - silently handle
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [router])

  // Feature cycling animation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeatureIndex((prevIndex) => (prevIndex + 1) % features.length)
    }, 3000) // Change feature every 3 seconds

    return () => clearInterval(interval)
  }, [features.length])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-dvh items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-dvh">
      {/* Navigation Bar */}
      <header className="px-4 lg:px-6 h-14 flex items-center sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 border-b">
        <Link href="/" className="flex items-center justify-center">
          <Image src="/logo.svg?height=30&width=30" width="30" height="30" alt="FXNote Logo" />
          <span className="ml-2 font-bold text-lg">FXNote</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link href="/auth/login" className="text-sm font-medium hover:underline underline-offset-4">
            ログイン / 新規登録
          </Link>
          <button 
            onClick={() => scrollToSection('features')}
            className="text-sm font-medium hover:underline underline-offset-4"
          >
            機能
          </button>
          <button 
            onClick={() => scrollToSection('pricing')}
            className="text-sm font-medium hover:underline underline-offset-4"
          >
            料金
          </button>
          <button 
            onClick={() => scrollToSection('contact')}
            className="text-sm font-medium hover:underline underline-offset-4"
          >
            お問い合わせ
          </button>
        </nav>
      </header>

      <main className="flex-1">
                {/* Hero Section */}
        <section id="hero" className="w-full h-[calc(100vh-56px)] flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20">
          <div className="container mx-auto px-4 md:px-6 max-w-7xl">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    FXNote
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  トレードを記録・分析し、市場のアンバランスを攻略
                  </p>
                  <p className="max-w-[600px] text-muted-foreground md:text-lg">
                  50%の壁を突破し、期待値を引き寄せろ
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link
                    href="/auth/signup"
                    className="inline-flex h-10 items-center justify-center rounded-md bg-gradient-to-r from-blue-600 to-purple-600 px-8 text-sm font-medium text-white shadow-lg transition-all duration-300 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50"
                  >
                    今すぐ始める
                  </Link>
                  <button
                    onClick={() => scrollToSection('features')}
                    className="inline-flex h-10 items-center justify-center rounded-md border-2 border-blue-200 bg-white/80 backdrop-blur-sm px-8 text-sm font-medium text-blue-700 shadow-sm transition-all duration-300 hover:bg-blue-50 hover:border-blue-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    詳細を見る
                  </button>
                </div>
              </div>
              <Image
                src="/hero.webp?height=550&width=550"
                width="550"
                height="550"
                alt="FXNote Dashboard"
                className="mx-auto aspect-video overflow-hidden rounded-2xl object-cover sm:w-full lg:order-last lg:aspect-square shadow-2xl ring-4 ring-white/20"
              />
            </div>
          </div>
        </section>

                {/* Features Section */}
        <section id="features" className="w-full py-8 md:py-16 lg:py-24 bg-gradient-to-b from-muted via-blue-50/30 to-muted dark:from-muted dark:via-blue-950/20 dark:to-muted">
          <div className="container mx-auto px-4 md:px-6 max-w-7xl">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">主要機能</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  FXNoteの包括的な機能で、トレードパフォーマンスを最大化しましょう
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-8 lg:grid-cols-2 lg:gap-12">
              <div className="flex flex-col justify-center space-y-4">
                <ul className="grid gap-6">
                  {features.map((feature, index) => {
                    const IconComponent = feature.icon
                    const isActive = index === activeFeatureIndex
                    return (
                      <li key={index}>
                        <div className="grid gap-1">
                          <div className="flex items-center gap-2">
                            <IconComponent className={`h-6 w-6 transition-all duration-500 ${
                              isActive ? 'text-primary scale-110' : 'text-muted-foreground'
                            }`} />
                            <h3 className={`font-bold transition-all duration-500 ${
                              isActive 
                                ? 'text-2xl text-foreground' 
                                : 'text-lg text-muted-foreground'
                            }`}>
                              {feature.title}
                            </h3>
                          </div>
                          <p className={`transition-all duration-500 ${
                            isActive 
                              ? 'text-base text-foreground font-medium' 
                              : 'text-sm text-muted-foreground'
                          }`}>
                            {feature.description}
                          </p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
              <div className="relative">
                <Image
                  src={`${features[activeFeatureIndex].image}?height=500&width=700`}
                  width="700"
                  height="500"
                  alt={`${features[activeFeatureIndex].title} Overview`}
                  className="mx-auto w-full h-[500px] overflow-hidden rounded-3xl object-contain transition-all duration-1000 ease-in-out feature-image-fade"
                  key={activeFeatureIndex}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="w-full py-8 md:py-16 lg:py-24">
          <div className="container mx-auto px-4 md:px-6 max-w-7xl">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">シンプルな料金プラン</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  透明性のある価格設定で、すべての機能を利用できます
                </p>
              </div>
            </div>
            <div className="mx-auto max-w-4xl py-8">
              <div className="grid gap-8 lg:grid-cols-1">
                <div className="flex flex-col p-8 bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/50 dark:from-gray-900 dark:via-blue-950/30 dark:to-indigo-950/30 rounded-2xl border-2 border-blue-200 shadow-xl hover:shadow-2xl transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800 dark:text-white">スタンダードプラン</h3>
                      <p className="text-muted-foreground">すべての機能を含む</p>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold text-green-600">1ヶ月無料</div>
                      <div className="text-sm text-muted-foreground">その後 ¥490/月</div>
                    </div>
                  </div>
                  <ul className="mt-6 space-y-3">
                    <li className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                      <span className="text-gray-700 dark:text-gray-300">ダッシュボード機能</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                      <span className="text-gray-700 dark:text-gray-300">カレンダー管理</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                      <span className="text-gray-700 dark:text-gray-300">トレード記録テーブル</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                      <span className="text-gray-700 dark:text-gray-300">詳細分析・レポート</span>
                    </li>
                  </ul>
                  <Link
                    href="/auth/signup"
                    className="mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 text-sm font-medium text-white shadow-lg transition-all duration-300 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    今すぐ始める
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="w-full py-8 md:py-16 lg:py-24 bg-gradient-to-b from-muted via-purple-50/30 to-muted dark:from-muted dark:via-purple-950/20 dark:to-muted">
          <div className="container mx-auto px-4 md:px-6 max-w-7xl">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">お問い合わせ</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  ご質問やご相談がございましたら、お気軽にお問い合わせください
                </p>
              </div>
            </div>
            <div className="mx-auto max-w-xl py-8">
              <div className="space-y-4 p-8 bg-gradient-to-br from-white via-purple-50/50 to-pink-50/50 dark:from-gray-900 dark:via-purple-950/30 dark:to-pink-950/30 rounded-2xl border border-purple-200 shadow-lg text-center">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">お問い合わせ先</h3>
                <p className="text-muted-foreground">ご連絡は以下のメールアドレスまでお願いします。</p>
                <a
                  href="mailto:support@fxnote.app"
                  className="inline-block text-lg font-semibold text-purple-700 dark:text-purple-300 underline underline-offset-4 hover:text-purple-800 dark:hover:text-purple-200"
                >
                  support@fxnote.app
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} FXNote. 全ての権利を保有します。
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            利用規約
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            プライバシーポリシー
          </Link>
        </nav>
      </footer>
    </div>
  )
}
