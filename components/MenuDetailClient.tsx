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
  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Header */}
      <MobileHeader />

      <main className="pt-14 sm:pt-0">
        {/* Hero Image with Back Button Overlay */}
        <div className="relative w-full h-[300px] sm:h-[400px] lg:h-[500px] border-t-[16px] border-b-[16px] border-white">
          <Image
            src={menuItem.image}
            alt={menuItem.name}
            fill
            className="object-cover"
            priority
          />
          
          {/* Back Button - Simple icon only */}
          <Link 
            href="/" 
            className="absolute top-4 left-4 z-10 hover:opacity-80 transition-opacity"
          >
            <Image
              src="/Frame 7.svg"
              alt="戻る"
              width={40}
              height={40}
              className="sm:w-12 sm:h-12"
            />
          </Link>
        </div>

        {/* Content */}
        <div className="max-w-[800px] mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Title and Price */}
          <div className="mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {menuItem.name}
            </h2>
            <div className="flex items-baseline gap-4">
              <span className="text-4xl font-bold text-orange-600">
                ¥{menuItem.price}
              </span>
              <span className="text-2xl font-semibold text-gray-700">
                {menuItem.calories}kcal
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="mb-8">
            <p className="text-lg text-gray-700 leading-relaxed">
              {menuItem.description}
            </p>
          </div>

          {/* Features */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              このメニューの特徴
            </h3>
            <ul className="space-y-2">
              {menuItem.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-orange-600 mr-2">✓</span>
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Nutrition Facts */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              栄養成分表示（1食あたり）
            </h3>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">エネルギー</span>
                  <span className="font-semibold">{menuItem.calories}kcal</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">タンパク質</span>
                  <span className="font-semibold">{menuItem.protein}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">脂質</span>
                  <span className="font-semibold">{menuItem.fat}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">炭水化物</span>
                  <span className="font-semibold">{menuItem.carbs}g</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              原材料
            </h3>
            <div className="bg-gray-50 rounded-lg p-6">
              <p className="text-gray-700">
                {menuItem.ingredients.join('、')}
              </p>
            </div>
          </div>

          {/* Allergens */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              アレルギー情報
            </h3>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
              <p className="text-sm text-gray-600 mb-2">
                本製品に含まれるアレルギー物質（特定原材料等）
              </p>
              <div className="flex flex-wrap gap-2">
                {menuItem.allergens.map((allergen, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-orange-600 text-white rounded-full text-sm"
                  >
                    {allergen}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <button className="flex-1 bg-orange-600 text-white py-4 px-8 rounded-full text-lg font-semibold hover:bg-orange-700 transition-colors">
              このメニューを注文する
            </button>
            <Link
              href="/#menu"
              className="flex-1 border-2 border-orange-600 text-orange-600 py-4 px-8 rounded-full text-lg font-semibold hover:bg-orange-50 transition-colors text-center"
            >
              他のメニューを見る
            </Link>
          </div>

          {/* Related Items */}
          <div className="border-t pt-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              おすすめの組み合わせ
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {menuItems
                .filter(item => item.id !== menuItem.id)
                .slice(0, 3)
                .map((item) => (
                  <Link
                    key={item.id}
                    href={`/menu/${item.id}`}
                    className="group"
                  >
                    <div className="relative h-[100px] rounded-lg overflow-hidden mb-2">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform"
                      />
                    </div>
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {item.calories}kcal / ¥{item.price}
                    </p>
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}