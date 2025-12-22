import { createServerClient } from '@/lib/supabase';
import {
  withAuth,
  jsonSuccess,
  handleSupabaseError,
} from '@/lib/api-helpers';

// GET: お問い合わせ一覧取得（認証必要）
export const GET = withAuth(async () => {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return handleSupabaseError(error, 'お問い合わせ取得');
  }

  return jsonSuccess(data || []);
});
