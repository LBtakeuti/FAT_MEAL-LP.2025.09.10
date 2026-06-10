import { describe, it, expect } from 'vitest';

// F55/F56: クーポン計算ロジックのユニットテスト。
//
// 対象ロジックは components/purchase/PurchaseFlow.tsx 内のローカル関数
// （calculateCouponDiscount / buildCouponDisplayConfig）に閉じているため、
// 本リポジトリの慣習（lib/__tests__/cancellation-availability.test.ts 参照）に倣い、
// 純粋計算部分をテスト側で同式に再定義してカバーする。
//
// 再定義した式は以下と一致していなければならない:
//   - フロント: components/purchase/PurchaseFlow.tsx calculateCouponDiscount / buildCouponDisplayConfig
//   - サーバー: app/api/payment/create-intent/route.ts
//       percent_off : Math.round(amount * (1 - p / 100))
//       amount_off  : Math.max(0, amount - amount_off)

// --- 現役3プランの totalPrice（商品 + 送料）。PurchaseFlow.tsx の planOptions と一致 ---
const PLAN_TOTAL: Record<string, number> = {
  'trial-6': 5700,
  'sub-6': 5100,
  'sub-12': 8100,
};
const SHIPPING_FEE = 1500;

type AppliedCoupon = {
  code: string;
  percentOff?: number;
  discount: number;
  couponMetadata?: Record<string, string> | null;
};

// === F55: サーバー式ミラー（純粋計算） ===
// PurchaseFlow.tsx calculateCouponDiscount の本体と同式。
function calculateCouponDiscount(base: number, coupon: AppliedCoupon | null): number {
  if (!coupon) return 0;
  if (coupon.percentOff) {
    const afterDiscount = Math.round(base * (1 - coupon.percentOff / 100));
    return Math.max(0, base - afterDiscount);
  }
  const afterDiscount = Math.max(0, base - coupon.discount);
  return base - afterDiscount;
}

// === サーバー側の請求額計算（create-intent/route.ts のトライアル経路と同式）===
// 比較検証用: フロント discount を引いた最終額 = サーバー amount であること。
function serverFinalAmount(base: number, coupon: AppliedCoupon | null): number {
  if (!coupon) return base;
  if (coupon.percentOff) {
    return Math.round(base * (1 - coupon.percentOff / 100));
  }
  return Math.max(0, base - coupon.discount);
}

// === F56: 整合ガード（buildCouponDisplayConfig の純粋部分）===
const COUPON_THEME_GRADIENTS: Record<string, string> = {
  gold: 'from-amber-500 via-yellow-400 to-amber-300',
  pink: 'from-pink-500 via-rose-400 to-pink-300',
  blue: 'from-blue-600 via-sky-500 to-cyan-300',
};

type DisplayConfig = {
  custom: boolean;
  label: string | null;
  gradientClass: string | null;
  freeShipping: boolean;
  productDiscount: number;
};

// PurchaseFlow.tsx buildCouponDisplayConfig の本体と同式。
// shippingFee / discount は呼び出し側で算出済みの値を渡す。
function buildCouponDisplayConfig(
  coupon: AppliedCoupon | null,
  shippingFee: number,
  discount: number,
): DisplayConfig {
  const fallback: DisplayConfig = {
    custom: false,
    label: null,
    gradientClass: null,
    freeShipping: false,
    productDiscount: 0,
  };
  const meta = coupon?.couponMetadata;
  if (!coupon || !meta || typeof meta !== 'object') return fallback;

  const freeShipping = meta.free_shipping === 'true';
  const rawProductDiscount = meta.product_discount;
  const productDiscount =
    typeof rawProductDiscount === 'string' && /^\d+$/.test(rawProductDiscount.trim())
      ? parseInt(rawProductDiscount.trim(), 10)
      : 0;

  const hasDisplayDirective =
    typeof meta.display_label === 'string' ||
    typeof meta.theme === 'string' ||
    freeShipping ||
    productDiscount > 0;
  if (!hasDisplayDirective) return fallback;

  const breakdownTotal = (freeShipping ? shippingFee : 0) + productDiscount;
  if (breakdownTotal !== discount) {
    return fallback;
  }

  const themeKey = typeof meta.theme === 'string' ? meta.theme : '';
  const gradientClass = COUPON_THEME_GRADIENTS[themeKey] || null;
  const label = typeof meta.display_label === 'string' ? meta.display_label : null;

  return { custom: true, label, gradientClass, freeShipping, productDiscount };
}

