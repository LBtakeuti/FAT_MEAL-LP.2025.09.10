import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookie, signOut, getAuthToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Supabaseからサインアウト
    const token = getAuthToken(request);
    if (token) {
      await signOut(token);
    }

    const response = NextResponse.json(
      { message: 'ログアウトしました' },
      { status: 200 }
    );
    
    clearAuthCookie(response);
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    
    // エラーが発生してもCookieはクリアする
    const response = NextResponse.json(
      { message: 'ログアウトしました' },
      { status: 200 }
    );
    
    clearAuthCookie(response);
    return response;
  }
}