'use client';

import React from 'react';
import Image from 'next/image';

const FeaturesSection: React.FC = () => {
  const features = [
    {
      title: '良質なタンパク質',
      description: `プロテインが苦手、お腹を下してしまう。
鶏むね肉は量が食べられない。
そう言った方におすすめ！
ふとるめしでは、味、量、質が担保されたお弁当を準備しています！`,
      image: '/22657774.png',
      align: 'left' as const
    },
    {
      title: '確かな味',
      description: `何度も改良を重ね、ご飯と合う最高のおかずをご用意！
ご飯と合う味付けだから勝手にご飯が進み、苦なく体重を増やすことが可能！「もう太れない」から卒業！ふとるめしをご賞味あれ！`,
      image: '/5627_color.svg',
      align: 'right' as const
    },
    {
      title: '簡単に食べられる！',
      description: `部活動やハードワーク、筋トレとあとは疲れて食べることをキャンセルしてしまう、洗い物が面倒でインスタント麺を食べている。そう言った方にふとるめしは最適解。
レンジでチン！して、あとは食べるだけ！
ふとるめしは忙しい方々の味方です！`,
      image: '/22665076.jpg',
      align: 'left' as const
    }
  ];

  return (
    <section id="features" className="min-h-screen bg-[#fff7ed] py-20 overflow-hidden">
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

              {/* 画像エリア */}
              <div className={`flex-1 w-full ${feature.title === '確かな味' ? 'max-w-[400px]' : 'max-w-[500px]'}`}>
                <div className={`rounded-2xl ${feature.title === '確かな味' ? 'h-[280px] lg:h-[320px]' : 'h-[380px] lg:h-[420px]'} w-full flex items-center justify-center`}>
                  <Image 
                    src={feature.image} 
                    alt={feature.title}
                    width={feature.title === '確かな味' ? 320 : 420}
                    height={feature.title === '確かな味' ? 320 : 420}
                    className="object-contain h-full w-auto max-h-full"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;