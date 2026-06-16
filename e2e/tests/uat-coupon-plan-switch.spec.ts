import { test, expect } from '@playwright/test';

/**
 * UAT: 購入フロー — subscription_only クーポン × プラン切替 自動解除
 *
 * 検証対象: components/purchase/PurchaseFlow.tsx
 *   - L479-496: calculateCouponDiscount — isTrial × subscription_only=true で割引ゼロ
 *   - L597-638: プラン切替 useEffect — validate-coupon 再実行 → valid:false → 自動解除 + トースト
 *
 * テストクーポン（テストモード sk_test）:
 *   Stripe Coupon ID : XCYiWWHm
 *     name: "[E2E_TEST] 定期専用500円引き"
 *     amount_off: 500, currency: jpy, duration: once
 *     metadata.subscription_only: "true"
 *   Promotion Code   : E2ESUBONLY (promo_1TillgKvr8fxkHMditv97GmJ)
 *
 * 環境制約:
 *   - .env.local = sk_test。ローカル開発サーバ（ポート 3010 / playwright.config.ts の baseURL）で実行。
 *   - テストモードの Promotion Code のため本番(live)には影響なし。
 *   - クリーンアップ: テスト完了後にこのクーポン/Promotion Code を削除する（afterAll）。
 *
 * 受入基準:
 *   1. sub-6 選択 + E2ESUBONLY 適用 → 割引 500 円が合計に反映される
 *   2. お試し(trial-6) に切替 → 自動解除トーストが表示される
 *   3. 自動解除後 — クーポンバッジが消え、割引行が消えるか ¥0 になる
 */

const BASE_URL = 'http://localhost:3010';
const PROMO_CODE = 'E2ESUBONLY';
const COUPON_ID = 'XCYiWWHm';
const PROMO_ID = 'promo_1TillgKvr8fxkHMditv97GmJ';
const STRIPE_KEY_ENV = process.env.STRIPE_SECRET_KEY ?? '';

async function deleteStripeTestData() {
  if (!STRIPE_KEY_ENV.startsWith('sk_test')) return;
  const headers = {
    Authorization: `Basic ${Buffer.from(STRIPE_KEY_ENV + ':').toString('base64')}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  };
  // Promotion Code を失効させる（Stripe は削除不可のため active=false）
  await fetch(`https://api.stripe.com/v1/promotion_codes/${PROMO_ID}`, {
    method: 'POST',
    headers,
    body: 'active=false',
  }).catch(() => {});
  // Coupon を削除
  await fetch(`https://api.stripe.com/v1/coupons/${COUPON_ID}`, {
    method: 'DELETE',
    headers,
  }).catch(() => {});
}

