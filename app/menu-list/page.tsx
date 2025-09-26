'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { menuItems as staticMenuItems } from '@/data/menuData';
import MobileHeader from '@/components/MobileHeader';
import { useRouter } from 'next/navigation';

export default function MenuListPage() {
  const router = useRouter();
  const [menuItems, setMenuItems] = useState(staticMenuItems);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMenuItems();
    
    // 30秒ごとに更新
    const interval = setInterval(() => {
      fetchMenuItems();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchMenuItems = async () => {
    try {
      const response = await fetch('/api/menu', {
        cache: 'no-store'
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setMenuItems(data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch menu items:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="h-[100dvh] bg-gray-50 flex flex-col">
      {/* Mobile Header */}
      <MobileHeader />

      <main className="flex-1 pt-14 sm:pt-20 pb-20 flex flex-col">
        <div className="max-w-[375px] px-4 md:max-w-[768px] md:px-6 lg:max-w-[1200px] lg:px-8 mx-auto w-full flex-1 flex flex-col">
          {/* Back button */}
          <div className="mt-4 mb-4">
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
          
          <div className="text-center mb-4 sm:mb-12">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-gray-900">
              弁当<span className="text-orange-600">メニュー</span>一覧
            </h1>
          </div>

          {/* Mobile: Vertical cards with left image, right text */}
          <div className="sm:hidden bg-white rounded-lg shadow-sm p-4 flex-1 flex flex-col justify-between">
            <div className="flex-1 flex flex-col justify-evenly">
              {menuItems.map((item, index) => (
                <div key={index}>
                  <Link href={`/menu/${item.id}`} className="flex gap-3 py-3 px-1">
                    <div className="relative w-[80px] h-[80px] flex-shrink-0">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover rounded-lg"
                        sizes="80px"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-gray-900 mb-1">
                        {item.name}
                      </h3>
                      <p className="text-[11px] text-gray-600 mb-2 leading-relaxed">
                        {item.description}
                      </p>
                      <div className="flex items-center gap-3">
                        <span className="text-base font-bold text-orange-600">
                          {item.calories}kcal
                        </span>
                      </div>
                    </div>
                  </Link>
                  {index < menuItems.length - 1 && (
                    <div className="border-b border-gray-100 mx-2"></div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Purchase Button */}
            <div className="mt-4">
              <button
                onClick={() => router.push('/purchase')}
                className="w-full bg-orange-600 text-white py-3 rounded-full font-semibold hover:bg-orange-700 transition-colors"
              >
                購入へ進む
              </button>
            </div>
          </div>

          {/* Desktop: Vertical cards similar to mobile */}
          <div className="hidden sm:flex sm:flex-col sm:flex-1 max-w-[900px] mx-auto w-full">
            <div className="bg-white rounded-xl shadow-sm p-6 space-y-6 flex-1">
              {menuItems.map((item, index) => (
                <div key={index} className="border-b border-gray-100 pb-6 last:border-0">
                  <Link href={`/menu/${item.id}`} className="flex gap-6 hover:bg-gray-50 p-4 -m-4 rounded-lg transition-colors">
                    <div className="relative w-[150px] h-[150px] flex-shrink-0">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover rounded-lg"
                        sizes="150px"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {item.name}
                      </h3>
                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {item.description}
                      </p>
                      <div className="flex items-center gap-6">
                        <span className="text-2xl font-bold text-orange-600">
                          {item.calories}kcal
                        </span>
                      </div>
                      <div className="flex gap-6 mt-3 text-sm">
                        <div>
                          <span className="text-gray-500">タンパク質</span>
                          <span className="font-semibold text-gray-900 ml-1">{item.protein}g</span>
                        </div>
                        <div>
                          <span className="text-gray-500">脂質</span>
                          <span className="font-semibold text-gray-900 ml-1">{item.fat}g</span>
                        </div>
                        <div>
                          <span className="text-gray-500">炭水化物</span>
                          <span className="font-semibold text-gray-900 ml-1">{item.carbs}g</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
              
              {/* Purchase Button */}
              <div className="pt-6">
                <button
                  onClick={() => router.push('/purchase')}
                  className="w-full bg-orange-600 text-white py-4 rounded-full font-semibold text-lg hover:bg-orange-700 transition-colors"
                >
                  購入へ進む
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}