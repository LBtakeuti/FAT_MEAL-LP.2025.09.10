import { test, expect } from '@playwright/test';

// SC-SEO-S2: コラム/お知らせ一覧の SSR 化 + 記事内部リンクの no-JS 露出（SEO回帰ガード）
// 趣旨: SEO-S2 で /blog・/news 一覧をサーバーで取得→SSR し、トップにも初期項目を SSR 露出。
//   クローラー/no-JS で記事への内部リンク（/blog/[slug]・/news/[id]）が初期HTMLに出ること。
// JS を実行しない生 HTML（request.get）で検証＝クローラー視点と一致・軽量。
// 件数は本番データ依存のため「1件以上」で判定（固定件数アサートは避ける）。

// /blog/[slug]・/news/[id] の詳細リンクだけを数える（一覧トップ /blog・/news 自身は除外）。
function countDetailLinks(html: string, base: 'blog' | 'news'): number {
  const re = new RegExp(`href="/${base}/[^"/?#]+"`, 'g');
  const all = html.match(re) ?? [];
  // 重複（同一記事への複数リンク）を除いたユニーク数を返す。
  return new Set(all).size;
}

test.describe('SEO-S2 記事内部リンクの no-JS 露出（SSR回帰ガード）', () => {
  test('/blog の SSR HTML に /blog/[slug] 内部リンクが1件以上出る', async ({ request }) => {
    const res = await request.get('/blog');
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(
      countDetailLinks(html, 'blog'),
      'コラム一覧 /blog の SSR HTML に記事詳細リンク /blog/[slug] が露出すること'
    ).toBeGreaterThan(0);
  });

  test('/news の SSR HTML に /news/[id] 内部リンクが1件以上出る', async ({ request }) => {
    const res = await request.get('/news');
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(
      countDetailLinks(html, 'news'),
      'お知らせ一覧 /news の SSR HTML に詳細リンク /news/[id] が露出すること'
    ).toBeGreaterThan(0);
  });

  test('トップ / の SSR HTML に Blog/News セクションの記事内部リンクが出る', async ({ request }) => {
    const res = await request.get('/');
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(
      countDetailLinks(html, 'blog'),
      'トップ / の BlogSection に /blog/[slug] が SSR 露出すること'
    ).toBeGreaterThan(0);
    expect(
      countDetailLinks(html, 'news'),
      'トップ / の NewsSection に /news/[id] が SSR 露出すること'
    ).toBeGreaterThan(0);
  });
});
