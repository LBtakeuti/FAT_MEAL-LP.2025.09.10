'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase';

const Header: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createBrowserClient();
    
    // 現在のセッションを取得
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <header className="relative bg-white shadow-md hidden sm:block">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col items-center">
          {/* ロゴ中央配置 */}
          <div className="mb-4">
            <Link href="/">
              <Image
                src="/logo-header.png"
                alt="ふとるめし"
                width={540}
                height={180}
                className="h-24 w-auto"
                priority
              />
            </Link>
          </div>
          {/* メニュー項目 */}
          <nav className="flex items-center space-x-2 md:space-x-4 lg:space-x-8 text-sm lg:text-base font-antique">
            <a href="/" className="text-[#374151] hover:text-orange-600 font-medium transition-colors">ホーム</a>
            <a href="/menu-list" className="text-[#374151] hover:text-orange-600 font-medium transition-colors">メニュー</a>
            <a href="/#news" className="text-[#374151] hover:text-orange-600 font-medium transition-colors">お知らせ</a>
            <a href="/contact" className="text-[#374151] hover:text-orange-600 font-medium transition-colors">お問い合わせ</a>
            
            {/* ログイン/マイページボタン */}
            {loading ? (
              <span className="text-gray-400 text-sm">読み込み中...</span>
            ) : user ? (
              <>
                <Link href="/mypage" className="text-[#374151] hover:text-orange-600 font-medium transition-colors">
                  マイページ
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-[#374151] hover:text-orange-600 font-medium transition-colors"
                >
                  ログアウト
                </button>
              </>
            ) : (
              <Link href="/login" className="text-[#374151] hover:text-orange-600 font-medium transition-colors">
                ログイン
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;