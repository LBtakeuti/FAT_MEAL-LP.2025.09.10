import { test, expect } from '@playwright/test';

// SC-F37: activate-subscription-redirect API スモークテスト
// 対象: /api/payment/activate-subscription-redirect
// 緊急修正: 3DSリダイレクト後のサブスク開始失敗（metadata キー名不整合）修正確認

test.describe('F37 activate-subscription-redirect API スモークテスト', () => {
  test('POST /api/payment/activate-subscription-redirect が setupIntentId なしで 4xx を返す（500 でないこと）', async ({ page }) => {
    await page.goto('/admin/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
    const status = await page.evaluate(async () => {
      const res = await fetch('/api/payment/activate-subscription-redirect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      return res.status;
    });
    expect(status).toBeLessThan(500);
    expect(status).toBeGreaterThanOrEqual(400);
  });

  test('POST /api/payment/activate-subscription-redirect が不正な setupIntentId で 4xx を返す（500 でないこと）', async ({ page }) => {
    await page.goto('/admin/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
    const status = await page.evaluate(async () => {
      const res = await fetch('/api/payment/activate-subscription-redirect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setupIntentId: 'seti_invalid_e2e_test_id' }),
      });
      return res.status;
    });
    expect(status).toBeLessThan(500);
    expect(status).toBeGreaterThanOrEqual(400);
  });
});
