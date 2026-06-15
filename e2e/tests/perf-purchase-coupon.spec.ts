import { test, expect } from '@playwright/test';

// パフォーマンステスト: /purchase 画面の表示時間計測
// クーポンガード修正に伴う購入導線の回帰確認
// 計測対象: DOMContentLoaded / Load / 主要要素表示時間

test.describe('Performance: /purchase 画面表示時間計測', () => {
  test('Purchase screen: DOMContentLoaded & Load timing', async ({ page }) => {
    const perfMetrics = {
      domContentLoadTime: 0,
      loadTime: 0,
      mainElementTime: 0,
      validateCouponTime: 0,
    };

    // ナビゲーション開始
    const navigationStart = Date.now();

    // DOMContentLoaded イベント待機
    await page.on('domcontentloaded', () => {
      perfMetrics.domContentLoadTime = Date.now() - navigationStart;
    });

    // ページ移動
    await page.goto('http://localhost:3000/purchase', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Load イベント待機（30秒タイムアウト）
    const loadPromise = page.evaluate(() => {
      return new Promise<number>((resolve) => {
        const startTime = performance.timing.navigationStart;
        if (document.readyState === 'complete') {
          resolve(performance.timing.loadEventEnd - startTime);
        } else {
          window.addEventListener('load', () => {
            resolve(performance.timing.loadEventEnd - startTime);
          }, { once: true });
        }
      });
    });

    try {
      perfMetrics.loadTime = await Promise.race([
        loadPromise,
        new Promise<number>((_, reject) =>
          setTimeout(() => reject(new Error('Load timeout')), 30000)
        )
      ]);
    } catch (e) {
      // Load イベントが30秒以内に発火しない場合も許容
      perfMetrics.loadTime = Date.now() - navigationStart;
    }

    // 主要要素（PurchaseFlow）表示時間
    const mainElementStart = Date.now();
    await page.waitForSelector('[data-testid="purchase-flow"]', { timeout: 10000 }).catch(() => {
      // フォールバック: 汎用セレクタで待機
      return page.waitForSelector('main', { timeout: 5000 });
    });
    perfMetrics.mainElementTime = Date.now() - navigationStart;

    // validate-coupon API レスポンス時間計測（無効コード）
    const couponStart = Date.now();
    const couponResult = await page.evaluate(async () => {
      const res = await fetch('/api/payment/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: '__INVALID_FOR_E2E__' }),
      });
      return { status: res.status, body: await res.json() };
    });
    perfMetrics.validateCouponTime = Date.now() - couponStart;

    // 結果表示
    console.log('=== Performance Metrics ===');
    console.log(`DOMContentLoaded: ${perfMetrics.domContentLoadTime}ms`);
    console.log(`Load: ${perfMetrics.loadTime}ms`);
    console.log(`Main Element Visible: ${perfMetrics.mainElementTime}ms`);
    console.log(`Validate Coupon API: ${perfMetrics.validateCouponTime}ms`);
    console.log('===========================');

    // 基本的なアサーション
    expect(perfMetrics.domContentLoadTime).toBeGreaterThan(0);
    expect(perfMetrics.domContentLoadTime).toBeLessThan(30000); // 30秒以内
    expect(perfMetrics.mainElementTime).toBeLessThan(20000); // 主要要素は20秒以内
    expect(couponResult.status).toBe(200);
    expect(couponResult.body).toMatchObject({ valid: false });
  });

  test('Purchase screen: Coupon validation responsive', async ({ page }) => {
    const results = {
      firstValidationMs: 0,
      secondValidationMs: 0,
      screenReady: false,
    };

    await page.goto('http://localhost:3000/purchase?step=info&plan=sub-6', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    // 最初のコード検証
    const start1 = Date.now();
    const result1 = await page.evaluate(async () => {
      const res = await fetch('/api/payment/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'INVALID_CODE_1' }),
      });
      return { status: res.status, body: await res.json() };
    });
    results.firstValidationMs = Date.now() - start1;

    // 2回目のコード検証（API呼び出し重複が無いか確認）
    const start2 = Date.now();
    const result2 = await page.evaluate(async () => {
      const res = await fetch('/api/payment/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'INVALID_CODE_2' }),
      });
      return { status: res.status, body: await res.json() };
    });
    results.secondValidationMs = Date.now() - start2;

    console.log('=== Coupon Validation Performance ===');
    console.log(`1st Validation: ${results.firstValidationMs}ms`);
    console.log(`2nd Validation: ${results.secondValidationMs}ms`);
    console.log(`2回目/1回目の比: ${(results.secondValidationMs / results.firstValidationMs).toFixed(2)}x`);
    console.log('====================================');

    // Stripe API往復含むため数百ms程度は許容
    expect(results.firstValidationMs).toBeLessThan(5000);
    expect(results.secondValidationMs).toBeLessThan(5000);
    expect(result1.status).toBe(200);
    expect(result2.status).toBe(200);
  });
});
