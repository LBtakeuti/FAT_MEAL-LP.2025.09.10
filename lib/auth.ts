import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from './supabase';

export interface AdminUser {
  id: string;
  email: string;
  role?: string;
}

// 有効な管理者ロール
const ADMIN_ROLES = ['admin', 'super_admin'];

/**
 * Supabase認証を使用してユーザーを認証
 * @param email メールアドレス
 * @param password パスワード
 * @returns 認証成功時はユーザー情報、失敗時はnull
 */
export async function authenticateUser(email: string, password: string): Promise<AdminUser | null> {
  try {
    const supabase = createServerClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('認証エラー:', error.message);
      return null;
    }

    if (!data.user) {
      return null;
    }

    // app_metadataからロールを取得
    const role = data.user.app_metadata?.role;

    return {
      id: data.user.id,
      email: data.user.email || email,
      role: role,
    };
  } catch (error) {
    console.error('認証処理エラー:', error);
    return null;
  }
}

/**
 * メールアドレスで管理者かどうかを確認
 * @param email メールアドレス
 * @returns 管理者情報またはnull
 */
export async function checkIsAdminByEmail(email: string): Promise<AdminUser | null> {
  try {
    const supabase = createServerClient();

    // メールアドレスでユーザーを検索
    // perPage デフォルト 50 のため、auth.users 件数が増えると最古ユーザーが
    // リストから漏れて 403 になる障害があった。1000 に拡張して回避。
    const { data: users, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });

    if (error) {
      console.error('ユーザー検索エラー:', error);
      return null;
    }

    const user = users.users.find((u) => u.email === email);

    if (!user) {
      return null;
    }

    const role = user.app_metadata?.role;

    // ロールが管理者でない場合はnull
    if (!role || !ADMIN_ROLES.includes(role)) {
      return null;
    }

    return {
      id: user.id,
      email: user.email || '',
      role: role,
    };
  } catch (error) {
    console.error('管理者チェックエラー:', error);
    return null;
  }
}

/**
 * Supabaseセッショントークン（access + refresh）を取得
 */
export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

export async function getSessionTokens(email: string, password: string): Promise<SessionTokens | null> {
  try {
    const supabase = createServerClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      console.error('セッション取得エラー:', error?.message);
      return null;
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    };
  } catch (error) {
    console.error('セッション取得エラー:', error);
    return null;
  }
}

/**
 * リフレッシュトークンを使って access_token を更新
 * Supabase はリフレッシュ時に refresh_token もローテーションする
 */
export async function refreshAccessToken(refreshToken: string): Promise<SessionTokens | null> {
  try {
    const supabase = createServerClient();

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      console.error('リフレッシュトークン更新エラー:', error?.message);
      return null;
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    };
  } catch (error) {
    console.error('リフレッシュトークン更新エラー:', error);
    return null;
  }
}

/**
 * トークンを検証してユーザー情報を取得（内部利用）
 * @param token アクセストークン
 * @returns ユーザー情報
 */
async function verifyToken(token: string): Promise<AdminUser | null> {
  try {
    const supabase = createServerClient();

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return null;
    }

    return {
      id: data.user.id,
      email: data.user.email || '',
      role: data.user.app_metadata?.role,
    };
  } catch (error) {
    console.error('トークン検証エラー:', error);
    return null;
  }
}

/**
 * トークンから管理者情報を検証（ミドルウェア用）
 * @param token アクセストークン
 * @returns 管理者ユーザー情報またはnull
 */
export async function verifyAdminToken(token: string): Promise<AdminUser | null> {
  try {
    const supabase = createServerClient();

    // トークンからユーザー情報を取得
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      return null;
    }

    const role = userData.user.app_metadata?.role;

    // ロールが管理者でない場合はnull
    if (!role || !ADMIN_ROLES.includes(role)) {
      return null;
    }

    return {
      id: userData.user.id,
      email: userData.user.email || '',
      role: role,
    };
  } catch (error) {
    console.error('管理者トークン検証エラー:', error);
    return null;
  }
}

/**
 * リクエストから認証トークン（access_token）を取得
 * Cookie `auth-token`（管理者ログインが発行）を優先し、
 * 無ければ `Authorization: Bearer <token>` ヘッダから取得する（お客様の Supabase access_token 用）。
 */
export function getAuthToken(req: NextRequest): string | undefined {
  const cookie = req.cookies.get('auth-token')?.value;
  if (cookie) {
    return cookie;
  }

  const bearer = req.headers.get('authorization');
  if (bearer?.startsWith('Bearer ')) {
    return bearer.slice(7);
  }

  return undefined;
}

/**
 * リクエストから refresh_token を取得
 */
export function getRefreshToken(req: NextRequest): string | undefined {
  return req.cookies.get('auth-refresh-token')?.value;
}

/**
 * 認証Cookie（access + refresh）両方をセット
 */
export function setAuthCookies(res: NextResponse, tokens: SessionTokens): void {
  res.cookies.set('auth-token', tokens.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });
  res.cookies.set('auth-refresh-token', tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });
}

/**
 * 認証Cookie（access + refresh）両方をクリア
 */
export function clearAuthCookie(res: NextResponse): void {
  res.cookies.delete('auth-token');
  res.cookies.delete('auth-refresh-token');
}

/**
 * Supabaseからサインアウト
 */
export async function signOut(): Promise<void> {
  try {
    const supabase = createServerClient();
    await supabase.auth.signOut();
  } catch (error) {
    console.error('サインアウトエラー:', error);
  }
}

/**
 * 認証結果の型定義
 */
export interface AuthResult {
  authenticated: boolean;
  user?: AdminUser;
}

/**
 * リクエストの認証を検証
 * @param req NextRequest
 * @returns 認証結果
 */
export async function verifyAuth(req: NextRequest): Promise<AuthResult> {
  const token = getAuthToken(req);

  if (!token) {
    return { authenticated: false };
  }

  const user = await verifyToken(token);

  if (!user) {
    return { authenticated: false };
  }

  return { authenticated: true, user };
}
