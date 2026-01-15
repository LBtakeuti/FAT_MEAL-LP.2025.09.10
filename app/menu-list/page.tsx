'use client';

import React, { useState } from 'react';
import Footer from '@/components/Footer';
import { useRouter } from 'next/navigation';
import { useMenuItems } from '@/hooks/useMenuItems';
import { MenuCard } from '@/components/menu/MenuCard';
import { MenuDetailModal } from '@/components/menu/MenuDetailModal';
import type { MenuItem } from '@/types';

export default function MenuListPage() {
  const router = useRouter();
  const { menuItems, isLoading } = useMenuItems({ limit: 0, autoRefresh: true, refreshInterval: 30000 });
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  const handleSelectItem = (item: MenuItem) => {
    setSelectedItem(item);
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <div className="min-h-screen bg-white flex flex-col">
        <main className="flex-1 pt-20 sm:pt-20 pb-12 sm:pb-20">
          <div className="max-w-6xl px-4 sm:px-6 lg:px-8 mx-auto w-full">
            {/* Back button */}
            <div className="pt-2 pb-2 mb-4 sm:mb-8 sm:pt-0 sm:pb-0">
              <button
                onClick={() => router.push('/')}
                className="inline-flex items-center text-gray-600 hover:text-orange-600 transition-colors"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm font-medium">戻る</span>
              </button>
            </div>
            
            {/* Page Title */}
            <div className="mb-6 sm:mb-10">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 font-antique">
                メニュー一覧
              </h1>
            </div>

            {/* Grid Layout - MenuCardを使用 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
              {menuItems.map((item) => (
                <MenuCard
                  key={item.id}
                  item={item}
                  onSelect={handleSelectItem}
                />
              ))}
            </div>
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>

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
}