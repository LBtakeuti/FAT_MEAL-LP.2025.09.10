import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseAdapter } from '@/lib/db-adapter';

export async function GET(request: NextRequest) {
  try {
    const dbAdapter = await getDatabaseAdapter();
    
    // Supabase APIが利用可能な場合
    if (dbAdapter.news && dbAdapter.news.getAll) {
      const newsItems = await dbAdapter.news.getAll();
      return NextResponse.json(newsItems);
    }
    
    // フォールバック: メモリDBを使用
    const { db } = await import('@/lib/db');
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
    const dbAdapter = await getDatabaseAdapter();
    
    const newsData = {
      title: data.title,
      date: data.date,
      category: data.category || '',
      excerpt: data.excerpt,
      content: data.content,
      image: data.image,
      isPublished: data.isPublished,
      publishedAt: data.isPublished ? new Date().toISOString() : undefined,
    };
    
    // Supabase APIが利用可能な場合
    if (dbAdapter.news && dbAdapter.news.create) {
      const newItem = await dbAdapter.news.create(newsData);
      return NextResponse.json(newItem, { status: 201 });
    }
    
    // フォールバック: メモリDBを使用
    const { db } = await import('@/lib/db');
    const newItem = db.createNewsItem(newsData);
    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error('Failed to create news:', error);
    return NextResponse.json(
      { message: 'ニュースの作成に失敗しました' },
      { status: 500 }
    );
  }
}