describe('F55: calculateCouponDiscount（サーバー式ミラー）', () => {
  describe('percent_off', () => {
    it('trial-6 / 10%OFF: 5700 → 割引570', () => {
      const c: AppliedCoupon = { code: 'P10', percentOff: 10, discount: 0 };
      expect(calculateCouponDiscount(PLAN_TOTAL['trial-6'], c)).toBe(570);
    });

    it('sub-6 / 10%OFF: 5100 → 割引510', () => {
      const c: AppliedCoupon = { code: 'P10', percentOff: 10, discount: 0 };
      expect(calculateCouponDiscount(PLAN_TOTAL['sub-6'], c)).toBe(510);
    });

    it('sub-12 / 10%OFF: 8100 → 割引810', () => {
      const c: AppliedCoupon = { code: 'P10', percentOff: 10, discount: 0 };
      expect(calculateCouponDiscount(PLAN_TOTAL['sub-12'], c)).toBe(810);
    });

    it('端数は四捨五入で割引後を算出（sub-6 / 33%OFF: round(5100*0.67)=3417, 割引1683）', () => {
      const c: AppliedCoupon = { code: 'P33', percentOff: 33, discount: 0 };
      // afterDiscount = round(5100 * 0.67) = round(3417) = 3417
      expect(calculateCouponDiscount(PLAN_TOTAL['sub-6'], c)).toBe(5100 - 3417);
    });

    it('四捨五入の繰り上げ確認（sub-12 / 15%OFF: round(8100*0.85)=6885, 割引1215）', () => {
      const c: AppliedCoupon = { code: 'P15', percentOff: 15, discount: 0 };
      expect(calculateCouponDiscount(PLAN_TOTAL['sub-12'], c)).toBe(8100 - Math.round(8100 * 0.85));
    });

    it('100%OFF: 割引額は base 全額', () => {
      const c: AppliedCoupon = { code: 'P100', percentOff: 100, discount: 0 };
      expect(calculateCouponDiscount(PLAN_TOTAL['trial-6'], c)).toBe(5700);
    });
  });

  describe('amount_off', () => {
    it('trial-6 / 2100円OFF: 割引2100（base未満）', () => {
      const c: AppliedCoupon = { code: 'A2100', discount: 2100 };
      expect(calculateCouponDiscount(PLAN_TOTAL['trial-6'], c)).toBe(2100);
    });

    it('sub-12 / 1000円OFF: 割引1000', () => {
      const c: AppliedCoupon = { code: 'A1000', discount: 1000 };
      expect(calculateCouponDiscount(PLAN_TOTAL['sub-12'], c)).toBe(1000);
    });

    it('base を超える amount_off は base にクランプ（割引額が base を超えない）', () => {
      const c: AppliedCoupon = { code: 'A99999', discount: 99999 };
      // afterDiscount = max(0, 5100 - 99999) = 0 → 割引 = 5100
      expect(calculateCouponDiscount(PLAN_TOTAL['sub-6'], c)).toBe(5100);
    });

    it('base ちょうどの amount_off: 割引 = base、割引後 0', () => {
      const c: AppliedCoupon = { code: 'A5700', discount: 5700 };
      expect(calculateCouponDiscount(PLAN_TOTAL['trial-6'], c)).toBe(5700);
    });
  });

  describe('クーポン未適用', () => {
    it('coupon が null なら割引 0', () => {
      expect(calculateCouponDiscount(PLAN_TOTAL['trial-6'], null)).toBe(0);
    });
  });

  describe('サーバー式（create-intent）との一致検証', () => {
    const plans = Object.entries(PLAN_TOTAL);

    it('percent_off: フロント (base - discount) === サーバー final amount', () => {
      const c: AppliedCoupon = { code: 'P25', percentOff: 25, discount: 0 };
      for (const [, base] of plans) {
        const frontFinal = base - calculateCouponDiscount(base, c);
        expect(frontFinal).toBe(serverFinalAmount(base, c));
      }
    });

    it('amount_off: フロント (base - discount) === サーバー final amount', () => {
      const c: AppliedCoupon = { code: 'A2100', discount: 2100 };
      for (const [, base] of plans) {
        const frontFinal = base - calculateCouponDiscount(base, c);
        expect(frontFinal).toBe(serverFinalAmount(base, c));
      }
    });

    it('amount_off クランプ時もサーバーと一致（max(0, ...)）', () => {
      const c: AppliedCoupon = { code: 'A99999', discount: 99999 };
      for (const [, base] of plans) {
        const frontFinal = base - calculateCouponDiscount(base, c);
        expect(frontFinal).toBe(serverFinalAmount(base, c));
        expect(frontFinal).toBe(0);
      }
    });
  });
});

