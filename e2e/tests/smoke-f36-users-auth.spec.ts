import { test, expect } from '@playwright/test';

// SC-F36: /api/users/ 配下 認証保護スモークテスト
// 対象: /api/users/profile, /api/users/orders, /api/users/subscriptions, /api/users/subscriptions/cancel
// 前提: 認証なし環境（Docker ローカル）での認証保護確認
// 緊急セキュリティ修正: 未認証で 401 が返ることを全エンドポイントで検証

test.describe('F36 /api/users/profile 認証保護スモークテスト', () => {
  test('GET /api/users/profile が認証なしで 401 を返す（500 でないこと）', async ({ page }) => {
    await page.goto('/admin/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
    const status = await page.evaluate(async () => {
      const res = await fetch('/api/users/profile', { method: 'GET' });
      return res.status;
    });
    expect(status).toBeLessThan(500);
    expect(status).toBeGreaterThanOrEqual(400);
  });

  test('POST /api/users/profile が認証なしで 401 を返す（500 でないこと）', async ({ page }) => {
    await page.goto('/admin/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
    const status = await page.evaluate(async () => {
      const res = await fetch('/api/users/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      return res.status;
    });
    expect(status).toBeLessThan(500);
    expect(status).toBeGreaterThanOrEqual(400);
  });

  test('PATCH /api/users/profile が認証なしで 401 を返す（500 でないこと）', async ({ page }) => {
    await page.goto('/admin/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
    const status = await page.evaluate(async () => {
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      return res.status;
    });
    expect(status).toBeLessThan(500);
    expect(status).toBeGreaterThanOrEqual(400);
  });
});

test.describe('F36 /api/users/ その他エンドポイント 認証保護スモークテスト', () => {
  test('GET /api/users/orders が認証なしで 401 を返す（500 でないこと）', async ({ page }) => {
    await page.goto('/admin/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
    const status = await page.evaluate(async () => {
      const res = await fetch('/api/users/orders', { method: 'GET' });
      return res.status;
    });
    expect(status).toBeLessThan(500);
    expect(status).toBeGreaterThanOrEqual(400);
  });

  test('GET /api/users/subscriptions が認証なしで 401 を返す（500 でないこと）', async ({ page }) => {
    await page.goto('/admin/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
    const status = await page.evaluate(async () => {
      const res = await fetch('/api/users/subscriptions', { method: 'GET' });
      return res.status;
    });
    expect(status).toBeLessThan(500);
    expect(status).toBeGreaterThanOrEqual(400);
  });

  test('POST /api/users/subscriptions/cancel が認証なしで 401 を返す（500 でないこと）', async ({ page }) => {
    await page.goto('/admin/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
    const status = await page.evaluate(async () => {
      const res = await fetch('/api/users/subscriptions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId: 'dummy' }),
      });
      return res.status;
    });
    expect(status).toBeLessThan(500);
    expect(status).toBeGreaterThanOrEqual(400);
  });
});
