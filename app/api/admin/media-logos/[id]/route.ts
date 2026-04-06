import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import {
  withAuthDynamic,
  jsonSuccess,
  jsonNotFound,
  handleSupabaseError,
} from '@/lib/api-helpers';

// GET: メディアロゴ詳細取得
export const GET = withAuthDynamic(async (_request: NextRequest, context) => {
  const { id } = await context.params;
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('media_logos')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return jsonNotFound('メディアロゴが見つかりません');
  }

  return jsonSuccess(data);
});

// PUT: メディアロゴ更新
export const PUT = withAuthDynamic(async (request: NextRequest, context) => {
  const { id } = await context.params;
  const body = await request.json();

  const supabase = createServerClient();

  const updateData = {
    name: body.name,
    image_url: body.image_url,
    sort_order: body.sort_order ?? 0,
    is_active: body.is_active ?? true,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await (supabase.from('media_logos') as any)
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    return handleSupabaseError(error || { message: 'Not found' }, 'メディアロゴ更新');
  }

  return jsonSuccess(data);
});

// DELETE: メディアロゴ削除
export const DELETE = withAuthDynamic(async (_request: NextRequest, context) => {
  const { id } = await context.params;
  const supabase = createServerClient();

  const { error } = await supabase.from('media_logos').delete().eq('id', id);

  if (error) {
    return handleSupabaseError(error, 'メディアロゴ削除');
  }

  return jsonSuccess({ message: '削除しました' });
});
