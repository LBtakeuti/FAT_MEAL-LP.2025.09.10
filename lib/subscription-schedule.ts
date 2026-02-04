/**
 * サブスクリプションプランの配送スケジュール計算（月額自動更新版）
 *
 * プラン構成:
 * - subscription-monthly-12: 月6食（月1回配送）¥9,780/月
 * - subscription-monthly-24: 月12食（月2回配送）¥18,600/月
 * - subscription-monthly-48: 月24食（月4回配送）¥34,800/月
 */

// サービス開始日（2月10日より前の注文は全てこの日に配送開始）
// TODO: 2月10日以降にこの特別処理を削除する
const SERVICE_LAUNCH_DATE = new Date('2025-02-10T00:00:00+09:00');

/**
 * サービス開始日より前かどうかを判定
 */
export function isBeforeLaunchDate(date: Date = new Date()): boolean {
  return date < SERVICE_LAUNCH_DATE;
}

/**
 * 配送基準日を取得（2月10日より前なら2月10日を返す）
 */
export function getEffectiveDeliveryDate(requestedDate: Date): Date {
  if (isBeforeLaunchDate(requestedDate)) {
    return new Date(SERVICE_LAUNCH_DATE);
  }
  return requestedDate;
}

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
    product_price: 14600,
    shipping_fee_per_delivery: 1500,
    monthly_total: 17600,
  },
  'subscription-monthly-48': {
    plan_id: 'subscription-monthly-48',
    meals_per_delivery: 12,
    deliveries_per_month: 4,
    product_price: 27800,
    shipping_fee_per_delivery: 1500,
    monthly_total: 33800,
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
 * 2月10日より前の注文は全て2月10日を配送基準日とする
 */
export function calculateInitialDeliverySchedule(
  planId: string,
  preferredDeliveryDate: Date
): DeliverySchedule[] {
  const config = PLAN_CONFIGS[planId];

  if (!config) {
    throw new Error(`Invalid plan ID: ${planId}`);
  }

  // 2月10日より前の場合は2月10日を配送基準日とする
  const effectiveDate = getEffectiveDeliveryDate(preferredDeliveryDate);

  const schedules: DeliverySchedule[] = [];

  if (config.deliveries_per_month === 1) {
    // 月1回配送
    schedules.push({
      delivery_number: 1,
      scheduled_date: effectiveDate,
      meals_per_delivery: 12,
    });
  } else if (config.deliveries_per_month === 2) {
    // 月2回配送: 基準日とその2週間後
    schedules.push({
      delivery_number: 1,
      scheduled_date: effectiveDate,
      meals_per_delivery: 12,
    });
    schedules.push({
      delivery_number: 2,
      scheduled_date: addDays(effectiveDate, 14),
      meals_per_delivery: 12,
    });
  } else if (config.deliveries_per_month === 4) {
    // 月4回配送: 基準日から1週間ごと
    for (let i = 0; i < 4; i++) {
      schedules.push({
        delivery_number: i + 1,
        scheduled_date: addDays(effectiveDate, 7 * i),
        meals_per_delivery: 12,
      });
    }
  }

  return schedules;
}

/**
 * 月次配送スケジュールを計算（毎月の請求成功時）
 * 請求日を基準に配送スケジュールを作成
 * 2月10日より前の場合は2月10日を配送基準日とする
 * - 6食: 基準日当日
 * - 12食: 基準日当日、+14日
 * - 24食: 基準日当日、+7日、+14日、+21日
 */
export function calculateMonthlyDeliverySchedule(
  planId: string,
  billingDate: Date // Stripeの請求日（current_period_start）
): DeliverySchedule[] {
  const config = PLAN_CONFIGS[planId];

  if (!config) {
    throw new Error(`Invalid plan ID: ${planId}`);
  }

  // 2月10日より前の場合は2月10日を配送基準日とする
  const effectiveDate = getEffectiveDeliveryDate(billingDate);

  const schedules: DeliverySchedule[] = [];

  if (config.deliveries_per_month === 1) {
    // 月1回配送: 基準日当日
    schedules.push({
      delivery_number: 1,
      scheduled_date: effectiveDate,
      meals_per_delivery: 12,
    });
  } else if (config.deliveries_per_month === 2) {
    // 月2回配送: 基準日当日と2週間後
    schedules.push({
      delivery_number: 1,
      scheduled_date: effectiveDate,
      meals_per_delivery: 12,
    });
    schedules.push({
      delivery_number: 2,
      scheduled_date: addDays(effectiveDate, 14),
      meals_per_delivery: 12,
    });
  } else if (config.deliveries_per_month === 4) {
    // 月4回配送: 基準日当日から1週間ごと
    for (let i = 0; i < 4; i++) {
      schedules.push({
        delivery_number: i + 1,
        scheduled_date: addDays(effectiveDate, 7 * i),
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
    'subscription-monthly-12': 'ふとるめし6食 月額プラン',
    'subscription-monthly-24': 'ふとるめし12食 月額プラン',
    'subscription-monthly-48': 'ふとるめし24食 月額プラン',
  };
  return planNames[planId] || 'ふとるめし月額プラン';
}

/**
 * プランIDからメニューセット名を取得
 */
export function getMenuSetName(planId: string): string {
  const menuSetNames: { [key: string]: string } = {
    'subscription-monthly-12': 'ふとるめし6食セット',
    'subscription-monthly-24': 'ふとるめし12食セット',
    'subscription-monthly-48': 'ふとるめし24食セット',
  };
  return menuSetNames[planId] || 'ふとるめしセット';
}

/**
 * プランIDと配送回数からメニューセット名（配送回数付き）を取得
 * 例: 24食プラン 1回目 → 「ふとるめし24食セット 1回目」
 */
export function getMenuSetNameWithDeliveryNumber(planId: string, deliveryNumber: number): string {
  const baseName = getMenuSetName(planId);
  return `${baseName} ${deliveryNumber}回目`;
}

/**
 * プランIDが有効かどうかを確認
 */
export function isValidPlanId(planId: string): boolean {
  return planId in PLAN_CONFIGS;
}
