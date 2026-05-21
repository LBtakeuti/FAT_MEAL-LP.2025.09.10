/**
 * 3Dセキュアフルページリダイレクト後のSubscription有効化API
 * SetupIntentのIDのみでSubscriptionを作成する（customerIdはSetupIntentから取得）
 */
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { setupIntentId } = await request.json();

    if (!setupIntentId) {
      return NextResponse.json({ error: 'setupIntentIdが必要です' }, { status: 400 });
    }

    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);

    if (setupIntent.status !== 'succeeded') {
      return NextResponse.json({ error: 'カード登録が完了していません' }, { status: 400 });
    }

    // メタデータからflowを検証
    if (setupIntent.metadata?.flow !== 'subscription_setup') {
      return NextResponse.json({ error: '不正なリクエストです' }, { status: 400 });
    }

    const customerId = setupIntent.customer as string;
    if (!customerId) {
      return NextResponse.json({ error: 'カスタマー情報が見つかりません' }, { status: 400 });
    }

    // 冪等性ガード
    const existingSubs = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 10,
    });
    const alreadyCreated = existingSubs.data.find(
      s => s.metadata?.setup_intent_id === setupIntentId
    );
    if (alreadyCreated) {
      return NextResponse.json({
        subscriptionId: alreadyCreated.id,
        status: alreadyCreated.status,
      });
    }

    const paymentMethodId = setupIntent.payment_method as string;
    const meta = setupIntent.metadata || {};
    const priceId = meta.price_id;
    const planId = meta.plan_id;

    if (!priceId || !planId) {
      return NextResponse.json({ error: 'プラン情報が見つかりません' }, { status: 400 });
    }

    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    const shippingPriceId = process.env.STRIPE_SHIPPING_PRICE_FREE || '';
    const items: Stripe.SubscriptionCreateParams.Item[] = [{ price: priceId }];
    if (shippingPriceId) items.push({ price: shippingPriceId });

    const subscription = await stripe.subscriptions.create(
      {
        customer: customerId,
        items,
        default_payment_method: paymentMethodId,
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
          notes: meta.notes || '',
          email: meta.email || '',
        },
      },
      {
        idempotencyKey: `subscription_create_${setupIntentId}`,
      }
    );

    return NextResponse.json({
      subscriptionId: subscription.id,
      status: subscription.status,
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Subscription redirect activation error:', errMsg);
    return NextResponse.json(
      { error: 'サブスクリプションの開始に失敗しました' },
      { status: 500 }
    );
  }
}
