'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MenuCard } from './menu/MenuCard';
import { MenuDetailModal } from './menu/MenuDetailModal';
import type { MenuItem } from '@/types';

interface MenuSectionProps {
  initialMenuItems?: MenuItem[];
}

const MenuSection: React.FC<MenuSectionProps> = ({ initialMenuItems = [] }) => {
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  const handleSelectItem = (item: MenuItem) => {
    setSelectedItem(item);
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
  };

  // データなし
  if (initialMenuItems.length === 0) {
    return (
      <section id="menu" className="bg-white py-8 sm:py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 font-antique">
              <span className="text-orange-600">メニュー</span>
            </h2>
          </div>
          <div className="flex items-center justify-center h-48">
            <div className="text-gray-500">メニュー情報を取得できませんでした</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section id="menu" className="bg-white py-8 sm:py-12">
        <div className="max-w-6xl mx-auto px-4">
          {/* タイトル */}
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 font-antique">
              <span className="text-orange-600">メニュー</span>
            </h2>
          </div>

          {/* メニューカード - 6枚グリッド */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {initialMenuItems.slice(0, 6).map((item, index) => (
              <MenuCard
                key={item.id}
                item={item}
                onSelect={handleSelectItem}
                priority={index < 6}
              />
            ))}
          </div>

          {/* もっと見るリンク */}
          <div className="mt-6 text-center">
            <Link
              href="/menu-list"
              className="inline-flex items-center text-orange-600 hover:text-orange-700 font-medium transition-colors text-sm"
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

      {/* メニュー詳細モーダル */}
      {selectedItem && (
        <MenuDetailModal
          item={selectedItem}
          isOpen={!!selectedItem}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
};

export default MenuSection;
