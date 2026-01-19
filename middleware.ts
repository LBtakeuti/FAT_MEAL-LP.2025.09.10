import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAdminToken, getAuthToken } from './lib/auth';

export async function middleware(request: NextRequest) {
  // 環境変数で認証の有効/無効を切り替え
  const authEnabled = process.env.ENABLE_AUTH !== 'false';

  if (!authEnabled) {
    console.warn('認証が無効になっています。本番環境では必ずENABLE_AUTH環境変数を削除してください。');
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

    // トークンを検証し、管理者テーブルも確認
    const adminUser = await verifyAdminToken(token);

    if (!adminUser) {
      // トークンが無効または管理者でない場合はログインページへリダイレクト
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
      loginUrl.searchParams.set('error', 'unauthorized');

      // 無効なトークンのCookieを削除
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('auth-token');
      return response;
    }

    // 管理者情報をヘッダーに追加（後続の処理で使用可能）
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-admin-user-id', adminUser.id);
    requestHeaders.set('x-admin-email', adminUser.email);
    requestHeaders.set('x-admin-role', adminUser.role || 'admin');

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*'
};
