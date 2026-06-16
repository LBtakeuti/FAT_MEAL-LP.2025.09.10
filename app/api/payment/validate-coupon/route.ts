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
// trial-6（お試し/単発）も含め、現役プラン全てを解決できるようにする。
// これにより商品制限付きクーポン(scope==='product')の applies_to を全プランで尊重する。
function getProductPriceIdForPlan(planId: string | null | undefined): string | null {
  if (!planId) return null;
  const map: Record<string, string | undefined> = {
    'trial-6': process.env.STRIPE_PRICE_TRIAL_6SET,
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

    // 定期専用クーポンのお試し誤適用ガード（ブラックリスト方式 / keitakeuchi判断 2026-06-16）:
    // coupon.metadata.subscription_only === "true" のクーポンは、お試し(one-time / trial-6)では弾く。
    // KOSHIGAYA(ze8rKt4d) のように applies_to 未設定で metadata/amount_off 駆動の割引が
    // scope==='all' 扱いで trial にすり抜けるのを止める。
    // - フラグ無し = お試しでも使える（将来のお試し用クーポンはフラグ未設定で通す）。
    // - 定期(sub-6/sub-12)は対象外（過剰ブロック禁止）。
    // - 判定不能（クーポン取得失敗・例外）は上流で error 返却済み＝安全側。
    const isOneTimePlan = planId === 'trial-6';
    const isSubscriptionOnlyCoupon = coupon.metadata?.subscription_only === 'true';
    if (isOneTimePlan && isSubscriptionOnlyCoupon) {
      return NextResponse.json({
        valid: false,
        error: 'このクーポンは定期プラン専用のため、お試しにはお使いいただけません',
        scope: 'all',
      });
    }

    // F44: applies_to.products を取得して scope を決定
    // applies_to.products は string[]（Product ID 配列）。未指定なら全体クーポン。
    const appliesToProducts: string[] | null = Array.isArray(coupon.applies_to?.products)
      ? coupon.applies_to.products
      : null;
    const scope: 'product' | 'all' = appliesToProducts && appliesToProducts.length > 0 ? 'product' : 'all';

    // F44 / 汎用ガード: planId が指定された場合、現プランの product_id が範囲に含まれるか判定。
    // scope==='all'（全体クーポン）は全プランで有効。
    // scope==='product'（商品制限クーポン）は applies_to に現プランの Product が含まれる場合のみ有効。
    // 重要（安全側デフォルト）: 商品制限クーポンでプランの Product を解決できない/不明な場合は
    //   null を素通りさせず false に倒す。これにより trial-6 など applies_to 外のプランへの
    //   誤適用を防ぐ（KOSHIGAYA 等の定期専用クーポンを単発購入で弾く）。
    let appliesToCurrentPlan: boolean | null = null;
    if (typeof planId === 'string' && planId) {
      if (scope === 'all') {
        appliesToCurrentPlan = true;
      } else {
        const productPriceId = getProductPriceIdForPlan(planId);
        if (!productPriceId) {
          // 商品制限クーポンなのにプランの Product を解決できない → 安全側で拒否
          console.error('[validate-coupon] Unresolvable product for product-scope coupon, denying:', planId);
          appliesToCurrentPlan = false;
        } else {
          try {
            const price = await stripe.prices.retrieve(productPriceId);
            const productId = typeof price.product === 'string' ? price.product : (price.product as any)?.id;
            // Product を取得できなければ安全側で拒否
            appliesToCurrentPlan = !!productId && appliesToProducts!.includes(productId);
          } catch (e) {
            console.error('[validate-coupon] Failed to retrieve price for plan, denying:', planId, e);
            appliesToCurrentPlan = false;
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

    // F57: 適用期間（once / repeating / forever）を返す。
    // 定期プラン×duration='once' の初回限定クーポンで「初回のみ適用」注記を出すため。
    // repeating の場合は duration_in_months（適用月数）も返す。
    const duration: 'once' | 'repeating' | 'forever' | null =
      coupon.duration === 'once' || coupon.duration === 'repeating' || coupon.duration === 'forever'
        ? coupon.duration
        : null;
    const durationInMonths: number | null =
      typeof coupon.duration_in_months === 'number' ? coupon.duration_in_months : null;

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
        duration,
        durationInMonths,
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
      duration,
      durationInMonths,
    });
  } catch (error) {
    console.error('Coupon validation error:', error);
    return NextResponse.json({ valid: false, error: '検証に失敗しました' });
  }
}
