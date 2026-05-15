import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

interface CartItem {
  planId: string;
  quantity: number;
}

interface CheckoutRequest {
  cart: CartItem[];
  customerInfo: {
    lastName: string;
    firstName: string;
    lastNameKana: string;
    firstNameKana: string;
    email: string;
    phone: string;
    postalCode: string;
    prefecture: string;
    city: string;
    address: string;
    building?: string;
    preferredDeliveryDate?: string;
    referralCode?: string;
    notes?: string;
  };
  couponCode?: string;
  survey?: {
    q1_answers: string[];
    q1_other_text?: string;
    q2_answers: string[];
    q2_other_text?: string;
    q3_answers: string[];
    q3_other_text?: string;
  };
}

// お試しプラン（trial-6）専用ルート。
// サブスクリプション（sub-6 / sub-12）は /api/payment/* 経由で処理する。
export async function POST(request: NextRequest) {
  try {
    const body: CheckoutRequest = await request.json();
    const { cart, customerInfo, couponCode } = body;

    console.log('[Checkout] Received referralCode:', customerInfo.referralCode);
    console.log('[Checkout] Full customerInfo:', JSON.stringify(customerInfo, null, 2));

    const fullAddress = `${customerInfo.postalCode} ${customerInfo.prefecture}${customerInfo.city}${customerInfo.address}${customerInfo.building ? ' ' + customerInfo.building : ''}`;
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const trialItem = cart.find(item => item.quantity > 0);
    if (!trialItem) {
      return NextResponse.json(
        { error: 'プランを選択してください' },
        { status: 400 }
      );
    }

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

    const shippingPriceId = process.env.STRIPE_SHIPPING_PRICE_TRIAL || '';

    const trialLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      { price: priceId, quantity: trialItem.quantity },
    ];

    if (shippingPriceId) {
      trialLineItems.push({ price: shippingPriceId, quantity: trialItem.quantity });
    }

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
        customer_name_kana: `${customerInfo.lastNameKana} ${customerInfo.firstNameKana}`,
        phone: customerInfo.phone,
        postal_code: customerInfo.postalCode,
        prefecture: customerInfo.prefecture,
        city: customerInfo.city,
        address_detail: customerInfo.address,
        building: customerInfo.building || '',
        address: fullAddress,
        coupon_code: couponCode || '',
        referral_code: customerInfo.referralCode || '',
        notes: customerInfo.notes || '',
      },
      locale: 'ja',
    };

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

    if (body.survey) {
      try {
        const supabase = createServerClient();
        await (supabase.from('purchase_surveys') as any).insert({
          stripe_session_id: session.id,
          customer_email: customerInfo.email,
          q1_answers: body.survey.q1_answers,
          q1_other_text: body.survey.q1_other_text || null,
          q2_answers: body.survey.q2_answers,
          q2_other_text: body.survey.q2_other_text || null,
          q3_answers: body.survey.q3_answers,
          q3_other_text: body.survey.q3_other_text || null,
        });
      } catch (surveyError) {
        console.error('Failed to save survey data:', surveyError);
      }
    }

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    console.error('Checkout session error:', error);
    return NextResponse.json(
      { error: '決済の準備に失敗しました。しばらくしてからお試しください。' },
      { status: 500 }
    );
  }
}
