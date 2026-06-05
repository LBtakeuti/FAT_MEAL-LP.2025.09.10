/**
 * プラン定義と配送スケジュール計算（月1回配送・段階割引なし）
 *
 * プラン構成:
 * - trial-6: お試しプラン（買い切り）6食 ¥5,700（商品¥4,200 + 送料¥1,500）
 * - sub-6: ふとるめしセット（6食）¥5,100/月（商品¥3,600 + 送料¥1,500、1食¥600）
 * - sub-12: ダブルふとるめセット（12食）¥8,100/月（商品¥6,600 + 送料¥1,500、1食¥550）
 *
 * Legacy（既存契約者のみ・新規発行なし）:
 * - subscription-monthly-12: 旧12食月額プラン。Stripe Subscription Schedule で
 *   Phase1 → Phase2 に移行済みの既存契約用。新規購入は sub-12 を使用する。
 */

import { getPlanDisplayName } from './plan-labels';

export interface DeliverySchedule {
  delivery_number: number;
  scheduled_date: Date;
  meals_per_delivery: number;
}

export interface PlanConfig {
  plan_id: string;
  meals_per_delivery: number;
  deliveries_per_month: number;
  product_price: number;
  shipping_fee_per_delivery: number;
  monthly_total: number;
  monthly_shipping_fee?: number;
  anchor_price?: number;
}

export const PLAN_CONFIGS: { [key: string]: PlanConfig } = {
  'trial-6': {
    plan_id: 'trial-6',
    meals_per_delivery: 6,
    deliveries_per_month: 1,
    product_price: 4200,
    shipping_fee_per_delivery: 1500,
    monthly_shipping_fee: 1500,
    monthly_total: 5700,
  },
  'sub-6': {
    plan_id: 'sub-6',
    meals_per_delivery: 6,
    deliveries_per_month: 1,
    product_price: 3600,           // ¥600 × 6個（F31で価格改定）
    shipping_fee_per_delivery: 1500,
    monthly_shipping_fee: 1500,
    monthly_total: 5100,           // 3600 + 1500
  },
  'sub-12': {
    plan_id: 'sub-12',
    meals_per_delivery: 12,
    deliveries_per_month: 1,
    product_price: 6600,           // ¥550 × 12個（F31で価格改定）
    shipping_fee_per_delivery: 1500,
    monthly_shipping_fee: 1500,
    monthly_total: 8100,           // 6600 + 1500
  },
  // Legacy: 既存契約者のみ対応（新規購入は sub-12 を使用）
  'subscription-monthly-12': {
    plan_id: 'subscription-monthly-12',
    meals_per_delivery: 12,
    deliveries_per_month: 1,
    product_price: 7650,           // Phase2価格（¥9,000 × 85%）
    shipping_fee_per_delivery: 1500,
    monthly_shipping_fee: 1500,
    monthly_total: 9150,
  },
};

/** 初回配送スケジュールを計算（購入時のみ・月1回配送固定） */
export function calculateInitialDeliverySchedule(
  planId: string,
  preferredDeliveryDate: Date
): DeliverySchedule[] {
  const config = PLAN_CONFIGS[planId];

  if (!config) {
    throw new Error(`Invalid plan ID: ${planId}`);
  }

  return [
    {
      delivery_number: 1,
      scheduled_date: preferredDeliveryDate,
      meals_per_delivery: config.meals_per_delivery,
    },
  ];
}

/** 月次配送スケジュールを計算（毎月の請求成功時・月1回配送固定） */
export function calculateMonthlyDeliverySchedule(
  planId: string,
  billingDate: Date
): DeliverySchedule[] {
  const config = PLAN_CONFIGS[planId];

  if (!config) {
    throw new Error(`Invalid plan ID: ${planId}`);
  }

  return [
    {
      delivery_number: 1,
      scheduled_date: billingDate,
      meals_per_delivery: config.meals_per_delivery,
    },
  ];
}

/** プランIDからプラン設定を取得 */
export function getPlanConfig(planId: string): PlanConfig {
  const config = PLAN_CONFIGS[planId];
  if (!config) {
    throw new Error(`Invalid plan ID: ${planId}`);
  }
  return config;
}

/**
 * プランIDからユーザー向け表示名を取得（F11 で plan-labels ヘルパーに統一）。
 *
 * 旧シグネチャを残しているのは Stripe Webhook / メール本文の呼び出し元の互換性のため。
 * 内部実装は lib/plan-labels.ts の getPlanDisplayName に委譲する。
 */
export function getPlanName(planId: string): string {
  return getPlanDisplayName(planId);
}

/**
 * メニューセット名（配送回数付き）を取得。
 * F11 で「N回目」表記を撤廃し、プラン名のみを返す。
 * 引数 _deliveryNumber は呼び出し側互換維持のため残置（未使用）。
 */
export function getMenuSetNameWithDeliveryNumber(planId: string, _deliveryNumber: number): string {
  return getPlanDisplayName(planId);
}

/** プランIDが有効かどうかを確認（legacy ID も valid 扱い） */
export function isValidPlanId(planId: string): boolean {
  return planId in PLAN_CONFIGS;
}

/**
 * F9-1: 初回購入時の希望日（preferred_delivery_date）を 2回目以降の請求月に継承する。
 *
 * - `preferred` の「日（day-of-month）」を抽出し、`billingDate` の年月に当てはめた YYYY-MM-DD を返す
 * - 当該月に同じ日が存在しない場合（例: 1/31 → 2/28、3/31 → 4/30）はその月の月末日へ丸める
 * - `preferred` は "YYYY-MM-DD" 形式の文字列を想定。形式不正の場合は null を返す
 * - 戻り値は JST 想定の "YYYY-MM-DD"（時刻成分なし）
 */
export function inheritPreferredDateForBilling(
  preferred: string,
  billingDate: Date,
): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(preferred);
  if (!m) return null;
  const preferredDay = parseInt(m[3], 10);
  if (!Number.isFinite(preferredDay) || preferredDay < 1 || preferredDay > 31) return null;

  // billingDate を JST 換算してから年月を取り出す（UTC のまま使うと境界日でズレる可能性があるため）
  const jst = new Date(billingDate.getTime() + 9 * 60 * 60 * 1000);
  const year = jst.getUTCFullYear();
  const month = jst.getUTCMonth(); // 0-11
  // 月末日: 翌月の 0 日 = 当月末日
  const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const day = Math.min(preferredDay, lastDayOfMonth);

  const y = String(year);
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${y}-${mm}-${dd}`;
}
