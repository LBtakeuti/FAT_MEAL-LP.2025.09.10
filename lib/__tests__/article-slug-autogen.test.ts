import { describe, it, expect } from 'vitest';

// F53: app/api/admin/articles/route.ts の slug 自動生成ロジックをテスト
// NOTE: jstDateStamp / generateUniqueSlug は非export のため、
//       既存パターン（BlogSection.logic.test.ts / share-links-jst-date.test.ts）に倣い
//       同等ロジックをここで再定義して検証する。
//       jstDateStamp は本番が Date.now() を使うため、テスト用に nowMs を注入できる形にしている
//       （実装ロジック `new Date(now + 9h)` の UTC 各getterは完全に一致）。

const JST_OFFSET = 9 * 60 * 60 * 1000;

/** 実装の jstDateStamp() と同一ロジック（now を注入可能にしたもの） */
function jstDateStamp(nowMs: number): string {
  const jst = new Date(nowMs + JST_OFFSET);
  const y = jst.getUTCFullYear();
  const m = String(jst.getUTCMonth() + 1).padStart(2, '0');
  const d = String(jst.getUTCDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

/**
 * 実装の generateUniqueSlug() と同一の連番一意化ロジック。
 * supabase クエリ部分は「既存 slug 集合」を渡すモックで置き換える。
 */
async function generateUniqueSlug(
  nowMs: number,
  existingSlugs: Set<string>
): Promise<string> {
  const base = `article-${jstDateStamp(nowMs)}`;
  for (let i = 1; ; i++) {
    const candidate = i === 1 ? base : `${base}-${i}`;
    // 実装: maybeSingle() が null を返せば空き
    const hit = existingSlugs.has(candidate);
    if (!hit) return candidate;
  }
}

describe('jstDateStamp — JST 基準の YYYYMMDD', () => {
  it('YYYYMMDD 形式（8桁数字）を返す', () => {
    const result = jstDateStamp(new Date('2026-06-04T03:00:00Z').getTime());
    expect(result).toMatch(/^\d{8}$/);
  });

  it('UTC 12:00 (= JST 21:00 同日) は同日の日付スタンプ', () => {
    // 2026-06-04 12:00 UTC = 2026-06-04 21:00 JST
    const result = jstDateStamp(new Date('2026-06-04T12:00:00Z').getTime());
    expect(result).toBe('20260604');
  });

  it('UTC 14:59 (= JST 23:59 同日) は同日の日付スタンプ', () => {
    // 2026-06-04 14:59 UTC = 2026-06-04 23:59 JST
    const result = jstDateStamp(new Date('2026-06-04T14:59:00Z').getTime());
    expect(result).toBe('20260604');
  });

  it('UTC 15:00 (= JST 翌日 00:00) は翌日の日付スタンプ（日跨ぎ境界）', () => {
    // 2026-06-04 15:00 UTC = 2026-06-05 00:00 JST
    const result = jstDateStamp(new Date('2026-06-04T15:00:00Z').getTime());
    expect(result).toBe('20260605');
  });

  it('UTC 15:30 深夜帯でも +9h で JST 翌日になる', () => {
    // 2026-06-04 15:30 UTC = 2026-06-05 00:30 JST
    const result = jstDateStamp(new Date('2026-06-04T15:30:00Z').getTime());
    expect(result).toBe('20260605');
  });

  it('月末→翌月の日跨ぎ（UTC 5/31 15:00 = JST 6/1 00:00）', () => {
    const result = jstDateStamp(new Date('2026-05-31T15:00:00Z').getTime());
    expect(result).toBe('20260601');
  });

  it('年末→翌年の日跨ぎ（UTC 12/31 15:00 = JST 1/1 00:00）', () => {
    const result = jstDateStamp(new Date('2026-12-31T15:00:00Z').getTime());
    expect(result).toBe('20270101');
  });

  it('月・日は0埋め2桁になる（1月5日）', () => {
    // 2026-01-05 03:00 UTC = 2026-01-05 12:00 JST
    const result = jstDateStamp(new Date('2026-01-05T03:00:00Z').getTime());
    expect(result).toBe('20260105');
  });
});

describe('generateUniqueSlug — 連番一意化', () => {
  const now = new Date('2026-06-04T03:00:00Z').getTime(); // JST 2026-06-04
  const base = 'article-20260604';

  it('既存 slug が無ければベース（連番なし）を返す', async () => {
    const result = await generateUniqueSlug(now, new Set());
    expect(result).toBe(base);
  });

  it('ベースが衝突したら -2 を返す', async () => {
    const result = await generateUniqueSlug(now, new Set([base]));
    expect(result).toBe(`${base}-2`);
  });

  it('ベースと -2 が衝突したら -3 を返す', async () => {
    const result = await generateUniqueSlug(now, new Set([base, `${base}-2`]));
    expect(result).toBe(`${base}-3`);
  });

  it('連続して埋まっている場合、最初の空き番号を返す（-2,-3 埋まり → -4）', async () => {
    const result = await generateUniqueSlug(
      now,
      new Set([base, `${base}-2`, `${base}-3`])
    );
    expect(result).toBe(`${base}-4`);
  });

  it('ベースは空きだが -2 が既存のケースでもベースを優先して返す', async () => {
    // i=1（ベース）から走査するため、-2 の有無に関わらずベースが空きなら base
    const result = await generateUniqueSlug(now, new Set([`${base}-2`]));
    expect(result).toBe(base);
  });

  it('JST 日付に追従したベースで生成する（日跨ぎ後は翌日ベース）', async () => {
    const nextDay = new Date('2026-06-04T15:30:00Z').getTime(); // JST 06-05 00:30
    const result = await generateUniqueSlug(nextDay, new Set());
    expect(result).toBe('article-20260605');
  });
});
