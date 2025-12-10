'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const CTASection: React.FC = () => {
  const router = useRouter();
  const sets = [
    {
      id: 'plan-3',
      meals: 3,
      title: 'ふとるめし3個セット',
      price: 3600,
      pricePerMeal: 1200,
      description: '初めての方におすすめ',
      subtitle: '3種類×1個ずつ',
      comingSoon: false,
    },
    {
      id: 'plan-6',
      meals: 6,
      title: 'ふとるめし6個セット',
      price: 7200,
      pricePerMeal: 1200,
      description: '1週間しっかり続けたい方に',
      subtitle: '3種類×2個ずつ',
      comingSoon: false,
    },
    {
      id: 'plan-9',
      meals: 9,
      title: 'ふとるめし9個セット',
      price: 10800,
      pricePerMeal: 1200,
      description: '本格的に体作りを始める方に',
      subtitle: '3種類×3個ずつ',
      comingSoon: true,
    },
  ];

  const [selectedPlan, setSelectedPlan] = useState<string>(sets[0].id);

  const handlePurchase = (planId: string) => {
    router.push(`/purchase?plan=${planId}`);
  };

  return (
    <section id="pricing" className="relative overflow-hidden bg-white py-12 sm:py-20">
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
            className="fill-orange-50"
          ></path>
        </svg>
      </div>

      {/* 下部の波形 */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-10" style={{ transform: 'translateY(1px)' }}>
        <svg
          className="relative block w-full h-16 sm:h-24"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          style={{ transform: 'scaleY(-1)' }}
        >
          <path
            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
            className="fill-orange-50"
          ></path>
        </svg>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 z-20">
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
                <p className="text-xs sm:text-sm md:text-base text-gray-600 mb-2 whitespace-nowrap">
                  {set.description}
                </p>
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