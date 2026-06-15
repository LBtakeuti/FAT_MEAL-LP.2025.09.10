import { describe, it, expect, vi } from 'vitest';

// 商品制限クーポンのお試し誤適用ガード（commit 537dc49）のユニットテスト。
//
// 対象ロジックは2つの API ルートに同形で存在する:
//   - app/api/payment/validate-coupon/route.ts
//       getProductPriceIdForPlan() でプラン→商品 Price ID を解決し、
//       scope==='product' のとき applies_to に現プランの Product が含まれるかで appliesToCurrentPlan を決定。
//       解決不能なら安全側で false（範囲外 → valid:false）。
//   - app/api/payment/create-intent/route.ts（one-time / trial-6 経路）
//       applies_to.products がある場合のみ trial-6 の Product を解決し、
//       含まれなければ割引を一切適用しない（amount 据え置き）。
//
// ルートハンドラは next/server・supabase・モジュールロード時の Stripe 生成を伴い重いため、
// 本リポジトリの慣習（lib/__tests__/cancellation-availability.test.ts / coupon-discount.test.ts 参照）に倣い、
// 判定ロジックを同式で再定義し、Stripe はフェイククライアントでモックしてカバーする。
//
// 再定義した式は以下と一致していなければならない:
//   - validate-coupon/route.ts: getProductPriceIdForPlan / scope 判定 / appliesToCurrentPlan 判定
//   - create-intent/route.ts (one-time): couponApplicable 判定

// === env ミラー（テスト内で固定値を使う。実 env には依存しない）===
const ENV = {
  STRIPE_PRICE_TRIAL_6SET: 'price_trial6',
  STRIPE_PRICE_SUB6_PRODUCT: 'price_sub6',
  STRIPE_PRICE_SUB12_PRODUCT: 'price_sub12',
};

// price_xxx → product_yyy の対応（Stripe 上の構造を模倣）
const PRICE_TO_PRODUCT: Record<string, string> = {
  price_trial6: 'prod_trial',
  price_sub6: 'prod_sub6',
  price_sub12: 'prod_sub12',
};

// KOSHIGAYA 相当（定期専用）: applies_to に sub-6 / sub-12 の Product のみ
const KOSHIGAYA_APPLIES_TO = ['prod_sub6', 'prod_sub12'];

// === Stripe フェイククライアント ===
// prices.retrieve(priceId) → { product } を返す。
// 未知 price はエラーを投げる（retrieve 失敗ケースの再現）。
function makeFakeStripe(opts?: { throwOnRetrieve?: boolean }) {
  return {
    prices: {
      retrieve: vi.fn(async (priceId: string) => {
        if (opts?.throwOnRetrieve) throw new Error('stripe down');
        const product = PRICE_TO_PRODUCT[priceId];
        if (!product) throw new Error(`No such price: ${priceId}`);
        return { product };
      }),
    },
  };
}

type Coupon = {
  applies_to?: { products?: string[] };
  percent_off?: number;
  amount_off?: number;
};

// === validate-coupon/route.ts ミラー ===
function getProductPriceIdForPlan(planId: string | null | undefined): string | null {
  if (!planId) return null;
  const map: Record<string, string | undefined> = {
    'trial-6': ENV.STRIPE_PRICE_TRIAL_6SET,
    'sub-6': ENV.STRIPE_PRICE_SUB6_PRODUCT,
    'sub-12': ENV.STRIPE_PRICE_SUB12_PRODUCT,
  };
  return map[planId] || null;
}

type ValidateResult = {
  valid: boolean;
  scope: 'product' | 'all';
  appliesToCurrentPlan: boolean | null;
};

// validate-coupon の判定部分を同式で再現（Stripe は注入）。
async function validateCoupon(
  stripe: ReturnType<typeof makeFakeStripe>,
  coupon: Coupon,
  planId: string | null,
): Promise<ValidateResult> {
  const appliesToProducts: string[] | null = Array.isArray(coupon.applies_to?.products)
    ? coupon.applies_to!.products!
    : null;
  const scope: 'product' | 'all' =
    appliesToProducts && appliesToProducts.length > 0 ? 'product' : 'all';

  let appliesToCurrentPlan: boolean | null = null;
  if (typeof planId === 'string' && planId) {
    if (scope === 'all') {
      appliesToCurrentPlan = true;
    } else {
      const productPriceId = getProductPriceIdForPlan(planId);
      if (!productPriceId) {
        appliesToCurrentPlan = false;
      } else {
        try {
          const price = await stripe.prices.retrieve(productPriceId);
          const productId =
            typeof (price as any).product === 'string'
              ? (price as any).product
              : (price as any).product?.id;
          appliesToCurrentPlan = !!productId && appliesToProducts!.includes(productId);
        } catch {
          appliesToCurrentPlan = false;
        }
      }
    }
  }

  const valid = appliesToCurrentPlan !== false;
  return { valid, scope, appliesToCurrentPlan };
}

