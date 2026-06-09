import { test, expect } from '@playwright/test';

// SC-F44: validate-coupon API スモークテスト
// 対象: POST /api/payment/validate-coupon
// 実Stripe クーポンの表示分岐・プラン切り替え解除は手動確認推奨

test.describe('F44 validate-coupon API スモークテスト', () => {
  test('POST /api/payment/validate-coupon が空ボディで 200 + valid:false を返す', async ({ page }) => {
    await page.goto('/purchase', { waitUntil: 'domcontentloaded', timeout: 60000 });
    const result = await page.evaluate(async () => {
      const res = await fetch('/api/payment/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      return { status: res.status, body: await res.json() };
    });
    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({ valid: false });
  });

  test('POST /api/payment/validate-coupon が無効コードで 200 + valid:false を返す', async ({ page }) => {
    await page.goto('/purchase', { waitUntil: 'domcontentloaded', timeout: 60000 });
    const result = await page.evaluate(async () => {
      const res = await fetch('/api/payment/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: '__INVALID_FOR_E2E__' }),
      });
      return { status: res.status, body: await res.json() };
    });
    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({ valid: false });
  });
});
