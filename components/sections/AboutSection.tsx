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
      description: '平均タンパク質60g超え！筋肉づくりに最適な栄養設計/毎日の食事管理も簡単に！',
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

        {/* 3つの特徴 - 横一列 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 items-stretch">
          {features.map((feature, index) => (
            <div
              key={index}
              className="relative bg-white p-6 sm:p-8 rounded-2xl overflow-visible h-full flex flex-col"
            >
              {/* 背景番号 */}
              <div className="absolute top-0 right-0 text-8xl sm:text-9xl lg:text-[10rem] font-bold text-orange-500 opacity-10 leading-none pointer-events-none z-0">
                {feature.number}
              </div>
              {/* 画像エリア - 高さを固定 */}
              <div className="flex justify-center items-end mb-4 relative z-20 h-24 sm:h-28 md:h-32">
                {index === 0 && (
                  <Image
                    src="/images/sections/hutoruhaha3.png"
                    alt="ふとる母3"
                    width={150}
                    height={150}
                    className="w-auto h-full max-h-24 sm:max-h-28 md:max-h-32 object-contain"
                  />
                )}
                {index === 1 && (
                  <Image
                    src="/images/sections/hutoruhaha.png"
                    alt="ふとる母"
                    width={150}
                    height={150}
                    className="w-auto h-full max-h-24 sm:max-h-28 md:max-h-32 object-contain"
                  />
                )}
                {index === 2 && (
                  <Image
                    src="/images/sections/hutoruhaha2.png"
                    alt="ふとる母2"
                    width={150}
                    height={150}
                    className="w-auto h-full max-h-24 sm:max-h-28 md:max-h-32 object-contain"
                  />
                )}
              </div>
              {/* コンテンツ */}
              <div className="relative z-10 flex-1 flex flex-col justify-start">
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


      </div>
    </section>
  );
};

export default AboutSection;

