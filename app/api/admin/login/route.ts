import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, generateToken, setAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { message: 'ユーザー名とパスワードは必須です' },
        { status: 400 }
      );
    }

    const user = await authenticateUser(username, password);

    if (!user) {
      return NextResponse.json(
        { message: 'ユーザー名またはパスワードが正しくありません' },
        { status: 401 }
      );
    }

    const token = await generateToken(user);
    const response = NextResponse.json(
      { message: 'ログイン成功', user },
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