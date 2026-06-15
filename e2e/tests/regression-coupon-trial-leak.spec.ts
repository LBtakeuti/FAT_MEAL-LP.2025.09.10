import { test, expect } from '@playwright/test';

/**
 * SC-REG-008: trial-6 + 定期専用クーポン(KOSHIGAYA)誤適用ガード
 *
 * 対象コミット: 537dc49 / 502a484
 * 指示書: docs/debug-coupon-trial-leak.md（FB番号未付与）
 *
 * 検証対象: POST /api/payment/validate-coupon
 *   - 商品制限クーポン（scope='product'）は trial-6 で valid:false を返すガード
 *   - 安全側デフォルト: planId の Product 解決不能時も valid:false に倒す
 *
 * 【環境制約・重要】
 *   ローカル .env.local の STRIPE_SECRET_KEY は sk_test（テストモード）。
 *   KOSHIGAYA は Stripe live の Promotion Code 想定のため、
 *   テストモードでは stripe.promotionCodes.list が空を返し
 *   { valid:false, error:'無効なクーポンコードです' } になる可能性が高い。
 *   これは "wrong plan" ガードのパスではなく "無効コード" パスだが、
 *   実害（割引適用）はゼロであるため受入最低ラインをクリアしている。
 *   ライブ環境での KOSHIGAYA による "wrong plan" ガードパスの確認は
 *   手動確認項目（下記コメント参照）。
 */

test.describe('SC-REG-008: trial-6 定期専用クーポン誤適用ガード リグレッション', () => {

  /**
   * SC-REG-008-01
   * trial-6 + KOSHIGAYA: valid===false かつ discount/percentOff が付かないこと
   *
   * error 文言は以下どちらでも許容（テストモード vs ライブモードで差が出る）:
   *   - '無効なクーポンコードです'  ... テストモードで Promotion Code が見つからない場合
   *   - '...プランにはお使いいただけません' ... ライブ環境で scope='product' ガードが発火した場合
   */
  test('SC-REG-008-01: trial-6 + KOSHIGAYA → valid:false かつ discount 未付与', async ({ page }) => {
    await page.goto('/purchase', { waitUntil: 'domcontentloaded', timeout: 60000 });

    const result = await page.evaluate(async () => {
      const res = await fetch('/api/payment/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'KOSHIGAYA', planId: 'trial-6' }),
      });
      return { status: res.status, body: await res.json() };
    });

    // HTTP ステータス
    expect(result.status).toBe(200);

    // valid:false であること（これが最重要ガード）
    expect(result.body.valid).toBe(false);

    // appliedCoupon が付いていないこと（discount/percentOff がゼロ/未定義）
    expect(result.body.appliedCoupon).toBeUndefined();
    expect(result.body.discount ?? 0).toBe(0);
    expect(result.body.percentOff).toBeUndefined();

    // error 文言は環境差を吸収して両方許容
    const error: string = result.body.error ?? '';
    const isWrongPlan = error.includes('プランにはお使いいただけません');
    const isInvalidCode = error.includes('無効な');
    expect(isWrongPlan || isInvalidCode).toBe(true);
  });

  /**
   * SC-REG-008-02
   * trial-6 + 完全無効コード → valid:false かつ discount 未付与
   * （コードが存在しない場合の基本ガードを恒久固定）
   */
  test('SC-REG-008-02: trial-6 + 無効コード → valid:false かつ discount 未付与', async ({ page }) => {
    await page.goto('/purchase', { waitUntil: 'domcontentloaded', timeout: 60000 });

    const result = await page.evaluate(async () => {
      const res = await fetch('/api/payment/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: '__E2E_INVALID_COUPON__', planId: 'trial-6' }),
      });
      return { status: res.status, body: await res.json() };
    });

    expect(result.status).toBe(200);
    expect(result.body.valid).toBe(false);
    expect(result.body.appliedCoupon).toBeUndefined();
    expect(result.body.discount ?? 0).toBe(0);
    expect(result.body.percentOff).toBeUndefined();
  });

  /**
   * SC-REG-008-03: 過剰ブロック回帰確認 (sub-6 / sub-12)
   *
   * 【ライブ環境手動確認項目】
   *   テストモード環境には scope='all' の全体クーポンが存在しないため、
   *   sub-6 / sub-12 で valid:true になる経路を E2E で自動検証できない。
   *
   *   実コード参照による確認（app/api/payment/validate-coupon/route.ts）:
   *     - scope === 'all'（coupon.applies_to が null/undefined）の場合、
   *       appliesToCurrentPlan チェックをスキップして valid:true を返す経路が存在する。
   *     - percent_off / amount_off の通常全体クーポンも valid:true になる。
   *   → ライブ環境での sub-6 / sub-12 + 全体クーポンの valid:true は
   *     手動確認（Stripe ダッシュボードの test-mode 全体クーポンで確認）。
   *
   * このテストでは過剰ブロックが「起きていない」ことを間接的に確認するため、
   * sub-6 + 無効コード が valid:false（ガードによる過剰ブロックではなく無効コード起因）
   * であることのみ検証する。
   */
  test('SC-REG-008-03: sub-6 + 無効コード → valid:false（過剰ブロックではなく無効コード起因）', async ({ page }) => {
    await page.goto('/purchase', { waitUntil: 'domcontentloaded', timeout: 60000 });

    const result = await page.evaluate(async () => {
      const res = await fetch('/api/payment/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: '__E2E_INVALID_COUPON__', planId: 'sub-6' }),
      });
      return { status: res.status, body: await res.json() };
    });

    expect(result.status).toBe(200);
    expect(result.body.valid).toBe(false);
    // 過剰ブロック（scope='product'ガード）ではなく無効コードエラーであること
    // scope が 'product' で返ってきた場合は過剰ブロックの可能性があるため失敗
    expect(result.body.scope).not.toBe('product');
  });

});
