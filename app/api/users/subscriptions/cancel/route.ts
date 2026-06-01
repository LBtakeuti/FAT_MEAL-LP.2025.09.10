import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import Stripe from 'stripe';
import { postSlack } from '@/lib/slack';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const REASON_LABELS: Record<string, string> = {
  too_much_quantity: '届く量が多すぎた',
  too_frequent: '配送の頻度が多すぎた',
  freezer_full: '冷凍庫に入りきらなかった',
  taste_mismatch: '味が自分に合わなかった',
  menu_variety: 'メニューのバリエーションが少なかった',
  nutrition_mismatch: 'カロリーや栄養バランスが合わなかった',
  too_expensive: '料金が高いと感じた',
  unexpected_price: '想定していた料金と違った',
  goal_reached: '目標体重・体型に達した',
  sports_stopped: '部活・スポーツをやめた・休止した',
  self_managed: '自分で食事管理できるようになった',
  family_cooking: '家族・保護者が食事を用意できるようになった',
  confusing_ui: '注文・解約の操作がわかりにくかった',
  didnt_know_2pieces: '1食が2個であることを知らなかった',
  delivery_schedule: '配送日の調整が難しかった',
};

async function sendCancellationSlackNotification(params: {
  customerName: string;
  customerEmail: string;
  planName: string;
  reasons: string[];
  message?: string;
}) {
  const reasonTexts = params.reasons
    .map(r => REASON_LABELS[r] || r)
    .map(r => `• ${r}`)
    .join('\n');

  const blocks: any[] = [
    {
      type: 'header',
      text: { type: 'plain_text', text: '⚠️ サブスクリプション解約', emoji: true },
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*お客様名:*\n${params.customerName}` },
        { type: 'mrkdwn', text: `*メール:*\n${params.customerEmail}` },
      ],
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*プラン:*\n${params.planName}` },
      ],
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*解約理由:*\n${reasonTexts}` },
    },
  ];

  if (params.message) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*コメント:*\n${params.message}` },
    });
  }

  blocks.push(
    { type: 'divider' },
    {
      type: 'context',
      elements: [
        { type: 'mrkdwn', text: `📅 ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}` },
      ],
    }
  );

  await postSlack('sales', blocks);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscriptionId, stripeSubscriptionId, reasons, message } = body;

    if (!subscriptionId || !stripeSubscriptionId || !reasons || reasons.length === 0) {
      return NextResponse.json(
        { error: '必須項目が不足しています' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // サブスクリプションの存在確認と情報取得
    const { data: subscription, error: subError } = await (supabase
      .from('subscriptions') as any)
      .select('id, status, stripe_subscription_id, shipping_address, user_id, plan_name, created_at')
      .eq('id', subscriptionId)
      .single();

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'サブスクリプションが見つかりません' },
        { status: 404 }
      );
    }

    if (subscription.status !== 'active') {
      return NextResponse.json(
        { error: 'このサブスクリプションは既に解約済みまたはアクティブではありません' },
        { status: 400 }
      );
    }

    // F21: 3ヶ月縛り（F21リリース日以降に契約した新規ユーザーのみ適用）
    const CUTOFF_DATE = new Date('2026-06-01T00:00:00+09:00');
    const subscriptionCreatedAt = new Date(subscription.created_at);
    if (subscriptionCreatedAt >= CUTOFF_DATE) {
      const cancelableFrom = new Date(subscriptionCreatedAt);
      cancelableFrom.setMonth(cancelableFrom.getMonth() + 3);
      if (new Date() < cancelableFrom) {
        return NextResponse.json(
          {
            error: 'ご契約から3ヶ月経過後に解約可能となります',
            cancelableFrom: cancelableFrom.toISOString(),
          },
          { status: 403 }
        );
      }
    }

    const shippingAddress = subscription.shipping_address as any;
    const customerEmail = shippingAddress?.email || '';
    const customerName = shippingAddress?.name || '';

    // 解約リクエストをDBに保存
    const { error: insertError } = await (supabase
      .from('subscription_cancellation_requests') as any)
      .insert({
        subscription_id: subscriptionId,
        stripe_subscription_id: stripeSubscriptionId,
        customer_email: customerEmail,
        customer_name: customerName,
        reasons: reasons,
        reason: reasons.join(', '),
        message: message || null,
        status: 'completed',
        user_id: subscription.user_id,
        cancelled_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Failed to insert cancellation request:', insertError);
      return NextResponse.json(
        { error: '解約リクエストの保存に失敗しました' },
        { status: 500 }
      );
    }

    // Stripe APIでサブスクリプションを解約
    // これにより customer.subscription.deleted webhook が発火し、
    // DB更新 + pending配送キャンセル + 解約通知メール送信が自動実行される
    await stripe.subscriptions.cancel(stripeSubscriptionId);

    // Slack通知
    await sendCancellationSlackNotification({
      customerName,
      customerEmail,
      planName: subscription.plan_name || 'ふとるめし定期プラン',
      reasons,
      message: message || undefined,
    });

    console.log(`[Cancel API] Subscription ${stripeSubscriptionId} cancelled by user. Reasons: ${reasons.join(', ')}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error canceling subscription:', error);
    return NextResponse.json(
      { error: error.message || '解約処理に失敗しました' },
      { status: 500 }
    );
  }
}
