import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import {
  withErrorHandlerDynamic,
  jsonSuccess,
  jsonBadRequest,
  jsonNotFound,
  jsonError,
  handleSupabaseError,
} from '@/lib/api-helpers';
import { rateLimit, getClientIP } from '@/lib/rate-limit';
import { isValidShareLinkSlug } from '@/lib/share-link-slug';
import { getSharePhotoUrl } from '@/lib/share-storage';

// GET: 公開用の共有リンク取得（リンク情報 + 写真一覧）
export const GET = withErrorHandlerDynamic(async (request: NextRequest, context) => {
  const { slug } = await context.params;
  if (!isValidShareLinkSlug(slug)) return jsonBadRequest('slug の形式が不正です');

  const { allowed } = rateLimit(`share-get:${getClientIP(request)}:${slug}`, 60, 60_000);
  if (!allowed) return jsonError('リクエストが多すぎます。しばらく待ってから再度お試しください', 429);

  const supabase = createServerClient() as any;

  const { data: link, error } = await supabase
    .from('share_links')
    .select('id, slug, label, title, body_html, expires_at, created_at')
    .eq('slug', slug)
    .maybeSingle();

  if (error) return handleSupabaseError(error, '共有リンク取得');
  if (!link) return jsonNotFound('共有リンクが見つかりません');

  const expired = link.expires_at ? new Date(link.expires_at).getTime() < Date.now() : false;

  if (expired) {
    return jsonSuccess({ link, photos: [], expired: true });
  }

  const { data: photos, error: photoErr } = await supabase
    .from('photos')
    .select('id, filename, file_path, mime_type, size_bytes, sort_order')
    .eq('share_link_id', link.id)
    .order('sort_order', { ascending: true });

  if (photoErr) return handleSupabaseError(photoErr, '写真取得');

  const photosWithUrl = ((photos || []) as Array<{ file_path: string }>).map((p) => ({
    ...p,
    url: getSharePhotoUrl(supabase, p.file_path),
  }));

  return jsonSuccess({ link, photos: photosWithUrl, expired: false });
});
