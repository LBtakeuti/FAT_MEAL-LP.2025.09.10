'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';

const translateErrorMessage = (message: string): string => {
  const errorMap: { [key: string]: string } = {
    'Password should be at least 6 characters': 'パスワードは6文字以上で入力してください',
    'New password should be different from the old password': '新しいパスワードは以前のパスワードと異なるものにしてください',
    'Auth session missing!': 'リンクの有効期限が切れています。もう一度メールから再設定をお試しください',
  };
  if (errorMap[message]) return errorMap[message];
  for (const [key, value] of Object.entries(errorMap)) {
    if (message.toLowerCase().includes(key.toLowerCase())) return value;
  }
  return 'パスワードの更新に失敗しました。もう一度お試しください';
};

function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState('');
  const [success, setSuccess] = useState(false);

  // ハッシュフラグメントから recovery セッションをセット
  useEffect(() => {
    const setupRecoverySession = async () => {
      if (typeof window === 'undefined') return;

      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const errorDescription = hashParams.get('error_description');
      if (errorDescription) {
        setSessionError('リンクの有効期限が切れています。もう一度メールから再設定をお試しください');
        return;
      }

      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (!accessToken) {
        // 直接アクセス／既に消費済みリンク
        const supabase = createBrowserClient();
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setSessionReady(true);
        } else {
          setSessionError('リンクが無効です。メールから再設定リンクを開いてください');
        }
        return;
      }

      const supabase = createBrowserClient();
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || '',
      });
      if (error) {
        setSessionError('リンクが無効です。もう一度メールから再設定をお試しください');
        return;
      }
      // ハッシュをURLから消す（再読込時の二重消費を防ぐ）
      window.history.replaceState(null, '', window.location.pathname);
      setSessionReady(true);
    };
    setupRecoverySession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }

    setLoading(true);
    const supabase = createBrowserClient();
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setSuccess(true);
      // 3秒後にログインページへ
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      setError(translateErrorMessage(err?.message || ''));
    } finally {
      setLoading(false);
    }
  };

  if (sessionError) {
    return (
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">新しいパスワードの設定</h2>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {sessionError}
        </div>
        <div className="mt-6 text-center">
          <Link href="/auth/forgot-password" className="text-orange-600 hover:text-orange-700 hover:underline text-sm">
            再設定メールを再送する
          </Link>
        </div>
        <div className="mt-4 text-center">
          <Link href="/login" className="text-gray-600 hover:text-gray-900 text-sm">
            ← ログインに戻る
          </Link>
        </div>
      </div>
    );
  }

  if (!sessionReady) {
    return (
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center text-gray-500">読み込み中...</div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">パスワードを更新しました</h2>
        </div>
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
          新しいパスワードでログインしてください。
          まもなくログインページへ移動します。
        </div>
        <div className="mt-6 text-center">
          <Link href="/login" className="text-orange-600 hover:text-orange-700 hover:underline text-sm">
            今すぐログインへ移動
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">新しいパスワードの設定</h2>
        <p className="text-gray-600 mt-2 text-sm">新しいパスワードを入力してください</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">新しいパスワード</label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="6文字以上"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">新しいパスワード（確認）</label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="もう一度入力"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={showPassword}
            onChange={(e) => setShowPassword(e.target.checked)}
            className="rounded border-gray-300"
          />
          パスワードを表示する
        </label>

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
          {loading ? '更新中...' : 'パスワードを更新する'}
        </button>
      </form>

      <div className="mt-4 text-center">
        <Link href="/login" className="text-gray-600 hover:text-gray-900 text-sm">
          ← ログインに戻る
        </Link>
      </div>
    </div>
  );
}

function ResetPasswordLoading() {
  return (
    <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
      <div className="text-center text-gray-500">読み込み中...</div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 pt-24 sm:pt-12">
      <Suspense fallback={<ResetPasswordLoading />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
