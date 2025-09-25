import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const menuItems = db.getAllMenuItems();
    const newsItems = db.getAllNewsItems();
    
    const totalStock = menuItems.reduce((sum, item) => sum + item.stock, 0);
    const lowStockItems = menuItems.filter(item => item.stock <= 50).length;
    
    const stats = {
      totalMenuItems: menuItems.length,
      totalStock,
      totalNews: newsItems.length,
      lowStockItems
    };
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { message: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}