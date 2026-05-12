import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import {
  withAuthDynamic,
  jsonSuccess,
  jsonNotFound,
  jsonBadRequest,
  handleSupabaseError,
  validateBody,
} from '@/lib/api-helpers';
import { REVIEW_ICON_PRESETS, type ReviewIconPreset } from '@/types/review';

const isValidPreset = (p: unknown): p is ReviewIconPreset =>
  typeof p === 'string' && (REVIEW_ICON_PRESETS as string[]).includes(p);

// GET: レビュー詳細取得
export const GET = withAuthDynamic(async (_request: NextRequest, context) => {
  const { id } = await context.params;
  const supabase = createServerClient() as any;

  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return jsonNotFound('レビューが見つかりません');
  }

  return jsonSuccess(data);
});

// PUT: レビュー更新
export const PUT = withAuthDynamic(async (request: NextRequest, context) => {
  const { id } = await context.params;
  const body = await request.json();

  const validation = validateBody(body, {
    name: { required: true, type: 'string', max: 30 },
    comment: { required: true, type: 'string', max: 200 },
    rating: { required: true, type: 'number', min: 1, max: 5 },
  });

  if (!validation.valid) {
    return jsonBadRequest(validation.errors.join(', '));
  }

  const iconUrl = body.icon_url || null;
  const iconPreset = isValidPreset(body.icon_preset) ? body.icon_preset : null;

  if (!iconUrl && !iconPreset) {
    return jsonBadRequest('アイコン画像（アップロード）またはプリセットアバターのいずれかを選択してください');
  }

  const supabase = createServerClient() as any;

  const updateData = {
    icon_url: iconUrl,
    icon_preset: iconPreset,
    name: body.name,
    comment: body.comment,
    rating: body.rating,
    sort_order: body.sort_order ?? 0,
    is_active: body.is_active ?? true,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from('reviews')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    return handleSupabaseError(error || { message: 'Not found' }, 'レビュー更新');
  }

  return jsonSuccess(data);
});

// DELETE: レビュー削除
export const DELETE = withAuthDynamic(async (_request: NextRequest, context) => {
  const { id } = await context.params;
  const supabase = createServerClient() as any;

  const { error } = await supabase.from('reviews').delete().eq('id', id);

  if (error) {
    return handleSupabaseError(error, 'レビュー削除');
  }

  return jsonSuccess({ message: '削除しました' });
});
