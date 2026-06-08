import { createServerClient } from '@/lib/supabase';
import {
  withAuth,
  jsonSuccess,
  handleSupabaseError,
} from '@/lib/api-helpers';

// GET: お問い合わせ一覧取得（認証必要）
// クエリ: ?from=YYYY-MM-DD&to=YYYY-MM-DD で created_at を範囲フィルタ
export const GET = withAuth(async (request) => {
  const supabase = createServerClient();
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  let query = (supabase.from('contacts') as any)
    .select('*')
    .order('created_at', { ascending: false });

  // YYYY-MM-DD 形式のみ受け付ける（簡易バリデーション）
  const isYmd = (s: string | null): s is string => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
  if (isYmd(from)) {
    query = query.gte('created_at', `${from}T00:00:00+09:00`);
  }
  if (isYmd(to)) {
    query = query.lte('created_at', `${to}T23:59:59+09:00`);
  }

  const { data, error } = await query;

  if (error) {
    return handleSupabaseError(error, 'お問い合わせ取得');
  }

  return jsonSuccess(data || []);
});
