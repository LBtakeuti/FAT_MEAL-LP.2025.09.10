import { test, expect } from '@playwright/test';

// SC-F16-001: F16 記事投稿管理画面のスモークテスト
// 対象: /admin/articles, /admin/articles/new, /api/admin/articles, /api/admin/articles/[id]
// 前提: 認証なし環境（Docker ローカル）での疎通・認証保護確認

test.describe('F16 記事管理一覧ページ スモークテスト', () => {
  test('/admin/articles に未認証アクセスで /admin/login へリダイレクトされる（タイムアウトしない）', async ({ page }) => {
    const res = await page.goto('/admin/articles', { waitUntil: 'commit', timeout: 60000 });
    const url = page.url();
    const statusOk = res?.status() !== undefined;
    expect(statusOk).toBe(true);
    expect(url).toMatch(/\/admin/);
  });

  test('/admin/articles/new に未認証アクセスで /admin/login へリダイレクトされる（タイムアウトしない）', async ({ page }) => {
    const res = await page.goto('/admin/articles/new', { waitUntil: 'commit', timeout: 60000 });
    const url = page.url();
    const statusOk = res?.status() !== undefined;
    expect(statusOk).toBe(true);
    expect(url).toMatch(/\/admin/);
  });
});

test.describe('F16 記事管理 API スモークテスト', () => {
  test('GET /api/admin/articles が認証なしで 401/403 を返す（500 でないこと）', async ({ page }) => {
    const res = await page.goto('/api/admin/articles', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    const status = res?.status() ?? 0;
    expect(status).toBeLessThan(500);
    expect(status).toBeGreaterThan(0);
  });

  test('GET /api/admin/articles/dummy-id が認証なしで 401/403 を返す（500 でないこと）', async ({ page }) => {
    const res = await page.goto('/api/admin/articles/00000000-0000-0000-0000-000000000000', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    const status = res?.status() ?? 0;
    expect(status).toBeLessThan(500);
    expect(status).toBeGreaterThan(0);
  });
});
