/**
 * SC-REG-009: trial-6 × subscription_only クーポン誤適用ガード
 * （metadata ブラックリスト方式 / cb935fd）
 *
 * 対象コミット: cb935fd
 * 変更概要: coupon.metadata.subscription_only === "true" のクーポンを
 *   trial-6(お試し)で使用した場合に valid:false を返すガードを実装。
 *   applies_to 方式（SC-REG-008）とは別レイヤーのガード。
 *
 * テストクーポン（Stripe テストモード / sk_test）:
 *   - E2ETESTSUBONLY001: coupon rPb6Ie6i, metadata.subscription_only="true"
 *   - E2ETESTNOFLAG001: coupon ttwnwqlT, metadata未設定（フラグ無し）
 * これらはテスト実行前に作成済み・テスト完了後に cleanup_stripe_test_coupons.ts で削除すること。
 *
 * 環境制約:
 *   - ローカル STRIPE_SECRET_KEY は sk_test（テストモード）
 *   - 本番(live) KOSHIGAYA クーポンはテストモードでは存在しない
 *   - テストモード専用クーポン（E2ETESTSUBONLY001 / E2ETESTNOFLAG001）で実ガードパスを再現
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('SC-REG-009: subscription_only metadata ガード（cb935fd）', () => {
  /**
   * SC-REG-009-01
   * trial-6 + subscription_only:"true" クーポン → valid:false / 割引ゼロ
   * ガードのコアケース: metadata.subscription_only="true" が trial-6 で弾かれること
   */
  test('SC-REG-009-01: trial-6 + E2ETESTSUBONLY001(subscription_only:true) → valid:false かつ discount 未付与', async ({ page }) => {
    await page.goto(`${BASE_URL}/purchase`, { waitUntil: 'domcontentloaded', timeout: 60000 });

    const result = await page.evaluate(async () => {
      const res = await fetch('/api/payment/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'E2ETESTSUBONLY001', planId: 'trial-6' }),
      });
      return { status: res.status, body: await res.json() };
    });

    expect(result.status).toBe(200);
    // ガード発動 → valid:false であること（割引ゼロが最低保証）
    expect(result.body.valid).toBe(false);
    // 割引ゼロ: discount / percentOff / appliedCoupon が付与されていないこと
    expect(result.body.discount).toBeUndefined();
    expect(result.body.percentOff).toBeUndefined();
    expect(result.body.appliedCoupon).toBeUndefined();
    // error文言: 定期専用文言であること
    // （テストモードクーポンなので "定期プラン専用" 文言が返るはず）
    expect(result.body.error).toBe(
      'このクーポンは定期プラン専用のため、お試しにはお使いいただけません'
    );
    // scope は 'all' が返る（applies_to 未設定クーポンの場合）
    expect(result.body.scope).toBe('all');
  });

  /**
   * SC-REG-009-02
   * trial-6 + subscription_only フラグ無しクーポン → valid:true / 割引付与（過剰ブロックなし）
   * フラグ無しクーポンは trial-6 でも通ることを保証する
   */
  test('SC-REG-009-02: trial-6 + E2ETESTNOFLAG001(フラグ無し) → valid:true かつ割引付与（過剰ブロックなし）', async ({ page }) => {
    await page.goto(`${BASE_URL}/purchase`, { waitUntil: 'domcontentloaded', timeout: 60000 });

    const result = await page.evaluate(async () => {
      const res = await fetch('/api/payment/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'E2ETESTNOFLAG001', planId: 'trial-6' }),
      });
      return { status: res.status, body: await res.json() };
    });

    expect(result.status).toBe(200);
    // フラグ無しはお試しでも通る → valid:true
    expect(result.body.valid).toBe(true);
    // 割引が付いていること（amount_off=200円）
    // discount フィールドまたは amountOff が存在すること
    const hasDiscount =
      typeof result.body.discount === 'number' ||
      typeof result.body.amountOff === 'number' ||
      typeof result.body.amount_off === 'number';
    expect(hasDiscount).toBe(true);
  });

  /**
   * SC-REG-009-03
   * sub-6 + subscription_only:"true" クーポン → valid:true（過剰ブロックなし）
   * isOneTimePlan(planId==='trial-6') のみ弾く実装であり、
   * sub-6 / sub-12 は弾かれないことを保証する
   */
  test('SC-REG-009-03: sub-6 + E2ETESTSUBONLY001(subscription_only:true) → valid:true（過剰ブロックなし）', async ({ page }) => {
    await page.goto(`${BASE_URL}/purchase`, { waitUntil: 'domcontentloaded', timeout: 60000 });

    const result = await page.evaluate(async () => {
      const res = await fetch('/api/payment/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'E2ETESTSUBONLY001', planId: 'sub-6' }),
      });
      return { status: res.status, body: await res.json() };
    });

    expect(result.status).toBe(200);
    // sub-6 は subscription_only クーポンで弾かれない → valid:true
    expect(result.body.valid).toBe(true);
  });

  /**
   * SC-REG-009-04
   * sub-12 + subscription_only:"true" クーポン → valid:true（過剰ブロックなし）
   */
  test('SC-REG-009-04: sub-12 + E2ETESTSUBONLY001(subscription_only:true) → valid:true（過剰ブロックなし）', async ({ page }) => {
    await page.goto(`${BASE_URL}/purchase`, { waitUntil: 'domcontentloaded', timeout: 60000 });

    const result = await page.evaluate(async () => {
      const res = await fetch('/api/payment/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'E2ETESTSUBONLY001', planId: 'sub-12' }),
      });
      return { status: res.status, body: await res.json() };
    });

    expect(result.status).toBe(200);
    // sub-12 は subscription_only クーポンで弾かれない → valid:true
    expect(result.body.valid).toBe(true);
  });

  /**
   * SC-REG-009-05（恒久固定）
   * trial-6 + 存在しないコード → valid:false かつ割引ゼロ
   * SC-REG-008-02 相当の恒久固定。subscription_only ガードに無関係でも
   * 存在しないコードが trial-6 で割引を付与しないことを保証する。
   */
  test('SC-REG-009-05: trial-6 + 無効コード → valid:false かつ discount 未付与（恒久固定）', async ({ page }) => {
    await page.goto(`${BASE_URL}/purchase`, { waitUntil: 'domcontentloaded', timeout: 60000 });

    const result = await page.evaluate(async () => {
      const res = await fetch('/api/payment/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: '__INVALID_REG009__', planId: 'trial-6' }),
      });
      return { status: res.status, body: await res.json() };
    });

    expect(result.status).toBe(200);
    expect(result.body.valid).toBe(false);
    expect(result.body.discount).toBeUndefined();
    expect(result.body.percentOff).toBeUndefined();
    expect(result.body.appliedCoupon).toBeUndefined();
  });
});
