'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { MenuItem } from '@/types';

interface MenuDetailModalProps {
  item: MenuItem;
  isOpen: boolean;
  onClose: () => void;
}

export function MenuDetailModal({ item, isOpen, onClose }: MenuDetailModalProps) {
  const router = useRouter();

  // ESCキーで閉じる & 背景スクロール防止
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      // 現在のスクロール位置を保存
      const scrollY = window.scrollY;

      document.addEventListener('keydown', handleEsc);

      // モバイルでの背景スクロール防止
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';

      return () => {
        document.removeEventListener('keydown', handleEsc);

        // スクロール位置を復元
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePurchase = () => {
    onClose();
    router.push('/purchase');
  };

  // 栄養情報の配列
  const nutritionData = [
    { label: '総カロリー', value: item.calories, unit: 'kcal' },
    { label: 'タンパク質', value: item.protein, unit: 'g' },
    { label: '脂質', value: item.fat, unit: 'g' },
    { label: '糖質', value: item.carbs, unit: 'g' },
  ];

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center px-4 py-12 sm:p-6 overflow-hidden"
      onClick={onClose}
    >
      {/* オーバーレイ */}
      <div className="absolute inset-0 bg-black/60 touch-none" />

      {/* モーダルコンテンツ */}
      <div
        className="relative bg-white rounded-xl w-full max-w-2xl max-h-[calc(100vh-6rem)] sm:max-h-[calc(100vh-3rem)] shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 閉じるボタン（固定） */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95"
          aria-label="閉じる"
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* スクロール可能エリア */}
        <div className="flex-1 overflow-y-auto">
          {/* 画像 */}
          <div className="relative w-full aspect-[4/3] sm:aspect-[16/10]">
            <Image
              src={item.image || '/placeholder-menu.jpg'}
              alt={item.name}
              fill
              className="object-cover rounded-t-xl"
              sizes="(max-width: 768px) 100vw, 672px"
              priority
            />
          </div>

          {/* コンテンツ */}
          <div className="p-5 sm:p-6">
            {/* タイトル */}
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
              {item.name}
            </h2>

            {/* 説明 */}
            {item.description && (
              <p className="text-sm sm:text-base text-gray-600 mb-5 leading-relaxed">
                {item.description}
              </p>
            )}

            {/* 栄養情報 */}
            <div className="grid grid-cols-4 gap-2 sm:gap-4 mb-6">
              {nutritionData.map((nutrition) => (
                <div
                  key={nutrition.label}
                  className="text-center py-3 bg-gray-50 rounded-lg"
                >
                  <div className="text-xs text-gray-500 mb-1">{nutrition.label}</div>
                  <div className="text-lg sm:text-xl font-bold text-gray-900">
                    {nutrition.value}
                  </div>
                  <div className="text-xs text-gray-500">{nutrition.unit}</div>
                </div>
              ))}
            </div>

            {/* 原材料 */}
            {item.ingredients && item.ingredients.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-900 mb-2 border-b border-gray-200 pb-1">
                  原材料
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  {item.ingredients.join('、')}
                </p>
              </div>
            )}

            {/* アレルゲン */}
            {item.allergens && item.allergens.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-900 mb-2 border-b border-gray-200 pb-1">
                  アレルギー情報
                </h3>
                <div className="flex flex-wrap gap-2">
                  {item.allergens.map((allergen) => (
                    <span
                      key={allergen}
                      className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded"
                    >
                      {allergen}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 購入ボタン（固定） */}
        <div className="sticky bottom-0 p-4 bg-white border-t border-gray-100 rounded-b-xl">
          <button
            onClick={handlePurchase}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 sm:py-4 rounded-lg transition-colors text-base sm:text-lg"
          >
            購入へ進む
          </button>
        </div>
      </div>
    </div>
  );
}
