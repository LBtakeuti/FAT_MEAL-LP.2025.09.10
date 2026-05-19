import sanitizeHtml from 'sanitize-html';

const BODY_ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 's',
  'a', 'h1', 'h2', 'h3',
  'ul', 'ol', 'li',
  'blockquote', 'code', 'pre',
];

const BODY_ALLOWED_ATTRIBUTES: sanitizeHtml.IOptions['allowedAttributes'] = {
  a: ['href', 'target', 'rel'],
};

const BODY_ALLOWED_SCHEMES = ['http', 'https', 'mailto', 'tel'];

/** body_html を安全にサニタイズ */
export function sanitizeShareLinkBody(html: unknown): string {
  if (typeof html !== 'string' || html.trim() === '') return '';
  return sanitizeHtml(html, {
    allowedTags: BODY_ALLOWED_TAGS,
    allowedAttributes: BODY_ALLOWED_ATTRIBUTES,
    allowedSchemes: BODY_ALLOWED_SCHEMES,
  });
}

export interface NormalizedExpiresAt {
  ok: true;
  value: string | null;
}

export interface ExpiresAtError {
  ok: false;
  message: string;
}

/**
 * expires_at の入力を正規化する（POST/PUT で共通利用）。
 * - undefined / null / '' → null（無期限）
 * - 文字列で ISO8601 として解釈可能 → ISO 文字列
 * - 過去日時 → エラー
 */
export function normalizeExpiresAt(input: unknown): NormalizedExpiresAt | ExpiresAtError {
  if (input === undefined || input === null || input === '') {
    return { ok: true, value: null };
  }
  if (typeof input !== 'string') {
    return { ok: false, message: 'expires_at は ISO8601 文字列を指定してください' };
  }
  const ts = Date.parse(input);
  if (Number.isNaN(ts)) {
    return { ok: false, message: 'expires_at の形式が不正です' };
  }
  if (ts < Date.now()) {
    return { ok: false, message: '有効期限は現在より後の日時を指定してください' };
  }
  return { ok: true, value: new Date(ts).toISOString() };
}

/** title の入力を正規化（空文字 → null） */
export function normalizeTitle(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  return trimmed === '' ? null : trimmed.slice(0, 120);
}

/** label の入力を正規化（空文字 → null） */
export function normalizeLabel(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  return trimmed === '' ? null : trimmed.slice(0, 120);
}
