import { test, expect } from '@playwright/test';

// SC-F39: パスワードリセット導線スモークテスト
// 対象: /auth/forgot-password, /auth/reset-password, /login（リンク存在確認）
// 前提: 一般公開ページのため認証不要

test.describe('F39 パスワードリセット ページ表示スモークテスト', () => {
  test('/auth/forgot-password が 200 で表示される', async ({ page }) => {
    const res = await page.goto('/auth/forgot-password', { waitUntil: 'domcontentloaded', timeout: 60000 });
    expect(res?.status()).toBe(200);
    const body = page.locator('body');
    await expect(body).toBeVisible();
    const bodyText = await body.innerText();
    expect(bodyText).not.toMatch(/404|Not Found|ページが見つかりません/i);
  });

  test('/auth/reset-password が 200 で表示される（hash なしでも 200）', async ({ page }) => {
    const res = await page.goto('/auth/reset-password', { waitUntil: 'domcontentloaded', timeout: 60000 });
    expect(res?.status()).toBe(200);
    const body = page.locator('body');
    await expect(body).toBeVisible();
    const bodyText = await body.innerText();
    expect(bodyText).not.toMatch(/404|Not Found|ページが見つかりません/i);
  });
});

test.describe('F39 /login パスワードリセットリンク スモークテスト', () => {
  test('/login に「パスワードを忘れた方はこちら」リンクが存在する', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
    const forgotLink = page.locator('a[href="/auth/forgot-password"], a:has-text("パスワードを忘れた")');
    await expect(forgotLink).toBeVisible({ timeout: 10000 });
  });

  test('/login から /auth/forgot-password へ遷移できる', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
    const forgotLink = page.locator('a[href="/auth/forgot-password"], a:has-text("パスワードを忘れた")');
    await forgotLink.click();
    await page.waitForURL(/\/auth\/forgot-password/, { timeout: 10000 });
    expect(page.url()).toMatch(/\/auth\/forgot-password/);
  });
});
