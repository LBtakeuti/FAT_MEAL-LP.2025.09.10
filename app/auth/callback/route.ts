import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/';

  // code があっても必ずクライアントサイドで処理する
  // サーバーサイドで exchangeCodeForSession してもブラウザのセッションが確立されないため
  const params = new URLSearchParams();
  params.set('next', next);
  if (code) params.set('code', code);

  return NextResponse.redirect(
    new URL(`/auth/callback/client?${params.toString()}`, requestUrl.origin)
  );
}
