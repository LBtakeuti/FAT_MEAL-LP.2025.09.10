'use client';

import React from 'react';
import Link from 'next/link';
import { useMenuItems } from '@/hooks';
import { MenuCard } from './menu/MenuCard';

const MenuSection: React.FC = () => {
  const { menuItems, isLoading } = useMenuItems({ limit: 3 });

  // ローディング中
  if (isLoading) {
    return (
      <section id="menu" className="bg-white py-8 sm:py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
              <span className="text-orange-600">メニュー</span>
            </h2>
            <div className="mt-2 h-0.5 bg-gray-200 w-full" />
          </div>
          <div className="flex items-center justify-center h-48">
            <div className="text-gray-500">読み込み中...</div>
          </div>
        </div>
      </section>
    );
  }

  // データなし
  if (menuItems.length === 0) {
    return (
      <section id="menu" className="bg-white py-8 sm:py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
              <span className="text-orange-600">メニュー</span>
            </h2>
            <div className="mt-2 h-0.5 bg-gray-200 w-full" />
          </div>
          <div className="flex items-center justify-center h-48">
            <div className="text-gray-500">メニュー情報を取得できませんでした</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="menu" className="bg-white py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* タイトル */}
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
            <span className="text-orange-600">メニュー</span>
          </h2>
          <div className="mt-2 h-0.5 bg-orange-500 w-full" />
        </div>

        {/* メニューカード - 3枚グリッド */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.slice(0, 3).map((item) => (
            <MenuCard key={item.id} item={item} variant="desktop" />
          ))}
        </div>

        {/* もっと見るリンク */}
        <div className="mt-6 text-center">
          <Link
            href="/menu-list"
            className="inline-flex items-center text-orange-600 hover:text-orange-700 font-medium transition-colors"
          >
            もっと見る
            <svg
              className="w-4 h-4 ml-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default MenuSection;
