import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

/**
 * F36: 認証 + 所有者強制。
 * トークンから取得した user.id を常に正とし、リクエストの userId は無視する。
 * 未認証: 401。トークンの id とリクエストの id が一致しない場合: 403。
 */
async function requireAuth(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.authenticated || !auth.user) {
    return { error: NextResponse.json({ error: '認証が必要です' }, { status: 401 }) };
  }
  return { user: auth.user };
}

// GET: ユーザープロフィールを取得（認証ユーザー自身のみ）
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if ('error' in authResult) return authResult.error;
    const { user } = authResult;

    const requestedUserId = request.nextUrl.searchParams.get('userId');
    if (requestedUserId && requestedUserId !== user.id) {
      return NextResponse.json({ error: '他ユーザーのプロフィールは取得できません' }, { status: 403 });
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'プロフィールが見つかりません' }, { status: 404 });
      }
      console.error('Failed to fetch user profile:', error);
      return NextResponse.json({ error: 'プロフィールの取得に失敗しました' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}

// POST: ユーザープロフィールを作成（認証ユーザー自身のみ）
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if ('error' in authResult) return authResult.error;
    const { user } = authResult;

    const body = await request.json();
    // F36: userId/email/id はトークンから上書き。リクエスト値は信頼しない。
    const profileData: Record<string, unknown> = { ...body };
    delete profileData.userId;
    delete profileData.id;
    delete profileData.email;

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        id: user.id,
        email: user.email,
        ...profileData,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create user profile:', error);
      return NextResponse.json({ error: 'プロフィールの作成に失敗しました' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}

// PATCH: ユーザープロフィールを更新（認証ユーザー自身のみ）
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if ('error' in authResult) return authResult.error;
    const { user } = authResult;

    const body = await request.json();
    // F36: userId/email/id はトークンから上書き不可。
    const updateData: Record<string, unknown> = { ...body };
    delete updateData.userId;
    delete updateData.id;
    delete updateData.email;

    const supabase = createServerClient();
    const { data, error } = await (supabase
      .from('user_profiles') as any)
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update user profile:', error);
      return NextResponse.json({ error: 'プロフィールの更新に失敗しました' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}
