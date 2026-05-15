'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface SubscriptionPlan {
  id: 'sub-6' | 'sub-12';
  meals: number;
  title: string;
  monthlyTotal: number;
  pricePerMeal: number;
  popular: boolean;
}

const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'sub-6',
    meals: 6,
    title: '6食プラン',
    monthlyTotal: 4500,
    pricePerMeal: 750,
    popular: false,
  },
  {
    id: 'sub-12',
    meals: 12,
    title: '12食プラン',
    monthlyTotal: 7500,
    pricePerMeal: 625,
    popular: true,
  },
];

const SubscriptionSection: React.FC = () => {
  const router = useRouter();

  const handlePurchase = (planId: SubscriptionPlan['id']) => {
    router.push(`/purchase?plan=${planId}`);
  };

  return (
    <section id="subscription" className="relative overflow-hidden bg-white py-12 sm:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
          {/* サブスクプランカード（sub-6 / sub-12） */}
          {subscriptionPlans.map((plan) => (
            <div
              key={plan.id}
              onClick={() => handlePurchase(plan.id)}
              className={`relative bg-white rounded-2xl p-6 sm:p-8 transition-all duration-300 border-2 flex flex-col cursor-pointer hover:shadow-xl hover:scale-[1.02] ${
                plan.popular ? 'border-orange-300 hover:border-orange-500' : 'border-gray-200 hover:border-orange-500'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm whitespace-nowrap">
                    人気No.1
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <span className="inline-block bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full mb-3">
                  定期
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 font-antique">
                  {plan.title}
                </h3>
                <p className="text-sm text-gray-500">
                  月¥{plan.monthlyTotal.toLocaleString()}（送料込）／月1回お届け
                </p>
              </div>

              <div className="text-center mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-black text-[#E8593C]">
                    ¥{plan.pricePerMeal.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-500">/食（税込・送料込）</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  月額合計 ¥{plan.monthlyTotal.toLocaleString()}（{plan.meals}食）
                </p>
              </div>

              <ul className="space-y-2 mb-6 text-sm text-gray-600 flex-1">
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>毎月{plan.meals}食お届け（月1回）</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>毎月自動更新</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>いつでも解約可能</span>
                </li>
              </ul>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePurchase(plan.id);
                }}
                className="mt-auto w-full h-14 rounded-xl font-bold text-lg transition-all duration-300 shadow-md bg-orange-500 text-white hover:bg-orange-600 hover:shadow-lg"
              >
                定期購入する
              </button>
            </div>
          ))}
        </div>

        <div className="mt-8 sm:mt-12 text-center text-sm text-gray-500">
          <p className="mb-1">※ 価格は税込表示です</p>
          <p>※ 定期購入はログインが必要です</p>
        </div>
      </div>
    </section>
  );
};

export default SubscriptionSection;