// === create-intent/route.ts (one-time / trial-6) ミラー ===
// 戻り値: 最終 amount（割引適用後）。割引非適用なら base 据え置き。
async function createIntentOneTimeAmount(
  stripe: ReturnType<typeof makeFakeStripe>,
  coupon: Coupon,
  base: number,
  // 実ルートの process.env.STRIPE_PRICE_TRIAL_6SET 参照を模倣。
  // 既定は env 設定済み（price_trial6）。env 未設定の検証時のみ '' を渡す
  // （未設定 env は falsy。undefined だと既定値にフォールバックしてしまうため空文字で表現）。
  trialPriceId: string = ENV.STRIPE_PRICE_TRIAL_6SET,
): Promise<{ amount: number; applied: boolean }> {
  const appliesToProducts: string[] | null = Array.isArray(coupon.applies_to?.products)
    ? coupon.applies_to!.products!
    : null;
  let couponApplicable = true;
  if (appliesToProducts && appliesToProducts.length > 0) {
    couponApplicable = false;
    if (trialPriceId) {
      try {
        const price = await stripe.prices.retrieve(trialPriceId);
        const productId =
          typeof (price as any).product === 'string'
            ? (price as any).product
            : (price as any).product?.id;
        couponApplicable = !!productId && appliesToProducts.includes(productId);
      } catch {
        couponApplicable = false;
      }
    }
  }

  let amount = base;
  let applied = false;
  if (couponApplicable) {
    applied = true;
    if (coupon.percent_off) {
      amount = Math.round(amount * (1 - coupon.percent_off / 100));
    } else if (coupon.amount_off) {
      amount = Math.max(0, amount - coupon.amount_off);
    }
  }
  return { amount, applied };
}

const TRIAL_BASE = 5700; // (4200 + 1500) * 1

describe('商品制限クーポンガード: validate-coupon', () => {
  it('trial-6 + 商品制限クーポン(sub限定) → valid:false / scope:product / appliesToCurrentPlan:false', async () => {
    const stripe = makeFakeStripe();
    const coupon: Coupon = { applies_to: { products: KOSHIGAYA_APPLIES_TO }, amount_off: 2100 };
    const res = await validateCoupon(stripe, coupon, 'trial-6');
    expect(res.scope).toBe('product');
    expect(res.appliesToCurrentPlan).toBe(false);
    expect(res.valid).toBe(false);
    // trial-6 の Product(prod_trial) は applies_to に含まれない
    expect(stripe.prices.retrieve).toHaveBeenCalledWith(ENV.STRIPE_PRICE_TRIAL_6SET);
  });

  it('sub-6 + 同クーポン → valid:true / appliesToCurrentPlan:true（従来どおり）', async () => {
    const stripe = makeFakeStripe();
    const coupon: Coupon = { applies_to: { products: KOSHIGAYA_APPLIES_TO }, amount_off: 2100 };
    const res = await validateCoupon(stripe, coupon, 'sub-6');
    expect(res.scope).toBe('product');
    expect(res.appliesToCurrentPlan).toBe(true);
    expect(res.valid).toBe(true);
  });

  it('sub-12 + 同クーポン → valid:true / appliesToCurrentPlan:true（従来どおり）', async () => {
    const stripe = makeFakeStripe();
    const coupon: Coupon = { applies_to: { products: KOSHIGAYA_APPLIES_TO }, amount_off: 2100 };
    const res = await validateCoupon(stripe, coupon, 'sub-12');
    expect(res.appliesToCurrentPlan).toBe(true);
    expect(res.valid).toBe(true);
  });

  it('scope:all クーポン + trial-6 → valid:true / scope:all / appliesToCurrentPlan:true（全体クーポンはお試しでも有効）', async () => {
    const stripe = makeFakeStripe();
    const coupon: Coupon = { percent_off: 10 }; // applies_to なし → 全体クーポン
    const res = await validateCoupon(stripe, coupon, 'trial-6');
    expect(res.scope).toBe('all');
    expect(res.appliesToCurrentPlan).toBe(true);
    expect(res.valid).toBe(true);
    // 全体クーポンは Product 解決不要
    expect(stripe.prices.retrieve).not.toHaveBeenCalled();
  });

  it('空の applies_to.products は全体クーポン扱い（scope:all）', async () => {
    const stripe = makeFakeStripe();
    const coupon: Coupon = { applies_to: { products: [] }, percent_off: 10 };
    const res = await validateCoupon(stripe, coupon, 'trial-6');
    expect(res.scope).toBe('all');
    expect(res.valid).toBe(true);
  });

  describe('安全側フォールバック', () => {
    it('商品制限クーポンでプランの Product を解決できない（未知プラン）→ 拒否(false)', async () => {
      const stripe = makeFakeStripe();
      const coupon: Coupon = { applies_to: { products: KOSHIGAYA_APPLIES_TO }, amount_off: 2100 };
      // getProductPriceIdForPlan が null を返すプラン
      const res = await validateCoupon(stripe, coupon, 'unknown-plan');
      expect(res.appliesToCurrentPlan).toBe(false);
      expect(res.valid).toBe(false);
      // Price ID が解決できないので Stripe は呼ばない
      expect(stripe.prices.retrieve).not.toHaveBeenCalled();
    });

    it('prices.retrieve が失敗 → 安全側で拒否(false)', async () => {
      const stripe = makeFakeStripe({ throwOnRetrieve: true });
      const coupon: Coupon = { applies_to: { products: KOSHIGAYA_APPLIES_TO }, amount_off: 2100 };
      const res = await validateCoupon(stripe, coupon, 'sub-6');
      expect(res.appliesToCurrentPlan).toBe(false);
      expect(res.valid).toBe(false);
    });

    it('planId 未指定なら appliesToCurrentPlan は null（範囲判定なし）', async () => {
      const stripe = makeFakeStripe();
      const coupon: Coupon = { applies_to: { products: KOSHIGAYA_APPLIES_TO }, amount_off: 2100 };
      const res = await validateCoupon(stripe, coupon, null);
      expect(res.appliesToCurrentPlan).toBeNull();
      expect(res.valid).toBe(true);
    });
  });
});

