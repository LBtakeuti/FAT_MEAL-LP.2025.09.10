'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase';

const Header: React.FC = () => {
  // null = 未確定、true/false = 確定済み
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const initialCheckDone = useRef(false);

  useEffect(() => {
    const supabase = createBrowserClient();
    
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
      initialCheckDone.current = true;
    };
    checkAuth();

    // リアルタイムで認証状態を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // 初回チェック完了後のみ更新（ページ遷移時のチラつき防止）
      if (initialCheckDone.current) {
        setIsLoggedIn(!!session);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="relative bg-white shadow-md hidden sm:block">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col items-center">
          {/* ロゴ中央配置 - コンテナ固定でレイアウトシフト防止 */}
          <div className="mb-4 h-24 flex items-center justify-center">
            <Link href="/">
              <Image
                src="/logo-header.png"
                alt="ふとるめし"
                width={540}
                height={180}
                className="h-24 w-auto"
                priority
                loading="eager"
                unoptimized
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
              className={`absolute right-0 flex items-center gap-2 px-4 py-2 rounded font-antique text-sm lg:text-base ${
                isLoggedIn === null
                  ? 'text-[#374151] border border-[#374151]'
                  : isLoggedIn
                    ? 'bg-[#FF6B35] text-white hover:bg-[#E55220] transition-all duration-300'
                    : 'text-[#374151] hover:text-[#FF6B35] border border-[#374151] hover:border-[#FF6B35] transition-all duration-300'
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
