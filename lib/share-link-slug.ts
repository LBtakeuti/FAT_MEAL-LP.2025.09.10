import { randomBytes } from 'crypto';

const SLUG_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

/**
 * 推測されにくい slug を CSPRNG で生成する。
 * デフォルト 8 文字（56^8 ≒ 9.6T パターン）。
 */
export function generateShareLinkSlug(length: number = 8): string {
  const bytes = randomBytes(length);
  let slug = '';
  for (let i = 0; i < length; i++) {
    slug += SLUG_CHARS.charAt(bytes[i] % SLUG_CHARS.length);
  }
  return slug;
}

/**
 * slug のフォーマット：
 * - 6〜64文字
 * - 英数字とハイフンのみ
 * - 先頭・末尾は英数字（ハイフン NG）
 * - 連続するハイフンは禁止
 *
 * 自動生成は CSPRNG で紛らわしい文字を除いた英数字8文字、
 * 管理者指定はこのパターン内でハイフンも可（例: `saitama-koukou-2026`）。
 */
export const SHARE_LINK_SLUG_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?!-)){4,62}[A-Za-z0-9]$/;

export function isValidShareLinkSlug(slug: string): boolean {
  return SHARE_LINK_SLUG_PATTERN.test(slug);
}

/** 管理者入力 slug を正規化（trim・前後空白除去）。空なら null（自動生成希望） */
export function normalizeManualSlug(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  return trimmed === '' ? null : trimmed;
}
