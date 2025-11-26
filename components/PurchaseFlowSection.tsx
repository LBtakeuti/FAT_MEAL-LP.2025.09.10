import React from 'react';
import Image from 'next/image';

const PurchaseFlowSection: React.FC = () => {
  const steps = [
    {
      number: 1,
      title: 'セット選択',
      description: 'お好みのセットやメニューを選択',
    },
    {
      number: 2,
      title: '配送先入力',
      description: 'お届け先情報とお支払い方法を入力',
    },
    {
      number: 3,
      title: 'お届け',
      description: '最短で翌日お届け（地域により異なります）',
    },
    {
      number: 4,
      title: 'レンジで温めて完成！',
      description: '電子レンジで温めるだけですぐに食べられます',
    },
  ];

  return (
    <section className="relative overflow-hidden bg-white py-12 sm:py-20">
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
            className="fill-orange-50"
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
            className="fill-orange-50"
          ></path>
        </svg>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            購入の流れ
          </h2>
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
              <div key={index} className="relative">
                {/* モバイル用接続線 */}
                {index < steps.length - 1 && (
                  <div className="lg:hidden absolute left-1/2 top-full w-1 h-6 bg-orange-300 -translate-x-1/2"></div>
                )}

                <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 hover:shadow-xl transition-shadow relative border border-gray-200">
                  {/* SVG画像 */}
                  {index === 0 ? (
                    <div className="flex justify-center mb-4">
                      <div className="overflow-hidden rounded-lg">
                        <Image
                          src="/step1-select-menu.svg"
                          alt="ふとるめし"
                          width={200}
                          height={200}
                          className="w-40 h-40 sm:w-52 sm:h-52 block"
                          style={{ display: 'block' }}
                          unoptimized
                        />
                      </div>
                    </div>
                  ) : index === 1 ? (
                    <div className="flex justify-center mb-4">
                      <div className="overflow-hidden rounded-lg">
                        <Image
                          src="/step2-delivery-info.svg"
                          alt="配送先入力"
                          width={200}
                          height={200}
                          className="w-40 h-40 sm:w-52 sm:h-52 block"
                          style={{ display: 'block' }}
                          unoptimized
                        />
                      </div>
                    </div>
                  ) : index === 2 ? (
                    <div className="flex justify-center mb-4">
                      <div className="overflow-hidden rounded-lg">
                        <Image
                          src="/step3-delivery.svg"
                          alt="お届け"
                          width={200}
                          height={200}
                          className="w-40 h-40 sm:w-52 sm:h-52 block"
                          style={{ display: 'block' }}
                          unoptimized
                        />
                      </div>
                    </div>
                  ) : index === 3 ? (
                    <div className="flex justify-center mb-4">
                      <div className="overflow-hidden rounded-lg">
                        <Image
                          src="/step4-enjoy.svg"
                          alt="お召し上がり"
                          width={200}
                          height={200}
                          className="w-40 h-40 sm:w-52 sm:h-52 block"
                          style={{ display: 'block' }}
                          unoptimized
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-7xl sm:text-8xl font-bold text-orange-100 text-center mb-4">
                      {step.number}
                    </div>
                  )}

                  {/* タイトル */}
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 text-center">
                    {step.title}
                  </h3>

                  {/* 説明 */}
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed text-center">
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
            href="#menu"
            className="inline-block bg-gradient-to-r from-orange-500 to-red-500 text-white px-10 sm:px-12 py-4 sm:py-5 rounded-xl font-bold text-lg sm:text-xl hover:from-orange-600 hover:to-red-600 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105"
          >
            今すぐ注文する
          </a>
          <p className="mt-4 text-sm sm:text-base text-gray-600">
            ※ 初回限定キャンペーン実施中
          </p>
        </div>
      </div>
    </section>
  );
};

export default PurchaseFlowSection;

