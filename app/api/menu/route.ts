import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
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

    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('メニュー取得エラー:', error);
      return NextResponse.json(
        { message: 'メニューの取得に失敗しました', error: error.message },
        { status: 500 }
      );
    }

    // フロント用にフィールド名を変換
    const menuItems = (data || []).map((item: any) => ({
      id: item.slug || item.id, // slugがあればslug、なければUUID
      name: item.name,
      description: item.description,
      price: String(item.price),
      calories: String(item.calories),
      protein: String(item.protein),
      fat: String(item.fat),
      carbs: String(item.carbs),
      image: item.main_image,
      ingredients: item.ingredients || [],
      allergens: item.allergens || []
    }));

    return NextResponse.json(menuItems);
  } catch (error: any) {
    console.error('Failed to fetch menu:', error);
    return NextResponse.json(
      { message: 'メニューの取得に失敗しました', error: error.message },
      { status: 500 }
    );
  }
}
