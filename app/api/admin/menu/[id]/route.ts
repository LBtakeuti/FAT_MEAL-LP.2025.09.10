import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import {
  withAuthDynamic,
  withErrorHandlerDynamic,
  jsonSuccess,
  jsonNotFound,
  jsonBadRequest,
  handleSupabaseError,
  validateBody,
} from '@/lib/api-helpers';

// GET: メニュー詳細取得（認証不要）
export const GET = withErrorHandlerDynamic(async (_request: NextRequest, context) => {
  const { id } = await context.params;
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return jsonNotFound('メニューが見つかりません');
  }

  return jsonSuccess(data);
});

// PUT: メニュー更新（認証必要）
export const PUT = withAuthDynamic(async (request: NextRequest, context) => {
  const { id } = await context.params;
  const body = await request.json();

  // バリデーション
  const validation = validateBody(body, {
    name: { required: true, type: 'string' },
    calories: { required: true },
    protein: { required: true },
    fat: { required: true },
    carbs: { required: true },
  });

  if (!validation.valid) {
    return jsonBadRequest(validation.errors.join(', '));
  }

  const supabase = createServerClient();

  const updateData = {
    name: body.name,
    description: body.description || null,
    price: body.price || null,
    calories: parseInt(body.calories),
    protein: parseFloat(body.protein),
    fat: parseFloat(body.fat),
    carbs: parseFloat(body.carbs),
    main_image: body.main_image || null,
    sub_images: body.sub_images || [],
    ingredients: body.ingredients || [],
    allergens: body.allergens || [],
    is_active: body.is_active !== false,
    display_order: body.display_order || 0,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await (supabase.from('menu_items') as any)
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    return handleSupabaseError(error || { message: 'Not found' }, 'メニュー更新');
  }

  return jsonSuccess(data);
});

// DELETE: メニュー削除（認証必要）
export const DELETE = withAuthDynamic(async (_request: NextRequest, context) => {
  const { id } = await context.params;
  const supabase = createServerClient();

  const { error } = await supabase.from('menu_items').delete().eq('id', id);

  if (error) {
    return handleSupabaseError(error, 'メニュー削除');
  }

  return jsonSuccess({ message: '削除しました' });
});
