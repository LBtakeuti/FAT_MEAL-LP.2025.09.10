'use client';

import React, { useState, useRef } from 'react';

export const TargetUserSlideMobile: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const slides = [
    {
      title: '良質なタンパク質',
      image: '/target-user-1.svg',
      description: 'プロテインが苦手、お腹を下してしまう。鶏むね肉は量が食べられない。そう言った方におすすめ！ふとるめしでは、味、量、質が担保されたお弁当を準備しています！',
      features: ['プロテイン不要', '美味しく摂取']
    },
    {
      title: '高カロリー・高タンパク',
      image: '/target-user-2.svg',
      description: '体を大きくしたいなら、良質で高カロリーな食事が必須です！ふとるめしなら、1食あたり1,400kcal以上の高カロリー弁当をご用意。',
      additionalDescription: 'さらにタンパク質は70g以上！トレーニング後の栄養補給に最適です。美味しく食べながら、理想の体づくりをサポートします。',
      stats: [
        { value: '1,400+', unit: 'kcal/食' },
        { value: '70g+', unit: 'タンパク質' }
      ]
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
    <section className="h-[100dvh] bg-white px-4 pb-20 flex flex-col">
      <div className="max-w-[375px] md:max-w-[768px] lg:max-w-[1200px] mx-auto w-full flex-1 flex flex-col">
        {/* タイトル */}
        <div className="pt-6 pb-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 text-center leading-[1.3]">
            ふとるめしの<span className="text-orange-600">こだわり</span>
          </h1>
        </div>
        
        {/* Horizontal Scroll Container */}
        <div className="flex-1 flex flex-col">
          <div 
            ref={scrollContainerRef}
            className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide flex-1"
            onScroll={handleScroll}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {/* Slide 1 */}
            <div className="min-w-full snap-center px-2 flex flex-col">
              <div className="flex flex-col h-full">
                {/* サブタイトル */}
                <div className="mb-4">
                  <h2 className="text-lg md:text-2xl font-bold text-gray-900 border-l-4 border-orange-600 pl-3">
                    {slides[0].title}
                  </h2>
                </div>
                
                {/* イラスト */}
                <div className="flex justify-center mb-4">
                  <img 
                    src={slides[0].image}
                    alt="プロテイン不要のイラスト" 
                    className="w-[200px] h-[200px] object-contain"
                  />
                </div>
                
                {/* コンテンツエリア */}
                <div className="flex-1 flex flex-col">
                  <div className="space-y-3 text-base text-gray-700 leading-[1.6] mb-4">
                    <p>{slides[0]?.description}</p>
                  </div>
                  
                  {/* チェックリスト */}
                  <div className="space-y-2 mb-4">
                    {slides[0]?.features?.map((feature, index) => (
                      <div key={index} className="flex items-center">
                        <svg className="w-5 h-5 text-orange-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-base text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Slide 2 */}
            <div className="min-w-full snap-center px-2 flex flex-col">
              <div className="flex flex-col h-full">
                {/* サブタイトル */}
                <div className="mb-4">
                  <h2 className="text-lg md:text-2xl font-bold text-gray-900 border-l-4 border-orange-600 pl-3">
                    {slides[1].title}
                  </h2>
                </div>
                
                {/* イラスト */}
                <div className="flex justify-center mb-4">
                  <img 
                    src={slides[1].image}
                    alt="筋トレをする人のイラスト" 
                    className="w-[220px] h-[220px] object-contain"
                  />
                </div>
                
                {/* コンテンツエリア */}
                <div className="flex-1 flex flex-col justify-start">
                  <div className="space-y-3 text-base text-gray-700 leading-[1.6] mb-4">
                    <p>{slides[1].description}</p>
                    <p>{slides[1].additionalDescription}</p>
                  </div>
                  
                  {/* 栄養成分ハイライト */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {slides[1].stats?.map((stat, index) => (
                      <div key={index} className="bg-orange-50 rounded-lg p-3 text-center">
                        <div className="text-3xl font-bold text-orange-600">{stat.value}</div>
                        <div className="text-sm text-gray-600">{stat.unit}</div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-l-4 border-orange-600 pl-3 py-2 bg-orange-50">
                    <p className="font-semibold text-orange-600 text-base leading-[1.5]">
                      毎日の食事が、あなたの成長につながる。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pagination Dots - Fixed position */}
          <div className="flex justify-center items-center gap-2 py-4">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollToSlide(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentSlide === index 
                    ? 'w-8 bg-orange-600' 
                    : 'w-2 bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
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

export default TargetUserSlideMobile;