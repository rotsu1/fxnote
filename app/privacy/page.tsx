import Link from "next/link"

export default function PrivacyPage() {
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
            <h1 className="text-3xl font-bold tracking-tight mb-6">プライバシーポリシー</h1>
            <p className="text-muted-foreground mb-8">
              本プライバシーポリシーは、FXNote（以下「本サービス」）におけるユーザーの個人情報等の取扱い方針を定めるものです。
            </p>

            <div className="space-y-8 text-sm leading-7">
              <section>
                <h2 className="text-xl font-semibold mb-2">1. 基本方針</h2>
                <p>
                  本サービスは、ユーザーのデータ（トレード履歴、ノート、設定、アカウント情報等）を安全に保管しますが、サービス提供・維持・セキュリティ確保に必要な範囲を超えて、これらのデータを利用しません。マーケティング、広告、外部への販売・共有は行いません。
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-2">2. 取得する情報</h2>
                <ul className="list-disc pl-5 space-y-1">
                  <li>アカウント情報（メールアドレス、認証情報 等）</li>
                  <li>アプリ内でユーザーが保存するデータ（トレード記録、ノート、タグ、設定 等）</li>
                  <li>サービス運用に必要な技術情報（エラーログ、アクセス時刻、IPアドレス等）</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-2">3. 利用目的</h2>
                <p>
                  取得した情報は、以下の目的に限定して利用します。
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>本サービスの提供（ユーザーデータの保存・表示・同期）</li>
                  <li>アカウントの作成・認証・セキュリティ対策</li>
                  <li>障害対応・不具合修正・品質向上のための最小限の運用解析</li>
                </ul>
                <p className="mt-2">上記以外の目的での利用は行いません。</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-2">4. 第三者提供・共同利用</h2>
                <p>
                  法令に基づく場合を除き、ユーザーの同意なく第三者に個人情報を提供しません。データは本サービスのインフラおよび認証のために委託先（例：Supabase 等のクラウドサービスプロバイダ）で取り扱われる場合がありますが、その場合も本ポリシーおよび委託契約に基づき、目的外利用を禁止します。
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-2">5. 保存期間・削除</h2>
                <p>
                  ユーザーデータは、ユーザーが削除するまで、またはアカウント削除時まで保存されます。アカウント削除後は、合理的な期間内に関連データを削除します（法令や技術的制約により一定期間バックアップに残存する場合があります）。
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-2">6. セキュリティ</h2>
                <p>
                  当社は、適切な技術的・組織的安全管理措置を講じ、データの不正アクセス・改ざん・漏えい・滅失・毀損の防止に努めます。ただし、インターネットを介したシステムにおいて100%の安全性を保証するものではありません。
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-2">7. クッキー等</h2>
                <p>
                  本サービスは、ログイン状態の維持やセキュリティのために、最小限のクッキー・ローカルストレージ等を使用する場合があります。広告目的のトラッキングは行いません。
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-2">8. ユーザーの権利</h2>
                <p>
                  ユーザーは、自己のデータの閲覧、修正、削除を行うことができます。ご希望やご不明点については下記窓口までお問い合わせください。
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-2">9. 改定</h2>
                <p>
                  本ポリシーは、法令やサービス内容の変更に応じて改定される場合があります。重要な変更がある場合は、アプリ内通知等でお知らせします。
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-2">10. お問い合わせ</h2>
                <p>
                  本ポリシーに関するお問い合わせは、<a className="underline" href="mailto:support@fxnote.app">support@fxnote.app</a> までご連絡ください。
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

