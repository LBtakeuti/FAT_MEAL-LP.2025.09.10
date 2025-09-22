'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { menuItems } from '@/data/menuData';
import MobileHeader from '@/components/MobileHeader';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

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
  const router = useRouter();
  
  return (
    <div className="min-h-screen bg-white">
      {/* Headers */}
      <div className="sm:hidden">
        <MobileHeader />
      </div>
      <div className="hidden sm:block">
        <Header />
      </div>

      <main className="pt-14 sm:pt-20">
        {/* Hero Image */}
        <div className="relative w-full h-[300px] sm:h-[400px] lg:h-[500px]">
          <Image
            src={menuItem.image}
            alt={menuItem.name}
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="max-w-[375px] sm:max-w-[700px] lg:max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Menu Name and Description */}
          <div className="mb-8 sm:mb-12">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              {menuItem.name}
            </h1>
            <p className="text-gray-700 text-sm sm:text-base lg:text-lg leading-relaxed">
              {menuItem.description}
            </p>
          </div>

          {/* Features */}
          <div className="mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
              このメニューの特徴
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {menuItem.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-700 text-sm sm:text-base">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Nutrition Info */}
          <div className="mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
              栄養成分表示
            </h2>
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="text-center mb-6">
                <div className="text-4xl sm:text-5xl font-bold text-orange-600 mb-1">
                  {menuItem.calories}
                </div>
                <div className="text-sm text-gray-600">kcal</div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">タンパク質</span>
                  <span className="text-lg font-bold text-gray-900">{menuItem.protein}g</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">脂質</span>
                  <span className="text-lg font-bold text-gray-900">{menuItem.fat}g</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">炭水化物</span>
                  <span className="text-lg font-bold text-gray-900">{menuItem.carbs}g</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <div className="mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
              原材料
            </h2>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <ul className="space-y-2">
                {menuItem.ingredients.map((ingredient, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-orange-600 rounded-full"></span>
                    <span className="text-gray-700 text-sm sm:text-base">{ingredient}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Allergens */}
          <div className="mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
              アレルギー情報
            </h2>
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-start gap-3 mb-3">
                <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-red-800 font-semibold mb-2">含まれるアレルギー物質</p>
                  <div className="flex flex-wrap gap-2">
                    {menuItem.allergens.map((allergen, index) => (
                      <span key={index} className="bg-white px-3 py-1 rounded-full text-sm text-red-700 border border-red-300">
                        {allergen}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <button
              onClick={() => router.push('/purchase')}
              className="w-full bg-orange-600 text-white py-4 rounded-full font-bold text-lg hover:bg-orange-700 transition-colors"
            >
              購入へ進む
            </button>
            
            <button
              onClick={() => router.push('/menu-list')}
              className="w-full bg-white border-2 border-orange-600 text-orange-600 py-4 rounded-full font-bold text-lg hover:bg-orange-50 transition-colors"
            >
              ラインナップを見る
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}