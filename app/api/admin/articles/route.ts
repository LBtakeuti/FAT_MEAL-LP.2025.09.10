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
 * GET /api/admin/articles?limit=&offset=&search=&isPublished=&tag=
 * - 認証: 管理者のみ
 * - 公開・下書きの両方を含む（管理用）
 * - F51-2: tag フィルタ追加（postgres text[] の contains で完全一致）
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
  const tag = sp.get('tag');

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
  if (tag) {
    // F51-2: tags は text[] のため contains で完全一致
    query = query.contains('tags', [tag]);
  }

  const { data, count, error } = await query;
  if (error) {
    return handleSupabaseError(error, '記事一覧取得');
  }

  return jsonSuccess({ articles: data ?? [], total: count ?? 0 });
});

/**
 * F16 / F53: 管理用 記事作成 API
 *
 * POST /api/admin/articles
 * - 認証: 管理者のみ
 * - 必須: title, content（slug は任意）
 * - slug 入力時は ^[a-z0-9][a-z0-9-]*[a-z0-9]$ 形式（部分的な kebab-case 強制）+ 一意チェック
 * - F53: slug 未指定/空欄なら `article-{YYYYMMDD}`（JST）をベースに、重複時は -2, -3 … で一意化して自動生成
 */

/** JST の今日を YYYYMMDD 文字列で返す */
function jstDateStamp(): string {
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const y = jst.getUTCFullYear();
  const m = String(jst.getUTCMonth() + 1).padStart(2, '0');
  const d = String(jst.getUTCDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

/**
 * F53: `article-{YYYYMMDD}` をベースに、articles に存在しない一意な slug を生成する。
 * 既に埋まっていれば -2, -3 … と連番を付けて空きを探す。
 */
async function generateUniqueSlug(supabase: any): Promise<string> {
  const base = `article-${jstDateStamp()}`;
  for (let i = 1; ; i++) {
    const candidate = i === 1 ? base : `${base}-${i}`;
    const { data: hit } = await supabase
      .from('articles')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle();
    if (!hit) return candidate;
  }
}

export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json();

  const validation = validateBody(body, {
    title: { required: true, type: 'string' },
    content: { required: true, type: 'string' },
  });
  if (!validation.valid) {
    return jsonBadRequest(validation.errors.join(', '));
  }

  const supabase = createServerClient() as any;

  const inputSlug = body.slug !== undefined && body.slug !== null ? String(body.slug).trim() : '';
  let slug: string;
  if (inputSlug === '') {
    // F53: 空欄なら自動生成（一意性も内部で担保）
    slug = await generateUniqueSlug(supabase);
  } else {
    // 手入力 slug: 従来通りバリデーション + 一意チェック
    if (!/^[a-z0-9](?:[a-z0-9-]{0,98}[a-z0-9])?$/.test(inputSlug)) {
      return jsonBadRequest('slug は小文字英数字とハイフンのみ（先頭末尾はハイフン不可、最大100文字）');
    }
    const { data: existing } = await supabase
      .from('articles')
      .select('id')
      .eq('slug', inputSlug)
      .maybeSingle();
    if (existing) {
      return jsonBadRequest('この slug は既に使用されています');
    }
    slug = inputSlug;
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
