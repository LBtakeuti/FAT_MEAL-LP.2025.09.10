/**
 * SetupIntent完了後にSubscriptionを開始するAPI
 * カード登録が成功した後にフロントから呼び出される
 *
 * セキュリティ:
 * - SetupIntentのcustomerとリクエストのcustomerIdの一致を検証
 * - 冪等性ガード: 同じSetupIntentで二重にSubscription作成しない
 */
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { confirmInitialSubscriptionPayment } from '@/lib/confirm-subscription-payment';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { setupIntentId, customerId } = await request.json();

    if (!setupIntentId || !customerId) {
      return NextResponse.json({ error: '必要な情報が不足しています' }, { status: 400 });
    }

    // SetupIntentからメタデータと支払い方法を取得
    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);

    if (setupIntent.status !== 'succeeded') {
      return NextResponse.json({ error: 'カード登録が完了していません' }, { status: 400 });
    }

    // 認証: SetupIntentのcustomerとリクエストのcustomerIdが一致するか検証
    if (setupIntent.customer !== customerId) {
      console.error(`[activate-subscription] Customer mismatch: setupIntent=${setupIntent.customer}, request=${customerId}`);
      return NextResponse.json({ error: '不正なリクエストです' }, { status: 403 });
    }

    // 冪等性ガード: 同じSetupIntentで既にSubscriptionが作成されていないか確認
    const existingSubs = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 10,
    });
    const alreadyCreated = existingSubs.data.find(
      s => s.metadata?.setup_intent_id === setupIntentId
    );
    if (alreadyCreated) {
      console.log(`[activate-subscription] Subscription already exists for setupIntent ${setupIntentId}`);
      return NextResponse.json({
        subscriptionId: alreadyCreated.id,
        status: alreadyCreated.status,
      });
    }

    const paymentMethodId = setupIntent.payment_method as string;
    const meta = setupIntent.metadata || {};
    const productPriceId = meta.product_price_id;
    const shippingPriceId = meta.shipping_price_id;
    const planId = meta.plan_id;
    const promotionCodeId = meta.promotion_code_id || '';

    if (!productPriceId || !shippingPriceId || !planId) {
      return NextResponse.json({ error: 'プラン情報が見つかりません' }, { status: 400 });
    }

    // カスタマーのデフォルト支払い方法を設定
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Subscription 作成（商品 + 送料 の2 Price で月額一律請求）
    // B1: payment_behavior=default_incomplete + 初回 invoice の PaymentIntent をサーバ側で確定する。
    //     これにより「確認待ち」のまま放置されて約23時間後に incomplete_expired で
    //     無言失効する不具合を防ぐ。
    const subscription = await stripe.subscriptions.create(
      {
        customer: customerId,
        items: [
          { price: productPriceId },
          { price: shippingPriceId },
        ],
        // 有効な Promotion Code があれば Stripe 請求にクーポンを反映
        ...(promotionCodeId ? { discounts: [{ promotion_code: promotionCodeId }] } : {}),
        default_payment_method: paymentMethodId,
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          setup_intent_id: setupIntentId,
          plan_id: planId,
          customer_name: meta.customer_name || '',
          customer_name_kana: meta.customer_name_kana || '',
          phone: meta.phone || '',
          postal_code: meta.postal_code || '',
          prefecture: meta.prefecture || '',
          city: meta.city || '',
          address_detail: meta.address_detail || '',
          building: meta.building || '',
          address: meta.address || '',
          preferred_delivery_date: meta.preferred_delivery_date || '',
          referral_code: meta.referral_code || '',
          share_slug: meta.share_slug || '',
          notes: meta.notes || '',
          email: meta.email || '',
        },
      },
      {
        idempotencyKey: `subscription_create_${setupIntentId}`,
      }
    );

    // B1: 初回 invoice の PaymentIntent をサーバ側で確定する。
    const result = await confirmInitialSubscriptionPayment(stripe, subscription, paymentMethodId);

    if (result.requiresAction) {
      // 追加認証（Link/3DS）が必要。フロントで完了させるため client_secret を返す。
      return NextResponse.json({
        subscriptionId: subscription.id,
        status: subscription.status,
        requiresAction: true,
        clientSecret: result.clientSecret,
      });
    }

    if (result.error) {
      // 確定に失敗（残高不足・カード拒否等）。無言で放置せずエラーを返す。
      console.error(`[activate-subscription] Initial payment failed for ${subscription.id}: ${result.error}`);
      return NextResponse.json(
        { error: '初回のお支払いを確定できませんでした。別の決済手段をお試しください。' },
        { status: 402 }
      );
    }

    return NextResponse.json({
      subscriptionId: subscription.id,
      status: result.subscriptionStatus ?? subscription.status,
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Subscription activation error:', errMsg);
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'development' ? errMsg : 'サブスクリプションの開始に失敗しました' },
      { status: 500 }
    );
  }
}
