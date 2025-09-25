import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = db.getNewsItem(id);
    
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
    
    const updatedItem = db.updateNewsItem(id, {
      title: data.title,
      date: data.date,
      category: data.category,
      excerpt: data.excerpt,
      content: data.content,
      image: data.image,
      isPublished: data.isPublished,
      publishedAt: data.isPublished ? new Date().toISOString() : undefined,
    });
    
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
    const success = db.deleteNewsItem(id);
    
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