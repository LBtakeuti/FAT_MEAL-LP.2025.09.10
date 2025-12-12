import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('menu_items')
      .select('id, name, main_image, sub_images, stock, price, is_active')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Inventory fetch error:', error);
      return NextResponse.json(
        { message: 'サーバーエラーが発生しました' },
        { status: 500 }
      );
    }

    // フロントエンドに合わせた形式に変換
    const inventory = (data || []).map(item => ({
      id: item.id,
      name: item.name,
      images: [item.main_image, ...(item.sub_images || [])].filter(Boolean),
      stock: item.stock || 0,
      price: `¥${(item.price || 0).toLocaleString()}`,
      isActive: item.is_active
    }));

    return NextResponse.json(inventory);
  } catch (error) {
    console.error('Inventory fetch error:', error);
    return NextResponse.json(
      { message: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
