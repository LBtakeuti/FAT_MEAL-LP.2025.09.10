/**
 * Stripe Elements用 PaymentIntent / Subscription 作成API
 *
 * セキュリティルール:
 * - Payment Intents API 経由必須（Charges API 禁止）
 * - カード情報はStripe Elements iframe経由のみ
 * - 自社サーバーでカード情報を保持・経由させない
 * - error.message をそのままユーザーに表示しない
 */
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// プラン金額定義（税込）— 表示用合計算出に使用。サブスクは月額固定で段階割引なし。
const PLAN_PRICES: Record<string, { amount: number; shipping: number }> = {
  'trial-6': { amount: 4200, shipping: 1500 }, // 合計5700円（買い切り）
  'sub-6': { amount: 3000, shipping: 1500 },   // 月額4500円
  'sub-12': { amount: 6000, shipping: 1500 },  // 月額7500円
};

// サブスクリプション用 Stripe Price ID を新プラン体系で取得。
// 商品 Price と送料 Price の2本を Subscription に積む構成。
function getSubscriptionPriceIds(planId: string): { productPriceId: string; shippingPriceId: string } {
  const productPriceMap: Record<string, string> = {
    'sub-6': process.env.STRIPE_PRICE_SUB6_PRODUCT || '',
    'sub-12': process.env.STRIPE_PRICE_SUB12_PRODUCT || '',
  };
  const shippingPriceId = process.env.STRIPE_PRICE_SUB_SHIPPING || '';
  return {
    productPriceId: productPriceMap[planId] || '',
    shippingPriceId,
  };
}

