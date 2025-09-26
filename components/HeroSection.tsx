'use client';

import React from 'react';
import Image from 'next/image';

const HeroSection: React.FC = () => {
  return (
    <section id="hero" className="h-[100dvh] sm:min-h-screen flex items-center justify-center bg-orange-500 pt-4 sm:pt-16 pb-16 sm:pb-0 relative overflow-hidden">
      {/* お弁当画像 - 画面中央に配置 */}
      <div className="absolute inset-x-4 top-[65px] bottom-16 sm:bottom-4 md:inset-8 md:top-[80px] lg:inset-12 lg:top-[90px] z-0">
        <Image
          src="/photo-1602273660127-a0000560a4c1.jpeg"
          alt="和食料理"
          fill
          className="object-cover shadow-2xl"
          priority
        />
      </div>
      
      <div className="max-w-[375px] px-4 md:max-w-[768px] md:px-6 lg:max-w-[1200px] lg:px-8 mx-auto text-center animate-fadeIn relative z-10">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-3 sm:mb-4">
            <span className="inline-block">もっと<span className="text-white">カロリー</span>を、</span>
            <span className="inline-block">もっと<span className="text-white">栄養</span>を。</span>
          </h2>
          <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mt-4 sm:mt-6">
            脅威の平均<span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl">1500</span>kcal
          </p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;