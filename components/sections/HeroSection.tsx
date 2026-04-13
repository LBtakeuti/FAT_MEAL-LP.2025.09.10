'use client';

import React from 'react';
import Image from 'next/image';

/**
 * ヒーローセクション
 */
const HeroSection: React.FC = () => {
  return (
    <section id="hero" className="relative overflow-hidden bg-white pt-4 pb-2">
      {/* PC */}
      <div className="hidden sm:block relative w-full max-w-3xl mx-auto" style={{ aspectRatio: '9/16' }}>
        <Image
          src="/images/hero/Frame 36.png"
          alt="ふとるめし"
          fill
          className="object-contain object-center"
          priority
        />
      </div>

      {/* SP */}
      <div className="sm:hidden w-full">
        <div className="relative w-full" style={{ aspectRatio: '9/16' }}>
          <Image
            src="/images/hero/Frame 36.png"
            alt="ふとるめし"
            fill
            className="object-contain object-center"
            priority
          />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
