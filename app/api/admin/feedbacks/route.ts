import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import {
  withAuth,
  jsonSuccess,
  jsonBadRequest,
  handleSupabaseError,
  validateBody,
} from '@/lib/api-helpers';

// GET: フィードバック一覧取得（管理用・全件）
export const GET = withAuth(async () => {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('feedbacks')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    return handleSupabaseError(error, 'フィードバック取得');
  }

  return jsonSuccess(data || []);
});

// POST: フィードバック新規作成
export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json();

  const validation = validateBody(body, {
    thumbnail_image: { required: true, type: 'string' },
    date: { required: true, type: 'string' },
    title: { required: true, type: 'string', max: 50 },
    description: { required: true, type: 'string', max: 200 },
  });

  if (!validation.valid) {
    return jsonBadRequest(validation.errors.join(', '));
  }

  const supabase = createServerClient();

  const feedbackData = {
    thumbnail_image: body.thumbnail_image,
    thumbnail_label: body.thumbnail_label || null,
    date: body.date,
    title: body.title,
    description: body.description,
    sort_order: body.sort_order ?? 0,
    is_active: body.is_active ?? true,
  };

  const { data, error } = await (supabase.from('feedbacks') as any)
    .insert(feedbackData)
    .select()
    .single();

  if (error) {
    return handleSupabaseError(error, 'フィードバック作成');
  }

  return jsonSuccess(data, 201);
});
