import { test, expect } from '@playwright/test';

test.describe('FAQセクション スモークテスト', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    // FAQセクションが表示されるまでAPIレスポンスを待つ（最大15秒）
    await page.waitForSelector('#faq', { timeout: 15000 });
  });

  test('FAQセクションが表示される', async ({ page }) => {
    const section = page.locator('#faq');
    await expect(section).toBeVisible();
  });

  test('FAQ見出し（オレンジ）が表示される', async ({ page }) => {
    const faqLabel = page.locator('#faq p.text-orange-500');
    await expect(faqLabel).toBeVisible();
    await expect(faqLabel).toHaveText('FAQ');

    const heading = page.locator('#faq h2.text-orange-600');
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText('よくあるご質問');
  });

  test('FAQ項目が線区切りで表示され、+アイコンが右端にある', async ({ page }) => {
    const items = page.locator('#faq .border-b.border-gray-200');
    const count = await items.count();
    expect(count).toBeGreaterThan(0);

    // 最初のアイテムのボタンと+アイコンを確認
    const firstButton = items.first().locator('button[aria-expanded]');
    await expect(firstButton).toBeVisible();

    const icon = firstButton.locator('span[aria-hidden="true"]');
    await expect(icon).toBeVisible();
    await expect(icon).toContainText('+');
  });

  test('初期状態でアコーディオンは全て閉じている', async ({ page }) => {
    const buttons = page.locator('#faq button[aria-expanded]');
    const count = await buttons.count();
    for (let i = 0; i < count; i++) {
      await expect(buttons.nth(i)).toHaveAttribute('aria-expanded', 'false');
    }
  });

  test('質問クリックでアコーディオンが展開し、+アイコンが回転する', async ({ page }) => {
    const firstButton = page.locator('#faq button[aria-expanded]').first();
    await firstButton.click();

    await expect(firstButton).toHaveAttribute('aria-expanded', 'true');

    // アイコンが rotate-45 クラスを持つことを確認
    const icon = firstButton.locator('span[aria-hidden="true"]');
    await expect(icon).toHaveClass(/rotate-45/);

    // 答えエリアが表示される（aria-hidden=false）
    const answerArea = page.locator('#faq .grid').first();
    await expect(answerArea).not.toHaveAttribute('aria-hidden', 'true');
  });

  test('答えタイトルがオレンジ（orange-600）で表示される', async ({ page }) => {
    const firstButton = page.locator('#faq button[aria-expanded]').first();
    await firstButton.click();

    const answerTitle = page.locator('#faq p.text-orange-600').first();
    await expect(answerTitle).toBeVisible();
  });

  test('別の質問をクリックすると前の項目が閉じる（同時1つのみ）', async ({ page }) => {
    const buttons = page.locator('#faq button[aria-expanded]');
    const count = await buttons.count();
    if (count < 2) {
      test.skip();
      return;
    }

    await buttons.nth(0).click();
    await expect(buttons.nth(0)).toHaveAttribute('aria-expanded', 'true');

    await buttons.nth(1).click();
    await expect(buttons.nth(1)).toHaveAttribute('aria-expanded', 'true');
    await expect(buttons.nth(0)).toHaveAttribute('aria-expanded', 'false');
  });

  test('展開済み項目を再クリックで閉じる', async ({ page }) => {
    const firstButton = page.locator('#faq button[aria-expanded]').first();
    await firstButton.click();
    await expect(firstButton).toHaveAttribute('aria-expanded', 'true');

    await firstButton.click();
    await expect(firstButton).toHaveAttribute('aria-expanded', 'false');
  });

  test('閉状態の答えエリアにaria-hidden=trueが付与される', async ({ page }) => {
    // 初期状態（全て閉）では最初のgrid要素はaria-hidden=true
    const answerAreas = page.locator('#faq .grid[aria-hidden]');
    const first = answerAreas.first();
    await expect(first).toHaveAttribute('aria-hidden', 'true');
  });
});
