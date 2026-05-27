/**
 * F13-1: Stripe Price ID を「Vercel 環境変数」から
 *        「Stripe price.metadata.internal_code を動的取得」する方式へ移行する共通ヘルパー。
 *
 * 環境変数を Vercel から完全に削除することがゴール。
 * 移行段階1（このファイル）では metadata 検索が失敗した場合のみ既存の環境変数を fallback として参照する。
 *
 * 使い方:
 *   const productPriceId = await getPriceIdByInternalCode('sub-12');
 *
 * Stripe ダッシュボード側の準備:
 *   各 price に metadata `internal_code` を設定する。
 *   - sub-6:        sub-6     商品（¥3,000/月）
 *   - sub-12:       sub-12    商品（¥6,000/月）
 *   - sub-shipping: sub-shipping  サブスク送料（¥1,500/月、共通）
 */

import Stripe from 'stripe';

// 環境変数 fallback マップ。Stripe 側で metadata が未設定でも動作継続するため。
// すべての price で internal_code が設定確認できたら、この fallback マップごと
// 削除して環境変数も Vercel から消す（最終ステップ）。
const ENV_FALLBACK: Record<string, string | undefined> = {
  'sub-6': process.env.STRIPE_PRICE_SUB6_PRODUCT,
  'sub-12': process.env.STRIPE_PRICE_SUB12_PRODUCT,
  'sub-shipping': process.env.STRIPE_PRICE_SUB_SHIPPING,
};

// メモリキャッシュ。Stripe API への過剰な list 呼び出しを抑える。
interface CacheEntry {
  priceId: string;
  expiresAt: number;
}
const CACHE_TTL_MS = 5 * 60 * 1000; // 5分
const cache = new Map<string, CacheEntry>();

// テスト用にキャッシュを初期化するヘルパー（本番コードからは呼ばない）。
export function _clearStripePriceCache(): void {
  cache.clear();
}

let stripeClient: Stripe | null = null;
function getStripe(): Stripe {
  if (stripeClient) return stripeClient;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error('STRIPE_SECRET_KEY is not configured');
  stripeClient = new Stripe(secretKey);
  return stripeClient;
}

/**
 * Stripe で active な全 price から `metadata.internal_code === code` を持つ price を探し、
 * その price ID を返す。見つからなければ環境変数 fallback、それも無ければ throw。
 *
 * 結果は 5 分間メモリキャッシュする。
 */
export async function getPriceIdByInternalCode(
  code: string,
  // テスト用に Stripe クライアントを差し替えられるようにする
  client?: Stripe,
): Promise<string> {
  // 1. メモリキャッシュ確認
  const now = Date.now();
  const cached = cache.get(code);
  if (cached && cached.expiresAt > now) {
    return cached.priceId;
  }

  // 2. Stripe API で metadata から動的取得
  try {
    const stripe = client ?? getStripe();
    // active な price は通常そう多くないため limit=100 で 1 ページに収まる想定
    const prices = await stripe.prices.list({ active: true, limit: 100 });
    const found = prices.data.find((p) => p.metadata?.internal_code === code);
    if (found?.id) {
      cache.set(code, { priceId: found.id, expiresAt: now + CACHE_TTL_MS });
      return found.id;
    }
  } catch (error) {
    // ネットワークエラー等で Stripe を叩けなかった場合も fallback に落とす
    console.error(`[stripe-prices] failed to query Stripe for internal_code=${code}`, error);
  }

  // 3. 環境変数 fallback（段階1の移行期間用）
  const envFallback = ENV_FALLBACK[code];
  if (envFallback) {
    cache.set(code, { priceId: envFallback, expiresAt: now + CACHE_TTL_MS });
    return envFallback;
  }

  // 4. それでも見つからなければ throw
  throw new Error(
    `Stripe price not found for internal_code="${code}". Set metadata.internal_code on the price, or define the env fallback.`,
  );
}
