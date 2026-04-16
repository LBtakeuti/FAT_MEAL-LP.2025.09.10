import { createServerClient } from '@/lib/supabase';
import { withAuth, jsonSuccess, handleSupabaseError } from '@/lib/api-helpers';

export const GET = withAuth(async () => {
  const supabase = createServerClient() as any;
  const { data, error } = await supabase
    .from('tiktok_shop_orders')
    .select('*')
    .order('created_time', { ascending: false, nullsFirst: false });

  if (error) return handleSupabaseError(error, 'TikTok Shop 注文取得');
  return jsonSuccess(data || []);
});
