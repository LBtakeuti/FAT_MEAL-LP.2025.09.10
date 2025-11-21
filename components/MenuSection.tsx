'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { menuItems as staticMenuData } from '@/data/menuData';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: string;
  calories: string;
  protein: string;
  fat: string;
  carbs: string;
  image: string;
}

// 静的データを初期値として変換
const initialMenuItems: MenuItem[] = staticMenuData.slice(0, 3).map(item => ({
  id: item.id,
  name: item.name,
  description: item.description,
  price: String(item.price),
  calories: String(item.calories),
  protein: String(item.protein),
  fat: String(item.fat),
  carbs: String(item.carbs),
  image: item.image
}));

const MenuSection: React.FC = () => {
  const router = useRouter();
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems);
  const [isLoading, setIsLoading] = useState(false); // 初期データがあるのでfalse
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const autoSwipeTimer = useRef<NodeJS.Timeout | null>(null);
  const lastInteractionTime = useRef<number>(Date.now());

  // APIからメニューデータを取得（バックグラウンドで更新）
  useEffect(() => {
    // 初回取得（エラーを抑制）
    fetchMenuItems().catch(() => {
      // エラーは無視して静的データを使用
    });
    
    // 30秒ごとに更新（管理画面での変更を反映）
    const interval = setInterval(() => {
      fetchMenuItems().catch(() => {
        // エラーは無視して静的データを使用
      });
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchMenuItems = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒でタイムアウト
      
      const response = await fetch('/api/menu', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        // データが取得できたら更新
        if (data && data.length > 0) {
          setMenuItems(data.slice(0, 3)); // 最初の3つだけ表示
        }
      }
    } catch (error) {
      // エラー時は静的データを維持（完全に無視）
      // ネットワークエラー、タイムアウト、その他のエラーをすべて無視
    }
  };

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

  // ローディングまたはデータがない場合の処理
  if (isLoading || menuItems.length === 0 || !currentItem) {
    return (
      <section id="menu" className="py-8 sm:py-12 bg-orange-50">
        <div className="max-w-[375px] px-4 md:max-w-[768px] md:px-6 lg:max-w-[1200px] lg:px-8 mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              <span className="text-orange-600">メニュー</span>
            </h2>
            <p className="text-sm text-gray-600">
              ボリューム満点！高カロリー・高タンパクの特製弁当
            </p>
          </div>
          <div className="flex justify-center items-center h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        </div>
      </section>
    );
  }

  const MenuCard = ({ item, compact = false }: { item: MenuItem, compact?: boolean }) => (
    <div 
      onClick={() => router.push(`/menu/${item.id}`)}
      className="bg-[#fff7ed] rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer"
    >
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
          <div className="flex items-center justify-end mt-0.5">
            <span className="bg-orange-600 text-white px-1 py-0.5 rounded text-[8px] hover:bg-orange-700 transition-colors">
              詳細
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <section id="menu" className="bg-[#fff7ed] flex flex-col sm:block py-4 sm:py-8">
      <div className="flex-1 flex flex-col sm:block max-w-[375px] px-4 md:max-w-[768px] md:px-6 lg:max-w-[1200px] lg:px-8 mx-auto w-full pb-20 sm:pb-0">
        <div className="text-center mb-3 sm:mb-8">
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-gray-900">
            <span className="text-orange-600">メニュー</span>
          </h2>
        </div>

        {/* Mobile: Single card with pagination and swipe */}
        <div className="sm:hidden flex-1 flex flex-col">
          <div 
            className="flex-1 px-4 mb-2 overflow-visible flex items-center justify-center"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div className="w-full max-w-[340px]">
              <div 
                onClick={() => router.push(`/menu/${currentItem.id}`)}
                className="bg-[#fff7ed] shadow-lg hover:shadow-xl transition-shadow duration-300 h-[360px] flex flex-col overflow-hidden cursor-pointer"
              >
                <div className="relative h-[220px] flex-shrink-0">
                  <Image
                    src={currentItem.image}
                    alt={currentItem.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                    priority={currentIndex === 0}
                    loading={currentIndex === 0 ? "eager" : "lazy"}
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
              className="bg-[#fff7ed] rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer"
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