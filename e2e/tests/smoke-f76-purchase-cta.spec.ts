import { test, expect, type Locator } from '@playwright/test';

// SC-F76: 購入CTA（3D PushButton）の遷移先 回帰ガード
// 趣旨: F76 で購入CTAを共通部品 PushButton（3Dボタン）に置換した。
//   見た目は変わるが「どこへ遷移するか」は不変であることを恒久ガードする。
//   - href型CTA（5箇所）: /purchase の type パラメータが保持されること（生HTML/raw）。
//   - プランカード3ボタン（#subscription, <button>+onClick→router.push のSPA遷移）:
//     クリックで正しいプラン種別（trial-6 / sub-6 / sub-12）へ遷移すること【お金に直結】。
//
// 注意（hydration-aware）: トップは Reveal 多数＋カルーセル等でクライアント島が多く、
//   dev では hydration 完了が遅れ、onClick アタッチ前のクリックが取りこぼされ得る。
//   仕様は緩めず、click→期待URL を expect(...).toPass() でリトライ待ちして確実に検証する。

// hydration 完了まで「クリック→期待URL」をリトライ。仕様/期待値（plan種別）は不変。
async function clickUntilUrl(page: import('@playwright/test').Page, button: Locator, urlRe: RegExp) {
  await button.scrollIntoViewIfNeeded();
  await expect(async () => {
    if (!urlRe.test(page.url())) {
      await button.click();
    }
    await expect(page).toHaveURL(urlRe, { timeout: 1500 });
  }).toPass({ timeout: 20000 });
}

test.describe('F76 購入CTA 遷移先ガード', () => {
  test('href型CTA 5箇所の /purchase type パラメータが保持される（SSR生HTML）', async ({ request }) => {
    const res = await request.get('/');
    expect(res.status()).toBe(200);
    const html = await res.text();
    // 各 type の href が初期HTMLに存在すること（CTA置換で遷移先が変わっていない）。
    expect(html, 'HeaderNav/SportsScience-secondary の ?type=subscription').toContain(
      'href="/purchase?type=subscription"'
    );
    expect(html, 'SportsScience 主CTA の ?type=trial').toContain('href="/purchase?type=trial"');
    expect(html, 'Mobile/HeroStats/PurchaseFlow の /purchase').toContain('href="/purchase"');
  });

  test('プランカード「お試しを購入する」→ /purchase?plan=trial-6', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    const btn = page.locator('#subscription button:has-text("お試しを購入する")').first();
    await clickUntilUrl(page, btn, /\/purchase\?plan=trial-6/);
  });

  test('プランカード 定期1番目「定期購入する」→ /purchase?plan=sub-6', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    const btn = page.locator('#subscription button:has-text("定期購入する")').nth(0);
    await clickUntilUrl(page, btn, /\/purchase\?plan=sub-6/);
  });

  test('プランカード 定期2番目「定期購入する」→ /purchase?plan=sub-12', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    const btn = page.locator('#subscription button:has-text("定期購入する")').nth(1);
    await clickUntilUrl(page, btn, /\/purchase\?plan=sub-12/);
  });
});
