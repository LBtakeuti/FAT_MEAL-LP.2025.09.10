'use client';

import React from 'react';
import Image from 'next/image';

const MenuIntroSection: React.FC = () => {
  return (
    <section className="menu-section">
      <div className="menu-inner">
        <h2 className="menu-title">
          ふとるめしは、太るに特化したデカ盛り弁当
        </h2>

        <p className="menu-desc">
          <span className="menu-line1">
            世の中の宅食はカロリーを抑えるものばかり。ふとるめしはその真逆の発想で作った。
          </span>
          <br />
          太りたいアスリートに必要なのは、制限ではなく補給だ。
          <br />
          管理栄養士が設計した、増量のための弁当がここにある。
        </p>

        <div className="menu-img-wrap mt-4">
          <Image
            src="/images/sections/menu-six.webp"
            alt="ふとるめし 全6メニュー"
            width={1600}
            height={1050}
            sizes="(min-width: 768px) 880px, 100vw"
            className="w-full h-auto rounded-lg"
          />
        </div>
      </div>
    </section>
  );
};

export default MenuIntroSection;