describe('商品制限クーポンガード: create-intent (one-time / trial-6)', () => {
  it('trial-6 + 商品制限クーポン(sub限定) → 割引非適用・amount 据え置き', async () => {
    const stripe = makeFakeStripe();
    const coupon: Coupon = { applies_to: { products: KOSHIGAYA_APPLIES_TO }, amount_off: 2100 };
    const res = await createIntentOneTimeAmount(stripe, coupon, TRIAL_BASE);
    expect(res.applied).toBe(false);
    expect(res.amount).toBe(TRIAL_BASE); // 5700 のまま
  });

  it('trial-6 + 全体クーポン(percent_off) → 適用OK', async () => {
    const stripe = makeFakeStripe();
    const coupon: Coupon = { percent_off: 10 };
    const res = await createIntentOneTimeAmount(stripe, coupon, TRIAL_BASE);
    expect(res.applied).toBe(true);
    expect(res.amount).toBe(Math.round(TRIAL_BASE * 0.9)); // 5130
  });

  it('trial-6 + 全体クーポン(amount_off) → 適用OK', async () => {
    const stripe = makeFakeStripe();
    const coupon: Coupon = { amount_off: 2100 };
    const res = await createIntentOneTimeAmount(stripe, coupon, TRIAL_BASE);
    expect(res.applied).toBe(true);
    expect(res.amount).toBe(TRIAL_BASE - 2100); // 3600
  });

  it('applies_to に trial-6 の Product を含むクーポン → 適用OK', async () => {
    const stripe = makeFakeStripe();
    const coupon: Coupon = {
      applies_to: { products: ['prod_trial', 'prod_sub6'] },
      amount_off: 1000,
    };
    const res = await createIntentOneTimeAmount(stripe, coupon, TRIAL_BASE);
    expect(res.applied).toBe(true);
    expect(res.amount).toBe(TRIAL_BASE - 1000); // 4700
  });

  it('prices.retrieve が失敗 → 安全側で割引非適用・amount 据え置き', async () => {
    const stripe = makeFakeStripe({ throwOnRetrieve: true });
    const coupon: Coupon = { applies_to: { products: ['prod_trial'] }, amount_off: 2100 };
    const res = await createIntentOneTimeAmount(stripe, coupon, TRIAL_BASE);
    expect(res.applied).toBe(false);
    expect(res.amount).toBe(TRIAL_BASE);
  });

  it('env(STRIPE_PRICE_TRIAL_6SET)未設定で trial product 解決不能 → 安全側で割引非適用・amount 据え置き', async () => {
    const stripe = makeFakeStripe();
    // applies_to に trial product を含むクーポンでも、env 未設定なら解決できないので弾く。
    const coupon: Coupon = { applies_to: { products: ['prod_trial'] }, amount_off: 2100 };
    const res = await createIntentOneTimeAmount(stripe, coupon, TRIAL_BASE, '');
    expect(res.applied).toBe(false);
    expect(res.amount).toBe(TRIAL_BASE);
    // env 未設定なら Stripe retrieve は呼ばれない（if (trialPriceId) でスキップ）
    expect(stripe.prices.retrieve).not.toHaveBeenCalled();
  });
});
