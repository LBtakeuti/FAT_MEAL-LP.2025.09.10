import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import {
  withAuthDynamic,
  jsonSuccess,
  jsonBadRequest,
  jsonNotFound,
  handleSupabaseError,
  validateBody,
} from '@/lib/api-helpers';

// PUT: 編集
export const PUT = withAuthDynamic(async (request: NextRequest, context) => {
  const { id } = await context.params;
  const body = await request.json();

  const validation = validateBody(body, {
    question: { required: true, type: 'string', max: 200 },
    answer_title: { required: true, type: 'string', max: 200 },
    answer_detail: { type: 'string', max: 4000 },
  });
  if (!validation.valid) return jsonBadRequest(validation.errors.join(', '));

  const supabase = createServerClient() as any;

  const updates: Record<string, unknown> = {
    question: body.question.trim(),
    answer_title: body.answer_title.trim(),
    answer_detail: (body.answer_detail || '').trim(),
  };
  if (typeof body.is_active === 'boolean') updates.is_active = body.is_active;
  if (typeof body.sort_order === 'number') updates.sort_order = body.sort_order;

  const { data, error } = await supabase
    .from('faqs')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    if ((error as any).code === 'PGRST116') return jsonNotFound('FAQが見つかりません');
    return handleSupabaseError(error, 'FAQ更新');
  }
  return jsonSuccess(data);
});

// DELETE: 削除
export const DELETE = withAuthDynamic(async (_request: NextRequest, context) => {
  const { id } = await context.params;
  const supabase = createServerClient() as any;

  const { error } = await supabase.from('faqs').delete().eq('id', id);
  if (error) return handleSupabaseError(error, 'FAQ削除');
  return jsonSuccess({ ok: true });
});
