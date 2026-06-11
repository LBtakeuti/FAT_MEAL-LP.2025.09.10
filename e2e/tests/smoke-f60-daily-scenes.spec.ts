import { test, expect } from '@playwright/test';

// SC-F60: DailyScenesSection（ふとるめしのある毎日）描画スモーク
// 対象: トップページ（/）に追加した新セクション（MediaLogosSection 直後）
// 観点: (1) トップページが新セクション追加後も 200 でレンダリングされる（既存回帰）
//       (2) 新セクションの主要文言が描画される（PC=3カラムgrid）
//       (3) 3枚の webp + swoosh.svg が 404 にならない
//       (4) F60-4: モバイル幅（390px）でも主要文言が描画される（横カルーセル化後の回帰）
// 読み取り専用・本番データ非改変（GET のみ）。

test.describe('F60 DailyScenesSection 描画スモーク', () => {
  test('トップページが 200 + 新セクション主要文言が可視', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    expect(response?.status()).toBe(200);

    // 中央見出し
    await expect(
      page.getByRole('heading', { name: 'ふとるめしを取り入れて、毎日をもっと豊かに' })
    ).toBeVisible();

    // 朝/昼/夜カードの小見出し（セクション内に限定）
    const section = page.locator('section[aria-label="ふとるめしのある毎日"]');
    await expect(section).toBeVisible();
    await expect(section.getByText('朝のふとるめし')).toBeVisible();
    await expect(section.getByText('お昼のふとるめし')).toBeVisible();
    await expect(section.getByText('夜のふとるめし')).toBeVisible();
  });

  test('モバイル幅（390px）でも主要文言が描画される（F60-4 横カルーセル回帰）', async ({ page }) => {
    // iPhone 14 相当の幅。F60-4 でモバイルは横スワイプカルーセル（overflow-x-auto）化。
    // カルーセルは3カードを全て DOM に保持する（条件レンダリングではない）ため、
    // 初期ビューポート外の2/3枚目も DOM 上に存在し続けることを確認する。
    await page.setViewportSize({ width: 390, height: 844 });
    const response = await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    expect(response?.status()).toBe(200);

    const section = page.locator('section[aria-label="ふとるめしのある毎日"]');
    await expect(section).toBeVisible();

    // 見出しと先頭（朝）カードは初期表示で可視
    await expect(
      section.getByRole('heading', { name: 'ふとるめしを取り入れて、毎日をもっと豊かに' })
    ).toBeVisible();
    await expect(section.getByText('朝のふとるめし')).toBeVisible();

    // 横カルーセル内の3カードはいずれも DOM 上に存在（横スクロールで到達可能）
    await expect(section.getByText('朝のふとるめし')).toHaveCount(1);
    await expect(section.getByText('お昼のふとるめし')).toHaveCount(1);
    await expect(section.getByText('夜のふとるめし')).toHaveCount(1);

    // 2/3枚目はカルーセルをスクロールすれば可視になる（scrollIntoView で到達確認）
    await section.getByText('夜のふとるめし').scrollIntoViewIfNeeded();
    await expect(section.getByText('夜のふとるめし')).toBeVisible();
  });

  test('セクションの画像素材（webp 3枚 + swoosh.svg）が 200 を返す', async ({ request }) => {
    const assets = [
      '/images/daily-scenes/asa.webp',
      '/images/daily-scenes/hiru.webp',
      '/images/daily-scenes/yoru.webp',
      '/images/daily-scenes/swoosh.svg',
    ];
    for (const path of assets) {
      const res = await request.get(path);
      expect(res.status(), `${path} が 200 を返すこと`).toBe(200);
    }
  });
});
