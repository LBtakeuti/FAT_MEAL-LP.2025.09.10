import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3010';

test.describe('F49: SEO強化（sitemap / robots / blog metadata / JSON-LD）', () => {
  test('GET /sitemap.xml が 200 + XML を返す', async ({ page }) => {
    const res = await page.goto(`${BASE}/sitemap.xml`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    expect(res?.status()).toBe(200);
    const contentType = res?.headers()['content-type'] ?? '';
    expect(contentType).toMatch(/xml/);
  });

  test('GET /robots.txt が 200 + text を返し「Disallow: /admin」を含む', async ({ page }) => {
    const res = await page.goto(`${BASE}/robots.txt`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    expect(res?.status()).toBe(200);
    const body = await page.content();
    expect(body).toContain('Disallow: /admin');
  });

  test('GET /blog が 200 で表示される（layout metadata 追加後も既存挙動維持）', async ({ page }) => {
    const res = await page.goto(`${BASE}/blog`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    expect(res?.status()).toBe(200);
  });

  test('GET /blog/taberarenai-naze が 200 で表示される（JSON-LD 追加後も既存挙動維持）', async ({ page }) => {
    const res = await page.goto(`${BASE}/blog/taberarenai-naze`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    expect(res?.status()).toBe(200);
  });

  test('/blog/taberarenai-naze に JSON-LD script タグが存在する', async ({ page }) => {
    await page.goto(`${BASE}/blog/taberarenai-naze`, {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
    const ldJson = await page.$('script[type="application/ld+json"]');
    expect(ldJson).not.toBeNull();
  });
});
