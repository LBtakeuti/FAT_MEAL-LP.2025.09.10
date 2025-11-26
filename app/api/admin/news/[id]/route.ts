import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) {
      return NextResponse.json(
        { message: 'ニュースが見つかりません' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Failed to fetch news:', error);
    return NextResponse.json(
      { message: 'ニュースの取得に失敗しました', error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 認証チェック
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { message: '認証が必要です' },
        { status: 401 }
      );
    }
    
    const { id } = await params;
    const body = await request.json();
    const supabase = createServerClient();
    
    // バリデーション
    if (!body.title || !body.content) {
      return NextResponse.json(
        { message: 'タイトルと本文は必須です' },
        { status: 400 }
      );
    }
    
    const updateData = {
      title: body.title,
      content: body.content,
      date: body.date || new Date().toISOString().split('T')[0],
      category: body.category || null,
      image: body.image || null,
      excerpt: body.excerpt || null,
      summary: body.summary || null,
      updated_at: new Date().toISOString(),
    };
    
    const { data, error } = await supabase
      .from('news')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error || !data) {
      return NextResponse.json(
        { message: 'ニュースの更新に失敗しました', error: error?.message },
        { status: 404 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Failed to update news:', error);
    return NextResponse.json(
      { message: 'ニュースの更新に失敗しました', error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 認証チェック
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { message: '認証が必要です' },
        { status: 401 }
      );
    }
    
    const { id } = await params;
    const supabase = createServerClient();
    
    const { error } = await supabase
      .from('news')
      .delete()
      .eq('id', id);
    
    if (error) {
      return NextResponse.json(
        { message: 'ニュースの削除に失敗しました', error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ message: '削除しました' });
  } catch (error: any) {
    console.error('Failed to delete news:', error);
    return NextResponse.json(
      { message: 'ニュースの削除に失敗しました', error: error.message },
      { status: 500 }
    );
  }
}