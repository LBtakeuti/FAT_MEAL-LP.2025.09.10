/**
 * F11: プラン表示名の単一の真実源（Single Source of Truth）。
 *
 * CSV / 管理画面 / メール などのすべてのプラン表記をこのヘルパー経由にすることで
 * 表記揺れを防ぐ。業務ルール（F11 で確定）:
 *   - trial-6                  → 「ふとるめし お試し6食セット」
 *   - sub-6                    → 「【定期】ふとるめし6食」
 *   - sub-12                   → 「【定期】ふとるめし12食」
 *   - subscription-monthly-12  → 「【定期】ふとるめし12食」（旧プランも統一）
 *   - 旧 6 食系（subscription-monthly-6, plan-6, monthly-6）→ 「【定期】ふとるめし6食」
 *   - 旧 12 食系（plan-12, monthly-12）→ 「【定期】ふとるめし12食」
 *   - 旧 18 食系（plan-18）→ 「【定期】ふとるめし18食」
 *   - 未知の planId は fallback（指定がなければ「ふとるめしプラン」）
 *
 * 「N回目」「× 数量」「（X個）」などの装飾は付けない。数量・配送回数は
 * 別カラム/別表示で扱う方針。
 */

const PLAN_LABELS: Record<string, string> = {
  // 現役
  'trial-6': 'ふとるめし お試し6食セット',
  'sub-6': '【定期】ふとるめし6食',
  'sub-12': '【定期】ふとるめし12食',
  // 旧プラン体系（既存契約者の継続処理用に表示は新表記へ統一）
  'subscription-monthly-12': '【定期】ふとるめし12食',
  'subscription-monthly-6': '【定期】ふとるめし6食',
  'monthly-12': '【定期】ふとるめし12食',
  'monthly-6': '【定期】ふとるめし6食',
  'plan-6': '【定期】ふとるめし6食',
  'plan-12': '【定期】ふとるめし12食',
  'plan-18': '【定期】ふとるめし18食',
};

/**
 * planId からユーザー向けプラン表示名を返す。
 *
 * @param planId Stripe metadata / DB の plan_id（既存・旧プランID も含む）
 * @param fallback 未知 planId のときの戻り値。省略時は「ふとるめしプラン」
 */
export function getPlanDisplayName(
  planId: string | null | undefined,
  fallback: string = 'ふとるめしプラン',
): string {
  if (!planId) return fallback;
  return PLAN_LABELS[planId] ?? fallback;
}
