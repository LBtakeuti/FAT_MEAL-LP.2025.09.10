/**
 * 未来配送予測：アクティブな subscriptions から、まだ DB に作られていない
 * 未来サイクル分の subscription_deliveries を「仮想行」として算出する。
 *
 * 既存ロジック (lib/subscription-schedule.ts:calculateMonthlyDeliverySchedule) を
 * 流用して、各サイクル開始日 (current_period_end + n month) から配送日を導出する。
 */
import { calculateMonthlyDeliverySchedule, isValidPlanId, getMenuSetNameWithDeliveryNumber } from './subscription-schedule';

export interface PredictedDelivery {
  source: 'subscription';
  date: string; // YYYY-MM-DD
  customer_name: string;
  customer_email: string;
  phone: string;
  postal_code: string;
  prefecture: string;
  city: string;
  address_detail: string;
  building: string;
  plan_id: string;
  plan_name: string;
  menu_set: string;
  meals_per_delivery: number;
  quantity: number;
  status: 'predicted';
  subscription_id: string;
  predicted: true;
}

interface ActiveSubRow {
  id: string;
  stripe_subscription_id: string | null;
  plan_id: string;
  plan_name: string;
  current_period_end: string | null;
  shipping_address: {
    name?: string;
    email?: string;
    phone?: string;
    postal_code?: string;
    prefecture?: string;
    city?: string;
    address_detail?: string;
    building?: string;
  } | null;
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  const target = d.getMonth() + months;
  d.setMonth(target);
  if (d.getMonth() !== ((target % 12) + 12) % 12) {
    d.setDate(0);
  }
  return d;
}

/**
 * アクティブサブの予定を [from, to] の範囲で予測する。
 * @param activeSubs 取得済みアクティブサブの配列
 * @param existingDeliveryDatesBySubId 既に DB に存在する subscription_deliveries の日付 Set（subscription_id ごと）
 * @param from YYYY-MM-DD
 * @param to YYYY-MM-DD
 * @param maxCyclesPerSub 各サブで何サイクル先まで予測するか（デフォルト6＝半年先）
 */
export function predictDeliveries(
  activeSubs: ActiveSubRow[],
  existingDeliveryDatesBySubId: Map<string, Set<string>>,
  from: string,
  to: string,
  maxCyclesPerSub = 6,
): PredictedDelivery[] {
  const fromDate = new Date(from + 'T00:00:00');
  const toDate = new Date(to + 'T23:59:59');
  const out: PredictedDelivery[] = [];

  for (const sub of activeSubs) {
    if (!sub.plan_id || !isValidPlanId(sub.plan_id)) continue;
    if (!sub.current_period_end) continue;

    const periodEnd = new Date(sub.current_period_end);
    const existing = existingDeliveryDatesBySubId.get(sub.id) || new Set<string>();
    const addr = sub.shipping_address || {};

    // current_period_end の翌サイクル以降の N サイクルを生成
    for (let i = 1; i <= maxCyclesPerSub; i++) {
      const cycleStart = addMonths(periodEnd, i - 1); // i=1 で次サイクル先頭
      if (cycleStart > toDate) break; // 期間を超えたら終了

      const schedules = calculateMonthlyDeliverySchedule(sub.plan_id, cycleStart);
      for (const s of schedules) {
        if (s.scheduled_date < fromDate || s.scheduled_date > toDate) continue;
        const dateStr = ymd(s.scheduled_date);
        if (existing.has(dateStr)) continue; // 既に DB にあるならスキップ

        out.push({
          source: 'subscription',
          date: dateStr,
          customer_name: addr.name || 'お客様',
          customer_email: addr.email || '',
          phone: addr.phone || '',
          postal_code: addr.postal_code || '',
          prefecture: addr.prefecture || '',
          city: addr.city || '',
          address_detail: addr.address_detail || '',
          building: addr.building || '',
          plan_id: sub.plan_id,
          plan_name: sub.plan_name,
          menu_set: getMenuSetNameWithDeliveryNumber(sub.plan_id, s.delivery_number),
          meals_per_delivery: s.meals_per_delivery,
          quantity: 1,
          status: 'predicted',
          subscription_id: sub.id,
          predicted: true,
        });
      }
    }
  }

  return out;
}
