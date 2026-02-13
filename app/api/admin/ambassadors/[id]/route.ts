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

// GET: アンバサダー詳細取得
export const GET = withAuthDynamic(async (_request: NextRequest, context) => {
  const { id } = await context.params;
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('ambassadors')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return jsonNotFound('アンバサダーが見つかりません');
  }

  return jsonSuccess(data);
});

// PUT: アンバサダー更新
export const PUT = withAuthDynamic(async (request: NextRequest, context) => {
  const { id } = await context.params;
  const body = await request.json();

  const validation = validateBody(body, {
    thumbnail_image: { required: true, type: 'string' },
    icon_image: { required: true, type: 'string' },
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
    icon_image: body.icon_image,
    department: body.department || null,
    date: body.date,
    title: body.title,
    description: body.description,
    sort_order: body.sort_order ?? 0,
    is_active: body.is_active ?? true,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await (supabase.from('ambassadors') as any)
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    return handleSupabaseError(error || { message: 'Not found' }, 'アンバサダー更新');
  }

  return jsonSuccess(data);
});

// DELETE: アンバサダー削除
export const DELETE = withAuthDynamic(async (_request: NextRequest, context) => {
  const { id } = await context.params;
  const supabase = createServerClient();

  const { error } = await supabase.from('ambassadors').delete().eq('id', id);

  if (error) {
    return handleSupabaseError(error, 'アンバサダー削除');
  }

  return jsonSuccess({ message: '削除しました' });
});
