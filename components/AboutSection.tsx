import React from 'react';
import Image from 'next/image';

const AboutSection: React.FC = () => {
  const features = [
    {
      title: '圧倒的なボリューム',
      description: '1食で900kcal超え！満足感のある量で確実にカロリー摂取',
      number: '01',
    },
    {
      title: '妥協なき美味しさ',
      description: 'ご飯が進む濃いめの味付け。毎日食べても飽きない本格的な味',
      number: '02',
    },
    {
      title: '計算されたPFCバランス',
      description: 'たんぱく質70g超え！筋肉づくりに最適な栄養設計',
      number: '03',
    },
  ];

  return (
    <section className="relative overflow-hidden bg-white py-12 sm:py-20">
      {/* 上部の波形 - オレンジ背景から遷移 */}
      <div className="absolute top-0 left-0 w-full overflow-hidden leading-none z-10" style={{ transform: 'translateY(-1px)' }}>
        <svg
          className="relative block w-full h-16 sm:h-24"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
            className="fill-white"
          ></path>
        </svg>
      </div>

      {/* 下部の波形 - 次のセクションへの遷移 */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-10" style={{ transform: 'translateY(1px)' }}>
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

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 z-20">
        {/* ヘッダー */}
        <div className="text-center mb-10 sm:mb-16">
          {/* セクションタイトル */}
          <div className="text-center mb-10 sm:mb-16 relative">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 relative z-10">
              ふとるめしとは
            </h2>
            <div className="flex justify-center -mt-6 sm:-mt-8 relative z-0">
              <Image
                src="/b_simple_111_0M 2.png"
                alt=""
                width={3923}
                height={465}
                className="w-full max-w-3xl h-auto"
              />
            </div>
          </div>
        </div>

        {/* 3つの特徴 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="relative bg-gradient-to-br from-orange-50 to-white p-6 sm:p-8 rounded-2xl"
            >
              <div className="text-5xl sm:text-6xl font-bold text-orange-500 mb-4 text-center">{feature.number}</div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 text-center">
                {feature.title}
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed text-center">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;

