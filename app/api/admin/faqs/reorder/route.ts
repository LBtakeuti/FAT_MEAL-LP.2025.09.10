import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import {
  withAuth,
  jsonSuccess,
  jsonBadRequest,
  handleSupabaseError,
} from '@/lib/api-helpers';

/**
 * POST: 並び順の一括更新
 * body: { items: Array<{ id: string; sort_order: number }> }
 */
export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json().catch(() => ({}));
  const items = Array.isArray(body?.items) ? body.items : null;
  if (!items) return jsonBadRequest('items は配列で指定してください');

  const supabase = createServerClient() as any;

  for (const item of items) {
    if (!item?.id || typeof item.sort_order !== 'number') continue;
    const { error } = await supabase
      .from('faqs')
      .update({ sort_order: item.sort_order })
      .eq('id', item.id);
    if (error) return handleSupabaseError(error, 'FAQ並び順更新');
  }

  return jsonSuccess({ ok: true });
});
