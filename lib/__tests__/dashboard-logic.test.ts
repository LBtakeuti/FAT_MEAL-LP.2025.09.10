import { describe, it, expect } from 'vitest';

// F15: 管理ダッシュボード純粋ロジックのユニットテスト
// NOTE: route.ts / page.tsx 内の非エクスポート関数を同等ロジックで再定義してテスト

const JST_OFFSET = 9 * 60 * 60 * 1000;

// ------- subscription-trend のバケット生成ロジック -------

function buildBuckets(nowUtcMs: number, months: number) {
  const now = new Date(nowUtcMs + JST_OFFSET);
  const curYear = now.getUTCFullYear();
  const curMonth = now.getUTCMonth();
  const buckets = new Map<string, { label: string; sortKey: string; count: number }>();
  for (let i = 0; i < months; i++) {
    const d = new Date(Date.UTC(curYear, curMonth - (months - 1 - i), 1));
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const sortKey = `${y}-${m}`;
    buckets.set(sortKey, { label: `${y}/${m}`, sortKey, count: 0 });
  }
  return buckets;
}

function countIntoBuckets(
  buckets: Map<string, { label: string; sortKey: string; count: number }>,
  rows: { created_at: string | null }[]
) {
  for (const row of rows) {
    if (!row.created_at) continue;
    const created = new Date(new Date(row.created_at).getTime() + JST_OFFSET);
    const y = created.getUTCFullYear();
    const m = String(created.getUTCMonth() + 1).padStart(2, '0');
    const key = `${y}-${m}`;
    const bucket = buckets.get(key);
    if (bucket) bucket.count += 1;
  }
}

// ------- admin/page.tsx の getCurrentMonthRange -------

function getCurrentMonthRange(nowUtcMs: number): { from: string; to: string } {
  const now = new Date(nowUtcMs + JST_OFFSET);
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const first = new Date(Date.UTC(y, m, 1));
  const lastDay = new Date(Date.UTC(y, m + 1, 0));
  const fmt = (d: Date) =>
    `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
  return { from: fmt(first), to: fmt(lastDay) };
}

// ------- テスト -------

describe('subscription-trend — buildBuckets', () => {
  it('months=3 で3件のバケットを生成する', () => {
    // 2026-05-28 JST
    const now = new Date('2026-05-28T00:00:00Z').getTime();
    const buckets = buildBuckets(now, 3);
    expect(buckets.size).toBe(3);
    expect(buckets.has('2026-03')).toBe(true);
    expect(buckets.has('2026-04')).toBe(true);
    expect(buckets.has('2026-05')).toBe(true);
  });

  it('months=1 で当月のみ生成する', () => {
    const now = new Date('2026-05-28T00:00:00Z').getTime();
    const buckets = buildBuckets(now, 1);
    expect(buckets.size).toBe(1);
    expect(buckets.has('2026-05')).toBe(true);
  });

  it('年跨ぎ: 2026-01 起点で前年12月を含む', () => {
    const now = new Date('2026-01-15T00:00:00Z').getTime();
    const buckets = buildBuckets(now, 3);
    expect(buckets.has('2025-11')).toBe(true);
    expect(buckets.has('2025-12')).toBe(true);
    expect(buckets.has('2026-01')).toBe(true);
  });

  it('初期 count はすべて 0', () => {
    const now = new Date('2026-05-28T00:00:00Z').getTime();
    const buckets = buildBuckets(now, 3);
    for (const b of buckets.values()) {
      expect(b.count).toBe(0);
    }
  });

  it('label は YYYY/MM 形式', () => {
    const now = new Date('2026-05-28T00:00:00Z').getTime();
    const buckets = buildBuckets(now, 1);
    const [bucket] = buckets.values();
    expect(bucket.label).toBe('2026/05');
  });
});

describe('subscription-trend — countIntoBuckets（JST集計）', () => {
  it('JST当月の created_at をカウントする', () => {
    const now = new Date('2026-05-28T00:00:00Z').getTime();
    const buckets = buildBuckets(now, 3);
    countIntoBuckets(buckets, [
      { created_at: '2026-05-01T00:00:00Z' },
      { created_at: '2026-05-15T12:00:00Z' },
    ]);
    expect(buckets.get('2026-05')!.count).toBe(2);
    expect(buckets.get('2026-04')!.count).toBe(0);
  });

  it('JST 境界: UTC 2026-04-30T15:00:00Z は JST 2026-05-01 なので 05 バケットへ', () => {
    const now = new Date('2026-05-28T00:00:00Z').getTime();
    const buckets = buildBuckets(now, 3);
    countIntoBuckets(buckets, [{ created_at: '2026-04-30T15:00:00Z' }]);
    expect(buckets.get('2026-05')!.count).toBe(1);
    expect(buckets.get('2026-04')!.count).toBe(0);
  });

  it('バケット外の created_at は無視する', () => {
    const now = new Date('2026-05-28T00:00:00Z').getTime();
    const buckets = buildBuckets(now, 3);
    countIntoBuckets(buckets, [{ created_at: '2025-12-31T00:00:00Z' }]);
    let total = 0;
    for (const b of buckets.values()) total += b.count;
    expect(total).toBe(0);
  });

  it('created_at が null のレコードはスキップ', () => {
    const now = new Date('2026-05-28T00:00:00Z').getTime();
    const buckets = buildBuckets(now, 1);
    countIntoBuckets(buckets, [{ created_at: null }]);
    expect(buckets.get('2026-05')!.count).toBe(0);
  });
});

describe('admin/page — getCurrentMonthRange', () => {
  it('2026-05-28 JST → from: 2026-05-01, to: 2026-05-31', () => {
    const now = new Date('2026-05-28T00:00:00Z').getTime();
    const { from, to } = getCurrentMonthRange(now);
    expect(from).toBe('2026-05-01');
    expect(to).toBe('2026-05-31');
  });

  it('2026-02-01 JST → to: 2026-02-28（うるう年でない）', () => {
    const now = new Date('2026-02-01T00:00:00Z').getTime();
    const { from, to } = getCurrentMonthRange(now);
    expect(from).toBe('2026-02-01');
    expect(to).toBe('2026-02-28');
  });

  it('2024-02-15 JST → to: 2024-02-29（うるう年）', () => {
    const now = new Date('2024-02-15T00:00:00Z').getTime();
    const { from, to } = getCurrentMonthRange(now);
    expect(from).toBe('2024-02-01');
    expect(to).toBe('2024-02-29');
  });

  it('JST深夜: UTC 2026-04-30T15:30:00Z は JST 2026-05-01 → 5月の範囲', () => {
    const now = new Date('2026-04-30T15:30:00Z').getTime();
    const { from, to } = getCurrentMonthRange(now);
    expect(from).toBe('2026-05-01');
    expect(to).toBe('2026-05-31');
  });
});
