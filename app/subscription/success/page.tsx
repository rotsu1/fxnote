export default function SubscriptionSuccessPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full border rounded-lg p-6 space-y-4 text-center">
        <h1 className="text-2xl font-semibold">ありがとうございます！</h1>
        <p className="text-sm text-muted-foreground">
          決済を処理しています。完了後、ダッシュボードにアクセスできます。
        </p>
        <a href="/dashboard" className="text-blue-600 underline">ダッシュボードへ</a>
      </div>
    </div>
  )
}

