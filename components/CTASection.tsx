'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const CTASection: React.FC = () => {
  const router = useRouter();
  const sets = [
    {
      id: 'plan-6',
      meals: 6,
      title: 'ふとるめし6個セット',
      price: 4200,
      pricePerMeal: 700,
      description: '初めての方におすすめ',
      subtitle: '6種類×1個ずつ',
      comingSoon: false,
    },
    {
      id: 'plan-12',
      meals: 12,
      title: 'ふとるめし12個セット',
      price: 8400,
      pricePerMeal: 700,
      description: '1週間しっかり続けたい方に',
      subtitle: '6種類×2個ずつ',
      comingSoon: false,
    },
    {
      id: 'plan-18',
      meals: 18,
      title: 'ふとるめし18個セット',
      price: 12600,
      pricePerMeal: 700,
      description: '本格的に体作りを始める方に',
      subtitle: '6種類×3個ずつ',
      comingSoon: false,
    },
  ];

  const [selectedPlan, setSelectedPlan] = useState<string>(sets[0].id);

  const handlePurchase = (planId: string) => {
    router.push(`/purchase?plan=${planId}`);
  };

  return (
    <section id="pricing" className="relative overflow-hidden bg-white py-12 sm:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            <span className="text-orange-600">ふとるめし</span>を試してみよう
          </h2>
        </div>

        {/* セット選択カード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {sets.map((set) => (
            <div
              key={set.id}
              onClick={() => {
                if (!set.comingSoon) {
                  setSelectedPlan(set.id);
                  handlePurchase(set.id);
                }
              }}
              className={`relative bg-white rounded-2xl p-6 sm:p-8 transition-all duration-300 border-2 flex flex-col ${
                set.comingSoon
                  ? 'border-gray-200 cursor-not-allowed'
                  : 'border-gray-200 cursor-pointer hover:border-orange-500 hover:shadow-xl hover:scale-105'
              }`}
            >
              {/* Coming Soon オーバーレイ */}
              {set.comingSoon && (
                <div className="absolute inset-0 bg-gray-100/80 backdrop-blur-[2px] rounded-2xl z-10 flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-2xl sm:text-3xl font-bold text-gray-500">Coming Soon</span>
                    <p className="text-sm text-gray-400 mt-2">準備中</p>
                  </div>
                </div>
              )}

              {/* セット内容 */}
              <div className="text-center mb-6">
                <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                  {set.title}
                </div>
                <p className="text-xs text-gray-500">
                  {set.subtitle}
                </p>
              </div>

              {/* 価格 */}
              <div className="text-center mb-6 pb-6 border-b border-gray-200">
                <div className="text-3xl sm:text-4xl font-bold text-orange-600 mb-1">
                  ¥{set.price.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">
                  税込
                </div>
              </div>

              {/* 選択ボタン */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!set.comingSoon) {
                    setSelectedPlan(set.id);
                    handlePurchase(set.id);
                  }
                }}
                disabled={set.comingSoon}
                className={`mt-auto w-full h-12 sm:h-14 rounded-xl font-bold text-base sm:text-lg transition-all duration-300 shadow-md ${
                  set.comingSoon
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-orange-500 text-white hover:bg-orange-600 hover:shadow-lg'
                }`}
              >
                {set.comingSoon ? '準備中' : '購入する'}
              </button>
            </div>
          ))}
        </div>

        {/* 注意事項 */}
        <div className="mt-8 sm:mt-12 text-center text-sm text-gray-600">
          <p className="mb-2">※価格は税込表示です</p>
          <p>※送料は別途かかります</p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;