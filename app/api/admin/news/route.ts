import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const newsItems = db.getAllNewsItems();
    return NextResponse.json(newsItems);
  } catch (error) {
    console.error('Failed to fetch news:', error);
    return NextResponse.json(
      { message: 'ニュースの取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const newItem = db.createNewsItem({
      title: data.title,
      date: data.date,
      category: data.category || '',
      excerpt: data.excerpt,
      content: data.content,
      image: data.image,
      isPublished: data.isPublished,
      publishedAt: data.isPublished ? new Date().toISOString() : undefined,
    });
    
    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error('Failed to create news:', error);
    return NextResponse.json(
      { message: 'ニュースの作成に失敗しました' },
      { status: 500 }
    );
  }
}