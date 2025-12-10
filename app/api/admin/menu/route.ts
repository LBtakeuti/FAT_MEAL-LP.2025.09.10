import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('メニュー取得エラー:', error);
      return NextResponse.json(
        { message: 'メニューの取得に失敗しました', error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Failed to fetch menu items:', error);
    return NextResponse.json(
      { message: 'メニューの取得に失敗しました', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { message: '認証が必要です' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const supabase = createServerClient();
    
    // バリデーション
    if (!body.name || !body.calories || body.protein === undefined || body.fat === undefined || body.carbs === undefined) {
      return NextResponse.json(
        { message: '必須項目が不足しています' },
        { status: 400 }
      );
    }
    
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
    
    const { data, error } = await (supabase
      .from('menu_items') as any)
      .insert(menuData)
      .select()
      .single();
    
    if (error) {
      console.error('メニュー作成エラー:', error);
      return NextResponse.json(
        { message: 'メニューの作成に失敗しました', error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create menu item:', error);
    return NextResponse.json(
      { message: 'メニューの作成に失敗しました', error: error.message },
      { status: 500 }
    );
  }
}
