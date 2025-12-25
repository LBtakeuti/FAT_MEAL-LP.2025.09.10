import { createServerClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/mypage';

  if (code) {
    const supabase = createServerClient();

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // 認証成功 - リダイレクト先へ
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  // エラー時はログインページへリダイレクト
  return NextResponse.redirect(new URL('/login?error=auth_failed', requestUrl.origin));
}
