'use client';

import React from 'react';
import Image from 'next/image';
import { Reveal } from '@/components/ui/Reveal';

const MenuIntroSection: React.FC = () => {
  return (
    <section className="menu-section bg-white">
      {/* F73: フェードイン */}
      <Reveal>
        <Image
          src="/images/tv/tv-logo.svg"
          alt="メディア掲載"
          width={375}
          height={96}
          priority
          sizes="100vw"
          className="block w-full h-auto"
        />
      </Reveal>
    </section>
  );
};

export default MenuIntroSection;
