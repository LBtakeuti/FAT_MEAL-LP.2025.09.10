'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase';

const HeaderNav: React.FC = () => {
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (initialCheckDone.current) {
        setIsLoggedIn(!!session);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="relative w-full flex items-center justify-center">
      {/* メインナビゲーション - 中央配置 */}
      <nav className="flex items-center space-x-2 md:space-x-4 lg:space-x-8 text-sm lg:text-base font-antique">
        <Link href="/" className="text-[#374151] hover:text-orange-600 font-medium transition-colors">ホーム</Link>
        <Link href="/menu-list" className="text-[#374151] hover:text-orange-600 font-medium transition-colors">メニュー</Link>
        <Link href="/news" className="text-[#374151] hover:text-orange-600 font-medium transition-colors">お知らせ</Link>
        <Link href="/contact" className="text-[#374151] hover:text-orange-600 font-medium transition-colors">お問い合わせ</Link>
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
  );
};

export default HeaderNav;
