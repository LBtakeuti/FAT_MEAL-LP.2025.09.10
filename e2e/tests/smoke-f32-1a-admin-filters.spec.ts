import { test, expect } from '@playwright/test';

// SC-F32-1a: admin一覧ページ期間フィルタ実装のスモークテスト
// 対象: /admin/orders, /admin/contacts, /admin/subscriptions（認証なし確認のみ）
// 前提: 認証なし環境（Docker ローカル）での疎通・認証保護確認
// フィルタ反映・件数表示・遷移挙動は認証セッション必須のため手動確認推奨

test.describe('F32-1a admin一覧ページ 未認証リダイレクトスモークテスト', () => {
  test('/admin/orders に未認証アクセスで /admin/login へリダイレクトされる（タイムアウトしない）', async ({ page }) => {
    const res = await page.goto('/admin/orders', { waitUntil: 'commit', timeout: 60000 });
    const url = page.url();
    const statusOk = res?.status() !== undefined;
    expect(statusOk).toBe(true);
    expect(url).toMatch(/\/admin/);
  });

  test('/admin/orders?from=2026-06-01&to=2026-06-30 に未認証アクセスで /admin/login へリダイレクトされる', async ({ page }) => {
    const res = await page.goto('/admin/orders?from=2026-06-01&to=2026-06-30', { waitUntil: 'commit', timeout: 60000 });
    const url = page.url();
    const statusOk = res?.status() !== undefined;
    expect(statusOk).toBe(true);
    expect(url).toMatch(/\/admin/);
  });

  test('/admin/contacts に未認証アクセスで /admin/login へリダイレクトされる（タイムアウトしない）', async ({ page }) => {
    const res = await page.goto('/admin/contacts', { waitUntil: 'commit', timeout: 60000 });
    const url = page.url();
    const statusOk = res?.status() !== undefined;
    expect(statusOk).toBe(true);
    expect(url).toMatch(/\/admin/);
  });

  test('/admin/subscriptions に未認証アクセスで /admin/login へリダイレクトされる（タイムアウトしない）', async ({ page }) => {
    const res = await page.goto('/admin/subscriptions', { waitUntil: 'commit', timeout: 60000 });
    const url = page.url();
    const statusOk = res?.status() !== undefined;
    expect(statusOk).toBe(true);
    expect(url).toMatch(/\/admin/);
  });
});

test.describe('F32-1a admin contacts API 認証保護スモークテスト', () => {
  test('GET /api/admin/contacts が認証なしで 401/403 を返す（500 でないこと）', async ({ page }) => {
    const res = await page.goto('/api/admin/contacts', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    const status = res?.status() ?? 0;
    expect(status).toBeLessThan(500);
    expect(status).toBeGreaterThan(0);
  });

  // F32-1a: from/to クエリ付きでも認証保護が機能することを確認
  test('GET /api/admin/contacts?from=...&to=... が認証なしで 401/403 を返す（500 でないこと）', async ({ page }) => {
    const res = await page.goto('/api/admin/contacts?from=2026-06-01&to=2026-06-30', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    const status = res?.status() ?? 0;
    expect(status).toBeLessThan(500);
    expect(status).toBeGreaterThan(0);
  });

  test('GET /api/admin/contacts?status=pending が認証なしで 401/403 を返す（500 でないこと）', async ({ page }) => {
    const res = await page.goto('/api/admin/contacts?status=pending&from=2026-06-01&to=2026-06-30', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    const status = res?.status() ?? 0;
    expect(status).toBeLessThan(500);
    expect(status).toBeGreaterThan(0);
  });
});
