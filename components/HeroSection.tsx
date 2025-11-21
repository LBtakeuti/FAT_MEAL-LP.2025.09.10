'use client';

import React from 'react';
import Image from 'next/image';

const HeroSection: React.FC = () => {
  return (
    <section id="hero" className="relative flex h-screen sm:min-h-screen items-center justify-center overflow-hidden bg-orange-500 pt-14 sm:pt-32 pb-16 sm:pb-24">
      {/* お弁当画像 - 画面中央に配置 */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/FOOD.avif"
          alt="和食料理"
          fill
          className="object-cover object-center md:object-[center_60%]"
          priority
        />
      </div>
      
      <div className="max-w-[375px] px-4 md:max-w-[768px] md:px-6 lg:max-w-[1200px] lg:px-8 mx-auto text-center animate-fadeIn relative z-10">
        <div className="relative w-full h-auto">
          <Image
            src="/copymane.png"
            alt="もっとカロリーを、もっと栄養を、努力にブースト。"
            width={800}
            height={400}
            className="w-full h-auto object-contain"
            priority
          />
        </div>
        <div className="mt-6 sm:mt-8">
          <p className="text-white text-lg sm:text-2xl md:text-3xl font-bold drop-shadow-lg">
            <span className="inline-block">栄養管理士監修の</span>
            <span className="inline-block">高カロリー×高栄養設計</span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;