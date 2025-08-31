import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isActiveStripeStatus(status?: string) {
  // アクティブ判定は trialing / active
  return status === 'active' || status === 'trialing';
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!accessToken) {
      return NextResponse.json({ error: 'Missing access token' }, { status: 401 });
    }

    // 1) トークンからユーザー確定
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(accessToken);
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
    const user = userData.user;

    // 2) 最新の購読レコードを取得（更新の新しい順に1件）
    const { data: subs, error: subsErr } = await supabaseAdmin
      .from('subscriptions')
      .select('status,current_period_end,cancel_at,ended_at,updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (subsErr) {
      console.error('subs fetch error:', subsErr);
      return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
    }

    const hasHistory = !!subs && subs.length > 0;
    const now = new Date();

    let isActive = false;
    let status: string | undefined;

    if (hasHistory) {
      const s = subs![0];
      status = s.status ?? undefined;

      const periodOk =
        s.current_period_end ? new Date(s.current_period_end) > now : false;

      const notEnded = !s.ended_at;
      // 期末解約予約(cancel_at)が将来ならその時点までは有効扱い
      const notCanceledYet = !s.cancel_at || new Date(s.cancel_at) > now;

      isActive = isActiveStripeStatus(status) && periodOk && notEnded && notCanceledYet;
    }

    // 3) 遷移先とアクセスレベル
    // 初回：/subscription
    // 非アクティブ（履歴あり）：/dashboard（limited）
    // アクティブ：/dashboard（full）
    let route: '/subscription' | '/dashboard';
    let access: 'none' | 'limited' | 'full';
    let reason: 'no_history' | 'inactive' | 'active';

    if (!hasHistory) {
      route = '/subscription';
      access = 'none';
      reason = 'no_history';
    } else if (isActive) {
      route = '/dashboard';
      access = 'full';
      reason = 'active';
    } else {
      route = '/dashboard';
      access = 'limited';
      reason = 'inactive';
    }

    return NextResponse.json({
      route,
      access,          // ← ダッシュボード側で機能制御に使う
      isActive,
      hasHistory,
      status: status ?? null,
      reason,
    });
  } catch (e: any) {
    console.error('subscription-status error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
