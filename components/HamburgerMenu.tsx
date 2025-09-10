'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface MenuItem {
  label: string;
  href: string;
}

const HamburgerMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems: MenuItem[] = [
    { label: 'トップ', href: '#hero' },
    { label: 'こだわり', href: '#features' },
    { label: '基礎代謝量', href: '#calculator' },
    { label: 'メニュー', href: '#menu' },
    { label: 'なぜ必要？', href: '#why' },
    { label: 'お知らせ', href: '#news' },
    { label: '料金', href: '#pricing' },
    { label: 'お問い合わせ', href: '#contact' },
  ];

  const toggleMenu = () => setIsOpen(!isOpen);
  
  const handleMenuClick = (href: string) => {
    setIsOpen(false);
    const element = document.querySelector(href);
    if (element) {
      const offsetTop = element.getBoundingClientRect().top + window.pageYOffset - 56;
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
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
        className="fixed top-4 right-4 z-50 h-12 w-12 flex flex-col justify-center items-center rounded-lg bg-white shadow-lg sm:hidden"
        aria-label={isOpen ? 'メニューを閉じる' : 'メニューを開く'}
      >
        <div className="relative w-6 h-5">
          <span className={`absolute left-0 w-full h-0.5 bg-gray-700 transition-all duration-300 ${isOpen ? 'top-2 rotate-45' : 'top-0'}`} />
          <span className={`absolute left-0 top-2 w-full h-0.5 bg-gray-700 transition-all duration-300 ${isOpen ? 'opacity-0' : 'opacity-100'}`} />
          <span className={`absolute left-0 w-full h-0.5 bg-gray-700 transition-all duration-300 ${isOpen ? 'top-2 -rotate-45' : 'top-4'}`} />
        </div>
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
        <div className="h-full overflow-y-auto p-6" style={{ paddingTop: 'calc(var(--safe-top) + 80px)' }}>
          <nav className="space-y-4">
            {menuItems.map((item) => (
              <button
                key={item.href}
                onClick={() => handleMenuClick(item.href)}
                className="block w-full text-left py-3 px-4 text-lg text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition-colors"
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
};

export default HamburgerMenu;