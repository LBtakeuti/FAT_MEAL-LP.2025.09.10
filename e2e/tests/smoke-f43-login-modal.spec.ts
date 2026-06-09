import { test, expect } from '@playwright/test';

// SC-F43: 既存会員未ログイン購入時ログイン誘導モーダル スモークテスト
// 対象: /purchase, /purchase?restore=1, /login?redirect=...
// モーダル・localStorage・ログイン誘導の実フローは手動確認推奨

test.describe('F43 購入フロー クエリパラメータ表示スモークテスト', () => {
  test('/purchase が 200 で表示される（既存挙動維持）', async ({ page }) => {
    const res = await page.goto('/purchase', { waitUntil: 'domcontentloaded', timeout: 60000 });
    expect(res?.status()).toBe(200);
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toMatch(/Internal Server Error/i);
    expect(bodyText).not.toMatch(/404|Not Found|ページが見つかりません/i);
  });

  test('/purchase?restore=1 が 200 で表示される（クエリ付きでもエラーにならない）', async ({ page }) => {
    const res = await page.goto('/purchase?restore=1', { waitUntil: 'domcontentloaded', timeout: 60000 });
    expect(res?.status()).toBe(200);
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toMatch(/Internal Server Error/i);
    expect(bodyText).not.toMatch(/404|Not Found|ページが見つかりません/i);
  });

  test('/login?redirect=%2Fpurchase%3Frestore%3D1 が 200 で表示される', async ({ page }) => {
    const res = await page.goto('/login?redirect=%2Fpurchase%3Frestore%3D1', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    expect(res?.status()).toBe(200);
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toMatch(/Internal Server Error/i);
    expect(bodyText).not.toMatch(/404|Not Found|ページが見つかりません/i);
  });
});
