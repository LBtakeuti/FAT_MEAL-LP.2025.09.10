import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import {
  withAuthDynamic,
  jsonSuccess,
  jsonNotFound,
  jsonBadRequest,
  handleSupabaseError,
} from '@/lib/api-helpers';

/**
 * F16: 管理用 記事個別操作 API
 *
 * GET /api/admin/articles/[id]
 * PATCH /api/admin/articles/[id]
 * DELETE /api/admin/articles/[id]
 */

export const GET = withAuthDynamic(async (_request: NextRequest, context) => {
  const { id } = await context.params;
  const supabase = createServerClient() as any;
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) {
    return handleSupabaseError(error, '記事取得');
  }
  if (!data) {
    return jsonNotFound('記事が見つかりません');
  }
  return jsonSuccess({ article: data });
});

export const PATCH = withAuthDynamic(async (request: NextRequest, context) => {
  const { id } = await context.params;
  const body = await request.json();
  const supabase = createServerClient() as any;

  if (body.slug !== undefined) {
    const slug = String(body.slug).trim();
    if (!/^[a-z0-9](?:[a-z0-9-]{0,98}[a-z0-9])?$/.test(slug)) {
      return jsonBadRequest('slug は小文字英数字とハイフンのみ（先頭末尾はハイフン不可、最大100文字）');
    }
    const { data: dup } = await supabase
      .from('articles')
      .select('id')
      .eq('slug', slug)
      .neq('id', id)
      .maybeSingle();
    if (dup) {
      return jsonBadRequest('この slug は既に他の記事で使用されています');
    }
  }

  const allowedKeys = [
    'slug',
    'title',
    'excerpt',
    'content',
    'thumbnail_url',
    'tags',
    'author',
    'is_published',
    'published_at',
    'meta_title',
    'meta_description',
    'og_image_url',
  ] as const;

  const updateData: Record<string, unknown> = {};
  for (const key of allowedKeys) {
    if (body[key] === undefined) continue;
    if (key === 'tags') {
      updateData[key] = Array.isArray(body.tags)
        ? body.tags.map((t: unknown) => String(t).trim()).filter(Boolean)
        : [];
      continue;
    }
    if (key === 'is_published') {
      updateData[key] = Boolean(body.is_published);
      continue;
    }
    if (key === 'published_at') {
      updateData[key] = body.published_at ? new Date(body.published_at).toISOString() : null;
      continue;
    }
    if (key === 'title' || key === 'slug' || key === 'author') {
      updateData[key] = String(body[key]).trim();
      continue;
    }
    updateData[key] = body[key] === '' ? null : body[key];
  }

  // 公開化された瞬間に published_at が未設定なら現在時刻を入れる
  if (updateData.is_published === true && body.published_at === undefined) {
    const { data: prev } = await supabase
      .from('articles')
      .select('published_at')
      .eq('id', id)
      .maybeSingle();
    if (!prev?.published_at) {
      updateData.published_at = new Date().toISOString();
    }
  }

  if (Object.keys(updateData).length === 0) {
    return jsonBadRequest('更新項目がありません');
  }

  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('articles')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    return handleSupabaseError(error || { message: 'Update failed' }, '記事更新');
  }
  return jsonSuccess({ article: data });
});

export const DELETE = withAuthDynamic(async (_request: NextRequest, context) => {
  const { id } = await context.params;
  const supabase = createServerClient() as any;
  const { error } = await supabase.from('articles').delete().eq('id', id);
  if (error) {
    return handleSupabaseError(error, '記事削除');
  }
  return jsonSuccess({ success: true });
});

export const dynamic = 'force-dynamic';
