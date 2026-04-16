import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { withAuthDynamic } from '@/lib/api-helpers';
import { jsonSuccess, jsonNotFound, handleSupabaseError } from '@/lib/api-helpers';

export const GET = withAuthDynamic(async (
  _request: NextRequest,
  context: { params: Promise<Record<string, string>> },
) => {
  const { id } = await context.params;
  const supabase = createServerClient();

  // ユーザープロフィール取得
  const { data: user, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return jsonNotFound('ユーザーが見つかりません');
    return handleSupabaseError(error, 'ユーザー情報の取得');
  }

  // 注文履歴を取得
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('customer_email', user.email)
    .order('created_at', { ascending: false });

  // サブスクリプション情報を取得
  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', id)
    .order('created_at', { ascending: false });

  return jsonSuccess({
    user,
    orders: orders || [],
    subscriptions: subscriptions || [],
  });
});
