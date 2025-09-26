'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

const FeaturesSectionMobile: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const features = [
    {
      title: '確かな味',
      subtitle: '',
      description: '何度も改良を重ね、ご飯と合う最高のおかずをご用意！ご飯と合う味付けだから勝手にご飯が進み、苦なく体重を増やすことが可能！',
      items: ['プロ監修', '味へのこだわり', '飽きない美味しさ'],
      image: '/5627_color.svg'
    },
    {
      title: '簡単に食べられる！',
      subtitle: '',
      description: '部活動やハードワーク、筋トレとあとは疲れて食べることをキャンセルしてしまう、洗い物が面倒でインスタント麺を食べている。そう言った方にふとるめしは最適解。レンジでチン！して、あとは食べるだけ！ふとるめしは忙しい方々の味方です！',
      items: ['レンジで簡単', '洗い物不要', '時短調理'],
      image: '/22665076.jpg'
    },
    {
      title: 'ボリューム満点',
      subtitle: '',
      description: '1食あたり平均1,500kcalの大容量！一般的な宅配弁当の2倍以上のボリュームで、しっかりと満足感を得られます。量を食べるのが苦手な方でも、美味しさで自然と完食できます。',
      items: ['大容量サイズ', '満足感たっぷり', '栄養バランス◎'],
      image: '/22657774.png'
    }
  ];

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const scrollLeft = scrollContainerRef.current.scrollLeft;
      const slideWidth = scrollContainerRef.current.offsetWidth;
      const newSlide = Math.round(scrollLeft / slideWidth);
      setCurrentSlide(newSlide);
    }
  };

  const scrollToSlide = (index: number) => {
    if (scrollContainerRef.current) {
      const slideWidth = scrollContainerRef.current.offsetWidth;
      scrollContainerRef.current.scrollTo({
        left: slideWidth * index,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section id="features" className="h-[100dvh] bg-white pt-8 pb-20 sm:hidden flex flex-col">
      <div className="max-w-[375px] px-4 mx-auto flex flex-col h-full">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ふとるめしの<span className="text-orange-600">こだわり</span>
          </h2>
        </div>

        {/* Horizontal Scroll Container */}
        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide flex-1"
          onScroll={handleScroll}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="min-w-full snap-center px-3"
            >
              <div className="bg-white rounded-xl p-4 w-full flex flex-col">
                {/* Orange accent bar - Fixed height */}
                <div className="relative h-[55px] mb-4">
                  <div className="absolute left-0 top-0 w-1 h-full bg-orange-600"></div>
                  <h3 className="text-xl font-bold text-gray-900 pl-3 mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600 pl-3">
                    {feature.subtitle}
                  </p>
                </div>

                {/* Image - Transparent background */}
                <div className="relative h-[170px] mb-4 rounded-lg overflow-hidden">
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    fill
                    className="object-contain"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                </div>

                {/* Description */}
                <p className="text-sm text-gray-700 mb-4 leading-[1.5]">
                  {feature.description}
                </p>

                {/* Feature items */}
                <div className="space-y-2">
                  {feature.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-center">
                      <span className="text-orange-600 mr-2 text-base">✓</span>
                      <span className="text-sm text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Dots with Swipe Hint */}
        <div className="py-4">
          <div className="flex justify-center items-center gap-2 mb-2">
            {features.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollToSlide(index)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  currentSlide === index 
                    ? 'w-8 bg-orange-600' 
                    : 'w-2.5 bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
          <p className="text-center text-xs text-gray-500">
            左右にスワイプ
          </p>
        </div>
      </div>

      {/* CSS to hide scrollbar */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
};

export default FeaturesSectionMobile;