import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { stripe } from '@/lib/stripe';
import { upsertSubscriptionFromStripe } from '@/lib/stripeFunctions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!accessToken) return NextResponse.json({ error: 'Missing access token' }, { status: 401 });

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(accessToken);
    if (userErr || !userData?.user) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    const user = userData.user;

    // Get latest subscription for the user
    const { data: subs, error: subsErr } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_subscription_id,status,ended_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1);
    if (subsErr) {
      console.error('cancel-subscription fetch error:', subsErr);
      return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
    }
    if (!subs || subs.length === 0) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
    }
    const latest = subs[0];
    if (!latest.stripe_subscription_id) {
      return NextResponse.json({ error: 'No Stripe subscription id' }, { status: 400 });
    }
    if (latest.status !== 'active' && latest.status !== 'trialing') {
      return NextResponse.json({ error: 'Subscription is not active or trialing' }, { status: 400 });
    }

    // Set cancel_at_period_end
    const updated = await stripe.subscriptions.update(latest.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    // Reflect in DB (also covered by webhook, but do it now for immediate UX)
    await upsertSubscriptionFromStripe(updated);

    return NextResponse.json({ ok: true, subscription: {
      status: updated.status,
      cancel_at: updated.cancel_at ? new Date(updated.cancel_at * 1000).toISOString() : null,
      cancel_at_period_end: updated.cancel_at_period_end,
      current_period_end: (updated as any).current_period_end ? new Date((updated as any).current_period_end * 1000).toISOString() : null,
    }});
  } catch (e: any) {
    console.error('cancel-subscription error:', e);
    return NextResponse.json({ error: e.message ?? 'Cancel failed' }, { status: 500 });
  }
}

