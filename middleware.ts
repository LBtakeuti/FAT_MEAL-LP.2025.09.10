import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAdminToken, getAuthToken } from './lib/auth';

export async function middleware(request: NextRequest) {
  // 認証は常に有効。無効化は開発環境でのみ ENABLE_AUTH=disabled_for_dev で可能
  const authDisabled = process.env.ENABLE_AUTH === 'disabled_for_dev' && process.env.NODE_ENV === 'development';

  if (authDisabled) {
    console.warn('[DEV ONLY] 認証が無効になっています');
    return NextResponse.next();
  }

  // CSRF保護: POST/PATCH/DELETE リクエストのOrigin検証（Webhook除外）
  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(request.method)) {
    const isWebhook = request.nextUrl.pathname.startsWith('/api/webhook/');
    if (!isWebhook) {
      const origin = request.headers.get('origin');
      const host = request.headers.get('host');
      if (origin && host) {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
    }
  }

  // 管理画面・管理APIへのアクセスをチェック
  const isAdminPage = request.nextUrl.pathname.startsWith('/admin');
  const isAdminApi = request.nextUrl.pathname.startsWith('/api/admin');
  
  if (isAdminPage || isAdminApi) {
    // ログインページとログインAPIは除外
    if (request.nextUrl.pathname === '/admin/login' || request.nextUrl.pathname === '/api/admin/login') {
      return NextResponse.next();
    }

    // バナーAPIのGETは認証不要（フロント表示用）
    const isBannerGet = request.method === 'GET' &&
      (request.nextUrl.pathname === '/api/admin/banner' ||
       request.nextUrl.pathname === '/api/admin/banner/mobile');
    if (isBannerGet) {
      return NextResponse.next();
    }

    // 認証トークンの確認
    const token = getAuthToken(request);

    if (!token) {
      // APIの場合は401を返す、ページの場合はリダイレクト
      if (isAdminApi) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    // トークンを検証し、管理者テーブルも確認
    const adminUser = await verifyAdminToken(token);

    if (!adminUser) {
      // APIの場合は401を返す、ページの場合はリダイレクト
      if (isAdminApi) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
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
  matcher: ['/admin/:path*', '/api/admin/:path*', '/api/payment/:path*', '/api/contact/:path*', '/api/checkout']
};
