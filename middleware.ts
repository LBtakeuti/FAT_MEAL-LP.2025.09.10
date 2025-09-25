import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, getAuthToken } from './lib/auth';

export async function middleware(request: NextRequest) {
  // 一時的に認証を無効化（開発中のみ）
  return NextResponse.next();
  
  // 以下は将来的に有効化する認証コード
  /*
  // 管理画面へのアクセスをチェック
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // ログインページは除外
    if (request.nextUrl.pathname === '/admin/login') {
      return NextResponse.next();
    }

    // 認証トークンの確認
    const token = getAuthToken(request);
    
    if (!token) {
      // 認証されていない場合はログインページへリダイレクト
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    
    const user = await verifyToken(token);
    if (!user) {
      // トークンが無効な場合はログインページへリダイレクト
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
  */
}

export const config = {
  matcher: '/admin/:path*'
};