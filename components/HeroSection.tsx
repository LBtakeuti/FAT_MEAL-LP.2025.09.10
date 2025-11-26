'use client';

import React from 'react';
import Image from 'next/image';

const HeroSection: React.FC = () => {
  return (
    <section id="hero" className="relative flex h-screen sm:min-h-screen items-center justify-center overflow-hidden bg-orange-500 pt-14 sm:pt-32 pb-16 sm:pb-24">
      {/* お弁当画像 - SP用とPC用で切り替え */}
      <div className="absolute inset-0 z-0">
        {/* SP用画像 */}
        <Image
          src="/hero-mobile-bg.png"
          alt="和食料理"
          fill
          className="sm:hidden object-cover object-center"
          priority
        />
        {/* PC用画像 */}
        <Image
          src="/hero-desktop-bg.avif"
          alt="和食料理"
          fill
          className="hidden sm:block object-cover object-center md:object-[center_60%]"
          priority
        />
      </div>
      
      <div className="max-w-[375px] px-4 md:max-w-[600px] md:px-6 lg:max-w-[800px] lg:px-8 mx-auto text-center animate-fadeIn relative z-10">
        <div className="relative w-full h-auto">
              <Image
                src="/hero-main-text.svg"
                alt="もっとカロリーを、もっと栄養を、努力にブースト。"
                width={800}
                height={400}
                className="w-full h-auto object-contain"
                unoptimized
              />
        </div>
        <div className="mt-6 sm:mt-8 inline-block bg-white/90 backdrop-blur-sm px-6 py-4 rounded-2xl">
          <p className="text-gray-900 text-lg sm:text-xl md:text-2xl font-bold font-antique">
            <span className="inline-block">栄養管理士監修の</span>
            <span className="inline-block">高カロリー×高栄養設計</span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;