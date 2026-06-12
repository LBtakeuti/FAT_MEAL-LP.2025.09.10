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

  test('F76-2/F76-3 導線の遷移先が保持される（お知らせを見る→/news, 定期コースを見る→?type=subscription, モバイルヘッダー購入→/purchase）', async ({
    page,
  }) => {
    // F76-2 で PushButton(<Link href>) 化した2導線 ＋ F76-3 でフラットLink化したモバイルヘッダー購入。
    // いずれも href なので遷移先（退行防止）を判定する。レスポンシブで PC/モバイル片方が
    // 非表示になる導線は「href付きで存在（count>0）＋可視なものが少なくとも1つ」で判定。
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // F76-2: NewsSection「お知らせを見る」→ /news（PC=lg / モバイル=full の2箇所）。
    const newsCta = page.locator('a[href="/news"]', { hasText: 'お知らせを見る' });
    expect(await newsCta.count(), '「お知らせを見る」→ /news が存在').toBeGreaterThan(0);
    await expect(
      newsCta.filter({ visible: true }).first(),
      '少なくとも1つの「お知らせを見る」が可視'
    ).toBeVisible();

    // F76-2: SportsScience 副次CTA「定期コースを見る」→ /purchase?type=subscription（outline-orange）。
    const subCta = page.locator('a[href="/purchase?type=subscription"]', {
      hasText: '定期コースを見る',
    });
    expect(
      await subCta.count(),
      '「定期コースを見る」→ /purchase?type=subscription が存在'
    ).toBeGreaterThan(0);
    await expect(subCta.filter({ visible: true }).first(), '「定期コースを見る」が可視').toBeVisible();

    // F76-3: モバイルヘッダーの「購入」（フラットLink・sm:hidden）→ /purchase・aria-label="購入"。
    // モバイル幅でのみ可視なので viewport を 390px にして可視判定する。
    await page.setViewportSize({ width: 390, height: 844 });
    const mobilePurchase = page.locator('header a[href="/purchase"][aria-label="購入"]');
    expect(await mobilePurchase.count(), 'モバイルヘッダー購入→ /purchase が存在').toBeGreaterThan(0);
    await expect(mobilePurchase.first(), 'モバイルヘッダー購入が可視（390px）').toBeVisible();
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
