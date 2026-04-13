'use client';

import React from 'react';

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

        {/* <div className="menu-img-wrap">
          <img
            src="/images/sections/slider-1.png"
            alt="ふとるめし 全6メニュー"
          />
        </div> 画像一時非表示 */}
      </div>
    </section>
  );
};

export default MenuIntroSection;
