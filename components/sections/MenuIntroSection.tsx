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
          <span className="hidden sm:inline">世の中の宅食はカロリーを抑える。ふとるめしは逆だ。太りたいアスリートのために、管理栄養士が作った増量専用の弁当。</span>
          <span className="sm:hidden">世の中の宅食はカロリーを抑える。<br />ふとるめしは逆だ。<br />太りたいアスリートのために、管理栄養士が作った増量専用の弁当。</span>
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
