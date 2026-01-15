'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

const TrialSection: React.FC = () => {
  const router = useRouter();

  const handlePurchase = () => {
    router.push('/purchase?plan=trial-6');
  };

  return (
    <section id="trial" className="bg-gray-100 py-8 sm:py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* コンパクトなお試しバナー */}
        <div
          onClick={handlePurchase}
          className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 bg-white rounded-lg p-4 sm:p-5 border border-gray-200 cursor-pointer hover:border-orange-400 hover:shadow-md transition-all duration-300"
        >
          {/* 左側: テキスト情報 */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <span className="bg-gray-200 text-gray-600 text-xs font-medium px-2 py-0.5 rounded">
                お試し
              </span>
              <h3 className="text-sm sm:text-base font-bold text-gray-800">
                まずは6食セットから
              </h3>
            </div>
            <p className="text-xs text-gray-500">
              6種類×1個ずつ / 1回限りの購入 / 定期契約なし
            </p>
          </div>

          {/* 中央: 価格 */}
          <div className="text-center">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-xl sm:text-2xl font-bold text-gray-700">
                ¥5,700
              </span>
              <span className="text-xs text-gray-400">
                税込・送料込
              </span>
            </div>
          </div>

          {/* 右側: ボタン */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePurchase();
            }}
            className="px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 bg-gray-800 text-white hover:bg-gray-700 whitespace-nowrap"
          >
            お試し購入
          </button>
        </div>
      </div>
    </section>
  );
};

export default TrialSection;
