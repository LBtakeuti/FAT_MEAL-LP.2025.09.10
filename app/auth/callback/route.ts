import { createServerClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/';

  if (code) {
    const supabase = createServerClient();

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // 認証成功 - リダイレクト先へ
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  // codeがない場合はクライアントサイドで処理するページにリダイレクト
  // (トークンがハッシュフラグメントにある場合)
  return NextResponse.redirect(new URL('/auth/callback/client', requestUrl.origin));
}
