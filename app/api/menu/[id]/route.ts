import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseAdapter } from '@/lib/db-adapter';

// 公開API - 認証不要
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDatabaseAdapter();
    const item = await db.menu.getById(id);
    
    if (!item) {
      return NextResponse.json(
        { message: 'メニューが見つかりません' },
        { status: 404 }
      );
    }
    
    // フロントエンド用に整形
    const formattedItem = {
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      calories: item.calories,
      protein: item.protein,
      fat: item.fat,
      carbs: item.carbs,
      image: item.images && item.images.length > 0 ? item.images[0] : '/default-bento.jpeg',
      images: item.images,
      features: item.features,
      ingredients: item.ingredients,
      allergens: item.allergens,
      stock: item.stock
    };
    
    return NextResponse.json(formattedItem);
  } catch (error) {
    console.error('Menu item fetch error:', error);
    return NextResponse.json(
      { message: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}