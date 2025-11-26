'use client';

import React, { useState, useEffect } from 'react';

const LineFloatingButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosed, setIsClosed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // ヒーローセクションの高さを取得（ビューポートの高さを基準）
      const heroHeight = window.innerHeight;
      const scrollPosition = window.scrollY;
      
      // ヒーローセクションを過ぎたら表示（閉じられていない場合のみ）
      if (!isClosed) {
        setIsVisible(scrollPosition > heroHeight);
      }
    };

    // 初回チェック
    handleScroll();

    // スクロールイベントリスナーを追加
    window.addEventListener('scroll', handleScroll);
    
    // クリーンアップ
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isClosed]);

  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsClosed(true);
    setIsVisible(false);
  };

  return (
    <div
      className={`fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 transition-opacity duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className="flex flex-col items-end gap-2 relative">
        {/* 閉じるボタン */}
        <button
          onClick={handleClose}
          className="absolute -top-2 -right-2 bg-gray-700 hover:bg-gray-800 text-white rounded-full w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center shadow-md transition-colors duration-200 z-10"
          aria-label="閉じる"
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

    <a
      href="https://lin.ee/AqKWBrV"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="LINE公式アカウント"
    >
          <div className="flex flex-col items-end gap-0">
        {/* テキストバッジ */}
        <div className="bg-white text-gray-900 font-bold text-xs sm:text-base md:text-lg px-3 py-2 sm:px-4 sm:py-3 rounded-lg shadow-md border-2 border-[#06C755] whitespace-nowrap mb-1">
          <span className="text-[#06C755]">LINE</span>で
          <span className="text-orange-600">ふとるめし</span>を
          <br className="sm:hidden" />
          チェック！！
        </div>
        
        <div className="relative">
          {/* メインボタン */}
          <div className="flex items-center gap-2 sm:gap-3 bg-[#06C755] hover:bg-[#05b04b] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 px-4 py-3 sm:px-6 sm:py-5 md:px-7 md:py-6">
            {/* LINEアイコン */}
            <svg
              viewBox="0 0 24 24"
              className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10"
              fill="currentColor"
            >
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
            </svg>
            {/* テキスト（PC表示） */}
            <span className="hidden sm:inline-block font-bold text-sm md:text-base lg:text-lg whitespace-nowrap">
              公式LINE
            </span>
          </div>
          
          {/* パルスアニメーション */}
          <div className="absolute inset-0 bg-[#06C755] rounded-full animate-ping opacity-20"></div>
        </div>
      </div>
    </a>
      </div>
    </div>
  );
};

export default LineFloatingButton;

