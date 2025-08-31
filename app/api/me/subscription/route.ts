import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!accessToken) return NextResponse.json({ error: 'Missing access token' }, { status: 401 });

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(accessToken);
    if (userErr || !userData?.user) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    const user = userData.user;

    const { data: subs, error: subsErr } = await supabaseAdmin
      .from('subscriptions')
      .select('id,status,trial_end,current_period_end,cancel_at,cancel_at_period_end,ended_at,updated_at,stripe_subscription_id')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1);
    if (subsErr) {
      console.error('me/subscription fetch error:', subsErr);
      return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
    }
    const sub = subs && subs.length > 0 ? subs[0] : null;
    return NextResponse.json({ subscription: sub });
  } catch (e: any) {
    console.error('me/subscription error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

