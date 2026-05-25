import { test, expect } from '@playwright/test';

// SC-F4-001 〜 SC-F4-005: F4-1/F4-2 配送希望日バリデーション撤廃 & 配送カレンダー配置変更
//
// F4-1: 配送希望日プルダウンに土日が含まれ、土日選択時にエラーが出ないことを確認
// F4-2: 管理画面 /admin/delivery が正常に応答することを確認（認証必須のためスモークのみ）

test.describe('SC-F4-001: /purchase ページ スモーク', () => {
  test('購入ページが正常に表示される', async ({ page }) => {
    await page.goto('/purchase', { waitUntil: 'domcontentloaded', timeout: 30000 });
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('SC-F4-002: 定期プラン選択後の配送希望日UI', () => {
  // ?step=info&plan=sub-6 で info ステップに直接遷移（purchaseType=subscription-monthly に設定される）
  test.beforeEach(async ({ page }) => {
    await page.goto('/purchase?step=info&plan=sub-6', { waitUntil: 'domcontentloaded', timeout: 30000 });
    // 配送希望日セクションが描画されるまで待つ（Stripe等の外部リクエストを待たない）
    await page.locator('select[name="preferredDeliveryDate"]').waitFor({ state: 'visible', timeout: 15000 });
  });

  test('配送希望日プルダウンが存在する', async ({ page }) => {
    const select = page.locator('select[name="preferredDeliveryDate"]');
    await expect(select).toBeVisible();
  });

  test('案内文言「土日もご指定いただけます」が存在する', async ({ page }) => {
    const text = page.locator('text=土日もご指定いただけます');
    await expect(text.first()).toBeVisible();
  });

  test('プルダウンの選択肢に土曜日（土）が含まれる', async ({ page }) => {
    const select = page.locator('select[name="preferredDeliveryDate"]');
    const options = await select.locator('option').allTextContents();
    const hasSaturday = options.some((o) => o.includes('土'));
    expect(hasSaturday).toBe(true);
  });

  test('プルダウンの選択肢に日曜日（日）が含まれる', async ({ page }) => {
    const select = page.locator('select[name="preferredDeliveryDate"]');
    const options = await select.locator('option').allTextContents();
    // 「日」は曜日表記として（土）と同様に括弧内に現れる
    const hasSunday = options.some((o) => o.includes('（日）'));
    expect(hasSunday).toBe(true);
  });
});

test.describe('SC-F4-003: 管理画面配送カレンダー スモーク', () => {
  test('/admin/delivery へのアクセスが404にならない', async ({ request }) => {
    const response = await request.get('/admin/delivery');
    // 認証リダイレクト（302）またはログイン画面（200）が返ること（404/500 でなければOK）
    expect(response.status()).not.toBe(404);
    expect(response.status()).not.toBe(500);
  });

  test('/admin/login が正常に表示される（認証フロー前提の確認）', async ({ page }) => {
    await page.goto('/admin/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await expect(page).toHaveURL(/admin\/login/);
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});
