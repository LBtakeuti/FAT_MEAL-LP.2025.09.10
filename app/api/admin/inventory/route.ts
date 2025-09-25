import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const menuItems = db.getAllMenuItems();
    // 在庫管理に必要な情報のみを返す
    const inventory = menuItems.map(item => ({
      id: item.id,
      name: item.name,
      images: item.images,
      stock: item.stock,
      price: item.price
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