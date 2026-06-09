import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  verifyAdminToken,
  getAuthToken,
  getRefreshToken,
  refreshAccessToken,
  type SessionTokens,
} from './lib/auth';

const COOKIE_OPTIONS_ACCESS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 60 * 60 * 24, // 24 hours
  path: '/',
};

const COOKIE_OPTIONS_REFRESH = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 60 * 60 * 24 * 30, // 30 days
  path: '/',
};

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

    // access_token を取得
    let token = getAuthToken(request);
    let refreshedTokens: SessionTokens | null = null;

    // access_token が存在し、admin として有効か検証
    let adminUser = token ? await verifyAdminToken(token) : null;

    // access_token が無効/期限切れの場合、refresh_token で更新を試みる
    if (!adminUser) {
      const refreshToken = getRefreshToken(request);
      if (refreshToken) {
        const newTokens = await refreshAccessToken(refreshToken);
        if (newTokens) {
          const refreshedAdminUser = await verifyAdminToken(newTokens.accessToken);
          if (refreshedAdminUser) {
            adminUser = refreshedAdminUser;
            refreshedTokens = newTokens;
            token = newTokens.accessToken;
          }
        }
      }
    }

    if (!adminUser) {
      // 認証失敗 - APIは401、ページはログインへリダイレクト
      const failureResponse = isAdminApi
        ? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        : NextResponse.redirect(
            (() => {
              const loginUrl = new URL('/admin/login', request.url);
              loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
              return loginUrl;
            })()
          );
      // 期限切れの可能性が高いので Cookie をクリア
      failureResponse.cookies.delete('auth-token');
      failureResponse.cookies.delete('auth-refresh-token');
      return failureResponse;
    }

    // 管理者情報をヘッダーに追加（後続の処理で使用可能）
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-admin-user-id', adminUser.id);
    requestHeaders.set('x-admin-email', adminUser.email);
    requestHeaders.set('x-admin-role', adminUser.role || 'admin');

    // refresh した場合、後続ハンドラーが新しい token を読めるよう Cookie ヘッダーも更新
    if (refreshedTokens) {
      const oldCookie = requestHeaders.get('cookie') || '';
      let updatedCookie = oldCookie;
      // auth-token を更新
      if (/auth-token=[^;]+/.test(oldCookie)) {
        updatedCookie = updatedCookie.replace(/auth-token=[^;]+/, `auth-token=${refreshedTokens.accessToken}`);
      } else {
        updatedCookie = updatedCookie
          ? `${updatedCookie}; auth-token=${refreshedTokens.accessToken}`
          : `auth-token=${refreshedTokens.accessToken}`;
      }
      // auth-refresh-token を更新
      if (/auth-refresh-token=[^;]+/.test(updatedCookie)) {
        updatedCookie = updatedCookie.replace(
          /auth-refresh-token=[^;]+/,
          `auth-refresh-token=${refreshedTokens.refreshToken}`
        );
      } else {
        updatedCookie = `${updatedCookie}; auth-refresh-token=${refreshedTokens.refreshToken}`;
      }
      requestHeaders.set('cookie', updatedCookie);
    }

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    // refresh した場合、ブラウザにも新 Cookie を返す
    if (refreshedTokens) {
      response.cookies.set('auth-token', refreshedTokens.accessToken, COOKIE_OPTIONS_ACCESS);
      response.cookies.set('auth-refresh-token', refreshedTokens.refreshToken, COOKIE_OPTIONS_REFRESH);
    }

    return response;
  }

  return NextResponse.next();
}

export const config = {
  // F36: /api/users/:path* を CSRF Origin チェック対象に追加。
  // 認証本体（所有者一致チェック）は各 route ハンドラ内で実施する。
  matcher: ['/admin/:path*', '/api/admin/:path*', '/api/payment/:path*', '/api/contact/:path*', '/api/checkout', '/api/users/:path*']
};
