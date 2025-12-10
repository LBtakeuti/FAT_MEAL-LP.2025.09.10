import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) {
      console.error('ニュース取得エラー:', error);
      return NextResponse.json(
        { message: 'ニュースの取得に失敗しました', error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Failed to fetch news:', error);
    return NextResponse.json(
      { message: 'ニュースの取得に失敗しました', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { message: '認証が必要です' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const supabase = createServerClient();
    
    // バリデーション
    if (!body.title || !body.content) {
      return NextResponse.json(
        { message: 'タイトルと本文は必須です' },
        { status: 400 }
      );
    }
    
    const newsData = {
      title: body.title,
      content: body.content,
      date: body.date || new Date().toISOString().split('T')[0],
      category: body.category || null,
      image: body.image || null,
      excerpt: body.excerpt || null,
      summary: body.summary || null,
    };
    
    const { data, error } = await (supabase
      .from('news') as any)
      .insert(newsData)
      .select()
      .single();
    
    if (error) {
      console.error('ニュース作成エラー:', error);
      return NextResponse.json(
        { message: 'ニュースの作成に失敗しました', error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create news:', error);
    return NextResponse.json(
      { message: 'ニュースの作成に失敗しました', error: error.message },
      { status: 500 }
    );
  }
}