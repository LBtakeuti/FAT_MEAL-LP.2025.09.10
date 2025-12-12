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
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'exit' | 'entering' | 'enter'>('idle');
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left');
  const autoSwipeTimer = useRef<NodeJS.Timeout | null>(null);
  const lastInteractionTime = useRef<number>(Date.now());
  const [isTitleVisible, setIsTitleVisible] = useState(false);
  const titleRef = useRef<HTMLDivElement>(null);

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

  // タイトルのスクロールアニメーション用
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsTitleVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (titleRef.current) {
      observer.observe(titleRef.current);
    }

    return () => {
      if (titleRef.current) {
        observer.unobserve(titleRef.current);
      }
    };
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

  const animateToIndex = (newIndex: number, direction: 'left' | 'right') => {
    if (animationPhase !== 'idle') return;

    setSlideDirection(direction);
    setAnimationPhase('exit');

    // Exit animation完了後、インデックス変更して入場アニメーション
    setTimeout(() => {
      setCurrentIndex(newIndex);
      // まず入場開始位置に配置（反対側から）
      setAnimationPhase('entering');

      // 次のフレームで入場アニメーション開始
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimationPhase('enter');

          // Enter animation complete
          setTimeout(() => {
            setAnimationPhase('idle');
          }, 300);
        });
      });
    }, 300);

    resetAutoSwipeTimer();
  };

  const handlePrevious = () => {
    const newIndex = (currentIndex - 1 + menuItems.length) % menuItems.length;
    animateToIndex(newIndex, 'right'); // 右方向にスライド（前へ）
  };

  const handleNext = () => {
    const newIndex = (currentIndex + 1) % menuItems.length;
    animateToIndex(newIndex, 'left'); // 左方向にスライド（次へ）
  };

  const handleDotClick = (index: number) => {
    if (index === currentIndex) return;
    const direction = index > currentIndex ? 'left' : 'right';
    animateToIndex(index, direction);
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
          <div className="mb-6 -mt-2 sm:-mt-1">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
              <span className="text-orange-600">メニュー</span>
            </h2>
            {/* アンダーライン */}
            <div className="relative h-0.5 bg-gray-300 overflow-hidden">
              <div className="absolute top-0 left-0 h-full bg-orange-500 w-full" />
            </div>
            <p className="text-sm text-gray-600 mt-4">
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
      className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer"
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
    <section id="menu" className="relative overflow-hidden bg-[#fff7ed] flex flex-col sm:block py-4 sm:py-8">
      {/* 上部の波形 */}
      <div className="absolute top-0 left-0 w-full overflow-hidden leading-none z-10" style={{ transform: 'translateY(-1px)' }}>
        <svg
          className="relative block w-full h-16 sm:h-24"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
            className="fill-white"
          ></path>
        </svg>
      </div>
      
      <div className="relative z-20 flex-1 flex flex-col sm:block max-w-[375px] px-4 md:max-w-[768px] md:px-6 lg:max-w-[1200px] lg:px-8 mx-auto w-full pb-20 sm:pb-0">
        <div ref={titleRef} className="mb-3 sm:mb-8 -mt-2 sm:-mt-1">
          <div className="mb-2">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
              <span className="text-orange-600">メニュー</span>
            </h2>
          </div>
          {/* アンダーライン */}
          <div className="relative h-0.5 bg-gray-300 overflow-hidden">
            <div
              className={`absolute top-0 left-0 h-full bg-orange-500 transition-all duration-1000 ease-out ${
                isTitleVisible ? 'w-full' : 'w-0'
              }`}
            />
          </div>
        </div>

        {/* Mobile: Single card with left/right buttons */}
        <div className="sm:hidden flex-1 flex flex-col">
          <div className="flex-1 relative flex items-center justify-center px-2 mb-2">
            {/* Left Arrow Button */}
            <button
              type="button"
              onClick={handlePrevious}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-30 w-10 h-10 flex items-center justify-center bg-white/90 rounded-full shadow-lg active:bg-orange-100 transition-colors"
              style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
              aria-label="前のメニュー"
            >
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Menu Card */}
            <div className="w-full max-w-[280px] mx-8 overflow-hidden">
              <div
                onClick={() => router.push(`/menu/${currentItem.id}`)}
                className={`bg-white shadow-lg hover:shadow-xl h-[360px] flex flex-col overflow-hidden cursor-pointer rounded-lg ${
                  animationPhase === 'entering'
                    ? '' // トランジションなし（即座に配置）
                    : 'transition-all duration-300 ease-out'
                } ${
                  animationPhase === 'exit'
                    ? slideDirection === 'left'
                      ? '-translate-x-full opacity-0'
                      : 'translate-x-full opacity-0'
                    : animationPhase === 'entering'
                      ? slideDirection === 'left'
                        ? 'translate-x-full opacity-0' // 右から入場するため右に配置
                        : '-translate-x-full opacity-0' // 左から入場するため左に配置
                      : 'translate-x-0 opacity-100'
                }`}
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

            {/* Right Arrow Button */}
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-30 w-10 h-10 flex items-center justify-center bg-white/90 rounded-full shadow-lg active:bg-orange-100 transition-colors"
              style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
              aria-label="次のメニュー"
            >
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Pagination dots */}
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
                style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
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

        {/* Desktop: Grid layout */}
        <div className="hidden sm:grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item, index) => (
            <div 
              key={index} 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push(`/menu/${item.id}`);
              }}
              className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer flex flex-col"
            >
              <div className="relative w-full h-[200px]">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {item.name}
                </h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-orange-600">
                    {item.calories}
                  </span>
                  <span className="text-sm text-gray-600 ml-1">kcal</span>
                </div>
                <div className="space-y-2 mb-4 flex-grow">
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
                <div className="flex items-center justify-center mt-auto">
                  <span className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm">
                    詳細を見る
                  </span>
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