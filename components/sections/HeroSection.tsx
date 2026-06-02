'use client';

import React from 'react';
import Image from 'next/image';

/**
 * ヒーローセクション
 */
const HeroSection: React.FC = () => {
  return (
    <section id="hero" className="relative overflow-hidden bg-white pt-4 pb-2">
      {/* PC: F24 で max-w-3xl(768px) → 80% = 614px に縮小 */}
      <div className="hidden sm:block relative w-4/5 max-w-[614px] mx-auto" style={{ aspectRatio: '9/16' }}>
        <Image
          src="/images/hero/hero-main.png"
          alt="ふとるめし"
          fill
          className="object-contain object-center"
          sizes="(min-width: 768px) 614px, 80vw"
          priority
        />
      </div>

      {/* SP: F24 で w-full → w-4/5 (80%) に縮小 */}
      <div className="sm:hidden w-full">
        <div className="relative w-4/5 mx-auto" style={{ aspectRatio: '9/16' }}>
          <Image
            src="/images/hero/hero-main.png"
            alt="ふとるめし"
            fill
            className="object-contain object-center"
            sizes="80vw"
            priority
          />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
