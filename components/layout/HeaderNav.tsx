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
        <Link href="/blog" className="text-[#374151] hover:text-orange-600 font-medium transition-colors">コラム</Link>
        <Link href="/news" className="text-[#374151] hover:text-orange-600 font-medium transition-colors">お知らせ</Link>
        <Link href="/contact" className="text-[#374151] hover:text-orange-600 font-medium transition-colors">お問い合わせ</Link>
        <Link
          href={isLoggedIn ? '/mypage' : '/login'}
          className="text-[#374151] hover:text-orange-600 font-medium transition-colors"
        >
          {isLoggedIn ? 'マイページ' : 'ログイン'}
        </Link>
      </nav>

      {/* ふとるめしを始めるボタン - 右端に絶対配置 */}
      <Link
        href="/purchase?type=subscription"
        className="absolute right-0 flex items-center px-5 py-2 rounded-full bg-[#FF6B35] text-white font-antique font-bold text-sm lg:text-base hover:bg-[#E55220] transition-colors whitespace-nowrap"
      >
        購入する
      </Link>
    </div>
  );
};

export default HeaderNav;
