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
              </div>
              <div className="border rounded-md p-4 h-64 overflow-y-auto text-sm space-y-3 bg-muted/30">
                <h3 className="text-base font-semibold">1. 適用</h3>
                <p>この利用規約（以下「本規約」）は、FXNote（以下「本サービス」）の提供条件およびユーザーの利用条件を定めます。当社は必要に応じて本規約を変更でき、変更後は本ページ掲載時に効力を生じます。</p>
                <h3 className="text-base font-semibold">2. 本サービスの内容</h3>
                <p>本サービスは、FX・暗号資産・株式等のトレードに関する記録、可視化、分析、学習のためのノート機能等を提供するツールであり、投資助言や売買の推奨は行いません。</p>
                <h3 className="text-base font-semibold">3. アカウント</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>正確かつ最新の情報で登録すること。</li>
                  <li>ログイン情報の管理はユーザーの責任。</li>
                  <li>不正利用・規約違反時はアカウント停止等の措置。</li>
                </ul>
                <h3 className="text-base font-semibold">4. 料金・支払い・解約</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>1ヶ月無料後は月額¥490（変更あり）。</li>
                  <li>料金・プランの変更あり。最新はアプリ表示が優先。</li>
                  <li>解約は次回更新から反映。日割り返金なし。</li>
                  <li>不履行時は提供停止や制限の可能性。</li>
                </ul>
                <h3 className="text-base font-semibold">5. ユーザーコンテンツとデータ</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>保存データの所有権はユーザーに帰属。</li>
                  <li>運営・品質向上・サポート目的で適切に取扱い。</li>
                  <li>合理的なセキュリティ対策を講じるが完全保証はしない。バックアップはユーザー責任。</li>
                </ul>
                <h3 className="text-base font-semibold">6. 禁止事項</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>法令・公序良俗違反</li>
                  <li>権利侵害（知的財産・プライバシー等）</li>
                  <li>不正アクセス、リバースエンジニアリング、過度な負荷</li>
                  <li>本サービス趣旨に反する不当な利用・再販等</li>
                </ul>
                <h3 className="text-base font-semibold">7. 投資助言等に関する免責</h3>
                <p>本サービスは投資助言、勧誘、売買推奨、パフォーマンスの保証を行いません。トレードは自己判断・自己責任で行ってください。</p>
                <h3 className="text-base font-semibold">8. 保障の否認および責任制限</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>「現状有姿」での提供。無欠陥・特定目的適合性は保証しません。</li>
                  <li>間接損害・逸失利益・データ消失等の責任を負いません。</li>
                </ul>
                <h3 className="text-base font-semibold">9. サービスの変更・停止</h3>
                <p>保守・セキュリティ・運用上の理由により、事前通知なく変更・中断・終了する場合があります。</p>
                <h3 className="text-base font-semibold">10. 規約の変更</h3>
                <p>必要に応じて本規約を変更します。重要な変更はアプリ内で通知に努めます。変更後の利用により同意とみなされます。</p>
                <h3 className="text-base font-semibold">11. 準拠法および管轄</h3>
                <p>日本法に準拠。当社所在地を管轄する裁判所を第一審の専属的合意管轄とします。</p>
                <h3 className="text-base font-semibold">12. お問い合わせ</h3>
                <p>fxnote.help@gmail.com までご連絡ください。</p>
              </div>
            </section>

            <section>
              <div className="flex items-start gap-3 mb-2">
                <Checkbox id="privacy" checked={checkedPrivacy} onCheckedChange={(v) => setCheckedPrivacy(Boolean(v))} />
                <label htmlFor="privacy" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  プライバシーポリシーを読みました
                </label>
              </div>
              <div className="border rounded-md p-4 h-64 overflow-y-auto text-sm space-y-3 bg-muted/30">
                <h3 className="text-base font-semibold">1. 基本方針</h3>
                <p>ユーザーデータ（トレード履歴、ノート、設定、アカウント情報等）は安全に保管し、サービス提供・維持・セキュリティ確保に必要な範囲を超えて利用しません。マーケティング、広告、外部への販売・共有は行いません。</p>
                <h3 className="text-base font-semibold">2. 取得する情報</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>アカウント情報（メールアドレス、認証情報 等）</li>
                  <li>ユーザーが保存するデータ（トレード記録、ノート、タグ、設定 等）</li>
                  <li>運用に必要な技術情報（エラーログ、アクセス時刻、IPアドレス等）</li>
                </ul>
                <h3 className="text-base font-semibold">3. 利用目的</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>サービスの提供（データ保存・表示・同期）</li>
                  <li>アカウント作成・認証・セキュリティ</li>
                  <li>障害対応・品質向上のための最小限の運用解析</li>
                </ul>
                <h3 className="text-base font-semibold">4. 第三者提供・共同利用</h3>
                <p>法令に基づく場合を除き同意なく第三者に提供しません。委託先（例：Supabase等）は契約に基づき目的外利用を禁止します。</p>
                <h3 className="text-base font-semibold">5. 保存期間・削除</h3>
                <p>ユーザーデータは削除またはアカウント削除まで保存。削除後もバックアップに一定期間残存する場合があります。</p>
                <h3 className="text-base font-semibold">6. セキュリティ</h3>
                <p>適切な技術的・組織的安全管理措置を講じますが、100%の安全性は保証できません。</p>
                <h3 className="text-base font-semibold">7. クッキー等</h3>
                <p>ログイン維持やセキュリティのため最小限のクッキー・ローカルストレージ等を使用。広告目的のトラッキングは行いません。</p>
                <h3 className="text-base font-semibold">8. ユーザーの権利</h3>
                <p>データの閲覧・修正・削除が可能です。連絡先：fxnote.help@gmail.com</p>
                <h3 className="text-base font-semibold">9. 改定</h3>
                <p>法令やサービス内容の変更に応じて改定される場合があります。重要な変更はアプリ内で通知します。</p>
                <h3 className="text-base font-semibold">10. お問い合わせ</h3>
                <p>fxnote.help@gmail.com までご連絡ください。</p>
              </div>
            </section>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <div className="flex items-center justify-end gap-3">
              <Button onClick={handleSubmit} disabled={!canSubmit}>
                {saving ? "保存中..." : "同意して進む"}
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              この操作により、本ページに記載の利用規約およびプライバシーポリシーに同意したものとみなされます。
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
