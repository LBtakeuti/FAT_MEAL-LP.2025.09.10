/**
 * API共通ヘルパー関数
 * 認証、エラーハンドリング、レスポンス生成を統一
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, AuthResult } from './auth';
import type { ApiSuccessResponse, ApiErrorResponse } from '@/types';

// ============================================
// レスポンスヘルパー
// ============================================

/**
 * 成功レスポンスを生成
 */
export function jsonSuccess<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * エラーレスポンスを生成
 */
export function jsonError(
  message: string,
  status: number = 500,
  error?: unknown
): NextResponse {
  const response: ApiErrorResponse = {
    success: false,
    message,
  };

  if (error instanceof Error) {
    response.error = error.message;
  } else if (typeof error === 'string') {
    response.error = error;
  }

  // 開発環境ではエラー詳細をログ出力
  if (process.env.NODE_ENV !== 'production' && error) {
    console.error(`API Error (${status}):`, message, error);
  }

  return NextResponse.json(response, { status });
}

/**
 * 認証エラーレスポンス
 */
export function jsonUnauthorized(message: string = '認証が必要です'): NextResponse {
  return jsonError(message, 401);
}

/**
 * バリデーションエラーレスポンス
 */
export function jsonBadRequest(message: string = 'リクエストが不正です'): NextResponse {
  return jsonError(message, 400);
}

/**
 * Not Foundエラーレスポンス
 */
export function jsonNotFound(message: string = 'リソースが見つかりません'): NextResponse {
  return jsonError(message, 404);
}

// ============================================
// 認証ラッパー
// ============================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RouteContext = { params: Promise<Record<string, string>> } | undefined;

type RouteHandler = (
  request: NextRequest,
  context?: RouteContext
) => Promise<NextResponse>;

type AuthenticatedHandler = (
  request: NextRequest,
  auth: AuthResult,
  context?: RouteContext
) => Promise<NextResponse>;

/**
 * 認証が必要なルートをラップ
 * 認証チェックとエラーハンドリングを自動化
 */
export function withAuth(handler: AuthenticatedHandler): RouteHandler {
  return async (request: NextRequest, context?: RouteContext) => {
    try {
      const authResult = await verifyAuth(request);

      if (!authResult.authenticated) {
        return jsonUnauthorized();
      }

      return await handler(request, authResult, context);
    } catch (error) {
      console.error('API Error:', error);
      return jsonError('サーバーエラーが発生しました', 500, error);
    }
  };
}

/**
 * 認証不要のルートをラップ（エラーハンドリングのみ）
 */
export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (request: NextRequest, context?: RouteContext) => {
    try {
      return await handler(request, context);
    } catch (error) {
      console.error('API Error:', error);
      return jsonError('サーバーエラーが発生しました', 500, error);
    }
  };
}

// ============================================
// バリデーションヘルパー
// ============================================

type ValidationRule = {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
  min?: number;
  max?: number;
  pattern?: RegExp;
};

type ValidationSchema = Record<string, ValidationRule>;

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * リクエストボディをバリデーション
 */
export function validateBody(
  body: Record<string, unknown>,
  schema: ValidationSchema
): ValidationResult {
  const errors: string[] = [];

  for (const [field, rules] of Object.entries(schema)) {
    const value = body[field];

    // 必須チェック
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field}は必須項目です`);
      continue;
    }

    // 値が存在する場合のみ型チェック
    if (value !== undefined && value !== null) {
      // 型チェック
      if (rules.type) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== rules.type) {
          errors.push(`${field}の型が不正です（期待: ${rules.type}）`);
        }
      }

      // 文字列長/数値範囲チェック
      if (rules.min !== undefined) {
        if (typeof value === 'string' && value.length < rules.min) {
          errors.push(`${field}は${rules.min}文字以上必要です`);
        } else if (typeof value === 'number' && value < rules.min) {
          errors.push(`${field}は${rules.min}以上の値が必要です`);
        }
      }

      if (rules.max !== undefined) {
        if (typeof value === 'string' && value.length > rules.max) {
          errors.push(`${field}は${rules.max}文字以下にしてください`);
        } else if (typeof value === 'number' && value > rules.max) {
          errors.push(`${field}は${rules.max}以下の値にしてください`);
        }
      }

      // パターンチェック
      if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
        errors.push(`${field}の形式が不正です`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================
// リクエスト解析ヘルパー
// ============================================

/**
 * URLパラメータを取得
 */
export function getQueryParam(request: NextRequest, key: string): string | null {
  return request.nextUrl.searchParams.get(key);
}

/**
 * 数値のURLパラメータを取得
 */
export function getQueryParamInt(
  request: NextRequest,
  key: string,
  defaultValue: number = 0
): number {
  const value = request.nextUrl.searchParams.get(key);
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * ページネーションパラメータを取得
 */
export function getPaginationParams(
  request: NextRequest,
  defaultLimit: number = 10
): { page: number; limit: number; offset: number } {
  const page = Math.max(1, getQueryParamInt(request, 'page', 1));
  const limit = Math.min(100, Math.max(1, getQueryParamInt(request, 'limit', defaultLimit)));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

// ============================================
// Supabaseエラーハンドリング
// ============================================

interface SupabaseError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

/**
 * Supabaseエラーをユーザーフレンドリーなメッセージに変換
 */
export function handleSupabaseError(
  error: SupabaseError,
  operation: string = '操作'
): NextResponse {
  console.error(`Supabase Error (${operation}):`, error);

  // よくあるエラーコードに対応
  switch (error.code) {
    case '23505': // unique_violation
      return jsonError(`${operation}に失敗しました：重複するデータが存在します`, 409);
    case '23503': // foreign_key_violation
      return jsonError(`${operation}に失敗しました：関連するデータが見つかりません`, 400);
    case '42P01': // undefined_table
      return jsonError('システムエラーが発生しました', 500, error);
    case 'PGRST116': // not found
      return jsonNotFound();
    default:
      return jsonError(`${operation}に失敗しました`, 500, error);
  }
}
