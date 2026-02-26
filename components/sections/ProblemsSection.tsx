'use client';

import React from 'react';

const ProblemsSection: React.FC = () => {
  return (
    <section id="problems" className="relative overflow-hidden bg-white py-4 sm:pt-6 sm:pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* メインテキスト */}
        <div className="text-center">
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-black leading-relaxed" style={{ fontFamily: '"Yu Mincho", "游明朝", YuMincho, serif' }}>
            <span className="block mb-2">太れないのは、努力が足りないんじゃない。</span>
            <span className="block mb-2">カロリーが足りないだけ。</span>
            <span className="block mb-2">ふとるめしは高カロリー・高タンパクに特化した、今までにない冷凍弁当。</span>
            <span className="block mb-2">ふとるめしは2個で1食。</span>
            <span className="block">本気のカラダづくりに、圧倒的なブーストを。</span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProblemsSection;
