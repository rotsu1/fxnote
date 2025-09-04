import Link from "next/link"

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-dvh">
      <header className="px-4 lg:px-6 h-14 flex items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <Link href="/" className="text-sm font-medium hover:underline underline-offset-4">
          ← ホームに戻る
        </Link>
        <div className="ml-auto text-xs text-muted-foreground">最終更新日：2025年9月4日</div>
      </header>

      <main className="flex-1">
        <section className="w-full py-8 md:py-12">
          <div className="container mx-auto px-4 md:px-6 max-w-3xl">
            <h1 className="text-3xl font-bold tracking-tight mb-6">利用規約</h1>
            <p className="text-muted-foreground mb-8">
              この利用規約（以下「本規約」）は、FXNote（以下「本サービス」）の提供条件および利用者の皆さま（以下「ユーザー」）による本サービスの利用条件を定めるものです。本サービスをご利用になる前に、本規約をよくお読みください。本サービスを利用した時点で、本規約に同意したものとみなします。
            </p>

            <div className="space-y-8 text-sm leading-7">
              <section>
                <h2 className="text-xl font-semibold mb-2">1. 適用</h2>
                <p>
                  本規約は、本サービスの提供および利用に関わる一切の関係に適用されます。当社（FXNote運営者）は必要に応じて本規約を変更できます。変更後の本規約は、本ページに掲載された時点から効力を生じます。
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-2">2. 本サービスの内容</h2>
                <p>
                  本サービスは、FX・暗号資産・株式等のトレードに関する記録、可視化、分析、学習のためのノート機能等を提供するツールです。ユーザー自身のトレード履歴・メモ等のデータを記録・表示するためのアプリケーションであり、投資助言や売買の推奨を行うものではありません。
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-2">3. アカウント</h2>
                <ul className="list-disc pl-5 space-y-1">
                  <li>ユーザーは正確かつ最新の情報でアカウントを登録してください。</li>
                  <li>ログイン情報の管理はユーザーの責任で行ってください。第三者による不正利用があっても、当社は責任を負いません。</li>
                  <li>不正利用、規約違反が判明した場合、当社はアカウントの停止または削除を行うことがあります。</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-2">4. 料金・支払い・解約</h2>
                <ul className="list-disc pl-5 space-y-1">
                  <li>本サービスには無料トライアル期間（1ヶ月）が含まれる有料プランがあり、トライアル終了後は月額料金（例：¥490/月）が自動的に課金されます。</li>
                  <li>料金・プラン内容は予告なく変更される場合があります。最新の価格はアプリ内の表示が優先されます。</li>
                  <li>サブスクリプションはユーザーの操作でいつでも解約できます。解約は次回更新以降に反映され、既に支払い済みの期間の日割り返金は行いません。</li>
                  <li>支払いが不履行となった場合、当社はサービス提供を停止または制限することがあります。</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-2">5. ユーザーコンテンツとデータ</h2>
                <ul className="list-disc pl-5 space-y-1">
                  <li>ユーザーが本サービスに保存するデータ（トレード履歴、ノート、設定等）の所有権はユーザーに帰属します。</li>
                  <li>当社は、本サービスの運営、品質向上、サポート提供の目的で、適切な範囲でデータを取り扱います。</li>
                  <li>当社は合理的なセキュリティ対策を講じますが、完全な無停止稼働やデータの完全性・永続性を保証するものではありません。重要なデータはユーザー自身でバックアップしてください。</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-2">6. 禁止事項</h2>
                <ul className="list-disc pl-5 space-y-1">
                  <li>法令または公序良俗に違反する行為</li>
                  <li>他者の権利を侵害する行為（知的財産、プライバシー等）</li>
                  <li>不正アクセス、リバースエンジニアリング、過度な負荷を与える行為</li>
                  <li>本サービスの趣旨に反する不当な利用や営利目的での再販等</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-2">7. 投資助言等に関する免責</h2>
                <p>
                  本サービスは投資助言、投資勧誘、売買の推奨、パフォーマンスの保証を行うものではありません。ユーザーは自身の判断と責任により取引を行い、その結果について当社は一切責任を負いません。
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-2">8. 保障の否認および責任制限</h2>
                <ul className="list-disc pl-5 space-y-1">
                  <li>本サービスは「現状有姿」で提供されます。明示または黙示を問わず、特定目的適合性や無欠陥を保証しません。</li>
                  <li>当社は、間接損害、特別損害、逸失利益、データ消失、機会損失等について、一切の責任を負いません。</li>
                  <li>法令上責任制限が認められない場合は、適用法の許容範囲内で最大限に制限されます。</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-2">9. サービスの変更・停止</h2>
                <p>
                  当社は、保守、セキュリティ、運用上の理由等により、事前通知の有無にかかわらず、本サービスの全部または一部を変更、中断、終了することができます。
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-2">10. 規約の変更</h2>
                <p>
                  当社は、必要に応じて本規約を変更できます。重要な変更がある場合は、アプリ内のお知らせ等で通知するよう努めます。変更後に本サービスを利用した場合、変更後の規約に同意したものとみなします。
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-2">11. 準拠法および管轄</h2>
                <p>
                  本規約の解釈および適用は、日本法に準拠します。本サービスに関して当社とユーザーの間で生じた紛争については、当社所在地を管轄する裁判所を第一審の専属的合意管轄裁判所とします。
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-2">12. お問い合わせ</h2>
                <p>
                  本規約および本サービスに関するお問い合わせは、<a className="underline" href="mailto:support@fxnote.app">support@fxnote.app</a> までご連絡ください。
                </p>
              </section>
            </div>

            <div className="mt-10">
              <Link href="/" className="text-sm text-primary underline underline-offset-4">
                ホームに戻る
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} FXNote. 全ての権利を保有します。
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="/terms" className="text-xs hover:underline underline-offset-4">
            利用規約
          </Link>
          <Link href="/privacy" className="text-xs hover:underline underline-offset-4">
            プライバシーポリシー
          </Link>
        </nav>
      </footer>
    </div>
  )
}
