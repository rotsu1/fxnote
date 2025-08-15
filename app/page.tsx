"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mountain, BarChart3, Calendar, Table, TrendingUp, Mail, Phone, MapPin } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"

export default function Component() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error("Session check error:", error)
        } else if (session) {
          // User is authenticated, redirect to dashboard
          router.push("/dashboard")
          return
        }
      } catch (error) {
        console.error("Unexpected error during session check:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [router])

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
          <Image src="/logo.svg?height=30&width=30" width="30" height="30" alt="Unbalancer Logo" />
          <span className="ml-2 font-bold text-lg">Unbalancer</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link href="/login" className="text-sm font-medium hover:underline underline-offset-4">
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
            onClick={() => scrollToSection('company')}
            className="text-sm font-medium hover:underline underline-offset-4"
          >
            会社概要
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
        <section id="hero" className="w-full py-6 sm:py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container mx-auto px-4 md:px-6 max-w-7xl">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Unbalancer
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
                    href="/signup"
                    className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                  >
                    今すぐ始める
                  </Link>
                  <button
                    onClick={() => scrollToSection('features')}
                    className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                  >
                    詳細を見る
                  </button>
                </div>
              </div>
              <Image
                src="/chatgpt_image.png?height=550&width=550"
                width="550"
                height="550"
                alt="Unbalancer Dashboard"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last lg:aspect-square"
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container mx-auto px-4 md:px-6 max-w-7xl">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">主要機能</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Unbalancerの包括的な機能で、トレードパフォーマンスを最大化しましょう
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-2 lg:gap-12">
              <div className="flex flex-col justify-center space-y-4">
                <ul className="grid gap-6">
                  <li>
                    <div className="grid gap-1">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-6 w-6 text-primary" />
                        <h3 className="text-xl font-bold">ダッシュボード</h3>
                      </div>
                      <p className="text-muted-foreground">
                        トレードの概要とパフォーマンスを一目で確認できる包括的なダッシュボード
                      </p>
                    </div>
                  </li>
                  <li>
                    <div className="grid gap-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-6 w-6 text-primary" />
                        <h3 className="text-xl font-bold">カレンダーページ</h3>
                      </div>
                      <p className="text-muted-foreground">
                        トレードのスケジュールと履歴をカレンダー形式で管理
                      </p>
                    </div>
                  </li>
                  <li>
                    <div className="grid gap-1">
                      <div className="flex items-center gap-2">
                        <Table className="h-6 w-6 text-primary" />
                        <h3 className="text-xl font-bold">テーブルページ</h3>
                      </div>
                      <p className="text-muted-foreground">
                        Excelライクな形式でトレード記録を保存・閲覧・管理
                      </p>
                    </div>
                  </li>
                  <li>
                    <div className="grid gap-1">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-6 w-6 text-primary" />
                        <h3 className="text-xl font-bold">分析ページ</h3>
                      </div>
                      <p className="text-muted-foreground">
                        詳細な分析とレポートでトレード戦略を最適化
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
              <Image
                src="/placeholder.svg?height=310&width=550"
                width="550"
                height="310"
                alt="Features Overview"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full"
              />
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 md:px-6 max-w-7xl">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">シンプルな料金プラン</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  透明性のある価格設定で、すべての機能を利用できます
                </p>
              </div>
            </div>
            <div className="mx-auto max-w-4xl py-12">
              <div className="grid gap-8 lg:grid-cols-1">
                <div className="flex flex-col p-6 bg-muted rounded-lg border-2 border-primary">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold">スタンダードプラン</h3>
                      <p className="text-muted-foreground">すべての機能を含む</p>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold">¥490</div>
                      <div className="text-sm text-muted-foreground">月額</div>
                    </div>
                  </div>
                  <ul className="mt-6 space-y-2">
                    <li className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                      ダッシュボード機能
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                      カレンダー管理
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                      トレード記録テーブル
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                      詳細分析・レポート
                    </li>
                  </ul>
                  <Link
                    href="/signup"
                    className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                  >
                    今すぐ始める
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 md:px-6 max-w-7xl">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">お問い合わせ</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  ご質問やご相談がございましたら、お気軽にお問い合わせください
                </p>
              </div>
            </div>
            <div className="mx-auto max-w-xl py-12">
              <div className="space-y-6">
                <h3 className="text-2xl font-bold">お問い合わせフォーム</h3>
                <form className="space-y-4">
                  <div className="grid gap-2">
                    <Input type="text" placeholder="お名前" />
                  </div>
                  <div className="grid gap-2">
                    <Input type="email" placeholder="メールアドレス" />
                  </div>
                  <div className="grid gap-2">
                    <Input type="text" placeholder="件名" />
                  </div>
                  <div className="grid gap-2">
                    <textarea 
                      placeholder="お問い合わせ内容"
                      className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    送信
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Unbalancer. 全ての権利を保有します。
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
