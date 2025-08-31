import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Crown, Receipt, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { ConfirmDialog } from "@/components/business/common/alert-dialog";

type SubRow = {
  status: string | null;
  trial_end: string | null;
  current_period_end: string | null;
  cancel_at: string | null;
  cancel_at_period_end: boolean | null;
  ended_at: string | null;
};

export function CurrentPlan() {
  const [sub, setSub] = useState<SubRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const plan = {
    name: 'FXNote Pro',
    price: '¥490',
    period: '月額',
    features: [
      '無制限の取引記録',
      '高度な分析ツール',
      'カスタムタグ',
      'データエクスポート',
    ],
  };

  const formatDate = (iso: string | null | undefined) => {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const refresh = async () => {
    try {
      setError(null);
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;
      const res = await fetch('/api/me/subscription', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('サブスクリプション情報の取得に失敗しました');
      const j = await res.json();
      setSub(j.subscription);
    } catch (e: any) {
      setError(e.message ?? '読み込みに失敗しました');
    }
  };

  useEffect(() => { refresh(); }, []);

  const isActive = sub?.status === 'active' || sub?.status === 'trialing';
  const isCancelScheduled = !!sub?.cancel_at && new Date(sub.cancel_at) > new Date();
  const endDate = sub?.status === 'trialing' ? sub?.trial_end : sub?.current_period_end;

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('認証が必要です');
      const res = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || 'キャンセルに失敗しました');
      }
      await refresh();
    } catch (e: any) {
      setError(e.message ?? 'キャンセルに失敗しました');
    } finally {
      setIsCancelling(false);
      setConfirmOpen(false);
    }
  };

  const handleResubscribe = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('認証が必要です');
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || 'チェックアウトの開始に失敗しました');
      }
      const { url } = await res.json();
      if (!url) throw new Error('チェックアウトURLが取得できませんでした');
      window.location.href = url;
    } catch (e: any) {
      setError(e.message ?? '再購読の開始に失敗しました');
    }
  };

  const getStatusBadge = () => {
    if (!sub) {
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-800">未加入</Badge>
      );
    }
    if (isCancelScheduled) {
      return (
        <Badge variant="secondary" className="bg-orange-100 text-orange-800">終了予定</Badge>
      );
    }
    if (sub.status === 'trialing') {
      return (
        <Badge variant="default" className="bg-purple-100 text-purple-800">トライアル中</Badge>
      );
    }
    if (sub.status === 'active') {
      return (
        <Badge variant="default" className="bg-blue-100 text-blue-800">アクティブ</Badge>
      );
    }
    return (
      <Badge variant="destructive" className="bg-red-100 text-red-800">無効</Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-yellow-600" />
          現在のプラン
        </CardTitle>
        <CardDescription>あなたのサブスクリプションプラン</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <Crown className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{plan.name}</h3>
              <p className="text-2xl font-bold text-blue-600">
                {plan.price}<span className="text-sm font-normal text-muted-foreground">/{plan.period}</span>
              </p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">含まれる機能</h4>
          <ul className="space-y-1">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg border">
          <div className="flex items-center gap-2 mb-2">
            <Receipt className="h-4 w-4 text-gray-600" />
            <span className="font-medium text-sm">{isActive ? (isCancelScheduled ? 'サービス終了日' : (sub?.status === 'trialing' ? 'トライアル終了日' : '次回支払い日')) : '状態'}</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">
            {isActive ? formatDate(endDate) : (sub ? '無効' : '未加入')}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {isCancelScheduled ? 'キャンセル後もこの日までご利用いただけます' : isActive ? '現在ご利用中です' : 'サブスクリプションが有効ではありません'}
          </p>
          {isCancelScheduled && (
            <div className="mt-2 flex items-center gap-2 text-orange-700 text-sm">
              <AlertTriangle className="h-4 w-4" />
              キャンセルが予約されています
            </div>
          )}
        </div>

        {error && (
          <div className="text-sm text-red-600">{error}</div>
        )}

        {isActive ? (
          <>
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => setConfirmOpen(true)}
              disabled={isCancelling || isCancelScheduled}
            >
              {isCancelScheduled ? 'キャンセル予約済み' : (isCancelling ? '処理中...' : 'サブスクリプションをキャンセル')}
            </Button>
            <ConfirmDialog
              open={confirmOpen}
              onOpenChange={setConfirmOpen}
              title="サブスクリプションをキャンセルしますか？"
              description="キャンセルしても、期間終了日までは引き続きご利用いただけます。"
              onConfirm={handleCancel}
            />
          </>
        ) : (
          <Button variant="default" className="w-full" onClick={handleResubscribe}>
            再購読（初月無料）
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
