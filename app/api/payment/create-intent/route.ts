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

// 買い切り（trial-6）の金額定義。サブスクは Stripe Price ID 経由で扱う。
const PLAN_PRICES: Record<string, { amount: number; shipping: number }> = {
  'trial-6': { amount: 4200, shipping: 1500 },
};

// 月額合計の表示用（フロントへ amount を返す）。
const SUBSCRIPTION_MONTHLY_TOTAL: Record<string, number> = {
  'sub-6': 4500,
  'sub-12': 7500,
};

// サブスクリプション用 Stripe Price ID（商品+送料の2本）を取得。
// いずれかの env が未設定なら null を返す（呼び出し側で 400 を返す）。
function getSubscriptionPriceIds(planId: string): { productPriceId: string; shippingPriceId: string } | null {
  const productMap: Record<string, string | undefined> = {
    'sub-6': process.env.STRIPE_PRICE_SUB6_PRODUCT,
    'sub-12': process.env.STRIPE_PRICE_SUB12_PRODUCT,
  };
  const productPriceId = productMap[planId];
  const shippingPriceId = process.env.STRIPE_PRICE_SUB_SHIPPING;
  if (!productPriceId || !shippingPriceId) return null;
  return { productPriceId, shippingPriceId };
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
  couponCode?: string;
  shareSlug?: string;
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
      share_slug: body.shareSlug || '',
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

      const priceIds = getSubscriptionPriceIds(planId);
      if (!priceIds) {
        console.error(`[create-intent] Missing Stripe Price IDs for ${planId}`);
        return NextResponse.json({ error: 'サブスクリプション価格が設定されていません' }, { status: 400 });
      }
      const { productPriceId, shippingPriceId } = priceIds;

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

      // クーポン検証（サブスク用）。有効な Promotion Code があればその id を
      // metadata に積み、activate-subscription 時に discounts へ適用する。
      let promotionCodeId = '';
      if (couponCode) {
        try {
          const promotionCodes = await stripe.promotionCodes.list({
            code: couponCode,
            active: true,
            limit: 1,
          });
          if (promotionCodes.data.length > 0) {
            promotionCodeId = promotionCodes.data[0].id;
          }
        } catch {
          console.log('[create-intent/sub] Promotion code not found, skipping discount');
        }
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
          promotion_code_id: promotionCodeId,
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
      const amount = SUBSCRIPTION_MONTHLY_TOTAL[planId] || 0;

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
