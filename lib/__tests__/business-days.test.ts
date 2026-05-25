import { describe, it, expect } from 'vitest';
import { resolveDeliveryWorkDate, listDeliveryDateOptions } from '../business-days';

// JST = UTC+9
// resolveDeliveryWorkDate は UTC の Date を受け取り、JST に変換して処理する

describe('resolveDeliveryWorkDate', () => {
  // 平日 09:59 JST → 当日
  it('平日 09:59 JST → 当日', () => {
    // 火曜 2026-05-19 09:59 JST = 2026-05-19 00:59 UTC
    const d = new Date('2026-05-19T00:59:00Z');
    expect(resolveDeliveryWorkDate(d)).toBe('2026-05-19');
  });

  // 平日 10:00 JST → 翌営業日
  it('平日 10:00 JST → 翌営業日（水曜）', () => {
    // 火曜 2026-05-19 10:00 JST = 2026-05-19 01:00 UTC
    const d = new Date('2026-05-19T01:00:00Z');
    expect(resolveDeliveryWorkDate(d)).toBe('2026-05-20');
  });

  // 金曜 09:59 JST → 当日（金曜）
  it('金曜 09:59 JST → 当日（金曜）', () => {
    // 金曜 2026-05-22 09:59 JST = 2026-05-22 00:59 UTC
    const d = new Date('2026-05-22T00:59:00Z');
    expect(resolveDeliveryWorkDate(d)).toBe('2026-05-22');
  });

  // 金曜 10:00 JST → 翌週月曜（土日スキップ）
  it('金曜 10:00 JST → 翌週月曜（土日スキップ）', () => {
    // 金曜 2026-05-22 10:00 JST = 2026-05-22 01:00 UTC
    const d = new Date('2026-05-22T01:00:00Z');
    expect(resolveDeliveryWorkDate(d)).toBe('2026-05-25');
  });

  // 土曜のどの時刻でも → 月曜
  it('土曜 00:00 JST → 月曜', () => {
    // 土曜 2026-05-23 00:00 JST = 2026-05-22 15:00 UTC
    const d = new Date('2026-05-22T15:00:00Z');
    expect(resolveDeliveryWorkDate(d)).toBe('2026-05-25');
  });

  it('土曜 23:59 JST → 月曜', () => {
    // 土曜 2026-05-23 23:59 JST = 2026-05-23 14:59 UTC
    const d = new Date('2026-05-23T14:59:00Z');
    expect(resolveDeliveryWorkDate(d)).toBe('2026-05-25');
  });

  // 日曜のどの時刻でも → 月曜
  it('日曜 00:00 JST → 月曜', () => {
    // 日曜 2026-05-24 00:00 JST = 2026-05-23 15:00 UTC
    const d = new Date('2026-05-23T15:00:00Z');
    expect(resolveDeliveryWorkDate(d)).toBe('2026-05-25');
  });

  it('日曜 23:59 JST → 月曜', () => {
    // 日曜 2026-05-24 23:59 JST = 2026-05-24 14:59 UTC
    const d = new Date('2026-05-24T14:59:00Z');
    expect(resolveDeliveryWorkDate(d)).toBe('2026-05-25');
  });

  // 祝日 10:00 JST → 次の営業日
  it('祝日（2026-01-01）10:00 JST → 次の営業日（2026-01-02）', () => {
    // 2026-01-01 10:00 JST = 2026-01-01 01:00 UTC → 翌日 2026-01-02 は平日なので OK
    const d = new Date('2026-01-01T01:00:00Z');
    expect(resolveDeliveryWorkDate(d)).toBe('2026-01-02');
  });

  // 連休（GW 2026-05-03〜06）初日 10:00 JST → GW明けの営業日
  it('GW 2026-05-03 10:00 JST → 2026-05-07（GW明け）', () => {
    // 2026-05-03〜06 は祝日。2026-05-07 は木曜（平日）
    // 2026-05-03 10:00 JST = 2026-05-03 01:00 UTC → 翌日(2026-05-04)から始まり祝日続きで 2026-05-07 へ
    const d = new Date('2026-05-03T01:00:00Z');
    expect(resolveDeliveryWorkDate(d)).toBe('2026-05-07');
  });

  // JST 境界: UTC 00:59 (JST 09:59) → 当日起点
  it('UTC 00:59 (= JST 09:59) → 当日起点', () => {
    // 月曜 2026-05-25 09:59 JST = 2026-05-25 00:59 UTC
    const d = new Date('2026-05-25T00:59:00Z');
    expect(resolveDeliveryWorkDate(d)).toBe('2026-05-25');
  });

  // JST 境界: UTC 01:00 (JST 10:00) → 翌日起点
  it('UTC 01:00 (= JST 10:00) → 翌日起点', () => {
    // 月曜 2026-05-25 10:00 JST = 2026-05-25 01:00 UTC → 翌日(火曜)
    const d = new Date('2026-05-25T01:00:00Z');
    expect(resolveDeliveryWorkDate(d)).toBe('2026-05-26');
  });
});

describe('listDeliveryDateOptions', () => {
  it('戻り値の最初の日が purchaseDate + 4営業日', () => {
    // 月曜 2026-05-25 購入 → 4営業日後 = 金曜 2026-05-29
    const purchase = new Date(2026, 4, 25); // JST ローカル日付
    const options = listDeliveryDateOptions(purchase);
    const first = options[0];
    expect(`${first.getFullYear()}-${String(first.getMonth() + 1).padStart(2, '0')}-${String(first.getDate()).padStart(2, '0')}`).toBe('2026-05-29');
  });

  it('戻り値の長さが 7', () => {
    const purchase = new Date(2026, 4, 25); // 2026-05-25 月曜
    const options = listDeliveryDateOptions(purchase);
    expect(options).toHaveLength(7);
  });

  it('土日も戻り値に含まれる', () => {
    // 月曜 2026-05-25 購入 → min=2026-05-29(金), max=2026-06-04(木)
    // 範囲に 2026-05-30(土) / 2026-05-31(日) が含まれるはず
    const purchase = new Date(2026, 4, 25);
    const options = listDeliveryDateOptions(purchase);
    const dayOfWeeks = options.map(d => d.getDay());
    expect(dayOfWeeks).toContain(6); // 土曜
    expect(dayOfWeeks).toContain(0); // 日曜
  });

  it('金曜購入 → min は翌々週火曜（4営業日後）', () => {
    // 金曜 2026-05-22 購入 → 1営業日後=月(25), 2=火(26), 3=水(27), 4=木(28)
    const purchase = new Date(2026, 4, 22);
    const options = listDeliveryDateOptions(purchase);
    const first = options[0];
    expect(`${first.getFullYear()}-${String(first.getMonth() + 1).padStart(2, '0')}-${String(first.getDate()).padStart(2, '0')}`).toBe('2026-05-28');
  });
});
