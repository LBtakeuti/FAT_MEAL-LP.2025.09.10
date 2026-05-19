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

/**
 * POST: Supabase Storage への直アップロード完了後、photos テーブルに登録する。
 * Body: { file_path, filename, mime_type?, size_bytes? }
 *
 * サーバー側で Storage に実ファイルが存在するか確認してから INSERT する。
 */
export const POST = withAuthDynamic(async (request: NextRequest, context) => {
  const { slug } = await context.params;
  if (!isValidShareLinkSlug(slug)) return jsonBadRequest('slug の形式が不正です');

  const body = await request.json().catch(() => ({}));
  const filePath = typeof body?.file_path === 'string' ? body.file_path : '';
  const filename = typeof body?.filename === 'string' ? body.filename : '';
  const mimeType = typeof body?.mime_type === 'string' ? body.mime_type : null;
  const sizeBytes = typeof body?.size_bytes === 'number' ? body.size_bytes : null;

  if (!filePath) return jsonBadRequest('file_path は必須です');
  if (!filename) return jsonBadRequest('filename は必須です');

  const supabase = createServerClient() as any;

  const { data: link, error: linkErr } = await supabase
    .from('share_links')
    .select('id, slug')
    .eq('slug', slug)
    .maybeSingle();
  if (linkErr) return handleSupabaseError(linkErr, '共有リンク取得');
  if (!link) return jsonNotFound('共有リンクが見つかりません');

  // file_path が指定 slug 配下であることを確認（悪意ある書き換え防止）
  if (!filePath.startsWith(`${link.slug}/`)) {
    return jsonBadRequest('file_path が slug と一致しません');
  }

  // Storage 上に本当に存在するか確認（dir / search ではなく download_head 風に試す）
  const dirPath = filePath.split('/').slice(0, -1).join('/');
  const fileName = filePath.split('/').pop() as string;
  const { data: listed, error: listErr } = await supabase.storage
    .from(SHARE_PHOTO_BUCKET)
    .list(dirPath, { search: fileName, limit: 1 });
  if (listErr) {
    console.error('storage list error:', listErr);
    return jsonBadRequest('アップロード状態の確認に失敗しました');
  }
  const exists = Array.isArray(listed) && listed.some((entry: { name: string }) => entry.name === fileName);
  if (!exists) {
    return jsonBadRequest('アップロードが完了していません。再度お試しください');
  }

  // 末尾の sort_order を取得
  const { data: lastSort } = await supabase
    .from('photos')
    .select('sort_order')
    .eq('share_link_id', link.id)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = (lastSort?.sort_order ?? -1) + 1;

  const { data: insRow, error: insErr } = await supabase
    .from('photos')
    .insert({
      share_link_id: link.id,
      file_path: filePath,
      filename,
      mime_type: mimeType,
      size_bytes: sizeBytes,
      sort_order: nextOrder,
    })
    .select('id')
    .single();

  if (insErr) {
    console.error('photos insert error:', insErr);
    // 失敗時は孤児ファイルとして Storage に残るが、cron で別途回収する
    return handleSupabaseError(insErr, '写真メタデータ保存');
  }

  return jsonSuccess({
    id: insRow.id,
    filename,
    file_path: filePath,
    url: getSharePhotoUrl(supabase, filePath),
  });
});
