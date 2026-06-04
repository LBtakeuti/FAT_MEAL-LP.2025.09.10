import { describe, it, expect } from 'vitest';

// F29: dashboard/summary/route.ts の純粋ロジック関数を再定義してテスト

const JST_OFFSET = 9 * 60 * 60 * 1000;

function jstMonthRangeUnix(year: number, monthZeroBased: number): { gte: number; lt: number } {
  const startUtc = Date.UTC(year, monthZeroBased, 1) - JST_OFFSET;
  const endUtc = Date.UTC(year, monthZeroBased + 1, 1) - JST_OFFSET;
  return { gte: Math.floor(startUtc / 1000), lt: Math.floor(endUtc / 1000) };
}

function jstDateBoundary(dateStr: string, endOfDay = false): string {
  return endOfDay ? `${dateStr}T23:59:59+09:00` : `${dateStr}T00:00:00+09:00`;
}

describe('jstMonthRangeUnix — JST月境界を Stripe Unix timestamp に変換', () => {
  it('2026-06（monthZeroBased=5）の gte は 2026-05-31T15:00:00Z（JST 6/1 0:00）', () => {
    const { gte } = jstMonthRangeUnix(2026, 5);
    const gteDate = new Date(gte * 1000);
    expect(gteDate.toISOString()).toBe('2026-05-31T15:00:00.000Z');
  });

  it('2026-06 の lt は 2026-06-30T15:00:00Z（JST 7/1 0:00）', () => {
    const { lt } = jstMonthRangeUnix(2026, 5);
    const ltDate = new Date(lt * 1000);
    expect(ltDate.toISOString()).toBe('2026-06-30T15:00:00.000Z');
  });

  it('gte < lt', () => {
    const { gte, lt } = jstMonthRangeUnix(2026, 5);
    expect(gte).toBeLessThan(lt);
  });

  it('月内の差分は正確に30日分（2026-06 は 30日）', () => {
    const { gte, lt } = jstMonthRangeUnix(2026, 5);
    const diffDays = (lt - gte) / 86400;
    expect(diffDays).toBe(30);
  });

  it('2月（monthZeroBased=1）: 2026年は28日', () => {
    const { gte, lt } = jstMonthRangeUnix(2026, 1);
    const diffDays = (lt - gte) / 86400;
    expect(diffDays).toBe(28);
  });

  it('2月（monthZeroBased=1）: 2028年（うるう年）は29日', () => {
    const { gte, lt } = jstMonthRangeUnix(2028, 1);
    const diffDays = (lt - gte) / 86400;
    expect(diffDays).toBe(29);
  });

  it('年跨ぎ: 2025-12（monthZeroBased=11）の lt は 2026-01 の gte と一致', () => {
    const dec = jstMonthRangeUnix(2025, 11);
    const jan = jstMonthRangeUnix(2026, 0);
    expect(dec.lt).toBe(jan.gte);
  });

  it('返却値は秒単位の整数', () => {
    const { gte, lt } = jstMonthRangeUnix(2026, 5);
    expect(Number.isInteger(gte)).toBe(true);
    expect(Number.isInteger(lt)).toBe(true);
  });
});

describe('jstDateBoundary — YYYY-MM-DD を JST ISO 文字列に変換', () => {
  it('デフォルト（endOfDay=false）は T00:00:00+09:00', () => {
    expect(jstDateBoundary('2026-06-01')).toBe('2026-06-01T00:00:00+09:00');
  });

  it('endOfDay=true は T23:59:59+09:00', () => {
    expect(jstDateBoundary('2026-06-30', true)).toBe('2026-06-30T23:59:59+09:00');
  });

  it('任意の日付でフォーマットが崩れない', () => {
    const result = jstDateBoundary('2026-02-28');
    expect(result).toBe('2026-02-28T00:00:00+09:00');
  });
});
