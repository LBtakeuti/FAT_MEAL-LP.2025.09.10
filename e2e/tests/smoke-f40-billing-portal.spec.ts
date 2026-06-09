import { test, expect } from '@playwright/test';

// SC-F40: 支払い失敗時カード変更導線（Stripe Customer Portal）スモークテスト
// 対象: /api/users/billing-portal, /mypage
// Stripe Customer Portal の実フローは実環境必要のため認証保護・ページ表示確認のみ

test.describe('F40 billing-portal API 認証保護スモークテスト', () => {
  test('POST /api/users/billing-portal が認証なしで 401 を返す（500 でないこと）', async ({ page }) => {
    await page.goto('/admin/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
    const status = await page.evaluate(async () => {
      const res = await fetch('/api/users/billing-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      return res.status;
    });
    expect(status).toBeLessThan(500);
    expect(status).toBeGreaterThanOrEqual(400);
  });
});

test.describe('F40 /mypage ページ表示スモークテスト', () => {
  test('/mypage が 4xx でないレスポンスを返す（未認証時は /login へリダイレクトされる想定）', async ({ page }) => {
    const res = await page.goto('/mypage', { waitUntil: 'commit', timeout: 60000 });
    const status = res?.status() ?? 0;
    // 未認証では /login へリダイレクト（200）またはそのまま表示
    // 4xx / 5xx でないことを確認
    expect(status).toBeLessThan(400);
    expect(status).toBeGreaterThan(0);
    // /mypage か /login のいずれかに着地する
    expect(page.url()).toMatch(/\/(mypage|login)/);
  });
});
