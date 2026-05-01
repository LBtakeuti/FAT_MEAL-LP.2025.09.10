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
          src="/images/hero/hero-main.png"
          alt="ふとるめし"
          fill
          className="object-contain object-center"
          sizes="(min-width: 768px) 768px, 100vw"
          priority
        />
      </div>

      {/* SP */}
      <div className="sm:hidden w-full">
        <div className="relative w-full" style={{ aspectRatio: '9/16' }}>
          <Image
            src="/images/hero/hero-main.png"
            alt="ふとるめし"
            fill
            className="object-contain object-center"
            sizes="100vw"
            priority
          />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
