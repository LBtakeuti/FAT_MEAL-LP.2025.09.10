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
import { SHARE_PHOTO_BUCKET, getSharePhotoUrl } from '@/lib/share-storage';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
]);

interface UploadResult {
  id: string;
  filename: string;
  url: string;
}

interface UploadError {
  filename: string;
  message: string;
}

// POST: 写真アップロード（FormData / 複数枚対応・部分成功対応）
export const POST = withAuthDynamic(async (request: NextRequest, context) => {
  const { slug } = await context.params;
  if (!isValidShareLinkSlug(slug)) return jsonBadRequest('slug の形式が不正です');

  const supabase = createServerClient() as any;

  const { data: link, error: linkErr } = await supabase
    .from('share_links')
    .select('id, slug')
    .eq('slug', slug)
    .maybeSingle();
  if (linkErr) return handleSupabaseError(linkErr, '共有リンク取得');
  if (!link) return jsonNotFound('共有リンクが見つかりません');

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonBadRequest('FormData の解析に失敗しました');
  }

  const files = formData.getAll('files').filter((f): f is File => f instanceof File);
  if (files.length === 0) return jsonBadRequest('ファイルが選択されていません');

  const { data: lastSort } = await supabase
    .from('photos')
    .select('sort_order')
    .eq('share_link_id', link.id)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  let nextOrder = (lastSort?.sort_order ?? -1) + 1;

  const uploaded: UploadResult[] = [];
  const failures: UploadError[] = [];

  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      failures.push({ filename: file.name, message: `サイズが上限 ${MAX_FILE_SIZE / 1024 / 1024}MB を超えています` });
      continue;
    }
    if (file.type && !ALLOWED_MIME.has(file.type)) {
      failures.push({ filename: file.name, message: `許可されていない形式 (${file.type})` });
      continue;
    }

    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    // file_path は予測不能性が必要（バケットが public のため）。CSPRNG の UUID を採用。
    const safeName = `${randomUUID()}.${ext}`;
    const filePath = `${link.slug}/${safeName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: upErr } = await supabase.storage
      .from(SHARE_PHOTO_BUCKET)
      .upload(filePath, buffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'application/octet-stream',
      });

    if (upErr) {
      console.error('Storage upload error:', upErr);
      failures.push({ filename: file.name, message: 'アップロードに失敗しました' });
      continue;
    }

    const { data: insRow, error: insErr } = await supabase
      .from('photos')
      .insert({
        share_link_id: link.id,
        file_path: filePath,
        filename: file.name,
        mime_type: file.type || null,
        size_bytes: file.size,
        sort_order: nextOrder,
      })
      .select('id')
      .single();

    if (insErr) {
      console.error('photos insert error:', insErr);
      // Storage 側もロールバック
      await supabase.storage.from(SHARE_PHOTO_BUCKET).remove([filePath]);
      failures.push({ filename: file.name, message: 'メタデータ保存に失敗しました' });
      continue;
    }

    uploaded.push({
      id: insRow.id,
      filename: file.name,
      url: getSharePhotoUrl(supabase, filePath),
    });
    nextOrder += 1;
  }

  if (uploaded.length === 0 && failures.length > 0) {
    return jsonBadRequest(`すべてのアップロードに失敗しました: ${failures.map((f) => f.filename).join(', ')}`);
  }

  return jsonSuccess({ uploaded, failures }, 201);
});
