'use client';

import React from 'react';
import Image from 'next/image';

const HeroSection: React.FC = () => {
  return (
    <section id="hero" className="min-h-screen flex items-center justify-center bg-orange-500 pt-16 md:pt-20 lg:pt-24 relative overflow-hidden">
      {/* お弁当画像 - 中央に配置 */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[400px] lg:w-[500px] h-[300px] md:h-[400px] lg:h-[500px] z-0">
        <Image
          src="/bento_1.jpeg"
          alt="お弁当"
          fill
          className="object-cover"
          priority
        />
      </div>
      
      {/* 「この飯、太る」テキスト */}
      <div className="absolute bottom-10 right-10 md:bottom-20 md:right-20 z-10">
        <p className="text-4xl md:text-6xl lg:text-7xl font-bold text-black transform rotate-[-5deg]">
          <span className="inline-block">この飯、</span>
          <span className="text-5xl md:text-7xl lg:text-8xl inline-block">太る</span>
        </p>
      </div>
      
      <div className="max-w-[375px] px-4 md:max-w-[768px] md:px-6 lg:max-w-[1200px] lg:px-8 mx-auto text-center animate-fadeIn relative z-10">
        <div className="mb-8">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-4">
            <span className="inline-block">もっと<span className="text-white">カロリー</span>を、</span>
            <span className="inline-block">もっと<span className="text-white">栄養</span>を。</span>
          </h2>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;