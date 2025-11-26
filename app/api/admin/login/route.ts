import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, getSessionToken, setAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: 'メールアドレスとパスワードは必須です' },
        { status: 400 }
      );
    }

    // Supabase認証でユーザーを検証
    const user = await authenticateUser(email, password);

    if (!user) {
      return NextResponse.json(
        { message: 'メールアドレスまたはパスワードが正しくありません' },
        { status: 401 }
      );
    }

    // セッショントークンを取得
    const token = await getSessionToken(email, password);

    if (!token) {
      return NextResponse.json(
        { message: 'セッション作成に失敗しました' },
        { status: 500 }
      );
    }

    const response = NextResponse.json(
      { 
        message: 'ログイン成功', 
        user: {
          id: user.id,
          email: user.email
        }
      },
      { status: 200 }
    );

    setAuthCookie(response, token);
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}