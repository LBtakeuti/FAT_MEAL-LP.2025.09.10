import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import {
  withAuth,
  jsonSuccess,
  jsonBadRequest,
  handleSupabaseError,
  validateBody,
} from '@/lib/api-helpers';

/**
 * F16: 管理用 記事一覧 API
 *
 * GET /api/admin/articles?limit=&offset=&search=&isPublished=
 * - 認証: 管理者のみ
 * - 公開・下書きの両方を含む（管理用）
 */
export const GET = withAuth(async (request: NextRequest) => {
  const supabase = createServerClient() as any;
  const sp = request.nextUrl.searchParams;
  const limitRaw = parseInt(sp.get('limit') || '20', 10);
  const limit = Math.min(Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 20), 100);
  const offsetRaw = parseInt(sp.get('offset') || '0', 10);
  const offset = Math.max(0, Number.isFinite(offsetRaw) ? offsetRaw : 0);
  const search = sp.get('search');
  const isPublishedParam = sp.get('isPublished');

  let query = supabase
    .from('articles')
    .select(
      'id, slug, title, excerpt, thumbnail_url, tags, author, is_published, published_at, view_count, created_at, updated_at',
      { count: 'exact' },
    )
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.ilike('title', `%${search}%`);
  }
  if (isPublishedParam === 'true') query = query.eq('is_published', true);
  if (isPublishedParam === 'false') query = query.eq('is_published', false);

  const { data, count, error } = await query;
  if (error) {
    return handleSupabaseError(error, '記事一覧取得');
  }

  return jsonSuccess({ articles: data ?? [], total: count ?? 0 });
});

/**
 * F16: 管理用 記事作成 API
 *
 * POST /api/admin/articles
 * - 認証: 管理者のみ
 * - 必須: title, slug, content
 * - slug は ^[a-z0-9][a-z0-9-]*[a-z0-9]$ 形式（部分的な kebab-case 強制）
 */
export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json();

  const validation = validateBody(body, {
    title: { required: true, type: 'string' },
    slug: { required: true, type: 'string' },
    content: { required: true, type: 'string' },
  });
  if (!validation.valid) {
    return jsonBadRequest(validation.errors.join(', '));
  }

  const slug = String(body.slug).trim();
  if (!/^[a-z0-9](?:[a-z0-9-]{0,98}[a-z0-9])?$/.test(slug)) {
    return jsonBadRequest('slug は小文字英数字とハイフンのみ（先頭末尾はハイフン不可、最大100文字）');
  }

  const supabase = createServerClient() as any;

  // slug ユニーク確認
  const { data: existing } = await supabase
    .from('articles')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  if (existing) {
    return jsonBadRequest('この slug は既に使用されています');
  }

  const isPublished = Boolean(body.is_published);
  const publishedAt = body.published_at
    ? new Date(body.published_at).toISOString()
    : isPublished
      ? new Date().toISOString()
      : null;

  const insertData = {
    slug,
    title: String(body.title).trim(),
    excerpt: body.excerpt ? String(body.excerpt) : null,
    content: String(body.content),
    thumbnail_url: body.thumbnail_url || null,
    tags: Array.isArray(body.tags) ? body.tags.map((t: unknown) => String(t).trim()).filter(Boolean) : [],
    author: body.author ? String(body.author).trim() : 'ふとるめし編集部',
    is_published: isPublished,
    published_at: publishedAt,
    meta_title: body.meta_title || null,
    meta_description: body.meta_description || null,
    og_image_url: body.og_image_url || null,
  };

  const { data, error } = await supabase
    .from('articles')
    .insert(insertData)
    .select()
    .single();

  if (error || !data) {
    return handleSupabaseError(error || { message: 'Insert failed' }, '記事作成');
  }

  return jsonSuccess({ article: data }, 201);
});

export const dynamic = 'force-dynamic';
