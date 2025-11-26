'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const CTASection: React.FC = () => {
  const router = useRouter();

  const handlePurchase = (plan: string) => {
    router.push(`/purchase?plan=${plan}`);
  };

  const mobilePlans = [
    {
      id: 'plan-6',
      label: '6個セット',
      price: '¥7,440',
      subtitle: '3種類×2個ずつ',
      features: ['全3種類×2個', '送料無料'],
      minHeight: 75,
    },
    {
      id: 'plan-12',
      label: '12個セット',
      price: '¥14,280',
      subtitle: '3種類×4個ずつ',
      features: ['全3種類×4個', '送料無料', '1食¥1,190'],
      minHeight: 85,
    },
    {
      id: 'plan-24',
      label: '24個セット',
      price: '¥27,360',
      subtitle: '3種類×8個ずつ',
      features: ['全3種類×8個', '送料無料', '1食¥1,140'],
      minHeight: 85,
    },
  ];

  const [selectedPlan, setSelectedPlan] = useState(mobilePlans[0].id);

  return (
    <section id="pricing" className="relative overflow-hidden bg-[#fff7ed] py-6 sm:py-12 flex flex-col">
      {/* 上部の波形 */}
      <div className="absolute top-0 left-0 w-full overflow-hidden leading-none" style={{ transform: 'translateY(-1px)' }}>
        <svg
          className="relative block w-full h-16 sm:h-24"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
            className="fill-orange-100"
          ></path>
        </svg>
      </div>

      {/* 下部の波形 */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none" style={{ transform: 'translateY(1px)' }}>
        <svg
          className="relative block w-full h-16 sm:h-24"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          style={{ transform: 'scaleY(-1)' }}
        >
          <path
            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
            className="fill-white"
          ></path>
        </svg>
      </div>

      <div className="relative w-full max-w-lg px-4 md:max-w-3xl md:px-6 lg:max-w-7xl lg:px-8 mx-auto flex-1 flex flex-col">
        <div className="text-center mb-2 sm:mb-8">
          <h2 className="text-lg sm:text-4xl md:text-5xl font-bold text-gray-900 mb-1 sm:mb-4">
            <span className="text-orange-600">ふとるめし</span>を試してみよう
          </h2>
        </div>

        <div className="text-center mb-2 sm:mb-8">
          <h3 className="text-sm sm:text-3xl font-bold text-gray-900">
            選べる3つのセット
          </h3>
        </div>

        {/* Mobile: Vertical layout - Compact for one screen */}
        <div className="sm:hidden flex-1 flex flex-col justify-between space-y-2 pb-4">
          {mobilePlans.map((plan) => {
            const selected = selectedPlan === plan.id;
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => {
                  setSelectedPlan(plan.id);
                  handlePurchase(plan.id);
                }}
                className={`text-left rounded-lg border-2 px-3 py-3 transition-all ${
                  selected ? 'border-orange-500 bg-white shadow-md' : 'border-gray-200 bg-white'
                }`}
                style={{ minHeight: plan.minHeight }}
              >
                <div className="bg-orange-600 text-white px-2 py-0.5 rounded-md inline-block mb-1">
                  <span className="font-bold text-xs">{plan.label}</span>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900 leading-tight">{plan.price}</div>
                  <p className="text-[10px] text-gray-600 mb-0.5">{plan.subtitle}</p>
                  <div className="space-y-0 text-left">
                    {plan.features.map((feature, idx) => (
                      <div className="flex items-center" key={idx}>
                        <span className="text-orange-600 mr-1 text-[10px]">✓</span>
                        <span className="text-[10px] text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </button>
            );
          })}

          {/* 購入へ進むボタン */}
          <div className="mt-3">
            <button 
              onClick={() => handlePurchase(selectedPlan)}
              className="w-full bg-orange-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-orange-700 transition-colors">
              購入へ進む
            </button>
          </div>
        </div>

        {/* Desktop: Grid layout */}
        <div className="hidden sm:grid md:grid-cols-3 gap-6 lg:gap-8">
          {/* 3個セット */}
          <div className="bg-white border-2 border-gray-200 rounded-xl p-8 hover:border-orange-600 hover:shadow-lg transition-all flex flex-col">
            <div className="text-center flex-1 flex flex-col">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">3個セット</h3>
              <div className="mb-6">
                <div className="text-4xl font-bold text-orange-600">
                  ¥3,870
                </div>
                <p className="text-gray-600 mt-2">3種類×1個ずつ</p>
              </div>
              <div className="space-y-3 text-left mb-8 flex-1">
                <div className="flex items-center">
                  <span className="text-orange-600 mr-3 text-lg">✓</span>
                  <span className="text-gray-700">全3種類をお試し</span>
                </div>
                <div className="flex items-center">
                  <span className="text-orange-600 mr-3 text-lg">✓</span>
                  <span className="text-gray-700">送料無料</span>
                </div>
                <div className="flex items-center">
                  <span className="text-orange-600 mr-3 text-lg">✓</span>
                  <span className="text-gray-700">1食あたり¥1,290</span>
                </div>
              </div>
              <button 
                onClick={() => handlePurchase('plan-3')}
                className="w-full bg-white text-orange-600 border-2 border-orange-600 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-colors">
                購入する
              </button>
            </div>
          </div>

          {/* 6個セット */}
          <div className="bg-white border-2 border-gray-200 rounded-xl p-8 hover:border-orange-600 hover:shadow-lg transition-all flex flex-col">
            <div className="text-center flex-1 flex flex-col">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">6個セット</h3>
              <div className="mb-6">
                <div className="text-4xl font-bold text-orange-600">
                  ¥7,440
                </div>
                <p className="text-gray-600 mt-2">3種類×2個ずつ</p>
              </div>
              <div className="space-y-3 text-left mb-8 flex-1">
                <div className="flex items-center">
                  <span className="text-orange-600 mr-3 text-lg">✓</span>
                  <span className="text-gray-700">全3種類×2個</span>
                </div>
                <div className="flex items-center">
                  <span className="text-orange-600 mr-3 text-lg">✓</span>
                  <span className="text-gray-700">送料無料</span>
                </div>
                <div className="flex items-center">
                  <span className="text-orange-600 mr-3 text-lg">✓</span>
                  <span className="text-gray-700">1食あたり¥1,240</span>
                </div>
              </div>
              <button 
                onClick={() => handlePurchase('plan-6')}
                className="w-full bg-white text-orange-600 border-2 border-orange-600 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-colors">
                購入する
              </button>
            </div>
          </div>

          {/* 12個セット */}
          <div className="bg-white border-2 border-gray-200 rounded-xl p-8 hover:border-orange-600 hover:shadow-lg transition-all flex flex-col">
            <div className="text-center flex-1 flex flex-col">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">12個セット</h3>
              <div className="mb-6">
                <div className="text-4xl font-bold text-orange-600">
                  ¥14,280
                </div>
                <p className="text-gray-600 mt-2">3種類×4個ずつ</p>
              </div>
              <div className="space-y-3 text-left mb-8 flex-1">
                <div className="flex items-center">
                  <span className="text-orange-600 mr-3 text-lg">✓</span>
                  <span className="text-gray-700">全3種類×4個</span>
                </div>
                <div className="flex items-center">
                  <span className="text-orange-600 mr-3 text-lg">✓</span>
                  <span className="text-gray-700">送料無料</span>
                </div>
                <div className="flex items-center">
                  <span className="text-orange-600 mr-3 text-lg">✓</span>
                  <span className="text-gray-700">1食あたり¥1,190</span>
                </div>
              </div>
              <button 
                onClick={() => handlePurchase('plan-12')}
                className="w-full bg-white text-orange-600 border-2 border-orange-600 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-colors">
                購入する
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;