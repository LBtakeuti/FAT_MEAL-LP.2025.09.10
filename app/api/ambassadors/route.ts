import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { withErrorHandler, handleSupabaseError } from '@/lib/api-helpers';

// GET: アクティブなアンバサダー一覧取得（認証不要）
export const GET = withErrorHandler(async () => {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('ambassadors')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    return handleSupabaseError(error, 'アンバサダー取得');
  }

  return new NextResponse(JSON.stringify(data || []), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 's-maxage=60',
    },
  });
});
