'use client';

import React, { useState, useEffect } from 'react';

interface BannerSettings {
  is_active: boolean;
  image_url: string;
  link_url: string;
}

const LineFloatingButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
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

  const handleBannerClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsBannerClosed(true);
  };

  const showBanner = banner !== null && banner.is_active && !!banner.image_url;
  const bannerImageUrl = banner?.image_url || '';
  const bannerLinkUrl = banner?.link_url || '';

  return (
    <>
      {/* PC用バナー - 画面中央下部 */}
      {showBanner && !isBannerClosed && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] transition-opacity duration-500 hidden sm:block ${
            isVisible && !isNearFooter ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="relative">
            {/* 閉じるボタン */}
            <button
              type="button"
              onClick={handleBannerClose}
              className="absolute -top-3 -right-3 bg-gray-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg hover:bg-gray-700 transition-colors z-[10002] cursor-pointer"
              style={{
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
              }}
              aria-label="閉じる"
            >
              <svg
                className="w-4 h-4"
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
            {bannerLinkUrl ? (
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
            ) : (
              <img
                src={bannerImageUrl}
                alt="バナー"
                width={600}
                height={100}
                className="rounded-lg shadow-lg"
              />
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default LineFloatingButton;