describe('F56: buildCouponDisplayConfig（整合ガード）', () => {
  it('KOSHIGAYA例: amount_off=2100, free_shipping=true, product_discount=600 → 整合一致で custom=true', () => {
    const base = PLAN_TOTAL['trial-6']; // 5700
    const coupon: AppliedCoupon = {
      code: 'KOSHIGAYA',
      discount: 2100,
      couponMetadata: {
        display_label: '越谷スペシャル',
        theme: 'gold',
        free_shipping: 'true',
        product_discount: '600',
      },
    };
    const discount = calculateCouponDiscount(base, coupon); // 2100
    expect(discount).toBe(2100);
    // 内訳: 送料1500 + 商品600 = 2100 === discount 2100
    const cfg = buildCouponDisplayConfig(coupon, SHIPPING_FEE, discount);
    expect(cfg.custom).toBe(true);
    expect(cfg.label).toBe('越谷スペシャル');
    expect(cfg.gradientClass).toBe(COUPON_THEME_GRADIENTS.gold);
    expect(cfg.freeShipping).toBe(true);
    expect(cfg.productDiscount).toBe(600);
  });

  it('内訳合計が discount と不一致ならフォールバック（custom=false）', () => {
    const coupon: AppliedCoupon = {
      code: 'BROKEN',
      discount: 2100,
      couponMetadata: {
        display_label: '壊れた内訳',
        theme: 'gold',
        free_shipping: 'true',
        product_discount: '999', // 1500 + 999 = 2499 ≠ 2100
      },
    };
    const cfg = buildCouponDisplayConfig(coupon, SHIPPING_FEE, 2100);
    expect(cfg.custom).toBe(false);
    expect(cfg.label).toBeNull();
    expect(cfg.gradientClass).toBeNull();
  });

  it('free_shipping のみ（送料1500）で discount=1500 なら整合一致', () => {
    const coupon: AppliedCoupon = {
      code: 'FREESHIP',
      discount: 1500,
      couponMetadata: { free_shipping: 'true', theme: 'blue' },
    };
    const cfg = buildCouponDisplayConfig(coupon, SHIPPING_FEE, 1500);
    expect(cfg.custom).toBe(true);
    expect(cfg.freeShipping).toBe(true);
    expect(cfg.productDiscount).toBe(0);
    expect(cfg.gradientClass).toBe(COUPON_THEME_GRADIENTS.blue);
  });

  it('product_discount のみで free_shipping なし、discount一致なら整合一致', () => {
    const coupon: AppliedCoupon = {
      code: 'PROD600',
      discount: 600,
      couponMetadata: { product_discount: '600', display_label: '商品割引' },
    };
    const cfg = buildCouponDisplayConfig(coupon, SHIPPING_FEE, 600);
    expect(cfg.custom).toBe(true);
    expect(cfg.freeShipping).toBe(false);
    expect(cfg.productDiscount).toBe(600);
    expect(cfg.gradientClass).toBeNull(); // theme未指定
  });

  describe('安全なデフォルトフォールバック', () => {
    it('metadata 未設定（null）ならデフォルト', () => {
      const coupon: AppliedCoupon = { code: 'NOMETA', discount: 500, couponMetadata: null };
      expect(buildCouponDisplayConfig(coupon, SHIPPING_FEE, 500).custom).toBe(false);
    });

    it('表示指示が一切ない metadata（空オブジェクト）ならデフォルト', () => {
      const coupon: AppliedCoupon = { code: 'EMPTY', discount: 500, couponMetadata: {} };
      expect(buildCouponDisplayConfig(coupon, SHIPPING_FEE, 500).custom).toBe(false);
    });

    it('coupon が null ならデフォルト', () => {
      expect(buildCouponDisplayConfig(null, SHIPPING_FEE, 0).custom).toBe(false);
    });

    it('未知 theme は gradientClass=null（整合一致時）', () => {
      const coupon: AppliedCoupon = {
        code: 'UNKNOWNTHEME',
        discount: 600,
        couponMetadata: { theme: 'rainbow', product_discount: '600' },
      };
      const cfg = buildCouponDisplayConfig(coupon, SHIPPING_FEE, 600);
      expect(cfg.custom).toBe(true);
      expect(cfg.gradientClass).toBeNull();
    });

    it('非数値 product_discount（"abc"）は 0 扱い', () => {
      const coupon: AppliedCoupon = {
        code: 'BADNUM',
        discount: 1500,
        couponMetadata: { free_shipping: 'true', product_discount: 'abc' },
      };
      // productDiscount=0 → 内訳=送料1500 === discount1500 で整合一致
      const cfg = buildCouponDisplayConfig(coupon, SHIPPING_FEE, 1500);
      expect(cfg.custom).toBe(true);
      expect(cfg.productDiscount).toBe(0);
    });

    it('負号付き product_discount（"-100"）は正規表現で弾かれ 0 扱い', () => {
      const coupon: AppliedCoupon = {
        code: 'NEGNUM',
        discount: 1500,
        couponMetadata: { free_shipping: 'true', product_discount: '-100' },
      };
      const cfg = buildCouponDisplayConfig(coupon, SHIPPING_FEE, 1500);
      expect(cfg.custom).toBe(true);
      expect(cfg.productDiscount).toBe(0);
    });

    it('free_shipping が "true" 以外（"1"）なら無効', () => {
      const coupon: AppliedCoupon = {
        code: 'FSWRONG',
        discount: 600,
        couponMetadata: { free_shipping: '1', product_discount: '600' },
      };
      // freeShipping=false なので内訳 = 0 + 600 = 600 === discount600 で整合一致
      const cfg = buildCouponDisplayConfig(coupon, SHIPPING_FEE, 600);
      expect(cfg.custom).toBe(true);
      expect(cfg.freeShipping).toBe(false);
    });
  });
});
