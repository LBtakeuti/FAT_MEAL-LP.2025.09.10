'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { menuItems } from '@/data/menuData';

const MenuSection: React.FC = () => {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const autoSwipeTimer = useRef<NodeJS.Timeout | null>(null);
  const lastInteractionTime = useRef<number>(Date.now());

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  // Reset auto-swipe timer
  const resetAutoSwipeTimer = () => {
    lastInteractionTime.current = Date.now();
    if (autoSwipeTimer.current) {
      clearInterval(autoSwipeTimer.current);
    }
    
    // Set up new auto-swipe timer
    autoSwipeTimer.current = setInterval(() => {
      const timeSinceLastInteraction = Date.now() - lastInteractionTime.current;
      if (timeSinceLastInteraction >= 8000) {
        handleNext();
        lastInteractionTime.current = Date.now();
      }
    }, 1000);
  };

  // Initialize auto-swipe on component mount
  useEffect(() => {
    resetAutoSwipeTimer();
    
    return () => {
      if (autoSwipeTimer.current) {
        clearInterval(autoSwipeTimer.current);
      }
    };
  }, []);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + menuItems.length) % menuItems.length);
    resetAutoSwipeTimer();
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % menuItems.length);
    resetAutoSwipeTimer();
  };

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
    resetAutoSwipeTimer();
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    }
    if (isRightSwipe) {
      handlePrevious();
    }
  };

  const currentItem = menuItems[currentIndex];

  const MenuCard = ({ item, compact = false }: { item: typeof menuItems[0], compact?: boolean }) => (
    <Link href={`/menu/${item.id}`} className="block">
      <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer">
        <div className="flex flex-col">
          <div className="relative h-[70px]">
            <Image
              src={item.image}
              alt={item.name}
              fill
              className="object-cover"
              sizes="50vw"
            />
          </div>
          <div className="p-1.5 flex flex-col">
            <h3 className="text-[10px] font-bold text-gray-900 mb-0.5 truncate">
              {item.name}
            </h3>
            <div className="mb-0.5">
              <span className="text-sm font-bold text-orange-600">
                {item.calories}
              </span>
              <span className="text-[9px] text-gray-600">kcal</span>
            </div>
            <div className="space-y-0 text-[8px]">
              <div className="flex justify-between">
                <span className="text-gray-500">タンパク質</span>
                <span className="font-semibold text-gray-900">{item.protein}g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">脂質</span>
                <span className="font-semibold text-gray-900">{item.fat}g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">炭水化物</span>
                <span className="font-semibold text-gray-900">{item.carbs}g</span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-[10px] font-bold text-gray-900">
                ¥{item.price}
              </span>
              <span className="bg-orange-600 text-white px-1 py-0.5 rounded text-[8px] hover:bg-orange-700 transition-colors">
                詳細
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );

  return (
    <section id="menu" className="h-[100dvh] sm:h-auto bg-white flex flex-col sm:block sm:py-20 sm:pb-20">
      <div className="flex-1 flex flex-col sm:block max-w-[375px] px-4 md:max-w-[768px] md:px-6 lg:max-w-[1200px] lg:px-8 mx-auto w-full pb-20 sm:pb-0">
        <div className="text-center mb-4 sm:mb-12 pt-8">
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-gray-900">
            弁当<span className="text-orange-600">メニュー</span>一覧
          </h2>
        </div>

        {/* Mobile: Single card with pagination and swipe */}
        <div className="sm:hidden flex-1 flex flex-col">
          <div 
            className="flex-1 px-4 mb-2 overflow-hidden flex items-center justify-center"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div className="w-full max-w-[340px]">
              <Link href={`/menu/${currentItem.id}`} className="block">
                <div className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 h-[380px] flex flex-col overflow-hidden">
                  <div className="relative h-[220px] flex-shrink-0">
                    <Image
                      src={currentItem.image}
                      alt={currentItem.name}
                      fill
                      className="object-cover"
                      sizes="100vw"
                      priority
                    />
                  </div>
                  <div className="p-3 flex flex-col">
                    <h3 className="text-base font-bold text-gray-900 mb-2 truncate">
                      {currentItem.name}
                    </h3>
                    <div className="mb-2">
                      <span className="text-xl font-bold text-orange-600">
                        {currentItem.calories}
                      </span>
                      <span className="text-xs text-gray-600 ml-1">kcal</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">タンパク質</span>
                        <span className="font-semibold text-gray-900">{currentItem.protein}g</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">脂質</span>
                        <span className="font-semibold text-gray-900">{currentItem.fat}g</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">炭水化物</span>
                        <span className="font-semibold text-gray-900">{currentItem.carbs}g</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Pagination dots */}
          <div className="flex justify-center gap-2 mb-2">
            {menuItems.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'bg-orange-600 w-7' 
                    : 'bg-gray-300 w-2.5 hover:bg-gray-400'
                }`}
                aria-label={`Go to menu item ${index + 1}`}
              />
            ))}
          </div>

          {/* View lineup button */}
          <div className="px-4 pb-2">
            <Link
              href="/menu-list"
              className="block w-full bg-orange-600 text-white py-2.5 rounded-full text-sm font-semibold text-center hover:bg-orange-700 transition-colors"
            >
              ラインナップを見る
            </Link>
          </div>
        </div>

        {/* Desktop: All cards in a list */}
        <div className="hidden sm:block space-y-8">
          {menuItems.map((item, index) => (
            <div 
              key={index} 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push(`/menu/${item.id}`);
              }}
              className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer"
            >
              <div className="flex h-[280px]">
                <div className="relative w-[40%]">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="40vw"
                  />
                </div>
                <div className="w-[60%] p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {item.name}
                    </h3>
                    <div className="mb-3">
                      <span className="text-4xl font-bold text-orange-600">
                        {item.calories}
                      </span>
                      <span className="text-sm text-gray-600 ml-1">kcal</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">タンパク質</span>
                      <span className="font-semibold text-gray-900">{item.protein}g</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">脂質</span>
                      <span className="font-semibold text-gray-900">{item.fat}g</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">炭水化物</span>
                      <span className="font-semibold text-gray-900">{item.carbs}g</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-end mt-4">
                    <span className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm">
                      詳細を見る
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MenuSection;