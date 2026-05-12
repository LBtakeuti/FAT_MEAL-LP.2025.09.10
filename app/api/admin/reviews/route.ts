import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import {
  withAuth,
  jsonSuccess,
  jsonBadRequest,
  handleSupabaseError,
  validateBody,
} from '@/lib/api-helpers';
import { REVIEW_ICON_PRESETS, type ReviewIconPreset } from '@/types/review';

const isValidPreset = (p: unknown): p is ReviewIconPreset =>
  typeof p === 'string' && (REVIEW_ICON_PRESETS as string[]).includes(p);

// GET: レビュー一覧（管理用・全件）
export const GET = withAuth(async () => {
  const supabase = createServerClient() as any;

  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    return handleSupabaseError(error, 'レビュー取得');
  }

  return jsonSuccess(data || []);
});

// POST: レビュー新規作成
export const POST = withAuth(async (request: NextRequest) => {
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

  const reviewData = {
    icon_url: iconUrl,
    icon_preset: iconPreset,
    name: body.name,
    comment: body.comment,
    rating: body.rating,
    sort_order: body.sort_order ?? 0,
    is_active: body.is_active ?? true,
  };

  const { data, error } = await supabase.from('reviews')
    .insert(reviewData)
    .select()
    .single();

  if (error) {
    return handleSupabaseError(error, 'レビュー作成');
  }

  return jsonSuccess(data, 201);
});
