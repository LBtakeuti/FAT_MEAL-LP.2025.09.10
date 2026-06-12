import { test, expect } from '@playwright/test';

// SC-F73: <Reveal>（スクロールフェードイン）の PE/SEO 回帰ガード
// 対象: トップページ（/）の SSR/初期HTML
// 趣旨: F73 で主要14セクションに <Reveal> を適用した。Reveal は PE 安全設計
//       （初期 state='static' で style 無し＝常に可視。client mount 後に IO対応&
//        reduced-motion無効時のみ opacity:0 へ切替）であり、SSR/no-JS（=クローラー）
//       にコンテンツを opacity:0 で隠してはならない。
// このテストは将来 Reveal が誤って SSR 時点で opacity:0 を出す回帰を防ぐ。
// JS を実行しない生 HTML（request.get）で検証＝PE/クローラー視点と一致・軽量。

test.describe('F73 Reveal PE/SEO ガード（SSR HTMLに opacity:0 を出さない）', () => {
  test('トップ / の SSR HTML に インライン opacity:0 が出現しない', async ({ request }) => {
    const res = await request.get('/');
    expect(res.status()).toBe(200);
    const html = await res.text();

    // インライン style の opacity:0 / opacity: 0（スペース有無の両方）を検出。
    const matches = html.match(/opacity:\s*0(?![.0-9])/g) ?? [];
    expect(
      matches.length,
      `SSR HTML に opacity:0 のインラインstyleが含まれてはいけない（Reveal の PE 安全違反）。検出数=${matches.length}`
    ).toBe(0);
  });
});
