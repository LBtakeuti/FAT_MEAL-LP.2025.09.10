/**
 * クーポンコード検証API
 * クライアントからクーポンコードを受け取り、Stripe Promotion Codeで検証する
 */
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { rateLimit, getClientIP } from '@/lib/rate-limit';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    // レート制限: IPあたり10回/分
    const clientIP = getClientIP(request);
    const { allowed } = rateLimit(`coupon:${clientIP}`, 10, 60_000);
    if (!allowed) {
      return NextResponse.json({ valid: false, error: 'リクエストが多すぎます。しばらくしてからお試しください。' });
    }

    const { code } = await request.json();

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
    const coupon = promo.coupon;
    let discount = 0;

    if (coupon.percent_off) {
      // パーセント割引は金額不明のため、percent_offを返す
      discount = 0;
      return NextResponse.json({
        valid: true,
        code: trimmedCode,
        discount,
        percentOff: coupon.percent_off,
      });
    } else if (coupon.amount_off) {
      discount = coupon.amount_off;
    }

    return NextResponse.json({
      valid: true,
      code: trimmedCode,
      discount,
    });
  } catch (error) {
    console.error('Coupon validation error:', error);
    return NextResponse.json({ valid: false, error: '検証に失敗しました' });
  }
}
