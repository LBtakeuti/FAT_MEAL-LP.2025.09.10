/**
 * 営業日計算ユーティリティ。
 * 土日・日本の祝日を除いた平日を「営業日」として扱う。
 */

export const JAPANESE_HOLIDAYS: string[] = [
  // 2024年
  '2024-01-01', '2024-01-08', '2024-02-11', '2024-02-12', '2024-02-23',
  '2024-03-20', '2024-04-29', '2024-05-03', '2024-05-04', '2024-05-05',
  '2024-05-06', '2024-07-15', '2024-08-11', '2024-08-12', '2024-09-16',
  '2024-09-22', '2024-09-23', '2024-10-14', '2024-11-03', '2024-11-04',
  '2024-11-23', '2024-12-23',
  // 2025年
  '2025-01-01', '2025-01-13', '2025-02-11', '2025-02-23', '2025-02-24',
  '2025-03-20', '2025-04-29', '2025-05-03', '2025-05-04', '2025-05-05',
  '2025-05-06', '2025-07-21', '2025-08-11', '2025-09-15', '2025-09-23',
  '2025-10-13', '2025-11-03', '2025-11-23', '2025-11-24',
  // 2026年
  '2026-01-01', '2026-01-12', '2026-02-11', '2026-02-23', '2026-03-20',
  '2026-04-29', '2026-05-03', '2026-05-04', '2026-05-05', '2026-05-06',
  '2026-07-20', '2026-08-11', '2026-09-21', '2026-09-22', '2026-09-23',
  '2026-10-12', '2026-11-03', '2026-11-23',
];

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 営業日（土日・祝日を除く平日）なら true を返す。 */
export function isBusinessDay(date: Date): boolean {
  const day = date.getDay();
  if (day === 0 || day === 6) return false;
  return !JAPANESE_HOLIDAYS.includes(toDateKey(date));
}

/** `date` から n 営業日後の日付を返す。n=0 のときは date 自身を返す。 */
export function addBusinessDays(date: Date, n: number): Date {
  const result = new Date(date);
  if (n <= 0) return result;
  let remaining = n;
  while (remaining > 0) {
    result.setDate(result.getDate() + 1);
    if (isBusinessDay(result)) remaining -= 1;
  }
  return result;
}

/**
 * 購入日から「4営業日後 〜 +6日（min 含めて7日間）」の配送可能範囲を返す。
 * min は営業日制約を満たすが、min〜max の途中に土日・祝日があっても範囲には含める。
 */
export function getDeliveryDateRange(purchaseDate: Date): { min: Date; max: Date } {
  const min = addBusinessDays(purchaseDate, 4);
  const max = new Date(min);
  max.setDate(max.getDate() + 6);
  return { min, max };
}
