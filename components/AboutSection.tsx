'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

const AboutSection: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const titleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentRef = titleRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  const features = [
    {
      title: '圧倒的なボリューム',
      description: '1食平均450kcal！/メイン、副菜のおかずも味がしっかり/ボリュームも満点で満足間違いなし！',
      number: '01',
    },
    {
      title: '妥協なき美味しさ',
      description: 'ご飯が進む濃いめの味付け。毎日食べても飽きない本格的な味',
      number: '02',
    },
    {
      title: '計算されたPFCバランス',
      description: '平均タンパク質30g超え！筋肉づくりに最適な栄養設計',
      number: '03',
    },
  ];

  return (
    <section className="relative overflow-hidden bg-white pt-0 pb-12 sm:pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div ref={titleRef} className="mb-4 sm:mb-6 -mt-2 sm:-mt-1">
          {/* セクションタイトル */}
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
            ふとるめしとは
          </h2>
          {/* アンダーライン */}
          <div className="relative h-0.5 bg-gray-300 overflow-hidden">
            <div
              className={`absolute top-0 left-0 h-full bg-orange-500 transition-all duration-1000 ease-out ${
                isVisible ? 'w-full' : 'w-0'
              }`}
            />
          </div>
        </div>

        {/* 3つの特徴 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="relative bg-white p-6 sm:p-8 rounded-2xl overflow-hidden"
            >
              {/* 背景番号 */}
              <div className="absolute top-2 right-2 text-8xl sm:text-9xl lg:text-[12rem] font-bold text-orange-500 opacity-10 leading-none">
                {feature.number}
              </div>
              {/* コンテンツ */}
              <div className="relative z-10">
                <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-3 text-center whitespace-nowrap">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed text-center">
                  {feature.description.split('/').map((line, idx) => (
                    <React.Fragment key={idx}>
                      {line}
                      {idx < feature.description.split('/').length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ボリューム調整セクション */}
        <div className="mt-10 sm:mt-14 rounded-2xl p-6 sm:p-8">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">
            お弁当の組み合わせでボリューム調整！
          </h3>

          {/* 説明文 */}
          <div className="text-sm sm:text-base text-gray-700 mb-6 sm:mb-8 space-y-2">
            <p className="text-center font-medium text-gray-800">
              計算されたタンパク質・カロリーで食事を管理し、<br className="sm:hidden" />食事を楽しく、努力にブーストをかけよう！
            </p>
          </div>

          {/* お弁当画像と説明 - 画像を横に3つ、説明は下に配置 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {/* 1食 */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 w-full max-w-[200px] sm:max-w-[250px] h-[200px] sm:h-[250px] relative">
                <Image
                  src="/futorumeshi1.png"
                  alt="1食のお弁当"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-orange-500 mb-2">1食</div>
              <div className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                約500kcal＋白米
              </div>
              <div className="text-sm sm:text-base text-gray-600">
                忙しい社会人の方に
              </div>
            </div>

            {/* 2食 */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 w-full max-w-[200px] sm:max-w-[250px] h-[200px] sm:h-[250px] relative">
                <Image
                  src="/futorumeshi2.png"
                  alt="2食のお弁当"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-orange-500 mb-2">2食</div>
              <div className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                約900kcal＋白米
              </div>
              <div className="text-sm sm:text-base text-gray-600">
                食べ盛りの学生・運動する方に
              </div>
            </div>

            {/* 3食 */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 w-full max-w-[200px] sm:max-w-[250px] h-[200px] sm:h-[250px] relative">
                <Image
                  src="/futorumeshi3.png"
                  alt="3食のお弁当"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-orange-500 mb-2">3食</div>
              <div className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                1500kCal＋白米
              </div>
              <div className="text-sm sm:text-base text-gray-600">
                増量中・アスリートの方に
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;

