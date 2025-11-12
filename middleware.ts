import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, getAuthToken } from './lib/auth';

export async function middleware(request: NextRequest) {
  // 環境変数で認証の有効/無効を切り替え
  const authEnabled = process.env.ENABLE_AUTH !== 'false';
  
  if (!authEnabled) {
    console.warn('⚠️  認証が無効になっています。本番環境では必ずENABLE_AUTH環境変数を削除してください。');
    return NextResponse.next();
  }
  
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
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    const user = await verifyToken(token);
    if (!user) {
      // トークンが無効な場合はログインページへリダイレクト
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*'
};