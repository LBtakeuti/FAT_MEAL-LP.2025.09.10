'use client';

import React from 'react';
import Link from 'next/link';
import { useMenuItems, useCarousel, useIntersectionObserver } from '@/hooks';
import { MenuCard } from './menu/MenuCard';

const MenuSection: React.FC = () => {
  const { menuItems, isLoading } = useMenuItems({ limit: 3 });
  const [titleRef, isTitleVisible] = useIntersectionObserver<HTMLDivElement>();

  const {
    currentIndex,
    handlePrevious,
    handleNext,
    handleDotClick,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    getAnimationClasses,
  } = useCarousel({
    itemCount: menuItems.length,
    autoPlayEnabled: true,
    autoPlayInterval: 8000,
  });

  // ローディング中の表示
  if (isLoading) {
    return (
      <section className="h-[100dvh] sm:h-auto bg-[#fff7ed] flex items-center justify-center">
        <div className="text-gray-500">読み込み中...</div>
      </section>
    );
  }

  // データがない場合の表示
  if (menuItems.length === 0) {
    return (
      <section className="h-[100dvh] sm:h-auto bg-[#fff7ed] flex items-center justify-center">
        <div className="text-gray-500">メニュー情報を取得できませんでした</div>
      </section>
    );
  }

  const currentItem = menuItems[currentIndex];

  return (
    <section
      id="menu"
      className="relative overflow-hidden bg-[#fff7ed] flex flex-col sm:block py-4 sm:py-8"
    >
      {/* 上部の波形 */}
      <div
        className="absolute top-0 left-0 w-full overflow-hidden leading-none z-10"
        style={{ transform: 'translateY(-1px)' }}
      >
        <svg
          className="relative block w-full h-16 sm:h-24"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
            className="fill-white"
          />
        </svg>
      </div>

      <div className="relative z-20 flex-1 flex flex-col sm:block max-w-[375px] px-4 md:max-w-[768px] md:px-6 lg:max-w-[1200px] lg:px-8 mx-auto w-full pb-20 sm:pb-0">
        {/* タイトル */}
        <div ref={titleRef} className="mb-3 sm:mb-8 -mt-2 sm:-mt-1">
          <div className="mb-2">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
              <span className="text-orange-600">メニュー</span>
            </h2>
          </div>
          <div className="relative h-0.5 bg-gray-300 overflow-hidden">
            <div
              className={`absolute top-0 left-0 h-full bg-orange-500 transition-all duration-1000 ease-out ${
                isTitleVisible ? 'w-full' : 'w-0'
              }`}
            />
          </div>
        </div>

        {/* Mobile: カルーセル */}
        <div className="sm:hidden flex-1 flex flex-col">
          <div className="flex-1 relative flex items-center justify-center px-2 mb-2">
            {/* 左矢印 */}
            <button
              type="button"
              onClick={handlePrevious}
              className="absolute left-0 z-30 w-10 h-10 flex items-center justify-center bg-white/90 rounded-full shadow-lg active:bg-orange-100"
              style={{
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
                top: '50%',
                transform: 'translateY(-50%)',
              }}
              aria-label="前のメニュー"
            >
              <svg
                className="w-5 h-5 text-orange-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            {/* メニューカード */}
            <div
              className="w-full max-w-[280px] mx-8 overflow-hidden"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <MenuCard
                item={currentItem}
                variant="mobile"
                priority={currentIndex === 0}
                className={getAnimationClasses()}
              />
            </div>

            {/* 右矢印 */}
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-0 z-30 w-10 h-10 flex items-center justify-center bg-white/90 rounded-full shadow-lg active:bg-orange-100"
              style={{
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
                top: '50%',
                transform: 'translateY(-50%)',
              }}
              aria-label="次のメニュー"
            >
              <svg
                className="w-5 h-5 text-orange-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          {/* ページネーションドット */}
          <div className="flex justify-center gap-2 mb-2">
            {menuItems.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleDotClick(index)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-orange-600 w-7'
                    : 'bg-gray-300 w-2.5 hover:bg-gray-400'
                }`}
                style={{
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                }}
                aria-label={`Go to menu item ${index + 1}`}
              />
            ))}
          </div>

          {/* ラインナップボタン */}
          <div className="px-4 pb-2">
            <Link
              href="/menu-list"
              className="block w-full bg-orange-600 text-white py-2.5 rounded-full text-sm font-semibold text-center hover:bg-orange-700 transition-colors"
            >
              ラインナップを見る
            </Link>
          </div>
        </div>

        {/* Desktop: グリッド */}
        <div className="hidden sm:grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <MenuCard key={item.id} item={item} variant="desktop" />
          ))}
        </div>
      </div>
    </section>
  );
};

export default MenuSection;
