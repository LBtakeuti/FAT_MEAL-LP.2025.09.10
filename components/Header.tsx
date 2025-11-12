'use client';

import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md hidden sm:block">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-orange-600">
              ふとるめし
            </h1>
          </div>
          <nav className="flex items-center space-x-2 md:space-x-4 lg:space-x-8 text-sm lg:text-base">
            <a href="/" className="text-gray-700 hover:text-orange-600 font-medium transition-colors">ホーム</a>
            <a href="#features" className="text-gray-700 hover:text-orange-600 font-medium transition-colors">こだわり</a>
            <a href="/menu-list" className="text-gray-700 hover:text-orange-600 font-medium transition-colors">メニュー</a>
            <a href="/news" className="text-gray-700 hover:text-orange-600 font-medium transition-colors">お知らせ</a>
            <a href="/contact" className="text-gray-700 hover:text-orange-600 font-medium transition-colors">お問い合わせ</a>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;