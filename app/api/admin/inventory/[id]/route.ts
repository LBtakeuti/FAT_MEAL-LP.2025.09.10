import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { stock } = await request.json();
    
    if (typeof stock !== 'number' || stock < 0) {
      return NextResponse.json(
        { message: '在庫数は0以上の数値である必要があります' },
        { status: 400 }
      );
    }
    
    const item = db.getMenuItem(params.id);
    if (!item) {
      return NextResponse.json(
        { message: 'アイテムが見つかりません' },
        { status: 404 }
      );
    }
    
    // 在庫数のみ更新
    const updatedItem = db.updateMenuItem(params.id, { stock });
    
    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('Stock update error:', error);
    return NextResponse.json(
      { message: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}