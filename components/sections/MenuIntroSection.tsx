'use client';

import React from 'react';
import Image from 'next/image';

const MenuIntroSection: React.FC = () => {
  return (
    <section className="menu-section">
      <div className="menu-inner">
        <div className="relative w-full max-w-xl mx-auto">
          <Image
            src="/images/sections/menu-six.png"
            alt="ふとるめし 弁当パッケージ"
            width={1600}
            height={1050}
            sizes="(min-width: 768px) 576px, 100vw"
            className="w-full h-auto rounded-lg opacity-50"
            priority
          />

          {/* テキストオーバーレイ */}
          <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-8 pointer-events-none">
            <p
              className="text-lg sm:text-2xl md:text-3xl leading-[3.0] tracking-wide text-center max-w-[95%] sm:max-w-lg md:max-w-xl"
              style={{
                color: '#1a1a1a',
                fontWeight: 700,
                textShadow: [
                  '0 0 6px #ffffff',
                  '0 0 12px #ffffff',
                  '0 0 20px #ffffff',
                  '2px 2px 0 #ffffff',
                  '-2px -2px 0 #ffffff',
                  '2px -2px 0 #ffffff',
                  '-2px 2px 0 #ffffff',
                ].join(', '),
              }}
            >
              ふとるめしは、見た目に投資しません。
              <br className="hidden sm:inline" />
              パッケージにかけるお金は、
              <br className="sm:hidden" />
              すべて素材・量・栄養に使います。
              アスリートに必要なのは、
              <br className="sm:hidden" />
              映える弁当ではなく、
              <br className="hidden md:inline" />
              体が変わる弁当だからです。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MenuIntroSection;
