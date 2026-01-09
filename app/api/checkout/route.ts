import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// 本番環境とテスト環境でPrice IDを切り替え
const isLiveMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_');

// プランIDとStripe価格IDのマッピング（環境変数から取得）
function getPriceMap(): { [key: string]: string } {
  if (isLiveMode) {
    return {
      'plan-6': process.env.STRIPE_PRICE_6SET_LIVE || '',
      'plan-12': process.env.STRIPE_PRICE_12SET_LIVE || '',
      'plan-18': process.env.STRIPE_PRICE_18SET_LIVE || '',
    };
  }
  return {
    'plan-6': process.env.STRIPE_PRICE_6SET_TEST || '',
    'plan-12': process.env.STRIPE_PRICE_12SET_TEST || '',
    'plan-18': process.env.STRIPE_PRICE_18SET_TEST || '',
  };
}

interface CartItem {
  planId: string;
  quantity: number;
}

interface CheckoutRequest {
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
  };
  couponCode?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutRequest = await request.json();
    const { cart, customerInfo, couponCode } = body;

    // カートアイテムをStripeのline_itemsに変換
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    for (const item of cart) {
      if (item.quantity > 0) {
        const priceId = getPriceMap()[item.planId];
        if (!priceId) {
          return NextResponse.json(
            { error: `無効なプランID: ${item.planId}` },
            { status: 400 }
          );
        }
        lineItems.push({
          price: priceId,
          quantity: item.quantity,
        });
      }
    }

    if (lineItems.length === 0) {
      return NextResponse.json(
        { error: 'カートが空です' },
        { status: 400 }
      );
    }

    // 送料を追加（¥990）
    // 送料用の価格がない場合は、shipping_optionsを使用
    const shippingOptions: Stripe.Checkout.SessionCreateParams.ShippingOption[] = [
      {
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: {
            amount: 990,
            currency: 'jpy',
          },
          display_name: '通常配送',
          delivery_estimate: {
            minimum: {
              unit: 'business_day',
              value: 3,
            },
            maximum: {
              unit: 'business_day',
              value: 7,
            },
          },
        },
      },
    ];

    // 配送先住所を構築
    const fullAddress = `${customerInfo.postalCode} ${customerInfo.prefecture}${customerInfo.city}${customerInfo.address}${customerInfo.building ? ' ' + customerInfo.building : ''}`;

    // オリジンURLを取得（フォールバック付き）
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // Checkout Sessionを作成
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${origin}/purchase/complete?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/purchase?canceled=true`,
      shipping_options: shippingOptions,
      customer_email: customerInfo.email,
      metadata: {
        customer_name: `${customerInfo.lastName} ${customerInfo.firstName}`,
        phone: customerInfo.phone,
        address: fullAddress,
        coupon_code: couponCode || '',
      },
      locale: 'ja',
    };

    // クーポンがある場合は割引を適用
    if (couponCode) {
      // Stripeのクーポン/プロモーションコードを検索
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
