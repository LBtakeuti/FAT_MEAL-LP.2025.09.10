'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Reveal } from '@/components/ui/Reveal';

type PlanId = 'trial-6' | 'sub-6' | 'sub-12';

interface PlanCard {
  id: PlanId;
  meals: number;
  title: string;
  /** F33: PC で意図した位置で改行するための分割表示用（任意） */
  titleMain?: string;
  titleSub?: string;
  /** サブスクは月額合計、お試しは1回合計 */
  totalPrice: number;
  pricePerMeal: number;
  isTrial: boolean;
  popular: boolean;
}

const plans: PlanCard[] = [
  {
    id: 'trial-6',
    meals: 6,
    title: 'お試しプラン',
    totalPrice: 5700, // 4200 + 送料1500
    pricePerMeal: 700, // 商品代のみ(4200/6)、送料を含めない
    isTrial: true,
    popular: false,
  },
  {
    id: 'sub-6',
    meals: 6,
    title: 'ふとるめしセット（6食）',
    titleMain: 'ふとるめしセット',
    titleSub: '（6食）',
    totalPrice: 5100,
    pricePerMeal: 600, // 商品代のみ(3600/6)、送料を含めない
    isTrial: false,
    popular: true,
  },
  {
    id: 'sub-12',
    meals: 12,
    title: 'ダブルふとるめセット（12食）',
    titleMain: 'ダブルふとるめセット',
    titleSub: '（12食）',
    totalPrice: 8100,
    pricePerMeal: 550, // 商品代のみ(6600/12)、送料を含めない
    isTrial: false,
    popular: false,
  },
];

const SubscriptionSection: React.FC = () => {
  const router = useRouter();

  const handlePurchase = (planId: PlanId) => {
    router.push(`/purchase?plan=${planId}`);
  };

  return (
    <section id="subscription" className="relative overflow-hidden bg-white py-12 sm:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* F73: プランカード群をフェードイン */}
        <Reveal className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              onClick={() => handlePurchase(plan.id)}
              className={`relative bg-white rounded-2xl p-6 sm:p-8 transition-all duration-300 border-2 flex flex-col cursor-pointer hover:shadow-xl hover:scale-[1.02] ${
                plan.popular
                  ? 'border-orange-300 hover:border-orange-500'
                  : plan.isTrial
                    ? 'border-amber-200 hover:border-amber-400'
                    : 'border-gray-200 hover:border-orange-500'
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
                <span
                  className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-3 ${
                    plan.isTrial ? 'bg-amber-100 text-amber-700' : 'bg-orange-100 text-orange-700'
                  }`}
                >
                  {plan.isTrial ? '1回購入' : '定期'}
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 font-antique">
                  {plan.titleMain && plan.titleSub ? (
                    <>
                      <span className="block">{plan.titleMain}</span>
                      <span className="block">{plan.titleSub}</span>
                    </>
                  ) : (
                    plan.title
                  )}
                </h3>
                <p className="text-sm text-gray-500">
                  {plan.isTrial
                    ? `¥${plan.totalPrice.toLocaleString()}（送料込）／1回のみお届け`
                    : `月¥${plan.totalPrice.toLocaleString()}（送料込）／月1回お届け`}
                </p>
              </div>

              <div className="text-center mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-black text-[#E8593C]">
                    ¥{plan.pricePerMeal.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-500">/食（税込・送料別）</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {plan.isTrial
                    ? `合計 ¥${plan.totalPrice.toLocaleString()}（${plan.meals}食）`
                    : `月額合計 ¥${plan.totalPrice.toLocaleString()}（${plan.meals}食）`}
                </p>
              </div>

              <ul className="space-y-2 mb-6 text-sm text-gray-600 flex-1">
                {plan.isTrial ? (
                  <>
                    <li className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>6種類のお弁当を1個ずつ</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>1回のみの単発購入</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>サブスク登録不要</span>
                    </li>
                  </>
                ) : (
                  <>
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
                      <span>3ヶ月経過後は解約可能</span>
                    </li>
                  </>
                )}
              </ul>
              {!plan.isTrial && (
                <p className="text-xs text-gray-500 mb-3 -mt-1">
                  ※ 最低3ヶ月のご継続をお願いいたします
                </p>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePurchase(plan.id);
                }}
                className={`mt-auto w-full h-14 rounded-xl font-bold text-lg transition-all duration-300 shadow-md hover:shadow-lg ${
                  plan.isTrial
                    ? 'bg-amber-500 text-white hover:bg-amber-600'
                    : 'bg-orange-500 text-white hover:bg-orange-600'
                }`}
              >
                {plan.isTrial ? 'お試しを購入する' : '定期購入する'}
              </button>
            </div>
          ))}
        </Reveal>

        <div className="mt-8 sm:mt-12 text-center text-sm text-gray-500">
          <p className="mb-1">※ 価格は税込表示です</p>
          <p className="mb-1">※ 定期購入はログインが必要です</p>
          <p>※ 定期購入は最低3ヶ月のご継続をお願いいたします</p>
        </div>
      </div>
    </section>
  );
};

export default SubscriptionSection;
