import { test, expect } from '@playwright/test';

// SC-F73: <Reveal>（スクロールフェードイン）の PE/SEO 回帰ガード
// 対象: トップページ（/）の SSR/初期HTML
// 趣旨: F73 で主要14セクションに <Reveal> を適用した。Reveal は PE 安全設計
//       （初期 state='static' で style 無し＝常に可視。client mount 後に IO対応&
//        reduced-motion無効時のみ opacity:0 へ切替）であり、SSR/no-JS（=クローラー）
//       にコンテンツを opacity:0 で隠してはならない。
// このテストは将来 Reveal が誤って SSR 時点で opacity:0 を出す回帰を防ぐ。
// JS を実行しない生 HTML（request.get）で検証＝PE/クローラー視点と一致・軽量。
//
// SC-F75 追記: <CountUp>（HeroStats 実績数値のカウントアップ）の PE/SEO 回帰ガード。
// CountUp も PE 安全設計（初期表示は実値。client mount 後 IO対応&reduced-motion無効時のみ
// 0 から開始）。SSR/no-JS（=クローラー）に実績数値が「0 固定」で出てはならず、実値
// （520 / 30）が見えること。将来 CountUp が SSR で 0 を出す回帰を防ぐ。

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

test.describe('F75 CountUp PE/SEO ガード（HeroStats 数値が SSR で実値・0固定でない）', () => {
  test('トップ / の SSR HTML で HeroStats の CountUp 数値が実値（520 / 30）で出る', async ({ request }) => {
    const res = await request.get('/');
    expect(res.status()).toBe(200);
    const html = await res.text();

    // CountUp は span.hsc-num（PC）/ span.hss-num（モバイル）として SSR される。
    // その span が直に保持するテキスト（= PE 時の実値）を抽出する。
    const countUpTexts = (
      html.match(/class="hs[cs]-num"[^>]*>([\d,]+)/g) ?? []
    ).map((m) => m.replace(/.*>/, ''));

    // 実値 520 / 30 が SSR に出ていること（0 固定でない＝クローラー対策）。
    expect(
      countUpTexts,
      `HeroStats CountUp が SSR で 0 固定（実値が出ていない）＝PE違反。抽出値=${JSON.stringify(countUpTexts)}`
    ).toEqual(expect.arrayContaining(['520', '30']));
  });
});
