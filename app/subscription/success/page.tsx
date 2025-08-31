"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function SubscriptionSuccess() {
  const router = useRouter();
  const [message, setMessage] = useState('サブスクリプションを確認しています...');

  useEffect(() => {
    const go = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) {
          setMessage('セッションが見つかりません。ログインに戻ります...');
          setTimeout(() => router.replace('/auth/login'), 1500);
          return;
        }
        const res = await fetch('/api/me/subscription-status', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const j = await res.json();
          if (j.route === '/subscription') {
            // Still no history? Unlikely, but stay on subscription
            setMessage('プラン選択に戻ります...');
            setTimeout(() => router.replace('/subscription'), 800);
          } else if (j.access === 'limited') {
            setMessage('ダッシュボード（設定）へ移動します...');
            setTimeout(() => router.replace('/dashboard/settings'), 800);
          } else {
            setMessage('ダッシュボードへ移動します...');
            setTimeout(() => router.replace('/dashboard/overview'), 800);
          }
          return;
        }
      } catch {}
      setMessage('ダッシュボードへ移動します...');
      setTimeout(() => router.replace('/dashboard/overview'), 1000);
    };
    go();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-gray-600">{message}</p>
    </main>
  );
}

