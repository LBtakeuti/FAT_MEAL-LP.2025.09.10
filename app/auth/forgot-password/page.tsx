'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase';

// Supabase のエラーメッセージを日本語に変換（最小セット）
const translateErrorMessage = (message: string): string => {
  const errorMap: { [key: string]: string } = {
    'Email rate limit exceeded': 'メール送信の制限に達しました。しばらく時間をおいてからお試しください',
    'For security purposes, you can only request this once every 60 seconds': 'セキュリティのため、60秒に1回のみリクエストできます',
    'Unable to validate email address: invalid format': 'メールアドレスの形式が正しくありません',
  };
  if (errorMap[message]) return errorMap[message];
  for (const [key, value] of Object.entries(errorMap)) {
    if (message.toLowerCase().includes(key.toLowerCase())) return value;
  }
  return 'メール送信に失敗しました。時間をおいてからお試しください';
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createBrowserClient();

    try {
      // 本番では NEXT_PUBLIC_SITE_URL、なければ現在の origin
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/auth/reset-password`,
      });

      // 列挙攻撃対策: メアドの存在有無に関わらず常に成功表示
      if (resetError) {
        console.error('[forgot-password] resetPasswordForEmail failed:', resetError);
      }
      setSent(true);
    } catch (err: any) {
      setError(translateErrorMessage(err?.message || ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 pt-24 sm:pt-12">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">パスワード再設定</h2>
          <p className="text-gray-600 mt-2 text-sm">
            ご登録のメールアドレスを入力してください。
            パスワード再設定用のリンクをお送りします。
          </p>
        </div>

        {sent ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
              <p className="font-medium mb-1">メールを送信しました</p>
              <p className="text-xs">
                ご入力いただいたメールアドレス宛にパスワード再設定リンクをお送りしました。
                メールが届かない場合は迷惑メールフォルダもご確認ください。
              </p>
            </div>
            <div className="text-center">
              <Link href="/login" className="text-orange-600 hover:text-orange-700 hover:underline text-sm">
                ← ログインに戻る
              </Link>
            </div>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="example@email.com"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? '送信中...' : '再設定メールを送る'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/login" className="text-orange-600 hover:text-orange-700 hover:underline text-sm">
                ログインに戻る
              </Link>
            </div>
          </>
        )}

        <div className="mt-4 text-center">
          <Link href="/" className="text-gray-600 hover:text-gray-900 text-sm">
            ← トップページに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
