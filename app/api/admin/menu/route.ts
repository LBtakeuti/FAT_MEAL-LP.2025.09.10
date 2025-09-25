import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseAdapter } from '@/lib/db-adapter';

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabaseAdapter();
    const menuItems = await db.menu.getAll();
    return NextResponse.json(menuItems);
  } catch (error) {
    console.error('Menu fetch error:', error);
    return NextResponse.json(
      { message: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDatabaseAdapter();
    const data = await request.json();
    const newItem = await db.menu.create({
      ...data,
      stock: data.stock || 300 // デフォルト在庫数
    });
    
    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error('Menu create error:', error);
    return NextResponse.json(
      { message: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}