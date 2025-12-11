'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

const Header: React.FC = () => {
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
            <a href="/news" className="text-[#374151] hover:text-orange-600 font-medium transition-colors">お知らせ</a>
            <a href="/contact" className="text-[#374151] hover:text-orange-600 font-medium transition-colors">お問い合わせ</a>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;