test.describe('UAT-COUPON-SWITCH: subscription_only クーポン × プラン切替 自動解除', () => {

  test.afterAll(async () => {
    await deleteStripeTestData();
  });

  /**
   * UAT-COUPON-SWITCH-01
   * 定期プラン(sub-6)でクーポン適用 → 割引が明細・合計に反映される
   * → お試し(trial-6)に切替 → 自動解除トースト表示 + 割引消滅
   */
  test('UAT-COUPON-SWITCH-01: 定期→お試し切替でクーポン自動解除とトーストを確認', async ({ page }) => {
    await page.goto('http://127.0.0.1:3000/purchase', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // ----- Step 1: sub-6 プランのアコーディオンを開く -----
    // デフォルトは sub-12 が開いているため、sub-6 ボタンを探してクリック
    const sub6Trigger = page.locator('[data-plan-id="sub-6"], button:has-text("6食"), label:has-text("6食")').first();
    if (await sub6Trigger.isVisible()) {
      await sub6Trigger.click();
    } else {
      // アコーディオントリガーをテキストで探す
      await page.locator('button').filter({ hasText: /6食プラン|6食定期/ }).first().click();
    }
    await page.waitForTimeout(500);

    // sub-6 プランが選択された状態であることを確認（数量 +1 ボタン or カート追加）
    // カートに sub-6 を追加する
    const addButton = page.locator('[data-plan-id="sub-6"] button:has-text("+"), button[aria-label*="sub-6"]').first();
    if (await addButton.isVisible()) {
      await addButton.click();
    } else {
      // プランアコーディオン内の + ボタンを探す
      const planSection = page.locator('div').filter({ hasText: /6食プラン/ }).last();
      await planSection.locator('button').filter({ hasText: '+' }).first().click();
    }
    await page.waitForTimeout(500);

    // ----- Step 2: クーポンコード入力・適用 -----
    const couponInput = page.locator('input[placeholder*="クーポン"], input[name*="coupon"], input[id*="coupon"]').first();
    await expect(couponInput).toBeVisible({ timeout: 10000 });
    await couponInput.fill(PROMO_CODE);

    const applyButton = page.locator('button').filter({ hasText: /適用|クーポン適用/ }).first();
    await applyButton.click();

    // ----- Step 3: 割引が明細に反映されることを確認 -----
    // トースト/バッジ または 割引行 "-¥500" の表示を待つ
    const discountIndicator = page.locator('text=500').or(page.locator('[data-testid="coupon-badge"]')).first();
    await expect(discountIndicator).toBeVisible({ timeout: 10000 });

    // ----- Step 4: お試しプラン(trial-6)に切替 -----
    const trialTrigger = page
      .locator('[data-plan-id="trial-6"], button:has-text("お試し"), label:has-text("お試し")')
      .first();
    if (await trialTrigger.isVisible()) {
      await trialTrigger.click();
    } else {
      await page.locator('button').filter({ hasText: /お試し/ }).first().click();
    }
    await page.waitForTimeout(1000);

    // ----- Step 5: 自動解除トーストが表示される -----
    // L640付近: `クーポン ${removedCode} はこのプランには使えないため解除しました`
    const toast = page.locator('text=解除しました').or(
      page.locator('[role="status"]').filter({ hasText: /解除|クーポン/ })
    ).first();
    await expect(toast).toBeVisible({ timeout: 10000 });

    // ----- Step 6: 割引が消える（クーポンバッジ非表示 or 割引行ゼロ）-----
    // クーポンバッジ（E2ESUBONLYの表示）が消えていること
    await expect(page.locator(`text=${PROMO_CODE}`)).not.toBeVisible({ timeout: 5000 });
  });

  /**
   * UAT-COUPON-SWITCH-02 (API レベル確認)
   * validate-coupon: sub-6 + E2ESUBONLY → valid:true（定期で使えること）
   */
  test('UAT-COUPON-SWITCH-02: validate-coupon — sub-6 + E2ESUBONLY → valid:true', async ({ page }) => {
    await page.goto('http://127.0.0.1:3000/purchase', { waitUntil: 'domcontentloaded', timeout: 60000 });

    const result = await page.evaluate(async (code) => {
      const res = await fetch('/api/payment/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, planId: 'sub-6' }),
      });
      return { status: res.status, body: await res.json() };
    }, PROMO_CODE);

    expect(result.status).toBe(200);
    expect(result.body.valid).toBe(true);
    // subscription_only メタデータが返ること
    expect(result.body.couponMetadata?.subscription_only).toBe('true');
  });

  /**
   * UAT-COUPON-SWITCH-03 (API レベル確認)
   * validate-coupon: trial-6 + E2ESUBONLY → valid:false（subscription_only ガード）
   */
  test('UAT-COUPON-SWITCH-03: validate-coupon — trial-6 + E2ESUBONLY → valid:false', async ({ page }) => {
    await page.goto('http://127.0.0.1:3000/purchase', { waitUntil: 'domcontentloaded', timeout: 60000 });

    const result = await page.evaluate(async (code) => {
      const res = await fetch('/api/payment/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, planId: 'trial-6' }),
      });
      return { status: res.status, body: await res.json() };
    }, PROMO_CODE);

    expect(result.status).toBe(200);
    expect(result.body.valid).toBe(false);
    // エラーに「定期プラン専用」または「お使いいただけません」を含むこと
    expect(result.body.error).toMatch(/定期プラン専用|お使いいただけません/);
  });
});
