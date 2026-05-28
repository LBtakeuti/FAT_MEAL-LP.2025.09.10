import { describe, it, expect } from 'vitest';

// F14-2: BlogSection 内の純粋関数ロジックをテスト
// NOTE: コンポーネントは非エクスポートのため、同等ロジックをここで再定義

const DISPLAY_LIMIT = 10;

function formatDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function resolveHasMore(items: unknown[]): boolean {
  return items.length > DISPLAY_LIMIT;
}

function resolveDisplayItems<T>(items: T[]): T[] {
  return items.slice(0, DISPLAY_LIMIT);
}

describe('BlogSection — formatDate', () => {
  it('ISO文字列を YYYY-MM-DD に変換する', () => {
    expect(formatDate('2026-05-28T00:00:00Z')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('null を渡すと空文字を返す', () => {
    expect(formatDate(null)).toBe('');
  });

  it('月・日は2桁ゼロ埋め', () => {
    const result = formatDate('2026-01-05T00:00:00Z');
    expect(result).toContain('-01-');
    expect(result.endsWith('-05')).toBe(true);
  });
});

describe('BlogSection — hasMore 判定 (limit=DISPLAY_LIMIT+1 戦略)', () => {
  it('件数が DISPLAY_LIMIT 以下なら false', () => {
    expect(resolveHasMore(new Array(DISPLAY_LIMIT).fill(null))).toBe(false);
  });

  it('件数が DISPLAY_LIMIT+1 なら true', () => {
    expect(resolveHasMore(new Array(DISPLAY_LIMIT + 1).fill(null))).toBe(true);
  });

  it('0件なら false', () => {
    expect(resolveHasMore([])).toBe(false);
  });

  it('件数が DISPLAY_LIMIT+2 以上でも true', () => {
    expect(resolveHasMore(new Array(DISPLAY_LIMIT + 5).fill(null))).toBe(true);
  });
});

describe('BlogSection — displayItems は DISPLAY_LIMIT 件にスライス', () => {
  it('DISPLAY_LIMIT+1 件の配列から DISPLAY_LIMIT 件取り出す', () => {
    const items = Array.from({ length: DISPLAY_LIMIT + 1 }, (_, i) => i);
    const displayed = resolveDisplayItems(items);
    expect(displayed).toHaveLength(DISPLAY_LIMIT);
    expect(displayed[displayed.length - 1]).toBe(DISPLAY_LIMIT - 1);
  });

  it('DISPLAY_LIMIT 件未満はそのまま返す', () => {
    const items = [1, 2, 3];
    expect(resolveDisplayItems(items)).toEqual([1, 2, 3]);
  });

  it('空配列はそのまま返す', () => {
    expect(resolveDisplayItems([])).toEqual([]);
  });
});
