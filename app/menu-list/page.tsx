'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { menuItems as staticMenuItems } from '@/data/menuData';
import MobileHeader from '@/components/MobileHeader';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
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
    <div className="min-h-screen bg-white flex flex-col">
      {/* Headers */}
      <div className="sm:hidden">
        <MobileHeader />
      </div>
      <div className="hidden sm:block">
        <Header />
      </div>

      <main className="flex-1 pt-20 sm:pt-20 pb-12 sm:pb-20">
        <div className="max-w-[375px] px-4 md:max-w-[768px] md:px-6 lg:max-w-[1200px] lg:px-8 mx-auto w-full">
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
          <div className="mb-6 sm:mb-12">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
              メニュー一覧
            </h1>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {menuItems.map((item) => (
              <Link
                key={item.id}
                href={`/menu/${item.id}`}
                className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer flex flex-col"
              >
                {/* Image */}
                <div className="relative w-full h-[200px] sm:h-[220px]">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                </div>
                
                {/* Content */}
                <div className="p-4 sm:p-5 flex flex-col flex-grow">
                  {/* Menu Name */}
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                    {item.name}
                  </h3>
                  
                  {/* Calories */}
                  <div className="mb-2">
                    <span className="text-xl sm:text-2xl font-bold text-orange-600">
                      {item.calories}
                    </span>
                    <span className="text-sm text-gray-600 ml-1">kcal</span>
                  </div>
                  
                  {/* Description */}
                  <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2 flex-grow">
                    {item.description}
                  </p>
                  
                  {/* Nutrition Info */}
                  <div className="space-y-1 text-xs sm:text-sm">
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
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}