import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 公開API - 認証不要
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 公開APIなのでanon keyを使用
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { message: 'Supabase設定が不足しています' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // UUIDかスラッグかを判定
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    let data: any, error;
    if (isUUID) {
      const result = await supabase
        .from('menu_items')
        .select('*')
        .eq('id', id)
        .single();
      data = result.data;
      error = result.error;
    } else {
      const result = await supabase
        .from('menu_items')
        .select('*')
        .eq('slug', id)
        .single();
      data = result.data;
      error = result.error;
    }

    if (error || !data) {
      return NextResponse.json(
        { message: 'メニューが見つかりません' },
        { status: 404 }
      );
    }

    // フロント用にフィールド名を変換
    const menuItem = {
      id: data.slug || data.id,
      name: data.name,
      description: data.description,
      price: String(data.price),
      calories: String(data.calories),
      protein: String(data.protein),
      fat: String(data.fat),
      carbs: String(data.carbs),
      image: data.main_image,
      ingredients: data.ingredients || [],
      allergens: data.allergens || []
    };

    return NextResponse.json(menuItem);
  } catch (error) {
    console.error('Menu item fetch error:', error);
    return NextResponse.json(
      { message: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
