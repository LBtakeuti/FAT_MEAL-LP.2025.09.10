'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface MenuItem {
  label: string;
  href: string;
}

const HamburgerMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems: MenuItem[] = [
    { label: 'TOP', href: '/' },
    { label: 'ふとるめしのこだわり', href: 'slide-1' },
    { label: 'どんな人に必要？', href: 'slide-2' },
    { label: 'メニュー一覧', href: '/menu-list' },
    { label: 'お知らせ', href: 'slide-6' },
  ];

  const footerMenuItems: MenuItem[] = [
    { label: 'カロリー計算', href: '#' },
    { label: '料金プラン', href: 'slide-5' },
    { label: 'お問い合わせ', href: '/contact' },
    { label: 'よくあるご質問', href: '/faq' },
  ];

  const toggleMenu = () => setIsOpen(!isOpen);
  
  const handleMenuClick = (href: string) => {
    setIsOpen(false);
    
    // TOPや他のページ遷移の場合
    if (href === '/' || href.startsWith('/')) {
      // 現在のページが / の場合はトップにスクロール、それ以外はページ遷移
      if (window.location.pathname === '/' && href === '/') {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      } else {
        window.location.href = href;
      }
      return;
    }
    
    // スライドへの遷移の場合
    if (href.startsWith('slide-')) {
      const slideIndex = parseInt(href.split('-')[1]);
      const swiper = (window as any).swiper;
      if (swiper) {
        swiper.slideTo(slideIndex);
      }
      return;
    }
    
    // ページ内アンカーの場合
    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        const offsetTop = element.getBoundingClientRect().top + window.pageYOffset - 56;
        window.scrollTo({
          top: offsetTop,
          behavior: 'smooth'
        });
      }
    }
  };

  // ESCキーで閉じる
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  // スクロールロック
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* ハンバーガーボタン */}
      <button
        onClick={toggleMenu}
        className="fixed top-4 right-4 z-50 h-12 w-12 flex flex-col justify-center items-center sm:hidden outline-none"
        aria-label={isOpen ? 'メニューを閉じる' : 'メニューを開く'}
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        {isOpen ? (
          // Close icon
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18" stroke="#374151" strokeWidth="2" strokeLinecap="round"/>
            <path d="M6 6L18 18" stroke="#374151" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        ) : (
          // ハンバーガーアイコン
          <svg className="w-8 h-8" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6.77383 34.1667C6.05967 34.1667 5.44661 33.9107 4.93466 33.3988C4.42272 32.8868 4.16675 32.2738 4.16675 31.5596V27.8975C4.16675 27.5256 4.29105 27.2153 4.53966 26.9667C4.788 26.7184 5.09814 26.5942 5.47008 26.5942H34.5301C34.902 26.5942 35.2122 26.7184 35.4605 26.9667C35.7091 27.2153 35.8334 27.5256 35.8334 27.8975V31.5596C35.8334 32.2738 35.5774 32.8868 35.0655 33.3988C34.5536 33.9107 33.9405 34.1667 33.2263 34.1667H6.77383ZM6.26091 28.688V31.5596C6.26091 31.7093 6.30897 31.8323 6.40508 31.9284C6.50119 32.0245 6.62411 32.0725 6.77383 32.0725H33.2263C33.3761 32.0725 33.499 32.0245 33.5951 31.9284C33.6912 31.8323 33.7392 31.7093 33.7392 31.5596V28.688H6.26091ZM20.0001 21.6388C18.9467 21.6388 18.1502 21.9298 17.6105 22.5117C17.0711 23.0937 16.1026 23.3846 14.7051 23.3846C13.3079 23.3846 12.3555 23.0937 11.848 22.5117C11.3405 21.9298 10.5617 21.6388 9.51175 21.6388C8.61591 21.6388 7.91744 21.8674 7.41633 22.3246C6.91522 22.7821 6.19453 23.1023 5.25425 23.285C4.96953 23.34 4.71703 23.2721 4.49675 23.0813C4.27675 22.8905 4.16675 22.6428 4.16675 22.3384C4.16675 22.0442 4.27133 21.7875 4.4805 21.5684C4.68939 21.3489 4.93633 21.1809 5.22133 21.0642C5.84244 20.857 6.43397 20.552 6.99591 20.1492C7.55814 19.7464 8.39494 19.545 9.50633 19.545C10.9038 19.545 11.8563 19.836 12.3638 20.418C12.8713 20.9996 13.6517 21.2905 14.7051 21.2905C15.7587 21.2905 16.5552 20.9996 17.0947 20.418C17.6341 19.836 18.6026 19.545 20.0001 19.545C21.3976 19.545 22.3661 19.836 22.9055 20.418C23.4449 20.9996 24.2415 21.2905 25.2951 21.2905C26.3484 21.2905 27.1234 20.9996 27.6201 20.418C28.117 19.836 29.0642 19.545 30.4618 19.545C31.5543 19.545 32.3898 19.7449 32.9684 20.1446C33.5473 20.5446 34.1508 20.8518 34.7788 21.0663C35.0638 21.176 35.3108 21.3439 35.5197 21.57C35.7288 21.7962 35.8334 22.0562 35.8334 22.35C35.8334 22.6437 35.7248 22.8867 35.5076 23.0792C35.2904 23.2714 35.0392 23.34 34.7542 23.285C33.8234 23.1023 33.113 22.7821 32.623 22.3246C32.133 21.8674 31.4399 21.6388 30.5438 21.6388C29.4941 21.6388 28.7062 21.9298 28.1801 22.5117C27.654 23.0937 26.6923 23.3846 25.2951 23.3846C23.8976 23.3846 22.9291 23.0937 22.3897 22.5117C21.8499 21.9298 21.0534 21.6388 20.0001 21.6388ZM20.0022 5.83337C21.9452 5.83337 23.8611 6.00199 25.7497 6.33921C27.6383 6.67643 29.3291 7.21129 30.8222 7.94379C32.3155 8.67657 33.524 9.63199 34.4476 10.81C35.3715 11.9881 35.8334 13.4246 35.8334 15.1196C35.8334 15.4702 35.7091 15.7698 35.4605 16.0184C35.2122 16.2667 34.9127 16.3909 34.5622 16.3909H5.438C5.08744 16.3909 4.788 16.2667 4.53966 16.0184C4.29105 15.7698 4.16675 15.4702 4.16675 15.1196C4.16675 13.4246 4.62869 11.9881 5.55258 10.81C6.47619 9.63199 7.68494 8.67657 9.17883 7.94379C10.6724 7.21129 12.364 6.67643 14.2534 6.33921C16.1429 6.00199 18.0591 5.83337 20.0022 5.83337ZM20.0001 7.92754C15.7834 7.92754 12.4749 8.5131 10.0747 9.68421C7.67439 10.8556 6.428 12.3932 6.3355 14.2971H33.6647C33.5422 12.3932 32.2883 10.8556 29.903 9.68421C27.5177 8.5131 24.2167 7.92754 20.0001 7.92754Z" fill="#374151"/>
          </svg>
        )}
      </button>

      {/* 背景オーバーレイ */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 sm:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ドロワーメニュー */}
      <div
        className={`fixed inset-y-0 right-0 w-[88vw] max-w-[360px] bg-white shadow-xl z-40 transform transition-transform duration-300 sm:hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-label="サイトナビゲーション"
        aria-modal="true"
      >
        <div className="h-full overflow-y-auto p-6 relative">
          {/* Close button in drawer */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            aria-label="メニューを閉じる"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          
          <nav className="pt-12">
            {/* Main menu items */}
            <div className="space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => handleMenuClick(item.href)}
                  className="block w-full text-left py-3 px-4 text-lg text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>
            
            {/* Divider */}
            <div className="my-6 border-t border-gray-200"></div>
            
            {/* Footer menu items */}
            <div className="space-y-2">
              {footerMenuItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => handleMenuClick(item.href)}
                  className="block w-full text-left py-2 px-4 text-base text-gray-600 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </nav>
        </div>
      </div>
    </>
  );
};

export default HamburgerMenu;