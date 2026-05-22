import { test, expect } from '@playwright/test';

// SC-REG-007: /message/[slug] 500エラー修正後のスモークテスト
// bfa8e89: isomorphic-dompurify → sanitize-html 置換

const EXISTING_SLUG = 'a-school';

test.describe('/message/[slug] スモークテスト', () => {
  test('実在slugでページが200を返しHTML本文が描画される', async ({ page }) => {
    const response = await page.goto(`/message/${EXISTING_SLUG}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    expect(response?.status()).toBe(200);

    const article = page.locator('article.message-body');
    await expect(article).toBeVisible();
  });

  test('h1タイトルが表示される', async ({ page }) => {
    await page.goto(`/message/${EXISTING_SLUG}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    const text = await heading.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });

  test('存在しないslugは404ページが表示される', async ({ page }) => {
    await page.goto('/message/nonexistent-slug-e2e-test', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    // Next.js devモードでは notFound() がHTTP 200でエラーページを返すため、
    // ページ内に "404" または "Not Found" が含まれることで確認する
    const body = await page.textContent('body');
    const is404 = body?.includes('404') || body?.includes('Not Found') || body?.includes('not found');
    expect(is404).toBe(true);
  });
});
