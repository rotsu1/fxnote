"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { BarChart3, Calendar, Table, TrendingUp, FileText, Clock, CheckCircle, Star } from "lucide-react"
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
          router.push("/dashboard")
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
          <Link href="/" className="text-sm font-medium hover:underline underline-offset-4">
            ホーム
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full min-h-[calc(100vh-56px)] flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950/20 dark:via-amber-950/20 dark:to-yellow-950/20">
          <div className="container mx-auto px-4 md:px-6 max-w-7xl">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Clock className="h-8 w-8 text-orange-500" />
                    <span className="text-lg font-medium text-orange-600 bg-orange-100 px-3 py-1 rounded-full">
                      リリース準備中
                    </span>
                  </div>
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-6xl xl:text-7xl/none bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent">
                    Coming Soon
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    FXNoteの本格リリースまで、もうしばらくお待ちください
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">開発完了済み</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">テスト完了済み</span>
                  </div>
                  <div className="flex items-center gap-2 text-orange-600">
                    <Clock className="h-5 w-5" />
                    <span className="font-medium">決済システム審査中</span>
                  </div>
                </div>
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-amber-400/20 rounded-3xl blur-3xl"></div>
                <Image
                  src="/hero.webp?height=550&width=550"
                  width="550"
                  height="550"
                  alt="FXNote Coming Soon"
                  className="relative mx-auto aspect-video overflow-hidden rounded-3xl object-cover sm:w-full lg:order-last lg:aspect-square shadow-2xl ring-4 ring-orange-200/20"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Status Section */}
        <section className="w-full py-16 bg-gradient-to-b from-muted via-orange-50/30 to-muted dark:from-muted dark:via-orange-950/20 dark:to-muted">
          <div className="container mx-auto px-4 md:px-6 max-w-7xl">
            <div className="flex flex-col items-center justify-center space-y-8 text-center">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                  現在の状況
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed">
                  サービス開始に向けて着実に準備を進めています
                </p>
              </div>
              
              <div className="grid gap-6 md:grid-cols-3 max-w-4xl w-full">
                <div className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-orange-200 shadow-lg">
                  <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">開発完了</h3>
                  <p className="text-muted-foreground">すべての機能の開発が完了し、テストも完了しています</p>
                </div>
                
                <div className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-orange-200 shadow-lg">
                  <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full">
                    <Clock className="h-8 w-8 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">審査中</h3>
                  <p className="text-muted-foreground">Stripe決済システムの審査を待っている状態です</p>
                </div>
                
                <div className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-orange-200 shadow-lg">
                  <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full">
                    <Star className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">リリース準備</h3>
                  <p className="text-muted-foreground">審査完了後、すぐにサービスを開始いたします</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Preview Section */}
        <section className="w-full py-16 bg-gradient-to-b from-muted via-amber-50/30 to-muted dark:from-muted dark:via-amber-950/20 dark:to-muted">
          <div className="container mx-auto px-4 md:px-6 max-w-7xl">
            <div className="flex flex-col items-center justify-center space-y-8 text-center">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
                  リリース予定の機能
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed">
                  準備が完了している機能を一部ご紹介します
                </p>
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