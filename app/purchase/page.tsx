'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import MobileHeader from '@/components/MobileHeader';
import Footer from '@/components/Footer';

interface PlanOption {
  id: string;
  quantity: number;
  label: string;
  price: number;
  description: string;
  perMeal: number;
  savings?: number;
  isPopular?: boolean;
}

const planOptions: PlanOption[] = [
  {
    id: 'plan-6',
    quantity: 6,
    label: '6個セット',
    price: 7440,
    description: '3種類×2個ずつ',
    perMeal: 1240,
    savings: 300
  },
  {
    id: 'plan-12',
    quantity: 12,
    label: '12個セット',
    price: 14280,
    description: '3種類×4個ずつ',
    perMeal: 1190,
    savings: 1200,
    isPopular: true
  },
  {
    id: 'plan-24',
    quantity: 24,
    label: '24個セット',
    price: 27360,
    description: '3種類×8個ずつ',
    perMeal: 1140,
    savings: 3600
  }
];

const PurchasePage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  useEffect(() => {
    const planParam = searchParams.get('plan');
    if (planParam && planOptions.some(p => p.id === planParam)) {
      setSelectedPlan(planParam);
    }
  }, [searchParams]);

  const selectedPlanData = planOptions.find(p => p.id === selectedPlan);
  const subtotal = selectedPlanData ? selectedPlanData.price * quantity : 0;
  const shipping = 0; // 送料無料
  const total = subtotal + shipping;

  const handleProceedToCheckout = () => {
    // TODO: 実際の決済処理へのリダイレクト
    alert('決済ページへ遷移します（実装予定）');
  };

  const getMinDeliveryDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 3); // 3日後から選択可能
    return date.toISOString().split('T')[0];
  };

  return (
    <>
      {/* Header */}
      <div className="sm:hidden">
        <MobileHeader />
      </div>
      <div className="hidden sm:block">
        <Header />
      </div>

      <main className="min-h-screen bg-gray-50 pt-16 sm:pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12">
          {/* 戻るボタン */}
          <div>
            <button
              onClick={() => router.back()}
              className="inline-flex items-center text-gray-600 hover:text-orange-600 transition-colors"
            >
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">戻る</span>
            </button>
          </div>
          
          {/* タイトル */}
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              ご購入手続き
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              お客様に最適なプランをお選びください
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            {/* Plan Selection & Options */}
            <div className="space-y-8">
              {/* Plan Selection */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  プランを選択
                </h2>
                <div className="space-y-4">
                  {planOptions.map((plan) => (
                    <label
                      key={plan.id}
                      className={`relative flex cursor-pointer rounded-lg border-2 p-4 transition-all ${
                        selectedPlan === plan.id
                          ? 'border-orange-600 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="plan"
                        value={plan.id}
                        checked={selectedPlan === plan.id}
                        onChange={(e) => setSelectedPlan(e.target.value)}
                        className="sr-only"
                      />
                      <div className="flex flex-1 items-center justify-between">
                        <div className="flex items-start space-x-4">
                          <div className={`mt-1 h-5 w-5 rounded-full border-2 ${
                            selectedPlan === plan.id
                              ? 'border-orange-600 bg-orange-600'
                              : 'border-gray-300'
                          }`}>
                            {selectedPlan === plan.id && (
                              <svg className="h-full w-full text-white p-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-semibold text-gray-900">
                                {plan.label}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {plan.description}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 mt-2">
                              <span className="text-xs text-gray-500">
                                1食あたり¥{plan.perMeal.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">
                            ¥{plan.price.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Quantity Selection */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  セット数
                </h2>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="h-10 w-10 rounded-lg border-2 border-gray-300 flex items-center justify-center hover:border-orange-600 hover:text-orange-600 transition-colors"
                    disabled={quantity <= 1}
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 text-center text-xl font-semibold border-2 border-gray-300 rounded-lg py-2 focus:border-orange-600 focus:outline-none"
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="h-10 w-10 rounded-lg border-2 border-gray-300 flex items-center justify-center hover:border-orange-600 hover:text-orange-600 transition-colors"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                  <span className="text-gray-600 ml-4">
                    セット
                  </span>
                </div>
              </div>

              {/* Delivery Options */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  配送オプション
                </h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="delivery-date" className="block text-sm font-medium text-gray-700 mb-2">
                      希望配送日（3営業日以降）
                    </label>
                    <input
                      type="date"
                      id="delivery-date"
                      value={deliveryDate}
                      min={getMinDeliveryDate()}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="special-requests" className="block text-sm font-medium text-gray-700 mb-2">
                      特記事項（任意）
                    </label>
                    <textarea
                      id="special-requests"
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      rows={3}
                      placeholder="アレルギーや配送に関するご要望など"
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-600 focus:outline-none resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Checkout Button */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <button
                  onClick={handleProceedToCheckout}
                  disabled={!selectedPlan}
                  className="w-full bg-orange-600 text-white py-4 rounded-lg font-semibold hover:bg-orange-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  決済へ進む
                </button>
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* Footer */}
      <Footer />
    </>
  );
};

const PurchasePageContent = () => {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">読み込み中...</div>}>
      <PurchasePage />
    </Suspense>
  );
};

export default PurchasePageContent;