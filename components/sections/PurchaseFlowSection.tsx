import React from 'react';
import Image from 'next/image';

const PurchaseFlowSection: React.FC = () => {
  const steps = [
    {
      number: 1,
      title: 'セット選択',
      description: 'お好みのセットやメニューを選択',
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
    <section className="relative overflow-hidden bg-white py-12 sm:py-20">
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="text-center mb-10 sm:mb-16">
          {/* セクションタイトル */}
          <div className="text-center mb-10 sm:mb-16 relative">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 relative z-10">
              購入の流れ
            </h2>
            <div className="flex justify-center -mt-6 sm:-mt-8 relative z-0">
              <Image
                src="/images/sections/b_simple_111_0M 2.png"
                alt=""
                width={3923}
                height={465}
                className="w-full max-w-3xl h-auto"
              />
            </div>
          </div>
          <p className="text-base sm:text-lg text-gray-600">
            簡単4ステップでお届け
          </p>
        </div>

        {/* ステップ */}
        <div className="relative">
          {/* 接続線（デスクトップ） */}
          <div className="hidden lg:block absolute top-20 left-0 right-0 h-1 bg-gradient-to-r from-orange-200 via-orange-300 to-orange-200 -z-10"></div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative flex">
                <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 hover:shadow-xl transition-shadow relative flex flex-col w-full h-full">
                  {/* 画像 */}
                  <div className="mb-4 flex justify-center items-center h-32 sm:h-40">
                    <Image
                      src={step.image}
                      alt={step.title}
                      width={200}
                      height={200}
                      className="w-full max-w-[180px] h-full object-contain"
                    />
                  </div>

                  {/* タイトル */}
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 text-center">
                    {step.title}
                  </h3>

                  {/* 説明 */}
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed text-center flex-grow">
                    {step.description}
                  </p>

                  {/* バッジ */}
                  <div className="absolute -top-3 -right-3 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-full flex items-center justify-center font-bold text-base sm:text-lg shadow-lg">
                    {step.number}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 sm:mt-16 text-center">
          <a
            href="/purchase"
            className="inline-block bg-orange-500 text-white px-10 sm:px-12 py-4 sm:py-5 rounded-xl font-bold text-lg sm:text-xl hover:bg-orange-600 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105"
          >
            今すぐ注文する
          </a>
        </div>
      </div>
    </section>
  );
};

export default PurchaseFlowSection;

