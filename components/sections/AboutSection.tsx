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
      description: '**「ふとるめし」のお弁当は2つで１食！**/個数でボリューム調整も簡単。/しっかりとした味付けで白米が進む！',
      number: '01',
    },
    {
      title: 'レンジでチンだけ',
      description: '夕食後、息子からまさかの「お腹すいた」の声に対応するための太る飯。/太る飯は、忙しいお母さんを応援します。',
      number: '02',
    },
    {
      title: '計算されたPFCバランス',
      description: '平均タンパク質60g超え！筋肉づくりに最適な栄養設計',
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

        {/* 3つの特徴 - 横一列（千鳥配置） */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 items-end">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`relative bg-white p-6 sm:p-8 rounded-2xl overflow-visible ${
                index === 1 ? 'md:mt-8' : ''
              }`}
            >
              {/* 背景番号 */}
              <div className="absolute top-0 right-0 text-8xl sm:text-9xl lg:text-[10rem] font-bold text-orange-500 opacity-10 leading-none pointer-events-none z-0">
                {feature.number}
              </div>
              {/* 1番目の特徴に画像を表示 */}
              {index === 0 && (
                <div className="flex justify-center mb-4 relative z-20">
                  <Image
                    src="/images/sections/hutoruhaha3.png"
                    alt="ふとる母3"
                    width={150}
                    height={150}
                    className="w-24 sm:w-28 md:w-32 h-auto"
                  />
                </div>
              )}
              {/* 2番目の特徴に画像を表示 */}
              {index === 1 && (
                <div className="flex justify-center mb-4 relative z-20">
                  <Image
                    src="/images/sections/hutoruhaha.png"
                    alt="ふとる母"
                    width={150}
                    height={150}
                    className="w-24 sm:w-28 md:w-32 h-auto"
                  />
                </div>
              )}
              {/* 3番目の特徴に画像を表示 */}
              {index === 2 && (
                <div className="flex justify-center mb-4 relative z-20">
                  <Image
                    src="/images/sections/hutoruhaha2.png"
                    alt="ふとる母2"
                    width={150}
                    height={150}
                    className="w-24 sm:w-28 md:w-32 h-auto"
                  />
                </div>
              )}
              {/* コンテンツ */}
              <div className="relative z-10">
                <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-3 text-center whitespace-nowrap">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed text-center">
                  {feature.description.split('/').map((line, idx) => {
                    // **テキスト** をboldに変換
                    const boldMatch = line.match(/^\*\*(.+)\*\*$/);
                    const content = boldMatch ? (
                      <span className="font-bold text-gray-900">{boldMatch[1]}</span>
                    ) : (
                      line
                    );
                    return (
                      <React.Fragment key={idx}>
                        {content}
                        {idx < feature.description.split('/').length - 1 && <br />}
                      </React.Fragment>
                    );
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ふとるくん + 2個で1食のSVG - セクションの上に配置 */}
        <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          <Image
            src="/images/sections/hutorukunn3.png"
            alt="ふとるくん"
            width={300}
            height={300}
            className="w-32 sm:w-40 md:w-48 h-auto"
          />
          <Image
            src="/images/sections/new-copy1.svg"
            alt="太る飯は2個で1食"
            width={600}
            height={200}
            className="w-full max-w-[280px] sm:max-w-[400px] md:max-w-[500px] h-auto"
          />
        </div>

      </div>
    </section>
  );
};

export default AboutSection;

