import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import {
  withAuth,
  withErrorHandler,
  jsonSuccess,
  jsonBadRequest,
  handleSupabaseError,
} from '@/lib/api-helpers';

// GET: バナー設定取得（認証不要、フロント表示用）
export const GET = withErrorHandler(async () => {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('banner_settings')
    .select('*')
    .eq('id', 1)
    .single();

  if (error) {
    return handleSupabaseError(error, 'バナー設定取得');
  }

  return jsonSuccess(data);
});

// PUT: バナー設定更新（認証必要、管理画面用）
export const PUT = withAuth(async (request: NextRequest) => {
  const body = await request.json();

  if (typeof body.is_active !== 'boolean' && !body.image_url && !body.link_url) {
    return jsonBadRequest('更新するフィールドを指定してください');
  }

  const supabase = createServerClient();

  const updateData: Record<string, unknown> = {};
  if (typeof body.is_active === 'boolean') updateData.is_active = body.is_active;
  if (body.image_url) updateData.image_url = body.image_url;
  if (body.link_url) updateData.link_url = body.link_url;

  const { data, error } = await (supabase
    .from('banner_settings') as any)
    .update(updateData)
    .eq('id', 1)
    .select()
    .single();

  if (error) {
    return handleSupabaseError(error, 'バナー設定更新');
  }

  return jsonSuccess(data);
});
