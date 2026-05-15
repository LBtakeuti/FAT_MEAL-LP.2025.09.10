/**
 * サブスクリプションプランの配送スケジュール計算（月額自動更新版）
 *
 * プラン構成（月1回配送・段階割引なし）:
 * - sub-6: 月6食 ¥4,500/月（商品¥3,000 + 送料¥1,500）
 * - sub-12: 月12食 ¥7,500/月（商品¥6,000 + 送料¥1,500）
 *
 * Legacy（既存契約者のみ・新規発行なし）:
 * - subscription-monthly-12: 月12食 ¥9,150/月（Phase2価格・商品¥7,650 + 送料¥1,500）
 *   Stripe Subscription Schedule で Phase1 → Phase2 移行済みの既存契約用。
 *   新規購入は sub-12 を使用する。
 */

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
  'sub-6': {
    plan_id: 'sub-6',
    meals_per_delivery: 6,
    deliveries_per_month: 1,
    product_price: 3000,           // ¥500 × 6個
    shipping_fee_per_delivery: 1500,
    monthly_shipping_fee: 1500,
    monthly_total: 4500,           // 3000 + 1500
  },
  'sub-12': {
    plan_id: 'sub-12',
    meals_per_delivery: 12,
    deliveries_per_month: 1,
    product_price: 6000,           // ¥500 × 12個
    shipping_fee_per_delivery: 1500,
    monthly_shipping_fee: 1500,
    monthly_total: 7500,           // 6000 + 1500
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
    anchor_price: 9000,
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

/** プランIDからプラン名を取得（legacy ID も含む） */
export function getPlanName(planId: string): string {
  const planNames: { [key: string]: string } = {
    'trial-6': 'お試しプラン',
    'sub-6': '6食プラン',
    'sub-12': '12食プラン',
    'subscription-monthly-12': '12食プラン（旧価格）',
  };
  return planNames[planId] || 'ふとるめし月額プラン';
}

/** プランIDからメニューセット名を取得 */
export function getMenuSetName(planId: string): string {
  const menuSetNames: { [key: string]: string } = {
    'trial-6': 'お試しプラン',
    'sub-6': '6食プラン',
    'sub-12': '12食プラン',
    'subscription-monthly-12': '12食プラン（旧価格）',
  };
  return menuSetNames[planId] || 'ふとるめしセット';
}

/**
 * メニューセット名（配送回数付き）を取得。
 * 月1回配送固定のため deliveryNumber は表示せず、プラン名のみを返す。
 * 引数は呼び出し側互換維持のため残置。
 */
export function getMenuSetNameWithDeliveryNumber(planId: string, _deliveryNumber: number): string {
  return getMenuSetName(planId);
}

/** プランIDが有効かどうかを確認（legacy ID も valid 扱い） */
export function isValidPlanId(planId: string): boolean {
  return planId in PLAN_CONFIGS;
}
