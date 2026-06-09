/**
 * F45: Open redirect 対策ヘルパー
 *
 * 攻撃シナリオ:
 *   /login?redirect=https://evil.example.com のようなリンクを攻撃者が拡散し、
 *   ログイン成功後にユーザーを悪意あるサイトへ誘導する。
 *
 * 安全と判定する値:
 *   - "/" 始まりの相対パス（例: "/", "/purchase", "/admin?foo=bar"）
 *
 * 安全でないと判定する値:
 *   - 絶対URL（http://, https://, javascript:, data: 等）
 *   - protocol-relative URL（// 始まり、///始まりを含む）
 *   - 相対パス（"/" で始まらないもの）
 *   - null / undefined / 空文字
 */
export function isSafeRedirect(value: string | null | undefined): boolean {
  if (!value) return false;
  // 絶対URL（http/https/ftp/javascript/data 等のスキーム付き）を除外
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return false;
  // protocol-relative URL（//evil.com, ///evil.com 等）を除外
  if (value.startsWith('//')) return false;
  // F45-fix: バックスラッシュを含む値を除外。
  // WHATWG URL パーサーはバックスラッシュをスラッシュに正規化するため、
  //   "/\\evil.com" は new URL で "https://evil.com/" として解釈される（外部ドメイン）。
  // 安全側に倒し、相対パスとして妥当でないバックスラッシュ含みは一律拒否する。
  if (value.includes('\\')) return false;
  // / 始まりの相対パスのみ許可
  if (!value.startsWith('/')) return false;
  return true;
}

/**
 * 安全な redirect 値のみ通し、不正な値はフォールバックに置き換える。
 */
export function sanitizeRedirect(value: string | null | undefined, fallback = '/'): string {
  return isSafeRedirect(value) ? (value as string) : fallback;
}
