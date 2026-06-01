import { test, expect } from '@playwright/test';

// SC-F20-001: F20 sub-6 価格改定スモークテスト
// 対象: /（LP TOP）、/purchase（購入ページ）
// 価格表示の正確な数値確認は hydration 後の DOM に依存するため、
// ページが正常に 200 で表示されること（サーバーエラーなし）を確認する

test.describe('F20 価格改定 スモークテスト', () => {
  test('LP TOP（/）が 200 で表示される', async ({ page }) => {
    const res = await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    expect(res?.status()).toBe(200);
    const body = page.locator('body');
    await expect(body).toBeVisible();
    const bodyText = await body.innerText();
    expect(bodyText).not.toMatch(/Internal Server Error/i);
  });

  test('/purchase が 200 で表示される', async ({ page }) => {
    const res = await page.goto('/purchase', { waitUntil: 'domcontentloaded', timeout: 60000 });
    expect(res?.status()).toBe(200);
    const body = page.locator('body');
    await expect(body).toBeVisible();
    const bodyText = await body.innerText();
    expect(bodyText).not.toMatch(/Internal Server Error/i);
  });
});
