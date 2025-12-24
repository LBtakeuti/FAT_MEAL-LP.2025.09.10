import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from './supabase';

export interface AdminUser {
  id: string;
  email: string;
}

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

    return {
      id: data.user.id,
      email: data.user.email || email,
    };
  } catch (error) {
    console.error('認証処理エラー:', error);
    return null;
  }
}

/**
 * Supabaseセッショントークンを取得
 * @param email メールアドレス
 * @param password パスワード
 * @returns セッショントークン
 */
export async function getSessionToken(email: string, password: string): Promise<string | null> {
  try {
    const supabase = createServerClient();
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      return null;
    }

    return data.session.access_token;
  } catch (error) {
    console.error('セッション取得エラー:', error);
    return null;
  }
}

/**
 * トークンを検証してユーザー情報を取得
 * @param token アクセストークン
 * @returns ユーザー情報
 */
export async function verifyToken(token: string): Promise<AdminUser | null> {
  try {
    const supabase = createServerClient();
    
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return null;
    }

    return {
      id: data.user.id,
      email: data.user.email || '',
    };
  } catch (error) {
    console.error('トークン検証エラー:', error);
    return null;
  }
}

/**
 * リクエストから認証トークンを取得
 * @param req NextRequest
 * @returns トークン
 */
export function getAuthToken(req: NextRequest): string | undefined {
  return req.cookies.get('auth-token')?.value;
}

/**
 * レスポンスに認証Cookieをセット
 * @param res NextResponse
 * @param token トークン
 */
export function setAuthCookie(res: NextResponse, token: string): void {
  res.cookies.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/'
  });
}

/**
 * 認証Cookieをクリア
 * @param res NextResponse
 */
export function clearAuthCookie(res: NextResponse): void {
  res.cookies.delete('auth-token');
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