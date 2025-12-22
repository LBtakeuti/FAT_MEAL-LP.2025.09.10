import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import {
  withAuth,
  withErrorHandler,
  jsonSuccess,
  jsonBadRequest,
  handleSupabaseError,
  validateBody,
} from '@/lib/api-helpers';

// GET: ニュース一覧取得（認証不要）
export const GET = withErrorHandler(async () => {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('news')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    return handleSupabaseError(error, 'ニュース取得');
  }

  return jsonSuccess(data || []);
});

// POST: ニュース作成（認証必要）
export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json();

  // バリデーション
  const validation = validateBody(body, {
    title: { required: true, type: 'string' },
    content: { required: true, type: 'string' },
  });

  if (!validation.valid) {
    return jsonBadRequest(validation.errors.join(', '));
  }

  const supabase = createServerClient();

  const newsData = {
    title: body.title,
    content: body.content,
    date: body.date || new Date().toISOString().split('T')[0],
    category: body.category || null,
    image: body.image || null,
    excerpt: body.excerpt || null,
    summary: body.summary || null,
  };

  const { data, error } = await (supabase.from('news') as any)
    .insert(newsData)
    .select()
    .single();

  if (error) {
    return handleSupabaseError(error, 'ニュース作成');
  }

  return jsonSuccess(data, 201);
});
