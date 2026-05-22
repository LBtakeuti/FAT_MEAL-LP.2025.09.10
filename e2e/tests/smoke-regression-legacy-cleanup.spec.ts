import { test, expect } from '@playwright/test';

// SC-REG-006: レガシーコード一括削除後のスモーク + リグレッション
// 削除対象: HeroSection.backup / AboutSection / ProblemsSection / TrialSection / StatsSection / IndividualMessageForm / MobileFooterNav
// 削除APIルート: /api/purchase / /api/messages/[slug] / /api/menu/[id] / /api/admin/subscriptions/deliveries

test.describe('トップページ スモークテスト', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  });

  test('トップページが正常に表示される', async ({ page }) => {
    await expect(page).toHaveTitle(/.+/);
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('SubscriptionSection が表示される', async ({ page }) => {
    const section = page.locator('#subscription, [data-section="subscription"], section').first();
    await expect(section).toBeVisible();
  });

  test('メニューアイテムが1件以上表示される', async ({ page }) => {
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    // メニューカードが表示されることを確認（img または メニュー名要素）
    const menuItems = page.locator('img[alt]');
    const count = await menuItems.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('メニュー一覧ページ スモークテスト', () => {
  test('メニュー一覧ページが正常に表示される', async ({ page }) => {
    await page.goto('/menu-list', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await expect(page).toHaveURL(/menu-list/);
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('管理画面ログインページ スモークテスト', () => {
  test('管理画面ログインページが正常に表示される', async ({ page }) => {
    await page.goto('/admin/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await expect(page).toHaveURL(/admin\/login/);
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('ログインフォームが表示される', async ({ page }) => {
    await page.goto('/admin/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"]');
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });
});

test.describe('APIルート スモークテスト（残存ルート）', () => {
  test('/api/menu が正常に応答し配列を返す', async ({ request }) => {
    const response = await request.get('/api/menu');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });
});

test.describe('削除APIルート リグレッションテスト（404確認）', () => {
  test('POST /api/purchase が404を返す（削除済み）', async ({ request }) => {
    const response = await request.post('/api/purchase', { data: {} });
    expect(response.status()).toBe(404);
  });

  test('GET /api/messages/test-slug が404を返す（削除済み）', async ({ request }) => {
    const response = await request.get('/api/messages/test-slug');
    expect(response.status()).toBe(404);
  });

  test('GET /api/menu/test-id が404を返す（削除済み）', async ({ request }) => {
    const response = await request.get('/api/menu/test-id');
    expect(response.status()).toBe(404);
  });
});
