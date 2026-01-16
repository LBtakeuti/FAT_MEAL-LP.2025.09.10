'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

const SubscriptionSection: React.FC = () => {
  const router = useRouter();

  const plans = [
    {
      id: 'subscription-monthly-12',
      meals: 12,
      title: '12食プラン',
      monthlyPrice: 9780,
      productPrice: 8280,
      shippingFee: 1500,
      deliveriesPerMonth: 1,
      description: '月1回配送',
      subtitle: '12食セット×月1回',
      pricePerMeal: 815,
    },
    {
      id: 'subscription-monthly-24',
      meals: 24,
      title: '24食プラン',
      originalProductPrice: 15600,
      productPrice: 11600,
      discount: 1000,
      monthlyPrice: 14600,
      shippingFee: 3000,
      deliveriesPerMonth: 2,
      description: '月2回配送',
      subtitle: '12食セット×月2回',
      pricePerMeal: 608,
      popular: true,
    },
    {
      id: 'subscription-monthly-48',
      meals: 48,
      title: '48食プラン',
      originalProductPrice: 28800,
      productPrice: 21800,
      discount: 1000,
      monthlyPrice: 27800,
      shippingFee: 6000,
      deliveriesPerMonth: 4,
      description: '月4回配送',
      subtitle: '12食セット×月4回',
      pricePerMeal: 579,
    },
  ];

  const handlePurchase = (planId: string) => {
    router.push(`/purchase?plan=${planId}`);
  };

  return (
    <section id="subscription" className="relative overflow-hidden bg-white py-12 sm:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 font-antique">
            <span className="text-orange-600">定期コース</span>でお得に継続
          </h2>
          <p className="mt-4 text-gray-600 text-sm sm:text-base">
            毎月届く定期便で、体づくりを習慣に
          </p>
        </div>

        {/* プランカード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              onClick={() => handlePurchase(plan.id)}
              className={`relative bg-white rounded-2xl p-6 sm:p-8 transition-all duration-300 border-2 flex flex-col cursor-pointer hover:shadow-xl hover:scale-[1.02] ${
                plan.popular
                  ? 'border-orange-500 shadow-lg'
                  : 'border-gray-200 hover:border-orange-500'
              }`}
            >
              {/* 人気バッジ */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-orange-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                    人気
                  </span>
                </div>
              )}

              {/* プラン名 */}
              <div className="text-center mb-6">
                <div className="inline-block bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full mb-3">
                  定期コース
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 font-antique">
                  {plan.title}
                </h3>
                <p className="text-sm text-gray-500">
                  {plan.subtitle}
                </p>
              </div>

              {/* 月額価格 */}
              <div className="text-center mb-6 pb-6 border-b border-gray-200">
                <p className="text-xs text-gray-500 mb-1">月額</p>
                {plan.discount ? (
                  <>
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <span className="text-lg text-gray-400 line-through">
                        ¥{plan.originalProductPrice?.toLocaleString()}
                      </span>
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                        ¥{plan.discount.toLocaleString()}OFF
                      </span>
                    </div>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-3xl sm:text-4xl font-bold text-red-600">
                        ¥{plan.monthlyPrice.toLocaleString()}
                      </span>
                      <span className="text-sm text-gray-500">
                        /月
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      （商品¥{plan.productPrice.toLocaleString()} + 送料¥{plan.shippingFee.toLocaleString()}）
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-3xl sm:text-4xl font-bold text-orange-600">
                        ¥{plan.monthlyPrice.toLocaleString()}
                      </span>
                      <span className="text-sm text-gray-500">
                        /月
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      （商品¥{plan.productPrice.toLocaleString()} + 送料¥{plan.shippingFee.toLocaleString()}）
                    </p>
                  </>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  1食あたり約¥{plan.pricePerMeal}
                </p>
              </div>

              {/* プラン詳細 */}
              <ul className="space-y-2 mb-6 text-sm text-gray-600 flex-1">
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{plan.description}（各12食）</span>
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

              {/* 購入ボタン */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePurchase(plan.id);
                }}
                className={`mt-auto w-full h-14 rounded-xl font-bold text-lg transition-all duration-300 shadow-md ${
                  plan.popular
                    ? 'bg-orange-500 text-white hover:bg-orange-600 hover:shadow-lg'
                    : 'bg-gray-900 text-white hover:bg-gray-800 hover:shadow-lg'
                }`}
              >
                定期購入する
              </button>
            </div>
          ))}
        </div>

        {/* 注意事項 */}
        <div className="mt-8 sm:mt-12 text-center text-sm text-gray-500">
          <p className="mb-1">※ 価格は税込表示です</p>
          <p className="mb-1">※ 定期購入はログインが必要です</p>
          <p>※ 解約はお問い合わせより承ります</p>
        </div>
      </div>
    </section>
  );
};

export default SubscriptionSection;
