'use client';

import React, { useState, useEffect } from 'react';

interface BannerSettings {
  is_active: boolean;
  image_url: string;
  link_url: string;
}

const LineFloatingButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLineClosed, setIsLineClosed] = useState(false);
  const [isBannerClosed, setIsBannerClosed] = useState(false);
  const [isNearFooter, setIsNearFooter] = useState(false);
  const [banner, setBanner] = useState<BannerSettings | null>(null);

  useEffect(() => {
    fetch('/api/admin/banner')
      .then(res => res.ok ? res.json() : null)
      .then(json => {
        if (json) setBanner(json.data ?? json);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      // ヒーローセクションの高さを取得（ビューポートの高さを基準）
      const heroHeight = window.innerHeight;
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // フッターが近づいているかチェック（ページの下から200px以内）
      const footerThreshold = documentHeight - windowHeight - 200;
      setIsNearFooter(scrollPosition > footerThreshold);

      // ヒーローセクションを過ぎたら表示
      setIsVisible(scrollPosition > heroHeight);
    };

    // 初回チェック
    handleScroll();

    // スクロールイベントリスナーを追加
    window.addEventListener('scroll', handleScroll);

    // クリーンアップ
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLineClose = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLineClosed(true);
  };

  const handleBannerClose = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsBannerClosed(true);
  };

  const showBanner = banner?.is_active !== false;
  const bannerImageUrl = banner?.image_url || '/banner-PC.png';
  const bannerLinkUrl = banner?.link_url || 'https://lin.ee/AqKWBrV';

  return (
    <>
      {/* PC用バナー - 画面中央下部 */}
      {showBanner && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] transition-opacity duration-500 hidden sm:block ${
            isVisible && !isNearFooter && !isBannerClosed ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="relative">
            {/* 閉じるボタン */}
            <button
              type="button"
              onClick={handleBannerClose}
              onTouchEnd={handleBannerClose}
              className="absolute -top-2 -right-2 bg-gray-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg z-20 hover:bg-gray-700 transition-colors"
              style={{
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation'
              }}
              aria-label="閉じる"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <a
              href={bannerLinkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <img
                src={bannerImageUrl}
                alt="バナー"
                width={600}
                height={100}
                className="rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
              />
            </a>
          </div>
        </div>
      )}

      {/* LINE追従ボタン */}
      <div
        className={`fixed bottom-36 sm:bottom-20 right-4 sm:right-6 z-[10000] transition-opacity duration-500 ${
          isVisible && !isNearFooter && !isLineClosed ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <a
          href="https://lin.ee/AqKWBrV"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LINE公式アカウント"
          style={{
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation'
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <div className="flex flex-col items-end gap-0">
            {/* テキストバッジ */}
            <div className="relative bg-white text-gray-900 font-bold text-xs sm:text-base md:text-lg px-3 py-2 sm:px-4 sm:py-3 rounded-lg shadow-md border-2 border-[#06C755] whitespace-nowrap mb-1">
              {/* 閉じるボタン - テキストバッジに対して固定 */}
              <button
                type="button"
                onClick={handleLineClose}
                onTouchEnd={handleLineClose}
                className="absolute -top-2 -right-2 bg-gray-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg z-20"
                style={{
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation'
                }}
                aria-label="閉じる"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
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
    </>
  );
};

export default LineFloatingButton;
