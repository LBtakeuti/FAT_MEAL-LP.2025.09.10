'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTooltipPosition } from './useTooltipPosition';
import { TooltipManager } from './TooltipManager';
import { StatsTable } from './StatsTable';
import { SNACK_BREAKDOWN, FUTORUMESHI_BREAKDOWN } from './constants';

const StatsSection: React.FC = () => {
  const [isMobile, setIsMobile] = useState(true);

  // 補食側のツールチップ
  const snack = useTooltipPosition();

  // ふとるめし側のツールチップ
  const futorumeshi = useTooltipPosition();

  // 画面幅をチェック
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  return (
    <section className="relative overflow-hidden bg-white py-12 sm:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* セクションタイトル */}
        <div className="text-center mb-10 sm:mb-16 relative">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 relative z-10">
            データで見る<br className="sm:hidden" />「ふとるめし」
          </h2>
          <div className="flex justify-center -mt-6 sm:-mt-8 relative z-0">
            <Image
              src="/images/sections/b_simple_111_0M 2.png"
              alt=""
              width={3923}
              height={465}
              className="w-full max-w-3xl h-auto"
            />
          </div>
        </div>

        {/* 比較表 */}
        <StatsTable
          snackButtonRef={snack.buttonRef}
          snackButtonRefDesktop={snack.buttonRefDesktop}
          futorumeshiButtonRef={futorumeshi.buttonRef}
          futorumeshiButtonRefDesktop={futorumeshi.buttonRefDesktop}
          onSnackDetailClick={(e) => snack.handleClick(e, () => futorumeshi.setIsOpen(false))}
          onFutorumeshiDetailClick={(e) => futorumeshi.handleClick(e, () => snack.setIsOpen(false))}
        />

        {/* ツールチップ - 補食側 */}
        <TooltipManager
          isOpen={snack.isOpen}
          position={snack.position}
          data={SNACK_BREAKDOWN}
          tooltipRef={snack.tooltipRef}
          isMobile={isMobile}
        />

        {/* ツールチップ - ふとるめし側 */}
        <TooltipManager
          isOpen={futorumeshi.isOpen}
          position={futorumeshi.position}
          data={FUTORUMESHI_BREAKDOWN}
          tooltipRef={futorumeshi.tooltipRef}
          isMobile={isMobile}
        />
      </div>
    </section>
  );
};

export default StatsSection;
