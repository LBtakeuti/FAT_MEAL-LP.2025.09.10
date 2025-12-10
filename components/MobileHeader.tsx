'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const MobileHeader: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Header - 常に表示 */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow-md sm:hidden z-50">
        <div className="flex items-center justify-between h-20 px-4">
          <Link href="/" className="ml-4">
            <Image
              src="/logo-header.png"
              alt="ふとるめし"
              width={240}
              height={80}
              className="h-14 w-auto"
              priority
            />
          </Link>
          
          {/* Hamburger Menu Button - ×に変わるアニメーション */}
          <button
            onClick={toggleMenu}
            className="h-10 w-10 flex flex-col justify-center items-center focus:outline-none focus:ring-0 focus:shadow-none active:bg-transparent tap-highlight-transparent hover:bg-transparent"
            style={{ 
              WebkitTapHighlightColor: 'transparent',
              boxShadow: 'none',
              outline: 'none'
            }}
            aria-label={isMenuOpen ? 'メニューを閉じる' : 'メニューを開く'}
          >
            <div className="relative w-6 h-5">
              <span className={`absolute left-0 w-full h-0.5 bg-[#374151] transition-all duration-300 ease-in-out ${
                isMenuOpen ? 'top-2 rotate-45' : 'top-0'
              }`} />
              <span className={`absolute left-0 top-2 w-full h-0.5 bg-[#374151] transition-all duration-300 ease-in-out ${
                isMenuOpen ? 'opacity-0' : 'opacity-100'
              }`} />
              <span className={`absolute left-0 w-full h-0.5 bg-[#374151] transition-all duration-300 ease-in-out ${
                isMenuOpen ? 'top-2 -rotate-45' : 'top-4'
              }`} />
            </div>
          </button>
        </div>
      </header>

      {/* Dropdown Menu - ヒーローセクションの上に被せる */}
      <div
        className={`fixed top-20 left-0 right-0 overflow-hidden transition-all duration-300 ease-in-out bg-white sm:hidden z-40 ${
          isMenuOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <nav className="border-t border-gray-200 shadow-lg">
            <div className="py-2">
              <button
                onClick={() => {
                  if (window.location.pathname === '/') {
                    const swiper = (window as any).swiper;
                    if (swiper) swiper.slideTo(0);
                  } else {
                    window.location.href = '/';
                  }
                  closeMenu();
                }}
                className="block w-full text-left px-6 py-3 text-orange-600 hover:bg-orange-50 transition-colors font-medium text-lg"
              >
                TOP
              </button>
              
              <button
                onClick={() => {
                  if (window.location.pathname === '/') {
                    const swiper = (window as any).swiper;
                    if (swiper) swiper.slideTo(1);
                  } else {
                    window.location.href = '/';
                  }
                  closeMenu();
                }}
                className="block w-full text-left px-6 py-3 text-orange-600 hover:bg-orange-50 transition-colors font-medium text-lg"
              >
                ふとるめしのこだわり
              </button>
              
              <button
                onClick={() => {
                  if (window.location.pathname === '/') {
                    const swiper = (window as any).swiper;
                    if (swiper) swiper.slideTo(2);
                  } else {
                    window.location.href = '/';
                  }
                  closeMenu();
                }}
                className="block w-full text-left px-6 py-3 text-orange-600 hover:bg-orange-50 transition-colors font-medium text-lg"
              >
                どんな人に必要？
              </button>
              
              <button
                onClick={() => {
                  if (window.location.pathname === '/') {
                    const swiper = (window as any).swiper;
                    if (swiper) swiper.slideTo(4);
                  } else {
                    window.location.href = '/';
                  }
                  closeMenu();
                }}
                className="block w-full text-left px-6 py-3 text-orange-600 hover:bg-orange-50 transition-colors font-medium text-lg"
              >
                メニュー一覧
              </button>
              
              <button
                onClick={() => {
                  if (window.location.pathname === '/') {
                    const swiper = (window as any).swiper;
                    if (swiper) swiper.slideTo(6);
                  } else {
                    window.location.href = '/';
                  }
                  closeMenu();
                }}
                className="block w-full text-left px-6 py-3 text-orange-600 hover:bg-orange-50 transition-colors font-medium text-lg"
              >
                お知らせ
              </button>

              <button
                onClick={() => {
                  window.location.href = '/contact';
                  closeMenu();
                }}
                className="block w-full text-left px-6 py-3 text-orange-600 hover:bg-orange-50 transition-colors font-medium text-lg"
              >
                お問い合わせ
              </button>
            </div>

            {/* LINE Button */}
            <div className="px-6 py-4 border-t border-gray-200">
              <a
                href="https://line.me/R/ti/p/@your-line-id"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-[#06C755] text-white py-3 rounded-lg hover:bg-[#05b04b] transition-colors font-medium"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                </svg>
                LINEで友だち追加
              </a>
            </div>
          </nav>
      </div>
    </>
  );
};

export default MobileHeader;
