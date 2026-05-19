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

// POST: 公開ページアクセスを記録
export const POST = withErrorHandlerDynamic(async (request: NextRequest, context) => {
  const { slug } = await context.params;
  if (!isValidShareLinkSlug(slug)) return jsonBadRequest('slug の形式が不正です');

  const clientIP = getClientIP(request);
  const { allowed } = rateLimit(`share-access:${clientIP}:${slug}`, 30, 60_000);
  if (!allowed) return jsonError('リクエストが多すぎます。しばらく待ってから再度お試しください', 429);

  const supabase = createServerClient() as any;

  const { data: link, error } = await supabase
    .from('share_links')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (error) return handleSupabaseError(error, '共有リンク取得');
  if (!link) return jsonNotFound('共有リンクが見つかりません');

  await supabase.from('share_access_logs').insert({
    share_link_id: link.id,
    user_agent: request.headers.get('user-agent') || null,
    ip_address: clientIP === 'unknown' ? null : clientIP,
    referer: request.headers.get('referer') || null,
  });

  return jsonSuccess({ ok: true });
});
