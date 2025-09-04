"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

export default function ConsentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkedTerms, setCheckedTerms] = useState(false)
  const [checkedPrivacy, setCheckedPrivacy] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.replace("/auth/login")
        return
      }
      // If already consented, bounce to post-login
      const { data, error } = await supabase
        .from("profiles")
        .select("is_concent")
        .eq("id", session.user.id)
        .single()
      if (!error && data && data.is_concent) {
        router.replace("/post-login")
        return
      }
      setLoading(false)
    }
    init()
  }, [router])

  const canSubmit = useMemo(() => checkedTerms && checkedPrivacy && !saving, [checkedTerms, checkedPrivacy, saving])

  const handleSubmit = async () => {
    setError(null)
    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.replace("/auth/login")
        return
      }
      const { error } = await supabase
        .from("profiles")
        .update({ is_concent: true })
        .eq("id", session.user.id)
      if (error) {
        setError("同意の保存に失敗しました。時間をおいて再試行してください。")
        setSaving(false)
        return
      }
      router.replace("/post-login")
    } catch (e) {
      setError("予期しないエラーが発生しました。")
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-14 flex items-center border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <Link href="/" className="text-sm font-medium hover:underline underline-offset-4">FXNote</Link>
        <div className="ml-auto text-xs text-muted-foreground">ご利用前の同意が必要です</div>
      </header>

      <main className="flex-1">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl py-8">
          <h1 className="text-2xl font-bold mb-2">利用に関する同意</h1>
          <p className="text-sm text-muted-foreground mb-6">
            本サービスの利用には、利用規約およびプライバシーポリシーへの同意が必要です。内容をご確認のうえチェックを入れて進んでください。
          </p>

          <div className="space-y-6">
            <section>
              <div className="flex items-start gap-3 mb-2">
                <Checkbox id="terms" checked={checkedTerms} onCheckedChange={(v) => setCheckedTerms(Boolean(v))} />
                <label htmlFor="terms" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  利用規約を読みました
                </label>
                <Link href="/terms" className="ml-auto text-xs underline underline-offset-4">全文を別タブで開く</Link>
              </div>
              <div className="border rounded-md p-4 h-48 overflow-y-auto text-sm space-y-3 bg-muted/30">
                <p className="font-semibold">概要</p>
                <p>本サービスはトレード記録・可視化・分析のためのツールであり、投資助言や売買推奨は行いません。ユーザーは自身の責任で本サービスを利用します。</p>
                <p className="font-semibold">料金</p>
                <p>1ヶ月無料の後、月額¥490（変更の可能性あり）。解約は次回更新から反映、返金は行いません。</p>
                <p className="font-semibold">禁止事項</p>
                <p>権利侵害、不正アクセス、過度な負荷、趣旨に反する利用等。</p>
                <p className="font-semibold">免責</p>
                <p>本サービスは現状有姿で提供され、当社は間接損害・逸失利益等に責任を負いません。</p>
                <p className="text-xs text-muted-foreground">詳細はページ下部のリンクまたは「全文を別タブで開く」をご覧ください。</p>
              </div>
            </section>

            <section>
              <div className="flex items-start gap-3 mb-2">
                <Checkbox id="privacy" checked={checkedPrivacy} onCheckedChange={(v) => setCheckedPrivacy(Boolean(v))} />
                <label htmlFor="privacy" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  プライバシーポリシーを読みました
                </label>
                <Link href="/privacy" className="ml-auto text-xs underline underline-offset-4">全文を別タブで開く</Link>
              </div>
              <div className="border rounded-md p-4 h-48 overflow-y-auto text-sm space-y-3 bg-muted/30">
                <p className="font-semibold">基本方針</p>
                <p>データはサービス提供・維持・セキュリティ確保の目的に限定して保存・利用し、マーケティング・広告・販売や目的外共有は行いません。</p>
                <p className="font-semibold">取得情報</p>
                <p>アカウント情報、ユーザーが保存するデータ、運用に必要な技術情報等。</p>
                <p className="font-semibold">第三者提供</p>
                <p>法令を除き第三者提供なし。委託先は目的限定で取り扱い。</p>
                <p className="font-semibold">ユーザーの権利</p>
                <p>データの閲覧・修正・削除が可能。お問い合わせ: support@fxnote.app</p>
              </div>
            </section>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <div className="flex items-center justify-end gap-3">
              <Link href="/" className="text-sm underline underline-offset-4">後で確認する</Link>
              <Button onClick={handleSubmit} disabled={!canSubmit}>
                {saving ? "保存中..." : "同意して進む"}
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              この操作により、<Link href="/terms" className="underline">利用規約</Link> と <Link href="/privacy" className="underline">プライバシーポリシー</Link> に同意したものとみなされます。
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

