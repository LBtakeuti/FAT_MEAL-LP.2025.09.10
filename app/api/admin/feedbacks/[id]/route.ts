import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import {
  withAuthDynamic,
  jsonSuccess,
  jsonNotFound,
  jsonBadRequest,
  handleSupabaseError,
  validateBody,
} from '@/lib/api-helpers';

// GET: フィードバック詳細取得
export const GET = withAuthDynamic(async (_request: NextRequest, context) => {
  const { id } = await context.params;
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('feedbacks')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return jsonNotFound('フィードバックが見つかりません');
  }

  return jsonSuccess(data);
});

// PUT: フィードバック更新
export const PUT = withAuthDynamic(async (request: NextRequest, context) => {
  const { id } = await context.params;
  const body = await request.json();

  const validation = validateBody(body, {
    thumbnail_image: { required: true, type: 'string' },
    date: { required: true, type: 'string' },
    title: { required: true, type: 'string', max: 50 },
    description: { required: true, type: 'string', max: 200 },
  });

  if (!validation.valid) {
    return jsonBadRequest(validation.errors.join(', '));
  }

  const supabase = createServerClient();

  const updateData = {
    thumbnail_image: body.thumbnail_image,
    thumbnail_label: body.thumbnail_label || null,
    date: body.date,
    title: body.title,
    description: body.description,
    sort_order: body.sort_order ?? 0,
    is_active: body.is_active ?? true,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await (supabase.from('feedbacks') as any)
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    return handleSupabaseError(error || { message: 'Not found' }, 'フィードバック更新');
  }

  return jsonSuccess(data);
});

// DELETE: フィードバック削除
export const DELETE = withAuthDynamic(async (_request: NextRequest, context) => {
  const { id } = await context.params;
  const supabase = createServerClient();

  const { error } = await supabase.from('feedbacks').delete().eq('id', id);

  if (error) {
    return handleSupabaseError(error, 'フィードバック削除');
  }

  return jsonSuccess({ message: '削除しました' });
});
