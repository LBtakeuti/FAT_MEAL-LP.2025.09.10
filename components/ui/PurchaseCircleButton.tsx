'use client';

import React from 'react';
import Link from 'next/link';

const TEXT = 'ふとるめし　努力にブースト　';

const PurchaseCircleButton: React.FC = () => {
  const chars = Array.from(TEXT);
  const stepDeg = 360 / chars.length;

  return (
    <Link
      href="/purchase"
      aria-label="ふとるめし 購入"
      className="purchase-circle-button"
    >
      {/* 周囲のテキスト（回転） */}
      <span className="purchase-circle-button__text" aria-hidden="true">
        {chars.map((ch, i) => (
          <span key={i} style={{ transform: `rotate(${stepDeg * i}deg)` }}>
            {ch}
          </span>
        ))}
      </span>
      {/* 中央の円 */}
      <span className="purchase-circle-button__circle" aria-hidden="true">
        購入
      </span>
    </Link>
  );
};

export default PurchaseCircleButton;
