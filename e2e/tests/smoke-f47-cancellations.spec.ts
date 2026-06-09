import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3010';

test.describe('F47: admin/cancellations + login rate-limit + reCAPTCHA削除', () => {
  test('POST /api/admin/login に不正な認証情報を送ると 4xx を返す（500 でないこと）', async ({ request }) => {
    const res = await request.post(`${BASE}/api/admin/login`, {
      headers: { 'Content-Type': 'application/json', Origin: BASE },
      data: { email: 'invalid@example.com', password: 'wrongpassword' },
    });
    const status = res.status();
    expect(status).toBeGreaterThanOrEqual(400);
    expect(status).toBeLessThan(500);
  });

  test('GET /admin/cancellations は未認証で /admin/login にリダイレクトされる', async ({ page }) => {
    await page.goto(`${BASE}/admin/cancellations`, {
      waitUntil: 'commit',
      timeout: 60000,
    });
    const finalUrl = page.url();
    expect(finalUrl).toContain('/admin/login');
  });

  test('GET /api/admin/cancellations は未認証で 401 を返す', async ({ request }) => {
    const res = await request.get(`${BASE}/api/admin/cancellations`, {
      headers: { Origin: BASE },
    });
    expect(res.status()).toBe(401);
  });

  test('GET /contact は 200 を返す（reCAPTCHA 削除後もページが正常に表示される）', async ({ page }) => {
    const res = await page.goto(`${BASE}/contact`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    expect(res?.status()).toBe(200);
  });
});
