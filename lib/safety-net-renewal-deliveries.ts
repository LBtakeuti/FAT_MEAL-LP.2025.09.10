/**
 * 定期更新配送の「取りこぼし防止」安全網バッチ用の純粋ロジック。
 *
 * webhook（handleMonthlySubscriptionPayment）が invoice.payment_succeeded を
 * 取りこぼした場合に、毎日の cron で subscription_deliveries を補完するための判定・
 * 配送日計算をここに集約する（route から testable に切り出し）。
 *
 * 【二重作成しない根拠】
 * 1. 取りこぼし判定は scheduled_date ではなく stripe_invoice_id 単位で行う。
 *    既存 deliveries に同一 invoice.id があれば作成しない。
 * 2. 配送日（scheduled_date / preferred_delivery_date）は webhook と同一ロジックで計算する：
 *    - billingDate = その請求サイクルの開始日（invoice.lines.data[0].period.start）
 *    - preferred_delivery_date があれば inheritPreferredDateForBilling、無ければ
 *      calculateMonthlyDeliverySchedule の billingDate ベース。
 *    これにより webhook が作る値と完全一致し、希望日ありの会員でも二重作成しない。
 */
import {
  calculateMonthlyDeliverySchedule,
  getMenuSetNameWithDeliveryNumber,
  getPlanConfig,
  inheritPreferredDateForBilling,
} from './subscription-schedule';

/** Stripe invoice から判定に必要な値だけを抜き出した入力 */
export interface CycleInvoiceInput {
  id: string;
  billingReason: string | null;
  status: string | null;
  /** この invoice が属する Stripe subscription ID */
  subscriptionId: string | null;
  /** その請求サイクルの開始日（unix 秒、invoice.lines.data[0].period.start） */
  periodStartUnix: number;
  amountPaid: number;
}

/** subscription_deliveries に insert する 1 行（webhook と同一構成） */
export interface RenewalDeliveryRow {
  subscription_id: string;
  scheduled_date: string;
  preferred_delivery_date: string;
  menu_set: string;
  meals_per_delivery: number;
  quantity: number;
  status: 'pending';
  stripe_invoice_id: string;
  customer_email: string;
}

/** 作成対象として確定した取りこぼし invoice と算出済みの配送日 */
export interface MissedRenewal {
  invoiceId: string;
  periodStartUnix: number;
  amountPaid: number;
  scheduledDate: string;
  row: RenewalDeliveryRow;
}

/**
 * webhook と同一ロジックで配送日（YYYY-MM-DD）を算出する。
 * - preferred があれば inheritPreferredDateForBilling（課金日以降で最も早い希望日）
 * - 無ければ calculateMonthlyDeliverySchedule の billingDate ベース（旧プラン挙動）
 */
export function computeRenewalScheduledDate(
  planId: string,
  preferred: string | null | undefined,
  periodStartUnix: number,
): string {
  const billingDate = new Date(periodStartUnix * 1000);
  if (preferred) {
    const inherited = inheritPreferredDateForBilling(preferred, billingDate);
    if (inherited) return inherited;
  }
  return calculateMonthlyDeliverySchedule(planId, billingDate)[0].scheduled_date
    .toISOString()
    .split('T')[0];
}

export interface BuildMissedRenewalsParams {
  subscriptionDbId: string;
  stripeSubscriptionId: string;
  planId: string;
  preferred: string | null | undefined;
  customerEmail: string;
  invoices: CycleInvoiceInput[];
  /** 既存 subscription_deliveries の stripe_invoice_id（非 null）集合 */
  existingInvoiceIds: Set<string>;
}

/**
 * 取りこぼした subscription_cycle invoice を抽出し、作成すべき delivery 行を組み立てる。
 *
 * 判定:
 * - billingReason === 'subscription_cycle' かつ status === 'paid' のみ対象
 *   （subscription_create / manual 等は対象外）
 * - 当該サブスクの invoice のみ（subscriptionId 一致）
 * - 既存 deliveries に同一 invoice.id があればスキップ（= 二重作成防止）
 */
export function buildMissedRenewals(params: BuildMissedRenewalsParams): MissedRenewal[] {
  const {
    subscriptionDbId,
    stripeSubscriptionId,
    planId,
    preferred,
    customerEmail,
    invoices,
    existingInvoiceIds,
  } = params;

  const planConfig = getPlanConfig(planId);
  const menuSet = getMenuSetNameWithDeliveryNumber(planId, 1);

  const missed: MissedRenewal[] = [];

  for (const inv of invoices) {
    if (inv.billingReason !== 'subscription_cycle') continue;
    if (inv.status !== 'paid') continue;
    if (inv.subscriptionId !== stripeSubscriptionId) continue;
    if (!inv.id) continue;
    if (existingInvoiceIds.has(inv.id)) continue;

    const scheduledDate = computeRenewalScheduledDate(planId, preferred, inv.periodStartUnix);

    const row: RenewalDeliveryRow = {
      subscription_id: subscriptionDbId,
      scheduled_date: scheduledDate,
      preferred_delivery_date: scheduledDate,
      menu_set: menuSet,
      meals_per_delivery: planConfig.meals_per_delivery,
      quantity: 1,
      status: 'pending',
      stripe_invoice_id: inv.id,
      customer_email: customerEmail,
    };

    missed.push({
      invoiceId: inv.id,
      periodStartUnix: inv.periodStartUnix,
      amountPaid: inv.amountPaid,
      scheduledDate,
      row,
    });
  }

  return missed;
}
