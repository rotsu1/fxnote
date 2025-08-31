// app/subscription/page.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleSubscribe = async () => {
    setErr(null);
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        throw new Error('認証トークンが見つかりません。ログインしてください。');
      }
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${res.status}`);
      }
      const { url } = await res.json();
      if (!url) throw new Error('チェックアウトURLが取得できませんでした');
      window.location.href = url; // Stripe Checkoutへ遷移
    } catch (e: any) {
      setErr(e.message ?? 'チェックアウトの開始に失敗しました');
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-3xl font-bold mb-6">プランを選択</h1>

      <div className="rounded-2xl border shadow-sm p-6">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold">¥490</span>
          <span className="text-gray-600">/ 月</span>
        </div>
        <p className="mt-2 text-sm text-gray-600">初月無料・すべての機能が使えます</p>

        <ul className="mt-6 space-y-2 text-sm">
          <li>・トレード記録・分析の全機能</li>
          <li>・タグ/戦略/感情フィルタによる詳細分析</li>
          <li>・将来のアップデートも含む</li>
        </ul>

        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="mt-8 w-full rounded-xl border border-black bg-black text-white py-3 font-medium hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'リダイレクト中…' : '申し込む（初月無料）'}
        </button>

        {err && (
          <p className="mt-3 text-sm text-red-600">
            エラー: {err}
          </p>
        )}

        <p className="mt-4 text-xs text-gray-500">
          決済ページに移動します。キャンセル時は課金されません。
        </p>
      </div>
    </main>
  );
}

