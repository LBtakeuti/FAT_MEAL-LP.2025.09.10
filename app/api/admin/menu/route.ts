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

// GET: メニュー一覧取得（認証不要）
export const GET = withErrorHandler(async () => {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    return handleSupabaseError(error, 'メニュー取得');
  }

  return jsonSuccess(data || []);
});

// POST: メニュー作成（認証必要）
export const POST = withAuth(async (request: NextRequest) => {
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

  const menuData = {
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
  };

  const { data, error } = await (supabase.from('menu_items') as any)
    .insert(menuData)
    .select()
    .single();

  if (error) {
    return handleSupabaseError(error, 'メニュー作成');
  }

  return jsonSuccess(data, 201);
});
