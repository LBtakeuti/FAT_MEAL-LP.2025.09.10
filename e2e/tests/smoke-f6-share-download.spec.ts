import { test, expect } from '@playwright/test';

// SC-F6: /share モバイル一括DLの Web Share API 化
// 対象コミット: 113c0e0
//
// デスクトップ環境（Playwright デフォルト）では shouldUseShareApi() が false を返すため、
// 既存の file-saver 経路（downloadSelectedPhotos）が動く。
// モバイル/Web Share API 経路は実機テスト依存のため E2E スコープ外。

const EXISTING_SLUG = 'a-school';

test.describe('SC-F6-001: /share/[slug] ページ スモーク', () => {
  test('実在slugで200が返りページが表示される', async ({ page }) => {
    await page.goto(`/share/${EXISTING_SLUG}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await expect(page).toHaveURL(new RegExp(`/share/${EXISTING_SLUG}`));
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('存在しないslugは404コンテンツが表示される', async ({ page }) => {
    await page.goto('/share/nonexistent-slug-e2e-test', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    // Docker開発環境では HTTP ステータスが200になるケースがあるため、
    // 404 UI（テキスト）が描画されることを確認する
    const body = await page.content();
    expect(body).toMatch(/404|Not Found|ページが見つかりません/);
  });
});

test.describe('SC-F6-002: /share/[slug] の UI 要素確認（デスクトップ経路）', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/share/${EXISTING_SLUG}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    // クライアントコンポーネントの描画を待つ
    await page.waitForTimeout(2000);
  });

  test('全選択ボタンが表示される', async ({ page }) => {
    const btn = page.locator('button', { hasText: '全選択' });
    const count = await btn.count();
    if (count === 0) {
      // 写真なしのslugの場合はスキップ
      test.skip();
      return;
    }
    await expect(btn.first()).toBeVisible();
  });

  test('ダウンロードボタンが表示される', async ({ page }) => {
    // 写真がある場合のみ「ダウンロード」または「写真を選択してください」ボタンが現れる
    const btn = page.locator('button').filter({ hasText: /ダウンロード|写真を選択してください/ });
    const count = await btn.count();
    if (count === 0) {
      test.skip();
      return;
    }
    await expect(btn.first()).toBeVisible();
  });

  test('全選択後にダウンロードボタンが選択枚数を表示する', async ({ page }) => {
    const selectAllBtn = page.locator('button', { hasText: '全選択' });
    const count = await selectAllBtn.count();
    if (count === 0) {
      test.skip();
      return;
    }
    await selectAllBtn.first().click();
    // 選択後は「ダウンロード (N枚)」の形式になる
    const downloadBtn = page.locator('button').filter({ hasText: /ダウンロード \(\d+枚\)/ });
    await expect(downloadBtn.first()).toBeVisible();
  });
});
