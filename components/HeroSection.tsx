'use client';

import React from 'react';
import Image from 'next/image';

const HeroSection: React.FC = () => {
  return (
    <section id="hero" className="relative flex min-h-[85vh] sm:min-h-screen items-center justify-center overflow-hidden bg-orange-500 pt-24 pb-16 sm:pt-32 sm:pb-24">
      {/* お弁当画像 - 画面中央に配置 */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/photo-1602273660127-a0000560a4c1.jpeg"
          alt="和食料理"
          fill
          className="object-cover object-center md:object-[center_60%]"
          priority
        />
      </div>
      
      <div className="max-w-[375px] px-4 md:max-w-[768px] md:px-6 lg:max-w-[1200px] lg:px-8 mx-auto text-center animate-fadeIn relative z-10">
        <div className="mb-8 sm:mb-8">
          <h2 className="font-bold text-white text-[clamp(2.25rem,7vw,4.75rem)] leading-[1.1] mb-4 sm:mb-4">
            <span className="block sm:inline">もっと<span className="text-orange-600">カロリー</span>を、</span>
            <span className="block sm:inline">もっと<span className="text-orange-600">栄養</span>を。</span>
          </h2>
          <p className="text-2xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mt-5 sm:mt-6">
            脅威の平均<span className="text-3xl sm:text-3xl md:text-4xl lg:text-5xl">1500</span>kcal
          </p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;