import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// サブスクリプションプランのStripe Price IDを取得
function getSubscriptionPriceId(planId: string): string {
  const priceMap: { [key: string]: string } = {
    'subscription-monthly-12': process.env.STRIPE_SUBSCRIPTION_PRICE_12_MONTHLY || '',
    'subscription-monthly-24': process.env.STRIPE_SUBSCRIPTION_PRICE_24_MONTHLY || '',
    'subscription-monthly-48': process.env.STRIPE_SUBSCRIPTION_PRICE_48_MONTHLY || '',
  };
  return priceMap[planId] || '';
}

// サブスクリプションプランの送料価格IDを取得（Recurring Price）
function getSubscriptionShippingPriceId(planId: string): string {
  const shippingMap: { [key: string]: string } = {
    'subscription-monthly-12': process.env.STRIPE_SHIPPING_PRICE_12 || '',
    'subscription-monthly-24': process.env.STRIPE_SHIPPING_PRICE_24 || '',
    'subscription-monthly-48': process.env.STRIPE_SHIPPING_PRICE_48 || '',
  };
  return shippingMap[planId] || '';
}

interface CartItem {
  planId: string;
  quantity: number;
}

interface CheckoutRequest {
  purchaseType?: 'one-time' | 'subscription-monthly';
  cart: CartItem[];
  customerInfo: {
    lastName: string;
    firstName: string;
    email: string;
    phone: string;
    postalCode: string;
    prefecture: string;
    city: string;
    address: string;
    building?: string;
    preferredDeliveryDate?: string;
  };
  couponCode?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutRequest = await request.json();
    const { cart, customerInfo, couponCode, purchaseType = 'one-time' } = body;

    // 配送先住所を構築
    const fullAddress = `${customerInfo.postalCode} ${customerInfo.prefecture}${customerInfo.city}${customerInfo.address}${customerInfo.building ? ' ' + customerInfo.building : ''}`;

    // オリジンURLを取得
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // サブスクリプション月額プランの場合
    if (purchaseType === 'subscription-monthly') {
      const subscriptionItem = cart.find(item => item.quantity > 0);
      if (!subscriptionItem) {
        return NextResponse.json(
          { error: 'サブスクリプションプランを選択してください' },
          { status: 400 }
        );
      }

      const planId = subscriptionItem.planId;
      const priceId = getSubscriptionPriceId(planId);
      const shippingPriceId = getSubscriptionShippingPriceId(planId);

      if (!priceId) {
        console.error(`Price ID not found for plan: ${planId}`);
        return NextResponse.json(
          { error: `Price ID not configured for plan: ${planId}. Please set the environment variable.` },
          { status: 400 }
        );
      }

      // line_itemsを構築（商品 + 送料）
      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
        { price: priceId, quantity: 1 },
      ];

      // 送料を追加
      if (shippingPriceId) {
        lineItems.push({ price: shippingPriceId, quantity: 1 });
      }

      // サブスクリプション用のCheckout Sessionを作成
      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'subscription',
        success_url: `${origin}/purchase/complete?session_id={CHECKOUT_SESSION_ID}&type=subscription`,
        cancel_url: `${origin}/purchase?canceled=true`,
        customer_email: customerInfo.email,
        metadata: {
          purchase_type: 'subscription-monthly',
          plan_id: planId,
          customer_name: `${customerInfo.lastName} ${customerInfo.firstName}`,
          phone: customerInfo.phone,
          postal_code: customerInfo.postalCode,
          prefecture: customerInfo.prefecture,
          city: customerInfo.city,
          address_detail: customerInfo.address,
          building: customerInfo.building || '',
          address: fullAddress,
          preferred_delivery_date: customerInfo.preferredDeliveryDate || '',
          coupon_code: couponCode || '',
        },
        subscription_data: {
          metadata: {
            plan_id: planId,
            customer_name: `${customerInfo.lastName} ${customerInfo.firstName}`,
            phone: customerInfo.phone,
            address: fullAddress,
            preferred_delivery_date: customerInfo.preferredDeliveryDate || '',
          },
        },
        locale: 'ja',
      };

      // クーポンがある場合は割引を適用
      if (couponCode) {
        try {
          const promotionCodes = await stripe.promotionCodes.list({
            code: couponCode,
            active: true,
            limit: 1,
          });

          if (promotionCodes.data.length > 0) {
            sessionParams.discounts = [
              { promotion_code: promotionCodes.data[0].id },
            ];
          }
        } catch {
          console.log('Promotion code not found in Stripe, skipping discount');
        }
      }

      const session = await stripe.checkout.sessions.create(sessionParams);
      return NextResponse.json({ url: session.url });
    }

    // お試しプラン（一回購入）の場合
    const trialItem = cart.find(item => item.quantity > 0);
    if (!trialItem) {
      return NextResponse.json(
        { error: 'プランを選択してください' },
        { status: 400 }
      );
    }

    // お試しプランのみ対応（trial-6）
    if (trialItem.planId !== 'trial-6') {
      return NextResponse.json(
        { error: `無効なプランID: ${trialItem.planId}` },
        { status: 400 }
      );
    }

    const priceId = process.env.STRIPE_PRICE_TRIAL_6SET || '';
    if (!priceId) {
      console.error('Trial price ID not configured');
      return NextResponse.json(
        { error: 'Price ID not configured. Please set the environment variable STRIPE_PRICE_TRIAL_6SET.' },
        { status: 400 }
      );
    }

    // 送料価格IDを取得
    const shippingPriceId = process.env.STRIPE_SHIPPING_PRICE_TRIAL || '';

    // line_itemsを構築（商品 + 送料）
    const trialLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      { price: priceId, quantity: trialItem.quantity },
    ];

    // 送料を追加
    if (shippingPriceId) {
      trialLineItems.push({ price: shippingPriceId, quantity: trialItem.quantity });
    }

    // 一回購入用のCheckout Sessionを作成
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: trialLineItems,
      mode: 'payment',
      success_url: `${origin}/purchase/complete?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/purchase?canceled=true`,
      customer_email: customerInfo.email,
      metadata: {
        purchase_type: 'one-time',
        plan_id: trialItem.planId,
        customer_name: `${customerInfo.lastName} ${customerInfo.firstName}`,
        phone: customerInfo.phone,
        postal_code: customerInfo.postalCode,
        prefecture: customerInfo.prefecture,
        city: customerInfo.city,
        address_detail: customerInfo.address,
        building: customerInfo.building || '',
        address: fullAddress,
        coupon_code: couponCode || '',
      },
      locale: 'ja',
    };

    // クーポンがある場合は割引を適用
    if (couponCode) {
      try {
        const promotionCodes = await stripe.promotionCodes.list({
          code: couponCode,
          active: true,
          limit: 1,
        });

        if (promotionCodes.data.length > 0) {
          sessionParams.discounts = [
            { promotion_code: promotionCodes.data[0].id },
          ];
        }
      } catch {
        console.log('Promotion code not found in Stripe, skipping discount');
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Checkout session error:', error);
    return NextResponse.json(
      { error: error.message || 'チェックアウトセッションの作成に失敗しました' },
      { status: 500 }
    );
  }
}
