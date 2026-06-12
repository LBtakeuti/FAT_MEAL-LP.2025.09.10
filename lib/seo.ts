/**
 * SEO-S3: メタ情報・構造化データ（JSON-LD）の共通ユーティリティ。
 *
 * - SITE_URL: 環境変数 NEXT_PUBLIC_SITE_URL を origin として使用（sitemap/robots と同値）。
 * - toSafeJsonLd: JSON.stringify は < > & をエスケープしないため、
 *   タイトル等に "</script>" が含まれると </script> インジェクションで XSS が成立する。
 *   < > & を Unicode エスケープして安全な JSON 文字列に変換する
 *   （blog/[slug]・トップ FAQPage と同一方針を共通化）。
 */

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.futorumeshi.com';

/** サイト共通のフォールバック OG 画像（横長専用画像が用意できるまでの暫定）。 */
export const DEFAULT_OG_IMAGE = '/images/branding/new-fabicon.png';

export function toSafeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}
