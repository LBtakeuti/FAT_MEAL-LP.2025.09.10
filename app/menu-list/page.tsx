'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { menuItems } from '@/data/menuData';
import MobileHeader from '@/components/MobileHeader';

export default function MenuListPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Header */}
      <MobileHeader />

      <main className="pt-14 sm:pt-20 pb-20">
        <div className="max-w-[375px] px-4 md:max-w-[768px] md:px-6 lg:max-w-[1200px] lg:px-8 mx-auto">
          <div className="text-center mb-6 sm:mb-12">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-gray-900">
              弁当<span className="text-orange-600">メニュー</span>一覧
            </h1>
          </div>

          {/* Mobile: Vertical list with horizontal cards */}
          <div className="sm:hidden space-y-3">
            {menuItems.map((item, index) => (
              <Link key={index} href={`/menu/${item.id}`} className="block">
                <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
                  <div className="flex h-[120px]">
                    <div className="relative w-[35%]">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="35vw"
                      />
                    </div>
                    <div className="w-[65%] p-3 flex flex-col justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-1">
                          {item.name}
                        </h3>
                        <div className="mb-2">
                          <span className="text-lg font-bold text-orange-600">
                            {item.calories}
                          </span>
                          <span className="text-xs text-gray-600">kcal</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-[10px]">
                        <div className="text-center">
                          <div className="text-gray-500">タンパク質</div>
                          <div className="font-semibold text-gray-900">{item.protein}g</div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-500">脂質</div>
                          <div className="font-semibold text-gray-900">{item.fat}g</div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-500">炭水化物</div>
                          <div className="font-semibold text-gray-900">{item.carbs}g</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop: Vertical list with horizontal cards */}
          <div className="hidden sm:block max-w-[800px] mx-auto space-y-4">
            {menuItems.map((item, index) => (
              <Link key={index} href={`/menu/${item.id}`} className="block">
                <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="flex h-[180px]">
                    <div className="relative w-[35%]">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="35vw"
                      />
                    </div>
                    <div className="w-[65%] p-6 flex flex-col justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {item.name}
                        </h3>
                        <div className="mb-3">
                          <span className="text-3xl font-bold text-orange-600">
                            {item.calories}
                          </span>
                          <span className="text-sm text-gray-600 ml-1">kcal</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex gap-6">
                          <div>
                            <span className="text-gray-600 text-sm">タンパク質</span>
                            <span className="font-semibold text-gray-900 ml-2">{item.protein}g</span>
                          </div>
                          <div>
                            <span className="text-gray-600 text-sm">脂質</span>
                            <span className="font-semibold text-gray-900 ml-2">{item.fat}g</span>
                          </div>
                          <div>
                            <span className="text-gray-600 text-sm">炭水化物</span>
                            <span className="font-semibold text-gray-900 ml-2">{item.carbs}g</span>
                          </div>
                        </div>
                        <span className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm">
                          詳細を見る
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Back to Home Button */}
          <div className="mt-8 text-center">
            <Link 
              href="/"
              className="inline-flex items-center gap-2 bg-white border-2 border-orange-600 text-orange-600 px-6 py-3 rounded-full font-semibold hover:bg-orange-50 transition-colors"
            >
              <Image
                src="/Frame 7.svg"
                alt="戻る"
                width={24}
                height={24}
              />
              <span>ホームに戻る</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}