interface CreateIntentRequest {
  purchaseType: 'one-time' | 'subscription-monthly';
  cart: { planId: string; quantity: number }[];
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
  promoSlug?: string;
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

export async function POST(request: NextRequest) {
  try {
    const body: CreateIntentRequest = await request.json();
    const { cart, customerInfo, couponCode, purchaseType } = body;

    const activeItem = cart.find(item => item.quantity > 0);
    if (!activeItem) {
      return NextResponse.json({ error: 'プランを選択してください' }, { status: 400 });
    }

    const fullAddress = `${customerInfo.postalCode} ${customerInfo.prefecture}${customerInfo.city}${customerInfo.address}${customerInfo.building ? ' ' + customerInfo.building : ''}`;

    // 共通metadata
    const metadata: Record<string, string> = {
      purchase_type: purchaseType,
      plan_id: activeItem.planId,
      customer_name: `${customerInfo.lastName} ${customerInfo.firstName}`,
      customer_name_kana: `${customerInfo.lastNameKana} ${customerInfo.firstNameKana}`,
      email: customerInfo.email,
      phone: customerInfo.phone,
      postal_code: customerInfo.postalCode,
      prefecture: customerInfo.prefecture,
      city: customerInfo.city,
      address_detail: customerInfo.address,
      building: customerInfo.building || '',
      address: fullAddress,
      coupon_code: couponCode || '',
      referral_code: customerInfo.referralCode || '',
      promo_slug: body.promoSlug || '',
      notes: customerInfo.notes || '',
      preferred_delivery_date: customerInfo.preferredDeliveryDate || '',
    };

    // アンケートデータを先に保存
    let surveySessionKey = '';

    if (purchaseType === 'one-time') {
      // === 買い切り: PaymentIntent作成 ===
      if (activeItem.planId !== 'trial-6') {
        return NextResponse.json({ error: '無効なプランIDです' }, { status: 400 });
      }

      const planPrice = PLAN_PRICES[activeItem.planId];
      if (!planPrice) {
        return NextResponse.json({ error: 'プラン価格が設定されていません' }, { status: 400 });
      }

      let amount = (planPrice.amount + planPrice.shipping) * activeItem.quantity;

      // クーポン適用（Stripe Promotion Code経由）
      let appliedCouponId: string | undefined;
      if (couponCode) {
        try {
          const promotionCodes = await stripe.promotionCodes.list({
            code: couponCode,
            active: true,
            limit: 1,
          });
          if (promotionCodes.data.length > 0) {
            const promo = promotionCodes.data[0] as any;
            const coupon = promo.coupon;
            appliedCouponId = coupon.id;
            if (coupon.percent_off) {
              amount = Math.round(amount * (1 - coupon.percent_off / 100));
            } else if (coupon.amount_off) {
              amount = Math.max(0, amount - coupon.amount_off);
            }
          }
        } catch {
          console.log('Promotion code not found, skipping discount');
        }
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'jpy',
        metadata,
        automatic_payment_methods: { enabled: true },
        description: `ふとるめし お試し6個セット × ${activeItem.quantity}`,
      });

      surveySessionKey = paymentIntent.id;

      // アンケート保存
      if (body.survey) {
        try {
          const supabase = createServerClient();
          await (supabase.from('purchase_surveys') as any).insert({
            stripe_session_id: paymentIntent.id,
            customer_email: customerInfo.email,
            q1_answers: body.survey.q1_answers,
            q1_other_text: body.survey.q1_other_text || null,
            q2_answers: body.survey.q2_answers,
            q2_other_text: body.survey.q2_other_text || null,
            q3_answers: body.survey.q3_answers,
            q3_other_text: body.survey.q3_other_text || null,
          });
        } catch (e) {
          console.error('Failed to save survey:', e);
        }
      }

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount,
      });

    } else {
      // === サブスクリプション: SetupIntent → カード登録後にSubscription作成（新プラン体系・月額一律） ===
      const planId = activeItem.planId;
      if (planId !== 'sub-6' && planId !== 'sub-12') {
        return NextResponse.json({ error: '無効なプランIDです' }, { status: 400 });
      }

      const { productPriceId, shippingPriceId } = getSubscriptionPriceIds(planId);
      if (!productPriceId || !shippingPriceId) {
        console.error(`[create-intent] Missing Stripe Price IDs for ${planId}`, {
          productPriceId: !!productPriceId,
          shippingPriceId: !!shippingPriceId,
        });
        return NextResponse.json({ error: 'サブスクリプション価格が設定されていません' }, { status: 500 });
      }

      const existingCustomers = await stripe.customers.list({
        email: customerInfo.email,
        limit: 1,
      });
      let customer: Stripe.Customer;
      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
      } else {
        customer = await stripe.customers.create({
          email: customerInfo.email,
          name: `${customerInfo.lastName} ${customerInfo.firstName}`,
          phone: customerInfo.phone,
          metadata: { plan_id: planId },
        });
      }

      // SetupIntent: カード登録用。商品/送料の Price ID を metadata に積み、
      // activate-subscription で2本の Price で Subscription を作成する。
      const setupIntent = await stripe.setupIntents.create({
        customer: customer.id,
        automatic_payment_methods: { enabled: true },
        metadata: {
          ...metadata,
          plan_id: planId,
          product_price_id: productPriceId,
          shipping_price_id: shippingPriceId,
          flow: 'subscription_setup',
        },
      });

      surveySessionKey = setupIntent.id;

      if (body.survey) {
        try {
          const supabase = createServerClient();
          await (supabase.from('purchase_surveys') as any).insert({
            stripe_session_id: setupIntent.id,
            customer_email: customerInfo.email,
            q1_answers: body.survey.q1_answers,
            q1_other_text: body.survey.q1_other_text || null,
            q2_answers: body.survey.q2_answers,
            q2_other_text: body.survey.q2_other_text || null,
            q3_answers: body.survey.q3_answers,
            q3_other_text: body.survey.q3_other_text || null,
          });
        } catch (e) {
          console.error('Failed to save survey:', e);
        }
      }

      // 表示用の月額合計（商品 + 送料）
      const planPrice = PLAN_PRICES[planId];
      const amount = planPrice ? planPrice.amount + planPrice.shipping : 0;

      return NextResponse.json({
        clientSecret: setupIntent.client_secret,
        setupIntentId: setupIntent.id,
        customerId: customer.id,
        amount,
        isSetup: true,
      });
    }
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Payment intent creation error:', errMsg, error);
    // error.message をそのままユーザーに返さない（本番）
    // 開発環境ではデバッグ用にエラー詳細を返す
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'development' ? errMsg : '決済の準備に失敗しました。しばらくしてからお試しください。' },
      { status: 500 }
    );
  }
}
