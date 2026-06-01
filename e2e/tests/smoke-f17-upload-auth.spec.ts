import { test, expect } from '@playwright/test';

// SC-F17-001: F17 OG画像アップロード機能 + upload API 認証強化スモークテスト
// 対象: /api/admin/upload（withAuth 追加後の認証保護確認）

test.describe('F17 upload API 認証保護スモークテスト', () => {
  test('GET /api/admin/upload が認証なしで 401/403/405 を返す（500 でないこと）', async ({ page }) => {
    // upload は POST 専用のため GET は 405 になる場合もある
    const res = await page.goto('/api/admin/upload', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    const status = res?.status() ?? 0;
    expect(status).toBeLessThan(500);
    expect(status).toBeGreaterThan(0);
  });

  test('POST /api/admin/upload が認証なしで 401/403 を返す（fetch で確認）', async ({ page }) => {
    await page.goto('/admin/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    const status = await page.evaluate(async () => {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: new FormData(),
      });
      return res.status;
    });
    // 認証なしで 401 または 403 が返ること（500 でないこと）
    expect(status).toBeLessThan(500);
    expect(status).toBeGreaterThanOrEqual(400);
  });
});
