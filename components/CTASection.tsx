'use client';

import React from 'react';

const CTASection: React.FC = () => {
  return (
    <section id="pricing" className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 sm:py-32 pb-20 sm:pb-20 relative">
      <div className="absolute top-0 left-0 right-0 h-32 bg-gray-50"></div>
      <div className="relative max-w-[375px] px-4 md:max-w-[768px] md:px-6 lg:max-w-[1200px] lg:px-8 mx-auto">
        <div className="text-center mb-6 sm:mb-12">
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-2 sm:mb-4">
            今すぐ<span className="text-orange-600">ふとるめし</span>を
            <span className="block sm:inline">始めよう</span>
          </h2>
          <p className="text-sm sm:text-lg text-gray-600 mt-2 sm:mt-4">
            あなたの健康的な体重増加をサポート
            <span className="hidden sm:inline">します</span>
          </p>
        </div>

        <div className="text-center mb-4 sm:mb-8">
          <h3 className="text-xl sm:text-3xl font-bold text-gray-900">
            選べる3つのセット
          </h3>
        </div>

        {/* Mobile: 2+1 layout - Compact for one screen */}
        <div className="sm:hidden">
          {/* Top row: 5個セット and 10個セット */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            {/* 3個セット */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-3 hover:border-orange-600 hover:shadow-lg transition-all">
              <div className="text-center">
                <h3 className="text-sm font-bold text-gray-900 mb-1">3個セット</h3>
                <div className="text-xl font-bold text-orange-600">
                  ¥3,870
                </div>
                <p className="text-[10px] text-gray-600 mb-2">3種類×1個ずつ</p>
                <div className="space-y-0.5 text-left mb-2">
                  <div className="flex items-start">
                    <span className="text-orange-600 mr-1 text-[10px]">✓</span>
                    <span className="text-[10px] text-gray-700">全3種類をお試し</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-orange-600 mr-1 text-[10px]">✓</span>
                    <span className="text-[10px] text-gray-700">送料無料</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-orange-600 mr-1 text-[10px]">✓</span>
                    <span className="text-[10px] text-gray-700">1食¥1,290</span>
                  </div>
                </div>
                <button className="w-full bg-orange-600 text-white py-1.5 rounded-lg text-xs font-semibold hover:bg-orange-700 transition-colors">
                  購入する
                </button>
              </div>
            </div>

            {/* 6個セット */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-3 hover:border-orange-600 hover:shadow-lg transition-all">
              <div className="text-center">
                <h3 className="text-sm font-bold text-gray-900 mb-1">6個セット</h3>
                <div className="text-xl font-bold text-orange-600">
                  ¥7,440
                </div>
                <p className="text-[10px] text-gray-600 mb-2">3種類×2個ずつ</p>
                <div className="space-y-0.5 text-left mb-2">
                  <div className="flex items-start">
                    <span className="text-orange-600 mr-1 text-[10px]">✓</span>
                    <span className="text-[10px] text-gray-700">全3種類×2個</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-orange-600 mr-1 text-[10px]">✓</span>
                    <span className="text-[10px] text-gray-700">送料無料</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-orange-600 mr-1 text-[10px]">✓</span>
                    <span className="text-[10px] font-semibold text-orange-600">¥300お得！</span>
                  </div>
                </div>
                <button className="w-full bg-orange-600 text-white py-1.5 rounded-lg text-xs font-semibold hover:bg-orange-700 transition-colors">
                  購入する
                </button>
              </div>
            </div>
          </div>

          {/* Bottom: 12個セット */}
          <div className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-orange-600 hover:shadow-lg transition-all">
            <div className="text-center">
              <h3 className="text-base font-bold text-gray-900 mb-2">12個セット</h3>
              <div className="text-2xl font-bold text-orange-600 mb-1">
                ¥14,280
              </div>
              <p className="text-xs text-gray-600 mb-3">3種類×4個ずつ</p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="space-y-1 text-left">
                  <div className="flex items-start">
                    <span className="text-orange-600 mr-1 text-xs">✓</span>
                    <span className="text-[10px] text-gray-700">全3種類×4個</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-orange-600 mr-1 text-xs">✓</span>
                    <span className="text-[10px] text-gray-700">送料無料</span>
                  </div>
                </div>
                <div className="space-y-1 text-left">
                  <div className="flex items-start">
                    <span className="text-orange-600 mr-1 text-xs">✓</span>
                    <span className="text-[10px] text-gray-700">1食¥1,190</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-orange-600 mr-1 text-xs">✓</span>
                    <span className="text-[10px] font-semibold text-orange-600">¥1,200お得！</span>
                  </div>
                </div>
              </div>
              <button className="w-full bg-orange-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-orange-700 transition-colors">
                購入する
              </button>
            </div>
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
              <button className="w-full bg-white text-orange-600 border-2 border-orange-600 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-colors">
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
                <div className="flex items-center">
                  <span className="text-orange-600 mr-3 text-lg">✓</span>
                  <span className="font-semibold text-orange-600">¥300お得！</span>
                </div>
              </div>
              <button className="w-full bg-white text-orange-600 border-2 border-orange-600 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-colors">
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
                <div className="flex items-center">
                  <span className="text-orange-600 mr-3 text-lg">✓</span>
                  <span className="font-semibold text-orange-600">¥1,200お得！</span>
                </div>
              </div>
              <button className="w-full bg-white text-orange-600 border-2 border-orange-600 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-colors">
                購入する
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600">
            ※ 全セット送料無料・冷凍でお届け
          </p>
          <p className="text-gray-600 mt-2">
            ※ 単品購入のみ（定期購買はありません）
          </p>
        </div>

        {/* Contact Section */}
        <div id="contact" className="mt-16 p-6 bg-gray-50 rounded-xl">
          <p className="text-gray-700 font-semibold mb-2">お問い合わせ</p>
          <p className="text-2xl font-bold text-orange-600">0120-XXX-XXX</p>
          <p className="text-sm text-gray-600">受付時間: 平日 9:00-18:00</p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;