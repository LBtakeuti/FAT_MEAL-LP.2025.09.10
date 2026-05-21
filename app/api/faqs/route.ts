import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { withErrorHandler, handleSupabaseError } from '@/lib/api-helpers';

// GET: 公開用FAQ一覧（is_active のみ、並び順）
export const GET = withErrorHandler(async () => {
  const supabase = createServerClient();

  const { data, error } = await (supabase as any)
    .from('faqs')
    .select('id, question, answer_title, answer_detail, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) return handleSupabaseError(error, 'FAQ取得');

  return new NextResponse(JSON.stringify(data || []), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 's-maxage=120, stale-while-revalidate=600',
    },
  });
});
