/**
 * F26: ダッシュボード集計から除外するメールアドレス（テスト/管理者の購入）
 *
 * Supabase の .in() / .not('column', 'in', '(...)') 用に CSV と配列の両形式を export する。
 *
 * 適用先:
 *  - orders.customer_email
 *  - subscriptions.shipping_address->>'email'
 */
export const EXCLUDED_DASHBOARD_EMAILS = [
  'takeuchi@landbridge.co.jp',
  'sales@landbridge.co.jp',
  'mimori@landbridge.co.jp',
] as const;

/**
 * Supabase の .not('column', 'in', value) に渡すための括弧つき CSV を返す。
 * 例: '(a@x.com,b@x.com)'
 */
export function excludedEmailsAsCsv(): string {
  return `(${EXCLUDED_DASHBOARD_EMAILS.join(',')})`;
}

/**
 * 配列ヘルパー: JS 側で除外したいケース用（Stripe 集計 / shipping_address 経由など）。
 */
export function isExcludedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return (EXCLUDED_DASHBOARD_EMAILS as readonly string[]).includes(email.toLowerCase());
}
