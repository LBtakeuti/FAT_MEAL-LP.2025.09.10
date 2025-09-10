'use client';

import React from 'react';

const FeaturesSection: React.FC = () => {
  const features = [
    {
      title: '良質なタンパク質',
      description: `プロテインが苦手、お腹を下してしまう。
鶏むね肉は量が食べられない。
そう言った方におすすめ！
ふとるめしでは、味、量、質が担保されたお弁当を準備しています！`,
      icon: '💪',
      align: 'left' as const
    },
    {
      title: '確かな味',
      description: `何度も改良を重ね、ご飯と合う最高のおかずをご用意！
ご飯と合う味付けだから勝手にご飯が進み、苦なく体重を増やすことが可能！`,
      icon: '😋',
      align: 'right' as const
    },
    {
      title: 'レンジでチンだけ！',
      description: `部活動やハードワーク、筋トレとあとは疲れて食べることをキャンセルしてしまう、洗い物が面倒でインスタント麺を食べている。そう言った方にふとるめしは最適解。
レンジでチン！して、あとは食べて容器を捨てるだけ!（自治体の指定の捨て方で）
ふとるめしは忙しい方々の味方です。`,
      icon: '⚡',
      align: 'left' as const
    }
  ];

  return (
    <>
      {/* Mobile: 3 separate full-screen sections for swipe */}
      <div className="sm:hidden">
        {features.map((feature, index) => (
          <section 
            key={index} 
            id={index === 0 ? 'features' : `features-${index + 1}`}
            className="min-h-[100dvh] bg-white flex flex-col justify-center py-12"
          >
            <div className="px-4 max-w-[375px] mx-auto">
              {/* Title - only show on first feature */}
              {index === 0 && (
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 whitespace-nowrap">
                    <span className="inline-block">ふとるめしの<span className="text-orange-600">こだわり</span></span>
                  </h2>
                </div>
              )}
              
              {/* Feature Icon */}
              <div className="flex justify-center mb-8">
                <div className="bg-orange-50 rounded-2xl w-[280px] h-[280px] flex items-center justify-center">
                  <span className="text-[100px]">{feature.icon}</span>
                </div>
              </div>
              
              {/* Feature Content */}
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-base text-gray-700 leading-relaxed whitespace-pre-line">
                  {feature.description}
                </p>
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* Desktop: Original layout */}
      <section id="features" className="hidden sm:block min-h-screen bg-white py-20">
        <div className="max-w-[375px] px-4 md:max-w-[768px] md:px-6 lg:max-w-[1200px] lg:px-8 mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 whitespace-nowrap">
              <span className="inline-block">ふとるめしの<span className="text-orange-600">こだわり</span></span>
            </h2>
          </div>

          <div className="space-y-20">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className={`flex flex-col ${
                  feature.align === 'left' 
                    ? 'lg:flex-row' 
                    : 'lg:flex-row-reverse'
                } items-center gap-8 lg:gap-12`}
              >
                {/* テキストコンテンツ */}
                <div className={`flex-1 ${
                  feature.align === 'left' 
                    ? 'lg:text-left lg:pr-8' 
                    : 'lg:text-right lg:pl-8'
                }`}>
                  <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                    {feature.title}
                  </h3>
                  <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-line">
                    {feature.description}
                  </p>
                </div>

                {/* アイコンエリア */}
                <div className="flex-1 w-full">
                  <div className="bg-orange-50 rounded-2xl h-[300px] lg:h-[350px] w-full flex items-center justify-center">
                    <span className="text-[120px] md:text-[150px]">{feature.icon}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default FeaturesSection;