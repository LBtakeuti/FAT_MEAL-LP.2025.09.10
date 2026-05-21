import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import {
  withAuth,
  jsonSuccess,
  jsonBadRequest,
  handleSupabaseError,
  validateBody,
} from '@/lib/api-helpers';

// GET: FAQ 一覧（全件、並び順）
export const GET = withAuth(async () => {
  const supabase = createServerClient() as any;
  const { data, error } = await supabase
    .from('faqs')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) return handleSupabaseError(error, 'FAQ取得');
  return jsonSuccess(data || []);
});

// POST: 新規作成
export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json();

  const validation = validateBody(body, {
    question: { required: true, type: 'string', max: 200 },
    answer_title: { required: true, type: 'string', max: 200 },
    answer_detail: { type: 'string', max: 4000 },
  });
  if (!validation.valid) return jsonBadRequest(validation.errors.join(', '));

  const supabase = createServerClient() as any;

  // 末尾の sort_order を取って +1
  const { data: lastRow } = await supabase
    .from('faqs')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = (lastRow?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from('faqs')
    .insert({
      question: body.question.trim(),
      answer_title: body.answer_title.trim(),
      answer_detail: (body.answer_detail || '').trim(),
      sort_order: nextOrder,
      is_active: body.is_active ?? true,
    })
    .select('*')
    .single();

  if (error) return handleSupabaseError(error, 'FAQ作成');
  return jsonSuccess(data, 201);
});
