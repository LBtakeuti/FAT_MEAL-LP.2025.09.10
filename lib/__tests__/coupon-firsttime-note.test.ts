import { describe, it, expect } from 'vitest';

// F57: 「初回のみ注記」の表示判定ロジックのユニットテスト。
//
// 対象は components/purchase/PurchaseFlow.tsx 内のインライン JSX 判定（1757-1768 行付近）。
// 本リポジトリの慣習（lib/__tests__/cancellation-availability.test.ts /
// coupon-discount.test.ts と同パターン）に倣い、判定と文言生成の純粋部分を
// テスト側に同式で切り出してカバーする。PurchaseFlow.tsx は無改変。
//
// 表示条件（JSX と同式）:
//   appliedCoupon && selectedPlan && !selectedPlan.isTrial &&
//   (duration === 'once' || duration === 'repeating')
// 文言分岐（3分岐 / commit e0fc904 = F59、通常価格に「（送料込み）」を明記したトーン調整）:
//   once → 「※初回限定の割引です。2回目以降は通常価格 ¥{totalPrice}（送料込み）になります。」
//   repeating かつ durationInMonths（truthy）→「※最初の{N}ヶ月限定の割引です。以降は通常価格 ¥{totalPrice}（送料込み）になります。」
//   repeating かつ durationInMonths 欠落(null/0) →「※期間限定の割引です。期間終了後は通常価格 ¥{totalPrice}（送料込み）になります。」
//     （月数を断定できないため「初回のみ」と誤断定しない汎用表現）

const PLAN_TOTAL: Record<string, number> = {
  'trial-6': 5700,
  'sub-6': 5100,
  'sub-12': 8100,
};

type Plan = { totalPrice: number; isTrial: boolean };
type Coupon = {
  duration?: 'once' | 'repeating' | 'forever' | null;
  durationInMonths?: number | null;
};

const planTrial: Plan = { totalPrice: PLAN_TOTAL['trial-6'], isTrial: true };
const planSub6: Plan = { totalPrice: PLAN_TOTAL['sub-6'], isTrial: false };
const planSub12: Plan = { totalPrice: PLAN_TOTAL['sub-12'], isTrial: false };

// PurchaseFlow.tsx の表示条件と同式。
function shouldShowFirstTimeNote(coupon: Coupon | null, plan: Plan | null): boolean {
  return Boolean(
    coupon &&
      plan &&
      !plan.isTrial &&
      (coupon.duration === 'once' || coupon.duration === 'repeating'),
  );
}

// PurchaseFlow.tsx の文言生成と同式（表示すると判定された前提 / 3分岐）。
function firstTimeNoteText(coupon: Coupon, plan: Plan): string {
  const price = plan.totalPrice.toLocaleString();
  return coupon.duration === 'once'
    ? `※初回限定の割引です。2回目以降は通常価格 ¥${price}（送料込み）になります。`
    : coupon.durationInMonths
      ? `※最初の${coupon.durationInMonths}ヶ月限定の割引です。以降は通常価格 ¥${price}（送料込み）になります。`
      : `※期間限定の割引です。期間終了後は通常価格 ¥${price}（送料込み）になります。`;
}

describe('F57: shouldShowFirstTimeNote（表示判定）', () => {
  it('定期(sub-6) × once → 表示', () => {
    expect(shouldShowFirstTimeNote({ duration: 'once' }, planSub6)).toBe(true);
  });

  it('定期(sub-12) × repeating → 表示', () => {
    expect(shouldShowFirstTimeNote({ duration: 'repeating', durationInMonths: 3 }, planSub12)).toBe(
      true,
    );
  });

  it('お試し(trial-6) × once → 非表示（2回目以降の概念なし）', () => {
    expect(shouldShowFirstTimeNote({ duration: 'once' }, planTrial)).toBe(false);
  });

  it('お試し(trial-6) × repeating → 非表示', () => {
    expect(
      shouldShowFirstTimeNote({ duration: 'repeating', durationInMonths: 3 }, planTrial),
    ).toBe(false);
  });

  it('定期 × forever → 非表示', () => {
    expect(shouldShowFirstTimeNote({ duration: 'forever' }, planSub6)).toBe(false);
  });

  it('定期 × duration=null → 非表示', () => {
    expect(shouldShowFirstTimeNote({ duration: null }, planSub6)).toBe(false);
  });

  it('定期 × duration未設定(undefined) → 非表示', () => {
    expect(shouldShowFirstTimeNote({}, planSub6)).toBe(false);
  });

  it('appliedCoupon なし(null) → 非表示', () => {
    expect(shouldShowFirstTimeNote(null, planSub6)).toBe(false);
  });

  it('selectedPlan なし(null) → 非表示', () => {
    expect(shouldShowFirstTimeNote({ duration: 'once' }, null)).toBe(false);
  });
});

describe('F57: firstTimeNoteText（文言分岐）', () => {
  it('once: 「※初回限定の割引です…通常価格 ¥5,100（送料込み）」(sub-6)', () => {
    expect(firstTimeNoteText({ duration: 'once' }, planSub6)).toBe(
      '※初回限定の割引です。2回目以降は通常価格 ¥5,100（送料込み）になります。',
    );
  });

  it('once: sub-12 は ¥8,100 を埋め込む', () => {
    expect(firstTimeNoteText({ duration: 'once' }, planSub12)).toBe(
      '※初回限定の割引です。2回目以降は通常価格 ¥8,100（送料込み）になります。',
    );
  });

  it('repeating + durationInMonths=3: 「※最初の3ヶ月限定の割引です…¥5,100（送料込み）」(sub-6)', () => {
    expect(
      firstTimeNoteText({ duration: 'repeating', durationInMonths: 3 }, planSub6),
    ).toBe('※最初の3ヶ月限定の割引です。以降は通常価格 ¥5,100（送料込み）になります。');
  });

  it('repeating + durationInMonths=6: N がそのまま反映される(sub-12)', () => {
    expect(
      firstTimeNoteText({ duration: 'repeating', durationInMonths: 6 }, planSub12),
    ).toBe('※最初の6ヶ月限定の割引です。以降は通常価格 ¥8,100（送料込み）になります。');
  });

  it('repeating だが durationInMonths が null → 「※期間限定の割引」汎用文言（once に誤断定しない）', () => {
    expect(
      firstTimeNoteText({ duration: 'repeating', durationInMonths: null }, planSub6),
    ).toBe('※期間限定の割引です。期間終了後は通常価格 ¥5,100（送料込み）になります。');
  });

  it('repeating だが durationInMonths=0(falsy) → 「※期間限定の割引」汎用文言', () => {
    expect(
      firstTimeNoteText({ duration: 'repeating', durationInMonths: 0 }, planSub6),
    ).toBe('※期間限定の割引です。期間終了後は通常価格 ¥5,100（送料込み）になります。');
  });

  it('金額は totalPrice.toLocaleString() でカンマ区切りされる', () => {
    expect(firstTimeNoteText({ duration: 'once' }, planSub12)).toContain('¥8,100');
  });
});
