import { test, expect } from '@playwright/test';

// SC-F21-001: F21 サブスク解約3ヶ月縛りスモークテスト
// 対象: /api/users/subscriptions/cancel（認証なし時の保護確認）
// 認証後の3ヶ月縛り判定ロジック（403 + cancelableFrom）はセッション必須のため自動化対象外

test.describe('F21 解約 API 認証保護スモークテスト', () => {
  test('POST /api/users/subscriptions/cancel が認証なしで 4xx を返す（500 でないこと）', async ({ page }) => {
    await page.goto('/admin/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    const status = await page.evaluate(async () => {
      const res = await fetch('/api/users/subscriptions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      return res.status;
    });
    // 認証なしで 400（セッションなし/不正リクエスト）または 401/403 が返ること
    expect(status).toBeLessThan(500);
    expect(status).toBeGreaterThanOrEqual(400);
  });
});
