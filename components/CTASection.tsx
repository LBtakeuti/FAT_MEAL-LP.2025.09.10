'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

const CTASection: React.FC = () => {
  const router = useRouter();

  const handlePurchase = (plan: string) => {
    router.push(`/purchase?plan=${plan}`);
  };

  return (
    <section id="pricing" className="h-[100dvh] sm:min-h-screen bg-gradient-to-b from-gray-50 to-white py-8 sm:py-32 pb-20 sm:pb-20 relative flex flex-col">
      <div className="absolute top-0 left-0 right-0 h-32 bg-gray-50"></div>
      <div className="relative max-w-[375px] px-4 md:max-w-[768px] md:px-6 lg:max-w-[1200px] lg:px-8 mx-auto flex-1 flex flex-col">
        <div className="text-center mb-3 sm:mb-12">
          <h2 className="text-xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-1 sm:mb-4">
            今すぐ<span className="text-orange-600">ふとるめし</span>を
            <span className="block sm:inline">始めよう</span>
          </h2>
          <p className="text-xs sm:text-lg text-gray-600 mt-1 sm:mt-4">
            あなたの健康的な体重増加をサポート
            <span className="hidden sm:inline">します</span>
          </p>
        </div>

        <div className="text-center mb-2 sm:mb-8">
          <h3 className="text-base sm:text-3xl font-bold text-gray-900">
            選べる3つのセット
          </h3>
        </div>

        {/* Mobile: Vertical layout - Compact for one screen */}
        <div className="sm:hidden flex-1 flex flex-col justify-between space-y-4">
          {/* 6個セット */}
          <div className="bg-white border-2 border-gray-200 rounded-lg px-2 py-4" style={{minHeight: '88px'}}>
            <div className="bg-orange-600 text-white px-2 py-0.5 rounded-md inline-block mb-1">
              <span className="font-bold text-xs">6個セット</span>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900 leading-tight">
                ¥7,440
              </div>
              <p className="text-[10px] text-gray-600 mb-0.5">3種類×2個ずつ</p>
              <div className="space-y-0 text-left">
                <div className="flex items-center">
                  <span className="text-orange-600 mr-1 text-[10px]">✓</span>
                  <span className="text-[10px] text-gray-700">全3種類×2個</span>
                </div>
                <div className="flex items-center">
                  <span className="text-orange-600 mr-1 text-[10px]">✓</span>
                  <span className="text-[10px] text-gray-700">送料無料</span>
                </div>
              </div>
            </div>
          </div>

          {/* 12個セット */}
          <div className="bg-white border-2 border-gray-200 rounded-lg px-2 py-4" style={{minHeight: '100px'}}>
            <div className="bg-orange-600 text-white px-2 py-0.5 rounded-md inline-block mb-1">
              <span className="font-bold text-xs">12個セット</span>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900 leading-tight">
                ¥14,280
              </div>
              <p className="text-[10px] text-gray-600 mb-0.5">3種類×4個ずつ</p>
              <div className="space-y-0 text-left">
                <div className="flex items-center">
                  <span className="text-orange-600 mr-1 text-[10px]">✓</span>
                  <span className="text-[10px] text-gray-700">全3種類×4個</span>
                </div>
                <div className="flex items-center">
                  <span className="text-orange-600 mr-1 text-[10px]">✓</span>
                  <span className="text-[10px] text-gray-700">送料無料</span>
                </div>
                <div className="flex items-center">
                  <span className="text-orange-600 mr-1 text-[10px]">✓</span>
                  <span className="text-[10px] text-gray-700">1食¥1,190</span>
                </div>
              </div>
            </div>
          </div>

          {/* 24個セット */}
          <div className="bg-white border-2 border-gray-200 rounded-lg px-2 py-4" style={{minHeight: '100px'}}>
            <div className="bg-orange-600 text-white px-2 py-0.5 rounded-md inline-block mb-1">
              <span className="font-bold text-xs">24個セット</span>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900 leading-tight">
                ¥27,360
              </div>
              <p className="text-[10px] text-gray-600 mb-0.5">3種類×8個ずつ</p>
              <div className="space-y-0 text-left">
                <div className="flex items-center">
                  <span className="text-orange-600 mr-1 text-[10px]">✓</span>
                  <span className="text-[10px] text-gray-700">全3種類×8個</span>
                </div>
                <div className="flex items-center">
                  <span className="text-orange-600 mr-1 text-[10px]">✓</span>
                  <span className="text-[10px] text-gray-700">送料無料</span>
                </div>
                <div className="flex items-center">
                  <span className="text-orange-600 mr-1 text-[10px]">✓</span>
                  <span className="text-[10px] text-gray-700">1食¥1,140</span>
                </div>
              </div>
            </div>
          </div>

          {/* 購入へ進むボタン */}
          <div className="mt-8 pb-16">
            <button 
              onClick={() => router.push('/purchase')}
              className="w-full bg-orange-600 text-white py-2.5 rounded-lg font-bold text-sm hover:bg-orange-700 transition-colors">
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

        <div className="mt-12 text-center">
          <p className="text-gray-600 mt-2">
            ※ セット購入のみ（定期購買はございません）
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;