import { NextResponse } from 'next/server';
import { clearAuthCookie, signOut } from '@/lib/auth';

export async function POST() {
  try {
    // Supabaseからサインアウト
    await signOut();

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