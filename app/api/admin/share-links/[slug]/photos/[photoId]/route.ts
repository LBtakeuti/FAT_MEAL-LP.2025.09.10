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

// DELETE: 写真を1枚削除
export const DELETE = withAuthDynamic(async (_request: NextRequest, context) => {
  const { slug, photoId } = await context.params;
  if (!isValidShareLinkSlug(slug)) return jsonBadRequest('slug の形式が不正です');

  const supabase = createServerClient() as any;

  const { data: link, error: linkErr } = await supabase
    .from('share_links')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  if (linkErr) return handleSupabaseError(linkErr, '共有リンク取得');
  if (!link) return jsonNotFound('共有リンクが見つかりません');

  const { data: photo, error: photoErr } = await supabase
    .from('photos')
    .select('id, file_path, share_link_id')
    .eq('id', photoId)
    .maybeSingle();
  if (photoErr) return handleSupabaseError(photoErr, '写真取得');
  if (!photo || photo.share_link_id !== link.id) return jsonNotFound('写真が見つかりません');

  const { error: removeErr } = await supabase.storage.from(SHARE_PHOTO_BUCKET).remove([photo.file_path]);
  if (removeErr) console.error('Storage 削除エラー（孤児ファイル化リスクあり）:', removeErr);

  const { error: delErr } = await supabase.from('photos').delete().eq('id', photo.id);
  if (delErr) return handleSupabaseError(delErr, '写真削除');

  return jsonSuccess({ ok: true });
});
