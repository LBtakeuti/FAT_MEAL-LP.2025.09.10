import { describe, it, expect } from 'vitest';

// F38: checkInventoryForDelivery の純粋ロジック部分を再定義してテスト
// 実際の関数は Supabase 依存のため、計算ロジックのみ切り出す

function calcRequiredSets(mealsPerDelivery: number | null | undefined): number {
  const meals = mealsPerDelivery || 12; // null/undefined は 12 にフォールバック
  return Math.ceil(meals / 6);
}

function hasEnoughStock(stockSets: number, requiredSets: number): boolean {
  return stockSets >= requiredSets;
}

describe('calcRequiredSets — meals_per_delivery → requiredSets', () => {
  it('6食プラン → requiredSets=1', () => {
    expect(calcRequiredSets(6)).toBe(1);
  });

  it('12食プラン → requiredSets=2', () => {
    expect(calcRequiredSets(12)).toBe(2);
  });

  it('null はフォールバック12食扱い → requiredSets=2', () => {
    expect(calcRequiredSets(null)).toBe(2);
  });

  it('undefined はフォールバック12食扱い → requiredSets=2', () => {
    expect(calcRequiredSets(undefined)).toBe(2);
  });

  it('将来18食プラン → requiredSets=3', () => {
    expect(calcRequiredSets(18)).toBe(3);
  });
});

describe('hasEnoughStock — 在庫境界値', () => {
  // 6食プラン（requiredSets=1）
  it('6食: stock=1 は OK（ちょうど）', () => {
    expect(hasEnoughStock(1, 1)).toBe(true);
  });

  it('6食: stock=2 は OK（超過）', () => {
    expect(hasEnoughStock(2, 1)).toBe(true);
  });

  it('6食: stock=0 は NG（不足）', () => {
    expect(hasEnoughStock(0, 1)).toBe(false);
  });

  // 12食プラン（requiredSets=2）
  it('12食: stock=2 は OK（ちょうど）', () => {
    expect(hasEnoughStock(2, 2)).toBe(true);
  });

  it('12食: stock=3 は OK（超過）', () => {
    expect(hasEnoughStock(3, 2)).toBe(true);
  });

  it('12食: stock=1 は NG（不足）', () => {
    expect(hasEnoughStock(1, 2)).toBe(false);
  });

  it('12食: stock=0 は NG', () => {
    expect(hasEnoughStock(0, 2)).toBe(false);
  });

  // F38修正の核心: 旧実装（requiredSets固定=2）だと6食プランで stock=1 が NG 扱いになっていた
  it('【F38修正検証】6食プランは stock=1 で配送可能になること', () => {
    const required = calcRequiredSets(6); // = 1
    expect(hasEnoughStock(1, required)).toBe(true); // 旧実装では false だった
  });
});
