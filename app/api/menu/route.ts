import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseAdapter } from '@/lib/db-adapter';

// リトライロジック付きのデータベースアクセス
async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.warn(`Retry ${i + 1}/${maxRetries} failed:`, error);
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)));
      }
    }
  }
  
  throw lastError;
}

// 公開API - 認証不要
export async function GET(request: NextRequest) {
  try {
    const db = await getDatabaseAdapter();
    const menuItems = await fetchWithRetry(() => db.menu.getAll());
    
    // フロントエンド用に整形
    const formattedItems = menuItems.map((item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      calories: item.calories,
      protein: item.protein,
      fat: item.fat,
      carbs: item.carbs,
      image: item.images && item.images.length > 0 ? item.images[0] : '/bento_1.jpeg',
      images: item.images,
      features: item.features,
      ingredients: item.ingredients,
      allergens: item.allergens,
      stock: item.stock
    }));
    
    return NextResponse.json(formattedItems);
  } catch (error) {
    console.error('Menu fetch error:', error);
    return NextResponse.json(
      { message: 'サーバーエラーが発生しました。しばらくしてから再度お試しください。' },
      { status: 500 }
    );
  }
}