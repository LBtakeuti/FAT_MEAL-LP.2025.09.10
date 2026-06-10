/**
 * クーポンコード検証API
 * クライアントからクーポンコードを受け取り、Stripe Promotion Codeで検証する
 *
 * F44:
 * - coupon.applies_to.products を取得して scope（'product' or 'all'）を返す
 * - planId が与えられた場合は現プランの product_id が範囲内か判定して appliesToCurrentPlan を返す
 * - 範囲外（appliesToCurrentPlan=false）の場合は valid=false でエラーメッセージを返す
 */
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { rateLimit, getClientIP } from '@/lib/rate-limit';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// planId → 商品 Price ID（env）。Price から Product ID は retrieve で取得する。
function getProductPriceIdForPlan(planId: string | null | undefined): string | null {
  if (!planId) return null;
  const map: Record<string, string | undefined> = {
    'sub-6': process.env.STRIPE_PRICE_SUB6_PRODUCT,
    'sub-12': process.env.STRIPE_PRICE_SUB12_PRODUCT,
  };
  return map[planId] || null;
}

export async function POST(request: NextRequest) {
  try {
    // レート制限: IPあたり10回/分
    const clientIP = getClientIP(request);
    const { allowed } = rateLimit(`coupon:${clientIP}`, 10, 60_000);
    if (!allowed) {
      return NextResponse.json({ valid: false, error: 'リクエストが多すぎます。しばらくしてからお試しください。' });
    }

    const { code, planId } = await request.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ valid: false, error: 'クーポンコードを入力してください' });
    }

    // Stripe Promotion Code は大文字小文字を区別する。入力をそのまま使う
    const trimmedCode = code.trim();

    const promotionCodes = await stripe.promotionCodes.list({
      code: trimmedCode,
      active: true,
      limit: 1,
    });

    if (promotionCodes.data.length === 0) {
      return NextResponse.json({ valid: false, error: '無効なクーポンコードです' });
    }

    const promo = promotionCodes.data[0] as any;

    // Stripe API の構造変更対応:
    // - 旧: promo.coupon が Coupon オブジェクト
    // - 新: promo.promotion.coupon が coupon ID（文字列）。coupons.retrieve で詳細取得が必要
    let coupon: any = null;
    if (promo.coupon && typeof promo.coupon === 'object') {
      coupon = promo.coupon;
    } else {
      const couponId =
        (typeof promo.coupon === 'string' ? promo.coupon : null) ||
        (typeof promo.promotion?.coupon === 'string' ? promo.promotion.coupon : null);
      if (couponId) {
        coupon = await stripe.coupons.retrieve(couponId);
      }
    }

    if (!coupon) {
      return NextResponse.json({ valid: false, error: 'クーポン情報を取得できませんでした' });
    }

    // F44: applies_to.products を取得して scope を決定
    // applies_to.products は string[]（Product ID 配列）。未指定なら全体クーポン。
    const appliesToProducts: string[] | null = Array.isArray(coupon.applies_to?.products)
      ? coupon.applies_to.products
      : null;
    const scope: 'product' | 'all' = appliesToProducts && appliesToProducts.length > 0 ? 'product' : 'all';

    // F44: planId が指定された場合、現プランの product_id が範囲に含まれるか判定
    let appliesToCurrentPlan: boolean | null = null;
    if (typeof planId === 'string' && planId) {
      if (scope === 'all') {
        appliesToCurrentPlan = true;
      } else {
        const productPriceId = getProductPriceIdForPlan(planId);
        if (productPriceId) {
          try {
            const price = await stripe.prices.retrieve(productPriceId);
            const productId = typeof price.product === 'string' ? price.product : (price.product as any)?.id;
            appliesToCurrentPlan = !!productId && appliesToProducts!.includes(productId);
          } catch (e) {
            console.error('[validate-coupon] Failed to retrieve price for plan:', planId, e);
            appliesToCurrentPlan = null;
          }
        }
      }
    }

    // 範囲外プランは valid=false で拒否（指示通り）
    if (appliesToCurrentPlan === false) {
      return NextResponse.json({
        valid: false,
        error: 'このクーポンは選択中のプランにはお使いいただけません',
        scope,
      });
    }

    let discount = 0;

    // F56: クーポンの表示出し分け用に name / metadata をそのまま返す。
    // フロントは metadata（display_label / theme / free_shipping / product_discount）を
    // 解釈して専用デザイン・割引内訳を出し分ける。未設定/未知値はフロント側でデフォルトへ。
    const couponName: string | null = typeof coupon.name === 'string' ? coupon.name : null;
    const couponMetadata: Record<string, string> =
      coupon.metadata && typeof coupon.metadata === 'object' ? coupon.metadata : {};

    if (coupon.percent_off) {
      return NextResponse.json({
        valid: true,
        code: trimmedCode,
        discount: 0,
        percentOff: coupon.percent_off,
        scope,
        appliesToProducts,
        appliesToCurrentPlan,
        couponName,
        couponMetadata,
      });
    } else if (coupon.amount_off) {
      discount = coupon.amount_off;
    }

    return NextResponse.json({
      valid: true,
      code: trimmedCode,
      discount,
      scope,
      appliesToProducts,
      appliesToCurrentPlan,
      couponName,
      couponMetadata,
    });
  } catch (error) {
    console.error('Coupon validation error:', error);
    return NextResponse.json({ valid: false, error: '検証に失敗しました' });
  }
}
