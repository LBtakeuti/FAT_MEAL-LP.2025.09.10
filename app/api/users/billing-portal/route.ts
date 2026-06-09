/**
 * Stripe Customer Portal セッション作成API
 *
 * 認証ユーザーが自身のお支払い情報（カード）を更新するための
 * Stripe ホスティングページへのリダイレクト URL を返す。
 *
 * セキュリティ:
 * - 認証必須（verifyAuth）
 * - stripe_customer_id はサーバ側で auth.user.id を使って subscriptions テーブルから取得
 *   （クライアントから customer_id を受け取らない）
 */
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated || !auth.user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const supabase = createServerClient();

    // active または past_due のサブスクから stripe_customer_id を取得
    // 複数あれば最新（started_at desc）を採用
    const { data: subs, error } = await (supabase
      .from('subscriptions') as any)
      .select('stripe_customer_id, status, started_at')
      .eq('user_id', auth.user.id)
      .in('status', ['active', 'past_due'])
      .order('started_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('[billing-portal] subscription fetch error:', error);
      return NextResponse.json({ error: 'お支払い情報の取得に失敗しました' }, { status: 500 });
    }

    const sub = subs && subs.length > 0 ? subs[0] : null;
    if (!sub || !sub.stripe_customer_id) {
      return NextResponse.json({ error: '対象のサブスクリプションが見つかりません' }, { status: 404 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.futorumeshi.com';

    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${siteUrl}/mypage`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[billing-portal] error:', errMsg);
    // Stripe 側エラーは詳細をユーザーに返さない
    return NextResponse.json(
      { error: 'お支払い情報ページの起動に失敗しました' },
      { status: 500 }
    );
  }
}
