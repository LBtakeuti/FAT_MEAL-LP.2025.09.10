import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import {
  withAuthDynamic,
  jsonSuccess,
  jsonBadRequest,
  handleSupabaseError,
} from '@/lib/api-helpers';

// PUT: ステータス更新等
export const PUT = withAuthDynamic(async (request: NextRequest, context) => {
  const { id } = await context.params;
  const body = await request.json();

  const allowedStatuses = ['pending', 'confirmed', 'shipped', 'cancelled'];
  if (body.status && !allowedStatuses.includes(body.status)) {
    return jsonBadRequest('不正なステータスです');
  }

  const supabase = createServerClient() as any;
  const { data, error } = await supabase
    .from('tiktok_shop_orders')
    .update({
      status: body.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return handleSupabaseError(error, 'TikTok Shop 注文更新');
  return jsonSuccess(data);
});

// DELETE
export const DELETE = withAuthDynamic(async (_request: NextRequest, context) => {
  const { id } = await context.params;
  const supabase = createServerClient() as any;
  const { error } = await supabase.from('tiktok_shop_orders').delete().eq('id', id);
  if (error) return handleSupabaseError(error, 'TikTok Shop 注文削除');
  return jsonSuccess({ message: '削除しました' });
});
