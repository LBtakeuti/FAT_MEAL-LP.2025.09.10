import { test, expect } from '@playwright/test';

// SC-F45: open redirect 対策スモークテスト
// 対象: /login, /auth/callback/client（クエリ付き含む）
// 実ログイン後の遷移確認（不正redirect→"/"フォールバック）は手動確認推奨

test.describe('F45 /login open redirect 対策スモークテスト', () => {
  test('/login が 200 で表示される（既存挙動維持）', async ({ page }) => {
    const res = await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
    expect(res?.status()).toBe(200);
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toMatch(/404|Not Found|ページが見つかりません/i);
    expect(bodyText).not.toMatch(/Internal Server Error/i);
  });

  test('/login?redirect=%2Fpurchase が 200 で表示される（正常な相対パス）', async ({ page }) => {
    const res = await page.goto('/login?redirect=%2Fpurchase', { waitUntil: 'domcontentloaded', timeout: 60000 });
    expect(res?.status()).toBe(200);
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toMatch(/404|Not Found|ページが見つかりません/i);
    expect(bodyText).not.toMatch(/Internal Server Error/i);
  });

  test('/login?redirect=https%3A%2F%2Fevil.example.com が 200 でエラーにならない（外部URLはサニタイズ済み）', async ({ page }) => {
    const res = await page.goto('/login?redirect=https%3A%2F%2Fevil.example.com', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    expect(res?.status()).toBe(200);
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toMatch(/404|Not Found|ページが見つかりません/i);
    expect(bodyText).not.toMatch(/Internal Server Error/i);
  });
});

test.describe('F45 /auth/callback/client open redirect 対策スモークテスト', () => {
  test('/auth/callback/client?next=https%3A%2F%2Fevil.example.com が 200 でエラーにならない', async ({ page }) => {
    const res = await page.goto('/auth/callback/client?next=https%3A%2F%2Fevil.example.com', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    // 200 またはリダイレクト先（/login 等）に着地する、5xx でないこと
    const status = res?.status() ?? 0;
    expect(status).toBeLessThan(500);
    expect(status).toBeGreaterThan(0);
  });
});
