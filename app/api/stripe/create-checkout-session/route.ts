// app/api/stripe/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1) Bearer トークンを取得
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!accessToken) {
      return NextResponse.json({ error: 'Missing access token' }, { status: 401 });
    }

    // 2) トークンからユーザーを取得（本人性の検証）
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(accessToken);
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
    const user = userData.user; // { id, email, ... }

    // 3) プロファイルの stripe_customer_id を確認/作成
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (profileErr && profileErr.code !== 'PGRST116') {
      console.error('load profile error:', profileErr);
      return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 });
    }

    let customerId = profile?.stripe_customer_id as string | null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { userId: user.id },
      });
      customerId = customer.id;

      // 既に入っている場合を上書きしない（多重作成防止）
      const { error: upErr } = await supabaseAdmin
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
        .is('stripe_customer_id', null);

      if (upErr) {
        // 競合でNULL以外に変わっていた場合でも続行OK
        console.warn('profiles update warn:', upErr);
      }
    }

    // 4) 価格IDとURL（productIdにも対応）
    const priceEnv = process.env.STRIPE_PRICE_ID; // 例: price_xxx（推奨） or prod_xxx（製品IDも可）
    if (!priceEnv) {
      return NextResponse.json({ error: 'Missing STRIPE_PRICE_ID (expected price_... or prod_...)' }, { status: 500 });
    }

    let priceId: string | null = null;
    if (priceEnv.startsWith('price_')) {
      priceId = priceEnv;
    } else if (priceEnv.startsWith('prod_')) {
      // プロダクトIDが指定された場合、アクティブな月額の価格を探索
      const prices = await stripe.prices.list({ product: priceEnv, active: true, limit: 10 });
      const monthly = prices.data.find(p => (p.recurring?.interval === 'month'));
      priceId = (monthly || prices.data[0])?.id || null;
    }
    if (!priceId) {
      return NextResponse.json({ error: 'Could not resolve a Stripe Price for STRIPE_PRICE_ID' }, { status: 500 });
    }

    const origin =
      req.headers.get('origin') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3000';

    // 5) 既存サブスク有無でトライアル制御（任意：user_id or customer_idのどちらかで判定）
    const { data: subs, error: subsErr } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .or(`user_id.eq.${user.id},stripe_customer_id.eq.${customerId}`);

    if (subsErr) {
      console.error('check subs error:', subsErr);
      return NextResponse.json({ error: 'Failed to check subscription status' }, { status: 500 });
    }
    const isNew = !subs || subs.length === 0;

    // 6) Checkout Session 作成（初月無料：trial_period_days: 30）
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId || undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/subscription`,
      metadata: { userId: user.id },
      subscription_data: {
        trial_period_days: isNew ? 30 : undefined,
        metadata: { userId: user.id },
      },
      allow_promotion_codes: false,
    });

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    console.error('checkout error:', e);
    return NextResponse.json({ error: e.message ?? 'Checkout failed' }, { status: 500 });
  }
}
