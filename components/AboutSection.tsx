'use client';

import React, { useState, useEffect, useRef } from 'react';

const AboutSection: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const titleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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

    if (titleRef.current) {
      observer.observe(titleRef.current);
    }

    return () => {
      if (titleRef.current) {
        observer.unobserve(titleRef.current);
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
      description: 'たんぱく質70g超え！筋肉づくりに最適な栄養設計',
      number: '03',
    },
  ];

  return (
    <section className="relative overflow-hidden bg-white pt-0 pb-12 sm:pb-20">
      {/* 上部の波形 */}
      <div className="absolute top-0 left-0 w-full overflow-hidden leading-none z-10" style={{ transform: 'translateY(-1px)' }}>
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
      
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 z-20">
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
        <div className="mt-10 sm:mt-14 bg-orange-50 rounded-2xl p-6 sm:p-8">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 text-center">
            お弁当の組み合わせでボリューム調整！
          </h3>

          {/* 説明文 */}
          <div className="text-sm sm:text-base text-gray-700 mb-6 space-y-2">
            <p className="text-center font-medium text-orange-600">
              カロリーとタンパク質が計算されたお弁当が1セット6種類入り！
            </p>
            <ul className="space-y-1 text-left max-w-xl mx-auto">
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-1">●</span>
                <span>忙しい社会人の方は、1つのお弁当で満足！</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-1">●</span>
                <span>食べ盛りの学生・運動する方には2つのお弁当でタンパク質・カロリーを摂取！</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-1">●</span>
                <span>増量中やハードトレーニングを日常的にしている方には3つのお弁当でタンパク質・カロリーを効率的に摂取！</span>
              </li>
            </ul>
            <p className="text-center font-medium text-gray-800 pt-2">
              計算されたタンパク質・カロリーで食事を管理し、<br className="sm:hidden" />食事を楽しく、努力にブーストをかけよう！
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-white rounded-xl p-4 sm:p-5 text-center shadow-sm">
              <div className="text-3xl sm:text-4xl font-bold text-orange-500 mb-2">1食</div>
              <div className="text-sm sm:text-base font-medium text-gray-900 mb-1">約450kcal</div>
              <div className="text-xs sm:text-sm text-gray-600">忙しい社会人の方に</div>
            </div>
            <div className="bg-white rounded-xl p-4 sm:p-5 text-center shadow-sm">
              <div className="text-3xl sm:text-4xl font-bold text-orange-500 mb-2">2食</div>
              <div className="text-sm sm:text-base font-medium text-gray-900 mb-1">約900kcal</div>
              <div className="text-xs sm:text-sm text-gray-600">食べ盛りの学生・運動する方に</div>
            </div>
            <div className="bg-white rounded-xl p-4 sm:p-5 text-center shadow-sm">
              <div className="text-3xl sm:text-4xl font-bold text-orange-500 mb-2">3食</div>
              <div className="text-sm sm:text-base font-medium text-gray-900 mb-1">約1,350kcal</div>
              <div className="text-xs sm:text-sm text-gray-600">増量中・アスリートの方に</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;

