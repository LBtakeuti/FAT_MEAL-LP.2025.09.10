'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';

export default function AuthCallbackClient() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createBrowserClient();

      // URLのクエリパラメータからリダイレクト先を取得
      const urlParams = new URLSearchParams(window.location.search);
      const nextUrl = urlParams.get('next') || '/';

      // URLのハッシュフラグメントからトークンを取得
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (accessToken) {
        // セッションを設定
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        });

        if (error) {
          console.error('Session error:', error);
          setError('認証に失敗しました');
          setTimeout(() => router.push('/login?error=auth_failed'), 2000);
          return;
        }

        // 認証成功 - リダイレクト先へ
        router.push(nextUrl);
        router.refresh();
      } else {
        // トークンがない場合は現在のセッションを確認
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          router.push(nextUrl);
          router.refresh();
        } else {
          setError('認証情報が見つかりません');
          setTimeout(() => router.push('/login?error=auth_failed'), 2000);
        }
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        {error ? (
          <>
            <div className="text-red-600 mb-4">{error}</div>
            <p className="text-gray-600">ログインページにリダイレクトします...</p>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">認証中...</p>
          </>
        )}
      </div>
    </div>
  );
}
