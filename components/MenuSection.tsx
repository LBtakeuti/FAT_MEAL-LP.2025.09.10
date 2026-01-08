'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import { useMenuItems, useCarousel, useIntersectionObserver } from '@/hooks';
import { MenuCard } from './menu/MenuCard';

// Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const MenuSection: React.FC = () => {
  // すべてのメニューを取得（limitを大きくして対応）
  const { menuItems, isLoading } = useMenuItems({ limit: 20 });
  const [titleRef, isTitleVisible] = useIntersectionObserver<HTMLDivElement>();
  const swiperRef = useRef<SwiperType | null>(null);

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
      <section className="h-[100dvh] sm:h-auto bg-white flex items-center justify-center">
        <div className="text-gray-500">読み込み中...</div>
      </section>
    );
  }

  // データがない場合の表示
  if (menuItems.length === 0) {
    return (
      <section className="h-[100dvh] sm:h-auto bg-white flex items-center justify-center">
        <div className="text-gray-500">メニュー情報を取得できませんでした</div>
      </section>
    );
  }

  const currentItem = menuItems[currentIndex];

  // PC版で4つ以上のメニューがある場合のみカルーセルを表示
  const showDesktopCarousel = menuItems.length > 3;

  return (
    <section
      id="menu"
      className="relative overflow-hidden bg-white flex flex-col sm:block py-4 sm:py-8"
    >
      <div className="flex-1 flex flex-col sm:block max-w-[375px] px-4 md:max-w-[768px] md:px-6 lg:max-w-[1200px] lg:px-8 mx-auto w-full pb-20 sm:pb-0">
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

        {/* Desktop: Swiperカルーセル or グリッド */}
        <div className="hidden sm:block">
          {showDesktopCarousel ? (
            <div className="relative">
              {/* Swiperカルーセル - overflow-hiddenで3枚のみ表示、内側にパディングでシャドウ用スペース確保 */}
              <div className="mx-14 lg:mx-16 overflow-hidden">
                <div className="p-4">
                  <Swiper
                  modules={[Navigation, Pagination]}
                  spaceBetween={24}
                  slidesPerView={1}
                  slidesPerGroup={1}
                  loop={menuItems.length > 3}
                  onSwiper={(swiper) => {
                    swiperRef.current = swiper;
                  }}
                  pagination={{
                    clickable: true,
                    el: '.swiper-pagination-custom',
                    bulletClass: 'swiper-pagination-bullet-custom',
                    bulletActiveClass: 'swiper-pagination-bullet-active-custom',
                  }}
                  breakpoints={{
                    640: {
                      slidesPerView: 2,
                      slidesPerGroup: 1,
                    },
                    1024: {
                      slidesPerView: 3,
                      slidesPerGroup: 1,
                    },
                  }}
                  className="menu-swiper"
                >
                  {menuItems.map((item) => (
                    <SwiperSlide key={item.id}>
                      <MenuCard item={item} variant="desktop" />
                    </SwiperSlide>
                  ))}
                  </Swiper>
                </div>
              </div>

              {/* 左矢印ボタン */}
              <button
                type="button"
                onClick={() => swiperRef.current?.slidePrev()}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-30 w-12 h-12 flex items-center justify-center bg-white rounded-full shadow-lg hover:bg-orange-50"
                aria-label="前のメニュー"
              >
                <svg
                  className="w-6 h-6 text-orange-600"
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

              {/* 右矢印ボタン */}
              <button
                type="button"
                onClick={() => swiperRef.current?.slideNext()}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-30 w-12 h-12 flex items-center justify-center bg-white rounded-full shadow-lg hover:bg-orange-50"
                aria-label="次のメニュー"
              >
                <svg
                  className="w-6 h-6 text-orange-600"
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

              {/* カスタムページネーション */}
              <div className="swiper-pagination-custom flex justify-center gap-2 mt-4" />
            </div>
          ) : (
            // 3つ以下の場合は通常のグリッド表示
            <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuItems.map((item) => (
                <MenuCard key={item.id} item={item} variant="desktop" />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* カスタムSwiperスタイル */}
      <style jsx global>{`
        .menu-swiper {
          height: auto !important;
        }
        .menu-swiper .swiper-wrapper {
          height: auto !important;
        }
        .menu-swiper .swiper-slide {
          height: auto !important;
        }
        .swiper-pagination-bullet-custom {
          width: 10px;
          height: 10px;
          background-color: #d1d5db;
          border-radius: 9999px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline-block;
          margin: 0 4px;
        }
        .swiper-pagination-bullet-active-custom {
          width: 28px;
          background-color: #ea580c;
        }
      `}</style>
    </section>
  );
};

export default MenuSection;
