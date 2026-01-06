'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase';

const Header: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    checkAuth();

    // リアルタイムで認証状態を監視
    const supabase = createBrowserClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

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

          {/* ナビゲーションとマイページボタンのコンテナ */}
          <div className="relative w-full flex items-center justify-center">
            {/* メインナビゲーション - 中央配置 */}
            <nav className="flex items-center space-x-2 md:space-x-4 lg:space-x-8 text-sm lg:text-base font-antique">
              <a href="/" className="text-[#374151] hover:text-orange-600 font-medium transition-colors">ホーム</a>
              <a href="/menu-list" className="text-[#374151] hover:text-orange-600 font-medium transition-colors">メニュー</a>
              <a href="/news" className="text-[#374151] hover:text-orange-600 font-medium transition-colors">お知らせ</a>
              <a href="/contact" className="text-[#374151] hover:text-orange-600 font-medium transition-colors">お問い合わせ</a>
            </nav>

            {/* マイページボタン - 右端に絶対配置 */}
            <Link
              href="/mypage"
              className={`absolute right-0 flex items-center gap-2 px-4 py-2 rounded transition-all duration-300 font-antique text-sm lg:text-base ${
                isLoggedIn
                  ? 'bg-[#FF6B35] text-white hover:bg-[#E55220]'
                  : 'text-[#374151] hover:text-[#FF6B35] border border-[#374151] hover:border-[#FF6B35]'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              マイページ
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
