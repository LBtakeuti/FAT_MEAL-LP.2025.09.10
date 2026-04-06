import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import {
  withAuth,
  jsonSuccess,
  jsonBadRequest,
  handleSupabaseError,
  validateBody,
} from '@/lib/api-helpers';

// GET: メディアロゴ一覧取得（管理用・全件）
export const GET = withAuth(async () => {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('media_logos')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    return handleSupabaseError(error, 'メディアロゴ取得');
  }

  return jsonSuccess(data || []);
});

// POST: メディアロゴ新規作成
export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json();

  const validation = validateBody(body, {
    name: { required: true, type: 'string' },
    image_url: { required: true, type: 'string' },
  });

  if (!validation.valid) {
    return jsonBadRequest(validation.errors.join(', '));
  }

  const supabase = createServerClient();

  const logoData = {
    name: body.name,
    image_url: body.image_url,
    sort_order: body.sort_order ?? 0,
    is_active: body.is_active ?? true,
  };

  const { data, error } = await (supabase.from('media_logos') as any)
    .insert(logoData)
    .select()
    .single();

  if (error) {
    return handleSupabaseError(error, 'メディアロゴ作成');
  }

  return jsonSuccess(data, 201);
});
