import { describe, it, expect } from 'vitest';

// F26: share-links/[slug]/stats/route.ts の JST 日付キー関数を再定義してテスト

const JST_OFFSET = 9 * 60 * 60 * 1000;

function toJstDateKey(iso: string): string {
  return new Date(new Date(iso).getTime() + JST_OFFSET).toISOString().slice(0, 10);
}

function jstDateKey(d: Date): string {
  return new Date(d.getTime() + JST_OFFSET).toISOString().slice(0, 10);
}

// 30日分のゼロ埋めキーを JST 基準で生成
function buildDailyKeys(nowUtcMs: number, days: number): string[] {
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(nowUtcMs - i * 24 * 60 * 60 * 1000);
    keys.push(jstDateKey(d));
  }
  return keys;
}

describe('toJstDateKey — UTC → JST 日付変換', () => {
  it('UTC 15:30 は JST 翌日 00:30 として翌日の日付キーを返す', () => {
    // 2026-06-01 15:30:00 UTC = 2026-06-02 00:30:00 JST
    const result = toJstDateKey('2026-06-01T15:30:00Z');
    expect(result).toBe('2026-06-02');
  });

  it('UTC 14:59 は JST 23:59 として同日の日付キーを返す', () => {
    // 2026-06-01 14:59:00 UTC = 2026-06-01 23:59:00 JST
    const result = toJstDateKey('2026-06-01T14:59:00Z');
    expect(result).toBe('2026-06-01');
  });

  it('JST 0:00 ぴったり（UTC 前日 15:00）は当日キーを返す', () => {
    // 2026-05-31 15:00:00 UTC = 2026-06-01 00:00:00 JST
    const result = toJstDateKey('2026-05-31T15:00:00Z');
    expect(result).toBe('2026-06-01');
  });

  it('YYYY-MM-DD 形式を返す', () => {
    const result = toJstDateKey('2026-06-04T00:00:00Z');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('jstDateKey — Date オブジェクト → JST 日付変換', () => {
  it('UTC 15:30 は JST 翌日キーを返す', () => {
    const d = new Date('2026-06-01T15:30:00Z');
    expect(jstDateKey(d)).toBe('2026-06-02');
  });

  it('UTC 14:59 は JST 同日キーを返す', () => {
    const d = new Date('2026-06-01T14:59:00Z');
    expect(jstDateKey(d)).toBe('2026-06-01');
  });
});

describe('buildDailyKeys — 30日分の JST 連続キー', () => {
  it('30件のキーを生成する', () => {
    const now = new Date('2026-06-04T12:00:00Z').getTime();
    const keys = buildDailyKeys(now, 30);
    expect(keys).toHaveLength(30);
  });

  it('昇順（古い順）で並ぶ', () => {
    const now = new Date('2026-06-04T12:00:00Z').getTime();
    const keys = buildDailyKeys(now, 30);
    for (let i = 1; i < keys.length; i++) {
      expect(keys[i] >= keys[i - 1]).toBe(true);
    }
  });

  it('末尾が現在の JST 日付', () => {
    // UTC 12:00 = JST 21:00 → 同日
    const now = new Date('2026-06-04T12:00:00Z').getTime();
    const keys = buildDailyKeys(now, 30);
    expect(keys[keys.length - 1]).toBe('2026-06-04');
  });

  it('重複なし（連続する一意の日付）', () => {
    const now = new Date('2026-06-04T12:00:00Z').getTime();
    const keys = buildDailyKeys(now, 30);
    const unique = new Set(keys);
    expect(unique.size).toBe(30);
  });

  it('UTC 15:30 (JST 翌日) 基準: 末尾キーが JST 翌日', () => {
    // UTC 2026-06-04 15:30 = JST 2026-06-05 00:30 → 末尾は 2026-06-05
    const now = new Date('2026-06-04T15:30:00Z').getTime();
    const keys = buildDailyKeys(now, 30);
    expect(keys[keys.length - 1]).toBe('2026-06-05');
  });
});
