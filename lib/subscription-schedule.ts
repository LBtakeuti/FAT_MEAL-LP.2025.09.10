/**
 * サブスクリプションプランの配送スケジュール計算（月額自動更新版）
 * 
 * プラン構成:
 * - subscription-monthly-12: 月12食（月1回配送）¥9,780/月
 * - subscription-monthly-24: 月24食（月2回配送）¥18,600/月
 * - subscription-monthly-48: 月48食（月4回配送）¥34,800/月
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
}

export const PLAN_CONFIGS: { [key: string]: PlanConfig } = {
  'subscription-monthly-12': {
    plan_id: 'subscription-monthly-12',
    meals_per_delivery: 12,
    deliveries_per_month: 1,
    product_price: 8280,
    shipping_fee_per_delivery: 1500,
    monthly_total: 9780,
  },
  'subscription-monthly-24': {
    plan_id: 'subscription-monthly-24',
    meals_per_delivery: 12,
    deliveries_per_month: 2,
    product_price: 15600,
    shipping_fee_per_delivery: 1500,
    monthly_total: 18600,
  },
  'subscription-monthly-48': {
    plan_id: 'subscription-monthly-48',
    meals_per_delivery: 12,
    deliveries_per_month: 4,
    product_price: 28800,
    shipping_fee_per_delivery: 1500,
    monthly_total: 34800,
  },
};

/**
 * 日付に日数を追加
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * 初回配送スケジュールを計算（購入時のみ）
 */
export function calculateInitialDeliverySchedule(
  planId: string,
  preferredDeliveryDate: Date
): DeliverySchedule[] {
  const config = PLAN_CONFIGS[planId];
  
  if (!config) {
    throw new Error(`Invalid plan ID: ${planId}`);
  }
  
  const schedules: DeliverySchedule[] = [];
  
  if (config.deliveries_per_month === 1) {
    // 月1回配送
    schedules.push({
      delivery_number: 1,
      scheduled_date: preferredDeliveryDate,
      meals_per_delivery: 12,
    });
  } else if (config.deliveries_per_month === 2) {
    // 月2回配送: 希望日とその2週間後
    schedules.push({
      delivery_number: 1,
      scheduled_date: preferredDeliveryDate,
      meals_per_delivery: 12,
    });
    schedules.push({
      delivery_number: 2,
      scheduled_date: addDays(preferredDeliveryDate, 14),
      meals_per_delivery: 12,
    });
  } else if (config.deliveries_per_month === 4) {
    // 月4回配送: 希望日から1週間ごと
    for (let i = 0; i < 4; i++) {
      schedules.push({
        delivery_number: i + 1,
        scheduled_date: addDays(preferredDeliveryDate, 7 * i),
        meals_per_delivery: 12,
      });
    }
  }
  
  return schedules;
}

/**
 * 月次配送スケジュールを計算（毎月の請求成功時）
 */
export function calculateMonthlyDeliverySchedule(
  planId: string,
  billingDate: Date // Stripeの請求日（current_period_start）
): DeliverySchedule[] {
  const config = PLAN_CONFIGS[planId];
  
  if (!config) {
    throw new Error(`Invalid plan ID: ${planId}`);
  }
  
  const schedules: DeliverySchedule[] = [];
  
  if (config.deliveries_per_month === 1) {
    // 月1回配送: 請求日から1週間後
    schedules.push({
      delivery_number: 1,
      scheduled_date: addDays(billingDate, 7),
      meals_per_delivery: 12,
    });
  } else if (config.deliveries_per_month === 2) {
    // 月2回配送: 請求日から1週間後と2週間後
    schedules.push({
      delivery_number: 1,
      scheduled_date: addDays(billingDate, 7),
      meals_per_delivery: 12,
    });
    schedules.push({
      delivery_number: 2,
      scheduled_date: addDays(billingDate, 14),
      meals_per_delivery: 12,
    });
  } else if (config.deliveries_per_month === 4) {
    // 月4回配送: 請求日から1週間ごと
    for (let i = 0; i < 4; i++) {
      schedules.push({
        delivery_number: i + 1,
        scheduled_date: addDays(billingDate, 7 * (i + 1)),
        meals_per_delivery: 12,
      });
    }
  }
  
  return schedules;
}

/**
 * プランIDからプラン設定を取得
 */
export function getPlanConfig(planId: string): PlanConfig {
  const config = PLAN_CONFIGS[planId];
  if (!config) {
    throw new Error(`Invalid plan ID: ${planId}`);
  }
  return config;
}

/**
 * プランIDからプラン名を取得
 */
export function getPlanName(planId: string): string {
  const planNames: { [key: string]: string } = {
    'subscription-monthly-12': 'ふとるめし12食 月額プラン',
    'subscription-monthly-24': 'ふとるめし24食 月額プラン',
    'subscription-monthly-48': 'ふとるめし48食 月額プラン',
  };
  return planNames[planId] || 'ふとるめし月額プラン';
}

/**
 * プランIDからメニューセット名を取得
 */
export function getMenuSetName(planId: string): string {
  // すべてのプランで12食セットを配送
  return 'ふとるめし12食セット';
}

/**
 * プランIDが有効かどうかを確認
 */
export function isValidPlanId(planId: string): boolean {
  return planId in PLAN_CONFIGS;
}
