'use client';

import React from 'react';
import Link from 'next/link';

const PromoterFloatingCta: React.FC = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9998] bg-white/95 backdrop-blur-sm border-t border-gray-200 px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
      <div className="max-w-md mx-auto">
        <Link
          href="/purchase"
          className="block w-full rounded-full bg-[#E8593C] text-white text-center py-3.5 text-base font-bold hover:bg-[#d14a2f] transition-colors"
        >
          購入する
        </Link>
      </div>
    </div>
  );
};

export default PromoterFloatingCta;
