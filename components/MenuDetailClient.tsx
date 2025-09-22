'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { menuItems } from '@/data/menuData';
import MobileHeader from '@/components/MobileHeader';

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
  features: string[];
  ingredients: string[];
  allergens: string[];
}

interface MenuDetailClientProps {
  menuItem: MenuItem;
}

export default function MenuDetailClient({ menuItem }: MenuDetailClientProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const currentItemIndex = menuItems.findIndex(item => item.id === menuItem.id);
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <MobileHeader />

      <main className="pt-14 pb-24 sm:pt-20">
        <div className="max-w-[450px] sm:max-w-[700px] lg:max-w-[900px] xl:max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Title */}
          <div className="text-center py-6 sm:py-8 lg:py-10">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
              弁当<span className="text-orange-600">メニュー</span>一覧
            </h1>
          </div>

          {/* Menu Card */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8 lg:mb-12">
            {/* Image with larger size */}
            <div className="relative w-full h-[350px] sm:h-[450px] lg:h-[500px] xl:h-[600px]">
              <Image
                src={menuItem.image}
                alt={menuItem.name}
                fill
                className="object-cover"
                priority
              />
            </div>

            {/* Content with more padding */}
            <div className="p-8 sm:p-10 lg:p-12 xl:p-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-4 lg:mb-6">
                {menuItem.name}
              </h2>
              
              {/* Calories display */}
              <div className="mb-6 lg:mb-8">
                <span className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-orange-600">
                  {menuItem.calories}
                </span>
                <span className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl text-gray-600 ml-2">kcal</span>
              </div>

              {/* Nutrition info */}
              <div className="space-y-4 lg:space-y-6">
                <div className="flex justify-between py-3 lg:py-4 border-b border-gray-100">
                  <span className="text-lg lg:text-xl xl:text-2xl text-gray-600">タンパク質</span>
                  <span className="text-lg lg:text-xl xl:text-2xl font-semibold text-gray-900">{menuItem.protein}</span>
                </div>
                <div className="flex justify-between py-3 lg:py-4 border-b border-gray-100">
                  <span className="text-lg lg:text-xl xl:text-2xl text-gray-600">脂質</span>
                  <span className="text-lg lg:text-xl xl:text-2xl font-semibold text-gray-900">{menuItem.fat}</span>
                </div>
                <div className="flex justify-between py-3 lg:py-4">
                  <span className="text-lg lg:text-xl xl:text-2xl text-gray-600">炭水化物</span>
                  <span className="text-lg lg:text-xl xl:text-2xl font-semibold text-gray-900">{menuItem.carbs}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Carousel dots */}
          <div className="flex justify-center gap-3 lg:gap-4 mb-10 lg:mb-12">
            {menuItems.map((item, index) => (
              <button
                key={item.id}
                onClick={() => window.location.href = `/menu/${item.id}`}
                className={`h-3 lg:h-4 rounded-full transition-all ${
                  index === currentItemIndex 
                    ? 'w-10 lg:w-12 bg-orange-600' 
                    : 'w-3 lg:w-4 bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`View ${item.name}`}
              />
            ))}
          </div>

          {/* Action button */}
          <button 
            onClick={() => window.location.href = '/menu-list'}
            className="w-full lg:max-w-lg lg:mx-auto lg:block bg-orange-600 text-white py-5 lg:py-6 rounded-full font-bold text-xl lg:text-2xl hover:bg-orange-700 transition-colors mb-6"
          >
            ラインナップを見る
          </button>
        </div>
      </main>

      {/* Bottom Navigation for mobile */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="grid grid-cols-2 h-16">
          <button 
            onClick={() => window.location.href = '/purchase'}
            className="flex items-center justify-center gap-2 text-white bg-orange-600 hover:bg-orange-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="font-medium">購入</span>
          </button>
          <button 
            onClick={() => window.location.href = '/contact'}
            className="flex items-center justify-center gap-2 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="font-medium">お問い合わせ</span>
          </button>
        </div>
      </div>
    </div>
  );
}