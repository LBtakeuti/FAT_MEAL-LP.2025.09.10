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
  const [isMobileBannerClosed, setIsMobileBannerClosed] = useState(false);
  const [isNearFooter, setIsNearFooter] = useState(false);
  const [banner, setBanner] = useState<BannerSettings | null>(null);
  const [mobileBanner, setMobileBanner] = useState<BannerSettings | null>(null);

  useEffect(() => {
    fetch('/api/admin/banner')
      .then(res => res.ok ? res.json() : null)
      .then(json => {
        if (json) setBanner(json.data ?? json);
      })
      .catch(() => {});

    fetch('/api/admin/banner/mobile')
      .then(res => res.ok ? res.json() : null)
      .then(json => {
        if (json) setMobileBanner(json.data ?? json);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const heroHeight = window.innerHeight;
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      const footerThreshold = documentHeight - windowHeight - 200;
      setIsNearFooter(scrollPosition > footerThreshold);

      setIsVisible(scrollPosition > heroHeight);
    };

    handleScroll();

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleBannerClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsBannerClosed(true);
  };

  const handleMobileBannerClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMobileBannerClosed(true);
  };

  const showBanner = banner !== null && banner.is_active && !!banner.image_url;
  const showMobileBanner = mobileBanner !== null && mobileBanner.is_active && !!mobileBanner.image_url;

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
            {banner.link_url ? (
              <a
                href={banner.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <img
                  src={banner.image_url}
                  alt="バナー"
                  width={600}
                  height={100}
                  className="rounded-lg"
                />
              </a>
            ) : (
              <img
                src={banner.image_url}
                alt="バナー"
                width={600}
                height={100}
                className="rounded-lg"
              />
            )}
          </div>
        </div>
      )}

      {/* モバイル用バナー - 追従フッターの上・右寄り */}
      {showMobileBanner && !isMobileBannerClosed && (
        <div className="fixed bottom-14 right-2 w-36 z-[9998] sm:hidden">
          <div className="relative">
            <button
              type="button"
              onClick={handleMobileBannerClose}
              className="absolute top-1 right-1 bg-gray-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg hover:bg-gray-700 transition-colors z-[10002] cursor-pointer"
              style={{
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
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
            {mobileBanner.link_url ? (
              <a
                href={mobileBanner.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <img
                  src={mobileBanner.image_url}
                  alt="バナー"
                  className="w-full rounded-lg"
                />
              </a>
            ) : (
              <img
                src={mobileBanner.image_url}
                alt="バナー"
                className="w-full rounded-lg"
              />
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default LineFloatingButton;
