import { randomUUID } from 'crypto';
import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import {
  withAuthDynamic,
  jsonSuccess,
  jsonBadRequest,
  jsonNotFound,
  handleSupabaseError,
} from '@/lib/api-helpers';
import { isValidShareLinkSlug } from '@/lib/share-link-slug';
import { SHARE_PHOTO_BUCKET } from '@/lib/share-storage';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB (DSLR の RAW JPEG 想定)
const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
]);

/**
 * POST: 写真1枚分のアップロードを Supabase Storage 直送で行うための署名URLを発行
 * Body: { filename: string, mime_type: string, size_bytes: number }
 * Returns: { signed_url, token, file_path }
 *
 * クライアントは返ってきた signed_url に PUT で本体を直接送り、
 * 成功したら /confirm を呼んで photos テーブルに登録する。
 */
export const POST = withAuthDynamic(async (request: NextRequest, context) => {
  const { slug } = await context.params;
  if (!isValidShareLinkSlug(slug)) return jsonBadRequest('slug の形式が不正です');

  const body = await request.json().catch(() => ({}));
  const filename = typeof body?.filename === 'string' ? body.filename : '';
  const mimeType = typeof body?.mime_type === 'string' ? body.mime_type : '';
  const sizeBytes = typeof body?.size_bytes === 'number' ? body.size_bytes : 0;

  if (!filename) return jsonBadRequest('filename は必須です');
  if (sizeBytes <= 0) return jsonBadRequest('size_bytes が不正です');
  if (sizeBytes > MAX_FILE_SIZE) {
    return jsonBadRequest(`サイズが上限 ${MAX_FILE_SIZE / 1024 / 1024}MB を超えています`);
  }
  if (mimeType && !ALLOWED_MIME.has(mimeType)) {
    return jsonBadRequest(`許可されていない形式 (${mimeType})`);
  }

  const supabase = createServerClient() as any;

  const { data: link, error: linkErr } = await supabase
    .from('share_links')
    .select('id, slug')
    .eq('slug', slug)
    .maybeSingle();
  if (linkErr) return handleSupabaseError(linkErr, '共有リンク取得');
  if (!link) return jsonNotFound('共有リンクが見つかりません');

  // 推測不能なファイルパス（slug/uuid.ext）
  const ext = (filename.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const filePath = `${link.slug}/${randomUUID()}.${ext}`;

  const { data, error } = await supabase.storage
    .from(SHARE_PHOTO_BUCKET)
    .createSignedUploadUrl(filePath);

  if (error || !data) {
    console.error('createSignedUploadUrl error:', error);
    return jsonBadRequest('署名URLの発行に失敗しました');
  }

  return jsonSuccess({
    signed_url: data.signedUrl,
    token: data.token,
    file_path: filePath,
  });
});
