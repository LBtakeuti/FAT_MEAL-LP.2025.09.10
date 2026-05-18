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
          <div className="absolute inset-0 flex items-center justify-center p-2 sm:p-4 pointer-events-none">
            <p
              className="text-2xl sm:text-3xl md:text-4xl leading-[2.4] tracking-wide text-center whitespace-nowrap"
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
              <br />
              パッケージにかけるお金は、すべて素材・量・栄養に使います。
              <br />
              アスリートに必要なのは、映える弁当ではなく、体が変わる弁当だからです。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MenuIntroSection;
