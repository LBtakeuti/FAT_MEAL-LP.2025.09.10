import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import {
  withAuthDynamic,
  jsonSuccess,
  jsonBadRequest,
  handleSupabaseError,
} from '@/lib/api-helpers';

const VALID_STATUSES = ['pending', 'responded', 'closed'] as const;

// PATCH: お問い合わせステータス更新（認証必要）
export const PATCH = withAuthDynamic(async (request: NextRequest, context) => {
  const { id } = await context.params;
  const body = await request.json();

  // ステータスのバリデーション
  if (body.status && !VALID_STATUSES.includes(body.status)) {
    return jsonBadRequest('ステータスが無効です');
  }

  const supabase = createServerClient();

  const { data, error } = await (supabase.from('contacts') as any)
    .update({ status: body.status })
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    return handleSupabaseError(
      error || { message: 'Not found' },
      'ステータス更新'
    );
  }

  return jsonSuccess(data);
});

// DELETE: お問い合わせ削除（認証必要）
export const DELETE = withAuthDynamic(async (_request: NextRequest, context) => {
  const { id } = await context.params;
  const supabase = createServerClient();

  const { error } = await supabase.from('contacts').delete().eq('id', id);

  if (error) {
    return handleSupabaseError(error, 'お問い合わせ削除');
  }

  return jsonSuccess({ message: '削除しました' });
});




