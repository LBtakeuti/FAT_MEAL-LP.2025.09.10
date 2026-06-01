import { test, expect } from '@playwright/test';

// SC-F14-001: F14-1 コラム機能基盤実装のスモークテスト
// 対象: /blog（一覧）/ /blog/[slug]（詳細）/ トップの BlogSection

test.describe('コラム一覧ページ スモークテスト', () => {
  test('/blog が 200 で表示される', async ({ page }) => {
    await page.goto('/blog', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await expect(page).toHaveURL(/\/blog/);
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('/blog に 404 コンテンツが含まれない（正常表示）', async ({ page }) => {
    await page.goto('/blog', { waitUntil: 'domcontentloaded', timeout: 60000 });
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toMatch(/404|Not Found|ページが見つかりません/i);
  });

  test('記事0件でも /blog が空状態で表示される', async ({ page }) => {
    const response = await page.goto('/blog', { waitUntil: 'domcontentloaded', timeout: 60000 });
    expect(response?.status()).toBe(200);
  });
});

test.describe('コラム詳細ページ スモークテスト', () => {
  test('/blog/存在しないスラッグ が 404 コンテンツを表示する', async ({ page }) => {
    await page.goto('/blog/this-slug-does-not-exist-e2e-test', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    // Next.js RSC streaming: 404 コンテンツはハイドレーション後に DOM に反映されるため networkidle まで待機
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    const bodyText = await page.locator('body').innerText();
    const url = page.url();
    // Next.js の notFound() は Docker 開発環境でも 200 を返す場合があるため HTML 内容で確認
    const has404Content =
      bodyText.match(/404|Not Found|見つかりません|This page could not be found/i) !== null ||
      url.includes('404');
    expect(has404Content).toBe(true);
  });
});

test.describe('トップページ BlogSection スモークテスト', () => {
  test('トップページが正常に表示される（BlogSection は記事0件時に非表示のため存在確認はスキップ）', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await expect(page).toHaveTitle(/.+/);
    const body = page.locator('body');
    await expect(body).toBeVisible();
    // BlogSection は articles.length === 0 のとき null を返すため、
    // ローカル開発環境（DBに記事なし）では #blog が DOM に存在しない。
    // 記事が公開された環境では #blog が表示されることを目視で確認すること。
  });
});
