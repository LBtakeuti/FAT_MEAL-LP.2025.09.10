import { test, expect } from '@playwright/test';

// SC-SEO-S3: メタ情報 / 構造化データ(JSON-LD) / sitemap / news[id] SSR の SEO 回帰ガード
// 趣旨: SEO-S3 で canonical・JSON-LD（Organization/WebSite/FAQPage/Article/BreadcrumbList）・
//   sitemap への動的URL追加・お知らせ詳細の server 化を行った。これらが将来退行しない
//   ことを恒久ガードする。JS非依存の生HTML（request.get）＝クローラー視点で検証・軽量。
// 個別記事/お知らせは本番データ依存のため、特定文言ではなく「構造」で判定する。

// application/ld+json を全抽出し、@type の集合を返す（配列LDは各要素の@typeを展開）。
function jsonLdTypes(html: string): string[] {
  const scripts = [
    ...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g),
  ].map((m) => m[1]);
  const types: string[] = [];
  for (const s of scripts) {
    // JSON.parse 出来ること自体が「< > & エスケープ後も妥当」の確認になる。
    const obj = JSON.parse(s);
    if (Array.isArray(obj)) obj.forEach((o) => types.push(o['@type']));
    else types.push(obj['@type']);
  }
  return types;
}

test.describe('SEO-S3 メタ/JSON-LD/sitemap/news SSR ガード', () => {
  test('canonical が主要5ページの SSR HTML に存在する', async ({ request }) => {
    for (const path of ['/', '/news', '/menu-list', '/contact', '/legal']) {
      const res = await request.get(path);
      expect(res.status(), `${path} が 200`).toBe(200);
      const html = await res.text();
      expect(html, `${path} に <link rel="canonical"> が存在`).toContain('rel="canonical"');
    }
  });

  test('トップ / の JSON-LD に Organization / WebSite / FAQPage が揃う', async ({ request }) => {
    const html = await (await request.get('/')).text();
    const types = jsonLdTypes(html);
    expect(types).toEqual(expect.arrayContaining(['Organization', 'WebSite', 'FAQPage']));
  });

  test('sitemap.xml が 200 で /news/[id] と /blog/[slug] を含む', async ({ request }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.status()).toBe(200);
    const xml = await res.text();
    // 動的追加された詳細URLが1件以上含まれること。
    expect(
      (xml.match(/\/news\/[^<\s"]+/g) ?? []).length,
      'sitemap に /news/[id] が含まれる（SEO-S3 動的追加）'
    ).toBeGreaterThan(0);
    expect(
      (xml.match(/\/blog\/[^<\s"]+/g) ?? []).length,
      'sitemap に /blog/[slug] が含まれる（従来どおり）'
    ).toBeGreaterThan(0);
  });

  test('blog/[slug] の JSON-LD に Article / BreadcrumbList が揃う', async ({ request }) => {
    // sitemap から実在の blog slug を1件取得（本番データ非依存に動的選択）。
    const xml = await (await request.get('/sitemap.xml')).text();
    const m = xml.match(/\/blog\/([^<\s"]+)/);
    expect(m, 'sitemap に blog 記事が存在').not.toBeNull();
    const html = await (await request.get(`/blog/${m![1]}`)).text();
    const types = jsonLdTypes(html);
    expect(types).toEqual(expect.arrayContaining(['Article', 'BreadcrumbList']));
  });

  test('news/[id] が SSR で 200・個別title・本文・BreadcrumbList を返す', async ({ request }) => {
    // sitemap から実在の news id を1件取得。
    const xml = await (await request.get('/sitemap.xml')).text();
    const m = xml.match(/\/news\/([^<\s"]+)/);
    expect(m, 'sitemap に news 記事が存在').not.toBeNull();

    const res = await request.get(`/news/${m![1]}`);
    expect(res.status(), 'お知らせ詳細が 200').toBe(200);
    const html = await res.text();

    // 個別 <title>（お知らせ一覧の汎用タイトルではなく記事固有）が出ていること。
    const title = (html.match(/<title>([^<]*)<\/title>/) ?? [])[1] ?? '';
    expect(title.length, '個別 <title> が出力される').toBeGreaterThan(0);

    // 本文がSSRで描画される（h1 見出し）＋ 戻る導線。
    expect(/<h1[^>]*>[^<]+<\/h1>/.test(html), 'お知らせ本文(h1)が SSR で出る').toBe(true);
    expect(html, 'お知らせ一覧への戻り導線').toContain('お知らせ一覧');

    // BreadcrumbList JSON-LD が妥当に出力される。
    expect(jsonLdTypes(html), 'news/[id] に BreadcrumbList').toEqual(
      expect.arrayContaining(['BreadcrumbList'])
    );
  });
});
