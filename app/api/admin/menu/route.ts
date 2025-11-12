import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseAdapter } from '@/lib/db-adapter';

// リトライロジック付きのデータベースアクセス
async function executeWithRetry<T>(
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

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabaseAdapter();
    const menuItems = await executeWithRetry(() => db.menu.getAll());
    return NextResponse.json(menuItems);
  } catch (error) {
    console.error('Menu fetch error:', error);
    return NextResponse.json(
      { message: 'サーバーエラーが発生しました。しばらくしてから再度お試しください。' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDatabaseAdapter();
    const data = await request.json();
    const newItem = await executeWithRetry(() => db.menu.create({
      ...data,
      stock: data.stock || 300 // デフォルト在庫数
    }));
    
    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error('Menu create error:', error);
    return NextResponse.json(
      { message: 'メニューの作成に失敗しました。しばらくしてから再度お試しください。' },
      { status: 500 }
    );
  }
}