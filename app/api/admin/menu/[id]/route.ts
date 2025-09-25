import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseAdapter } from '@/lib/db-adapter';

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
        { message: 'アイテムが見つかりません' },
        { status: 404 }
      );
    }
    return NextResponse.json(item);
  } catch (error) {
    console.error('Menu item fetch error:', error);
    return NextResponse.json(
      { message: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDatabaseAdapter();
    const data = await request.json();
    const success = await db.menu.update(id, data);
    
    if (!success) {
      return NextResponse.json(
        { message: 'アイテムが見つかりません' },
        { status: 404 }
      );
    }
    
    const updatedItem = await db.menu.getById(id);
    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('Menu item update error:', error);
    return NextResponse.json(
      { message: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDatabaseAdapter();
    const success = await db.menu.delete(id);
    
    if (!success) {
      return NextResponse.json(
        { message: 'アイテムが見つかりません' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { message: '削除しました' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Menu item delete error:', error);
    return NextResponse.json(
      { message: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}