import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseAdapter } from '@/lib/db-adapter';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dbAdapter = await getDatabaseAdapter();
    
    let item;
    if (dbAdapter.news && dbAdapter.news.getById) {
      item = await dbAdapter.news.getById(id);
    } else {
      const { db } = await import('@/lib/db');
      item = db.getNewsItem(id);
    }
    
    if (!item) {
      return NextResponse.json(
        { message: 'ニュースが見つかりません' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(item);
  } catch (error) {
    console.error('Failed to fetch news:', error);
    return NextResponse.json(
      { message: 'ニュースの取得に失敗しました' },
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
    const data = await request.json();
    const dbAdapter = await getDatabaseAdapter();
    
    const updateData = {
      title: data.title,
      date: data.date,
      category: data.category,
      excerpt: data.excerpt,
      content: data.content,
      image: data.image,
      isPublished: data.isPublished,
      publishedAt: data.isPublished ? new Date().toISOString() : undefined,
    };
    
    let updatedItem;
    if (dbAdapter.news && dbAdapter.news.update) {
      updatedItem = await dbAdapter.news.update(id, updateData);
    } else {
      const { db } = await import('@/lib/db');
      updatedItem = db.updateNewsItem(id, updateData);
    }
    
    if (!updatedItem) {
      return NextResponse.json(
        { message: 'ニュースが見つかりません' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('Failed to update news:', error);
    return NextResponse.json(
      { message: 'ニュースの更新に失敗しました' },
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
    const dbAdapter = await getDatabaseAdapter();
    
    let success;
    if (dbAdapter.news && dbAdapter.news.delete) {
      success = await dbAdapter.news.delete(id);
    } else {
      const { db } = await import('@/lib/db');
      success = db.deleteNewsItem(id);
    }
    
    if (!success) {
      return NextResponse.json(
        { message: 'ニュースが見つかりません' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: '削除しました' });
  } catch (error) {
    console.error('Failed to delete news:', error);
    return NextResponse.json(
      { message: 'ニュースの削除に失敗しました' },
      { status: 500 }
    );
  }
}