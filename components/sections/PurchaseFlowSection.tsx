import React from 'react';
import Image from 'next/image';

const PurchaseFlowSection: React.FC = () => {
  const steps = [
    {
      number: 1,
      title: 'セット選択',
      description: 'お試しセット・お得な定期コースを選択',
      image: '/images/steps/step1-select-menu.svg',
    },
    {
      number: 2,
      title: '配送先入力',
      description: 'お届け先情報とお支払い方法を入力',
      image: '/images/steps/Step1.png',
    },
    {
      number: 3,
      title: 'お届け',
      description: '最短で翌日お届け（地域により異なります）',
      image: '/images/steps/Step2.png',
    },
    {
      number: 4,
      title: 'レンジで温めて完成！',
      description: '電子レンジで温めるだけですぐに食べられます',
      image: '/images/steps/Step3.png',
    },
  ];

  return (
    <section className="bg-gray-50 py-12 sm:py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* ヘッダー */}
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
            購入の流れ
          </h2>
        </div>

        {/* モバイル: 縦並びカード */}
        <div className="flex flex-col gap-4 sm:hidden">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center gap-4 bg-white rounded-xl p-4 shadow-sm">
              {/* 番号 */}
              <div className="flex-shrink-0 w-8 h-8 bg-[#E8593C] text-white rounded-full flex items-center justify-center font-bold text-sm">
                {step.number}
              </div>
              {/* 画像 */}
              <div className="flex-shrink-0 w-36 h-36">
                <Image
                  src={step.image}
                  alt={step.title}
                  width={160}
                  height={160}
                  className="w-full h-full object-contain"
                  unoptimized
                />
              </div>
              {/* テキスト */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-gray-900">{step.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* デスクトップ: グリッドカード */}
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <div key={index} className="relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              {/* 番号バッジ */}
              <div className="absolute -top-3 -left-3 w-10 h-10 bg-[#E8593C] text-white rounded-full flex items-center justify-center font-bold text-base shadow-md">
                {step.number}
              </div>
              {/* 画像 */}
              <div className="flex justify-center items-center h-36 mb-4">
                <Image
                  src={step.image}
                  alt={step.title}
                  width={160}
                  height={160}
                  className="w-full max-w-[140px] h-full object-contain"
                  unoptimized
                />
              </div>
              {/* テキスト */}
              <h3 className="text-base font-bold text-gray-900 text-center mb-2">{step.title}</h3>
              <p className="text-sm text-gray-500 text-center leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 sm:mt-14 text-center">
          <a
            href="/purchase"
            className="inline-block bg-[#E8593C] text-white px-10 py-3.5 sm:py-4 rounded-full font-bold text-base sm:text-lg hover:bg-[#d64a2e] transition-colors shadow-md"
          >
            今すぐ注文する
          </a>
        </div>
      </div>
    </section>
  );
};

export default PurchaseFlowSection;
