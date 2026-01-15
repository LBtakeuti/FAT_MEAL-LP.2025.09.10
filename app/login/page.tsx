'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import Link from 'next/link';
import Header from '@/components/Header';
import MobileHeader from '@/components/MobileHeader';

// Supabaseのエラーメッセージを日本語に変換
const translateErrorMessage = (message: string): string => {
  const errorMap: { [key: string]: string } = {
    'Invalid login credentials': 'メールアドレスまたはパスワードが正しくありません',
    'Email not confirmed': 'メールアドレスが確認されていません。確認メールをご確認ください',
    'User already registered': 'このメールアドレスは既に登録されています',
    'Password should be at least 6 characters': 'パスワードは6文字以上で入力してください',
    'Unable to validate email address: invalid format': 'メールアドレスの形式が正しくありません',
    'Signup requires a valid password': '有効なパスワードを入力してください',
    'Email rate limit exceeded': 'メール送信の制限に達しました。しばらく時間をおいてからお試しください',
    'For security purposes, you can only request this once every 60 seconds': 'セキュリティのため、60秒に1回のみリクエストできます',
    'New password should be different from the old password': '新しいパスワードは以前のパスワードと異なるものにしてください',
    'Auth session missing!': 'セッションが見つかりません。再度ログインしてください',
  };

  // 完全一致をチェック
  if (errorMap[message]) {
    return errorMap[message];
  }

  // 部分一致をチェック
  for (const [key, value] of Object.entries(errorMap)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  // マッチしない場合は汎用メッセージ
  return 'エラーが発生しました。もう一度お試しください';
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // URLパラメータからエラーを取得、またはハッシュからトークンを処理
  useEffect(() => {
    const handleAuth = async () => {
      // ハッシュフラグメントにトークンがあるか確認
      if (window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken) {
          const supabase = createBrowserClient();
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

          if (!error) {
            router.push('/');
            router.refresh();
            return;
          }
        }
      }

      // エラーパラメータを確認
      const errorParam = searchParams.get('error');
      if (errorParam === 'auth_failed') {
        setError('認証に失敗しました。もう一度お試しください。');
      }
    };

    handleAuth();
  }, [searchParams, router]);

  // Googleでログイン
  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);

    const supabase = createBrowserClient();

    try {
      const { error: googleError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/login`,
        },
      });

      if (googleError) {
        throw googleError;
      }
    } catch (err: any) {
      setError(translateErrorMessage(err.message || 'Googleログインに失敗しました'));
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    // 新規登録時のパスワード確認
    if (isSignUp && password !== confirmPassword) {
      setError('パスワードが一致しません');
      setLoading(false);
      return;
    }

    const supabase = createBrowserClient();

    try {
      if (isSignUp) {
        // 新規登録
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/`,
          },
        });

        if (signUpError) {
          throw signUpError;
        }

        if (data.user) {
          setSuccessMessage('登録が完了しました。確認メールを送信しましたので、メール内のリンクをクリックして認証を完了してください。');
        }
      } else {
        // ログイン
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          throw signInError;
        }

        // ログイン成功 - リダイレクトパラメータがあればそこへ
        const redirectUrl = searchParams.get('redirect');
        const typeParam = searchParams.get('type');
        
        if (redirectUrl) {
          // サブスクリプション購入からのリダイレクトの場合はtype=subscriptionも付与
          const finalUrl = typeParam === 'subscription' 
            ? `${redirectUrl}?type=subscription` 
            : redirectUrl;
          router.push(finalUrl);
        } else {
          router.push('/');
        }
        router.refresh();
      }
    } catch (err: any) {
      setError(translateErrorMessage(err.message || 'エラーが発生しました'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {isSignUp ? '新規登録' : 'ログイン'}
        </h2>
        <p className="text-gray-600 mt-2">
          {isSignUp ? 'アカウントを作成してマイページをご利用ください' : 'アカウントをお持ちの方はログインしてください'}
        </p>
      </div>

      {/* Googleログインボタン（上部に配置） */}
      <button
        onClick={handleGoogleLogin}
        disabled={loading || googleLoading}
        className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
      >
        {googleLoading ? (
          <span>処理中...</span>
        ) : (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Googleで{isSignUp ? '登録' : 'ログイン'}</span>
          </>
        )}
      </button>

      {/* 区切り線 */}
      <div className="mt-6 relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">または</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            パスワード
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="6文字以上"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none transition-none will-change-auto"
              style={{ transform: 'translateY(-50%)' }}
              aria-label={showPassword ? 'パスワードを非表示' : 'パスワードを表示'}
            >
              {showPassword ? (
                <svg className="w-5 h-5 transition-none pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ display: 'block' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5 transition-none pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ display: 'block' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {isSignUp && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              パスワード（確認）
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="パスワードを再入力"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none transition-none will-change-auto"
                style={{ transform: 'translateY(-50%)' }}
                aria-label={showConfirmPassword ? 'パスワードを非表示' : 'パスワードを表示'}
              >
                {showConfirmPassword ? (
                  <svg className="w-5 h-5 transition-none pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ display: 'block' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 transition-none pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ display: 'block' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
            {successMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || googleLoading}
          className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? '処理中...' : isSignUp ? '新規登録' : 'ログイン'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError('');
            setSuccessMessage('');
            setPassword('');
            setConfirmPassword('');
            setShowPassword(false);
            setShowConfirmPassword(false);
          }}
          className="text-orange-600 hover:text-orange-700 hover:underline text-sm"
        >
          {isSignUp ? '既にアカウントをお持ちの方はログイン' : '新規登録はこちら'}
        </button>
      </div>

      <div className="mt-4 text-center">
        <Link href="/" className="text-gray-600 hover:text-gray-900 text-sm">
          ← トップページに戻る
        </Link>
      </div>
    </div>
  );
}

function LoginPageLoading() {
  return (
    <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-8"></div>
        <div className="h-12 bg-gray-200 rounded mb-6"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto mb-6"></div>
        <div className="space-y-4">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <>
      <Header />
      <MobileHeader />
      <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 pt-24 sm:pt-12">
        <Suspense fallback={<LoginPageLoading />}>
          <LoginForm />
        </Suspense>
      </div>
    </>
  );
}
