import { describe, it, expect } from 'vitest';

// F30: ダッシュボード日付範囲指定の純粋ロジックテスト
// admin/page.tsx の getDefaultRange と summary/route.ts の
// jstDateBoundaryUnix / formatJstDate を再定義してテスト

const JST_OFFSET = 9 * 60 * 60 * 1000;

// --- admin/page.tsx: getDefaultRange ---
function getDefaultRange(nowUtcMs: number): { from: string; to: string } {
  const now = new Date(nowUtcMs + JST_OFFSET);
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();
  const first = new Date(Date.UTC(y, m, 1));
  const today = new Date(Date.UTC(y, m, d));
  const fmt = (date: Date) =>
    `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
  return { from: fmt(first), to: fmt(today) };
}

// --- summary/route.ts: formatJstDate / jstDateBoundary / jstDateBoundaryUnix ---
function jstDateBoundary(dateStr: string, endOfDay = false): string {
  return endOfDay ? `${dateStr}T23:59:59+09:00` : `${dateStr}T00:00:00+09:00`;
}
function jstDateBoundaryUnix(dateStr: string, endOfDay = false): number {
  return Math.floor(new Date(jstDateBoundary(dateStr, endOfDay)).getTime() / 1000);
}
function formatJstDate(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

// --- subscription-trend/route.ts: from/to バケット生成 ---
function buildRangeBuckets(fromParam: string, toParam: string) {
  const [fy, fm] = fromParam.split('-').map(Number);
  const [ty, tm] = toParam.split('-').map(Number);
  const startYear = fy;
  const startMonth = (fm ?? 1) - 1;
  const endYear = ty;
  const endMonth = (tm ?? 1) - 1;
  const startUtc = Date.UTC(startYear, startMonth, 1);
  const endUtc = Date.UTC(endYear, endMonth, 1);
  if (startUtc > endUtc) return [];
  const buckets: { label: string; sortKey: string; count: number }[] = [];
  let cursor = new Date(startUtc);
  const stop = new Date(endUtc);
  while (cursor.getTime() <= stop.getTime()) {
    const y = cursor.getUTCFullYear();
    const m = String(cursor.getUTCMonth() + 1).padStart(2, '0');
    const sortKey = `${y}-${m}`;
    buckets.push({ label: `${y}/${m}`, sortKey, count: 0 });
    cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
  }
  return buckets;
}

// -----------------------------------------------
// getDefaultRange テスト
// -----------------------------------------------
describe('getDefaultRange — JST 月初〜今日', () => {
  it('月中: from は月初、to は今日', () => {
    // JST 2026-06-04（UTC 2026-06-03T15:00:00Z）
    const now = new Date('2026-06-03T15:00:00Z').getTime();
    const { from, to } = getDefaultRange(now);
    expect(from).toBe('2026-06-01');
    expect(to).toBe('2026-06-04');
  });

  it('月初1日: from と to が同じ', () => {
    // JST 2026-06-01 00:30（UTC 2026-05-31T15:30:00Z）
    const now = new Date('2026-05-31T15:30:00Z').getTime();
    const { from, to } = getDefaultRange(now);
    expect(from).toBe('2026-06-01');
    expect(to).toBe('2026-06-01');
  });

  it('月末: to は月末日（from とは異なる）', () => {
    // JST 2026-06-30（UTC 2026-06-29T15:00:00Z）
    const now = new Date('2026-06-29T15:00:00Z').getTime();
    const { from, to } = getDefaultRange(now);
    expect(from).toBe('2026-06-01');
    expect(to).toBe('2026-06-30');
  });

  it('うるう年 2/29: from=2028-02-01, to=2028-02-29', () => {
    // JST 2028-02-29（UTC 2028-02-28T15:00:00Z）
    const now = new Date('2028-02-28T15:00:00Z').getTime();
    const { from, to } = getDefaultRange(now);
    expect(from).toBe('2028-02-01');
    expect(to).toBe('2028-02-29');
  });

  it('JST深夜境界: UTC 2026-06-30T15:30:00Z は JST 2026-07-01 → 7月扱い', () => {
    const now = new Date('2026-06-30T15:30:00Z').getTime();
    const { from, to } = getDefaultRange(now);
    expect(from).toBe('2026-07-01');
    expect(to).toBe('2026-07-01');
  });
});

// -----------------------------------------------
// formatJstDate テスト
// -----------------------------------------------
describe('formatJstDate — Date → YYYY-MM-DD', () => {
  it('通常の日付を YYYY-MM-DD 形式で返す', () => {
    const d = new Date(Date.UTC(2026, 5, 4)); // 2026-06-04
    expect(formatJstDate(d)).toBe('2026-06-04');
  });

  it('月・日が1桁のとき0埋めされる', () => {
    const d = new Date(Date.UTC(2026, 0, 5)); // 2026-01-05
    expect(formatJstDate(d)).toBe('2026-01-05');
  });
});

// -----------------------------------------------
// jstDateBoundaryUnix テスト
// -----------------------------------------------
describe('jstDateBoundaryUnix — YYYY-MM-DD → Unix秒（JST境界）', () => {
  it('開始: 2026-06-01T00:00:00+09:00 の Unix秒', () => {
    const expected = Math.floor(new Date('2026-06-01T00:00:00+09:00').getTime() / 1000);
    expect(jstDateBoundaryUnix('2026-06-01')).toBe(expected);
  });

  it('終了(endOfDay=true): 2026-06-30T23:59:59+09:00 の Unix秒', () => {
    const expected = Math.floor(new Date('2026-06-30T23:59:59+09:00').getTime() / 1000);
    expect(jstDateBoundaryUnix('2026-06-30', true)).toBe(expected);
  });

  it('開始 < 終了（同月）', () => {
    const gte = jstDateBoundaryUnix('2026-06-01');
    const lte = jstDateBoundaryUnix('2026-06-30', true);
    expect(gte).toBeLessThan(lte);
  });
});

// -----------------------------------------------
// subscription-trend バケット生成（from/to 範囲）テスト
// -----------------------------------------------
describe('subscription-trend — from/to バケット生成', () => {
  it('2026-06〜2026-08: 3件のバケット', () => {
    const buckets = buildRangeBuckets('2026-06-01', '2026-08-31');
    expect(buckets).toHaveLength(3);
    expect(buckets[0].sortKey).toBe('2026-06');
    expect(buckets[2].sortKey).toBe('2026-08');
  });

  it('同月(from=to): 1件のバケット', () => {
    const buckets = buildRangeBuckets('2026-06-01', '2026-06-30');
    expect(buckets).toHaveLength(1);
    expect(buckets[0].sortKey).toBe('2026-06');
  });

  it('年跨ぎ 2025-11〜2026-01: 3件のバケット', () => {
    const buckets = buildRangeBuckets('2025-11-01', '2026-01-31');
    expect(buckets).toHaveLength(3);
    expect(buckets[0].sortKey).toBe('2025-11');
    expect(buckets[2].sortKey).toBe('2026-01');
  });

  it('from > to: 空配列を返す', () => {
    const buckets = buildRangeBuckets('2026-08-01', '2026-06-30');
    expect(buckets).toHaveLength(0);
  });

  it('label は YYYY/MM 形式', () => {
    const buckets = buildRangeBuckets('2026-06-01', '2026-06-30');
    expect(buckets[0].label).toBe('2026/06');
  });

  it('初期 count はすべて 0', () => {
    const buckets = buildRangeBuckets('2026-06-01', '2026-08-31');
    for (const b of buckets) expect(b.count).toBe(0);
  });

  it('昇順（sortKey 順）で並ぶ', () => {
    const buckets = buildRangeBuckets('2026-04-01', '2026-06-30');
    for (let i = 1; i < buckets.length; i++) {
      expect(buckets[i].sortKey > buckets[i - 1].sortKey).toBe(true);
    }
  });
});
