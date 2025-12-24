import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import {
  withAuthDynamic,
  withErrorHandlerDynamic,
  jsonSuccess,
  jsonNotFound,
  jsonBadRequest,
  handleSupabaseError,
  validateBody,
} from '@/lib/api-helpers';

// GET: ニュース詳細取得（認証不要）
export const GET = withErrorHandlerDynamic(async (_request: NextRequest, context) => {
  const { id } = await context.params;
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('news')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return jsonNotFound('ニュースが見つかりません');
  }

  return jsonSuccess(data);
});

// PUT: ニュース更新（認証必要）
export const PUT = withAuthDynamic(async (request: NextRequest, context) => {
  const { id } = await context.params;
  const body = await request.json();

  // バリデーション
  const validation = validateBody(body, {
    title: { required: true, type: 'string' },
    content: { required: true, type: 'string' },
  });

  if (!validation.valid) {
    return jsonBadRequest(validation.errors.join(', '));
  }

  const supabase = createServerClient();

  const updateData = {
    title: body.title,
    content: body.content,
    date: body.date || new Date().toISOString().split('T')[0],
    category: body.category || null,
    image: body.image || null,
    excerpt: body.excerpt || null,
    summary: body.summary || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await (supabase.from('news') as any)
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    return handleSupabaseError(error || { message: 'Not found' }, 'ニュース更新');
  }

  return jsonSuccess(data);
});

// DELETE: ニュース削除（認証必要）
export const DELETE = withAuthDynamic(async (_request: NextRequest, context) => {
  const { id } = await context.params;
  const supabase = createServerClient();

  const { error } = await supabase.from('news').delete().eq('id', id);

  if (error) {
    return handleSupabaseError(error, 'ニュース削除');
  }

  return jsonSuccess({ message: '削除しました' });
});
