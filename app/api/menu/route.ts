import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // 公開中のメニューのみ取得、表示順でソート
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('メニュー取得エラー:', error);
      // エラー時は空配列を返す（フロントエンドで静的データを使用）
      return NextResponse.json([]);
    }
    
    // MenuSectionで期待される形式に変換
    const formattedData = (data || []).map(item => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      price: item.price?.toString() || '',
      calories: item.calories.toString(),
      protein: item.protein.toString(),
      fat: item.fat.toString(),
      carbs: item.carbs.toString(),
      image: item.main_image || '/placeholder.jpg',
    }));
    
    return NextResponse.json(formattedData);
  } catch (error: any) {
    console.error('Failed to fetch menu:', error);
    // エラー時は空配列を返す（フロントエンドで静的データを使用）
    return NextResponse.json([]);
  }
}
