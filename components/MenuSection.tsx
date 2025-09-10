'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { menuItems } from '@/data/menuData';

const MenuSection: React.FC = () => {
  // All 5 cards on one page
  const allItems = menuItems;

  const MenuCard = ({ item, compact = false }: { item: typeof menuItems[0], compact?: boolean }) => (
    <Link href={`/menu/${item.id}`} className="block">
      <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer">
        <div className="flex flex-col">
          <div className={`relative ${compact ? 'h-[80px]' : 'h-[90px]'}`}>
            <Image
              src={item.image}
              alt={item.name}
              fill
              className="object-cover"
              sizes="50vw"
            />
          </div>
          <div className={`${compact ? 'p-2' : 'p-2.5'} flex flex-col`}>
            <h3 className="text-[11px] font-bold text-gray-900 mb-0.5">
              {item.name}
            </h3>
            <div className="mb-0.5">
              <span className="text-base font-bold text-orange-600">
                {item.calories}
              </span>
              <span className="text-[10px] text-gray-600">kcal</span>
            </div>
            <div className="space-y-0 text-[9px]">
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
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs font-bold text-gray-900">
                ¥{item.price}
              </span>
              <span className="bg-orange-600 text-white px-1.5 py-0.5 rounded text-[9px] hover:bg-orange-700 transition-colors">
                詳細
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );

  return (
    <section id="menu" className="min-h-screen bg-white py-12 sm:py-20">
      <div className="max-w-[375px] px-4 md:max-w-[768px] md:px-6 lg:max-w-[1200px] lg:px-8 mx-auto">
        <div className="text-center mb-6 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900">
            弁当<span className="text-orange-600">メニュー</span>一覧
          </h2>
        </div>

        {/* Mobile: All 5 cards in one view */}
        <div className="sm:hidden">
          <div className="px-2">
            {/* 5th card at the top - more compact */}
            <div className="mb-3 max-w-[200px] mx-auto">
              <MenuCard item={allItems[4]} compact={true} />
            </div>
            
            {/* First 4 cards in 2x2 grid */}
            <div className="grid grid-cols-2 gap-2">
              {allItems.slice(0, 4).map((item, index) => (
                <MenuCard key={index} item={item} />
              ))}
            </div>
          </div>
        </div>

        {/* Desktop: All cards in a list */}
        <div className="hidden sm:block space-y-8">
          {menuItems.map((item, index) => (
            <Link key={index} href={`/menu/${item.id}`} className="block">
              <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer">
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
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-2xl font-bold text-gray-900">
                        ¥{item.price}
                      </span>
                      <span className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm">
                        詳細
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MenuSection;