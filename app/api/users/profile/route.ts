import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET: ユーザープロフィールを取得
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'ユーザーIDが必要です' },
        { status: 400 }
      );
    }

    // 認証チェック（簡易版 - クライアント側でSupabase Authを使用しているため、RLSで保護）
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      // プロフィールが存在しない場合（PGRST116は「行が見つからない」エラー）
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'プロフィールが見つかりません' },
          { status: 404 }
        );
      }
      console.error('Failed to fetch user profile:', error);
      return NextResponse.json(
        { error: 'プロフィールの取得に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

// POST: ユーザープロフィールを作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, ...profileData } = body;

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'ユーザーIDとメールアドレスが必要です' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        email,
        ...profileData,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create user profile:', error);
      return NextResponse.json(
        { error: 'プロフィールの作成に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

// PATCH: ユーザープロフィールを更新
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, ...updateData } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'ユーザーIDが必要です' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data, error } = await (supabase
      .from('user_profiles') as any)
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update user profile:', error);
      return NextResponse.json(
        { error: 'プロフィールの更新に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

