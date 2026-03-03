'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

const sliderImages = [
  '/images/sections/slider-1.png',
  '/images/sections/slider-2.png',
  '/images/sections/slider-3.png',
];

const ProblemsSection: React.FC = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % sliderImages.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section id="problems" className="relative overflow-hidden bg-white py-4 sm:pt-6 sm:pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-end gap-8 md:gap-12">
          {/* メインテキスト */}
          <div className="flex-1 text-center md:text-left flex flex-col">
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-black leading-relaxed mb-4" style={{ fontFamily: '"Yu Mincho", "游明朝", YuMincho, serif' }}>
              太ることは簡単ではない。これは学生アスリートに特化した太るための弁当である。
            </p>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-2" style={{ fontFamily: '"Noto Sans JP", sans-serif' }}>
              本気で高みを目指すアスリートに向けた超高カロリーなボリューム弁当です。
            </p>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4" style={{ fontFamily: '"Noto Sans JP", sans-serif' }}>
              管理栄養士監修のもと、味とボリュームにこだわったふとるめし。ふとるめしは努力人の味方です。ふとるめしは、頑張る人を応援します。
            </p>
            {/* バッジ */}
            <div className="flex justify-center md:justify-start gap-2 sm:gap-3 mt-2">
              <Image
                src="/images/sections/badge-media.png"
                alt="メディア掲載多数"
                width={80}
                height={80}
                className="w-16 sm:w-20 md:w-24 h-auto"
              />
              <Image
                src="/images/sections/badge-domestic.png"
                alt="国内生産"
                width={80}
                height={80}
                className="w-16 sm:w-20 md:w-24 h-auto"
              />
              <Image
                src="/images/sections/badge-nutritionist.png"
                alt="管理栄養士監修"
                width={80}
                height={80}
                className="w-16 sm:w-20 md:w-24 h-auto"
              />
            </div>
          </div>
          {/* 画像スライダー（PCのみ右側に表示） */}
          <div className="hidden md:flex flex-1 justify-end">
            <div className="relative w-full max-w-md aspect-square overflow-hidden">
              {sliderImages.map((src, index) => (
                <div
                  key={src}
                  className={`absolute inset-0 transition-opacity duration-1000 ${
                    index === currentImageIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                  }`}
                >
                  <Image
                    src={src}
                    alt="ふとるめし"
                    fill
                    className="object-cover"
                    priority={index === 0}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemsSection;
