'use client';
// Force reload
import React, { useState, useEffect } from 'react';

const MobileHeader: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMenuOpen) {
        closeMenu();
      }
    };

    if (isMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  const handleNavClick = (href: string) => {
    const targetId = href.replace('#', '');
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
    closeMenu();
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md sm:hidden">
        <div className="flex items-center justify-between h-14 px-4">
          <h1 className="text-xl font-bold text-orange-600">
            ふとるめし
          </h1>
          {/* Hamburger Menu Button */}
          <button
            onClick={toggleMenu}
            className="h-10 w-10 flex flex-col justify-center items-center rounded-lg hover:bg-gray-100 transition-colors"
            aria-label={isMenuOpen ? 'メニューを閉じる' : 'メニューを開く'}
          >
            <div className="relative w-6 h-5">
              <span className={`absolute left-0 w-full h-0.5 bg-gray-700 transition-all duration-300 ${
                isMenuOpen ? 'top-2 rotate-45' : 'top-0'
              }`} />
              <span className={`absolute left-0 top-2 w-full h-0.5 bg-gray-700 transition-all duration-300 ${
                isMenuOpen ? 'opacity-0' : 'opacity-100'
              }`} />
              <span className={`absolute left-0 w-full h-0.5 bg-gray-700 transition-all duration-300 ${
                isMenuOpen ? 'top-2 -rotate-45' : 'top-4'
              }`} />
            </div>
          </button>
        </div>
      </header>

      {/* Backdrop */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 sm:hidden"
          onClick={closeMenu}
        />
      )}

      {/* Drawer Menu */}
      <div
        className={`fixed inset-y-0 right-0 w-full bg-white shadow-xl z-50 transform transition-transform duration-300 sm:hidden ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-label="サイトナビゲーション"
        aria-modal="true"
      >
        {/* Close button */}
        <div className="flex justify-end p-4 border-b border-gray-100">
          <button
            onClick={closeMenu}
            className="text-gray-400 hover:text-gray-600 text-sm font-medium tracking-wider"
          >
            CLOSE
          </button>
        </div>

        <div className="h-full overflow-y-auto pb-20">
          {/* Main Navigation */}
          <div className="py-8">
            <nav>
              <button
                onClick={() => handleNavClick('#hero')}
                className="block w-full text-left text-2xl font-medium text-orange-600 hover:bg-orange-50 transition-all py-6 px-8"
              >
                TOP
              </button>
              
              <button
                onClick={() => handleNavClick('#features')}
                className="block w-full text-left text-2xl font-medium text-orange-600 hover:bg-orange-50 transition-all py-6 px-8"
              >
                ふとるめしのこだわり
              </button>
              
              <button
                onClick={() => handleNavClick('#target-users')}
                className="block w-full text-left text-2xl font-medium text-orange-600 hover:bg-orange-50 transition-all py-6 px-8"
              >
                どんな人に必要？
              </button>
              
              <button
                onClick={() => handleNavClick('#menu')}
                className="block w-full text-left text-2xl font-medium text-orange-600 hover:bg-orange-50 transition-all py-6 px-8"
              >
                メニュー一覧
              </button>
              
              <button
                onClick={() => handleNavClick('#news')}
                className="block w-full text-left text-2xl font-medium text-orange-600 hover:bg-orange-50 transition-all py-6 px-8"
              >
                お知らせ
              </button>
            </nav>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 mx-8"></div>

          {/* Secondary Navigation */}
          <div className="py-8">
            <nav>
              <button
                onClick={() => handleNavClick('#calculator')}
                className="block w-full text-left text-lg text-gray-700 hover:bg-gray-50 hover:text-orange-600 transition-all py-5 px-8"
              >
                カロリー計算
              </button>
              <button
                onClick={() => handleNavClick('#pricing')}
                className="block w-full text-left text-lg text-gray-700 hover:bg-gray-50 hover:text-orange-600 transition-all py-5 px-8"
              >
                料金プラン
              </button>
              <button
                onClick={() => handleNavClick('#contact')}
                className="block w-full text-left text-lg text-gray-700 hover:bg-gray-50 hover:text-orange-600 transition-all py-5 px-8"
              >
                お問い合わせ
              </button>
              <a
                href="#"
                className="block w-full text-left text-lg text-gray-700 hover:bg-gray-50 hover:text-orange-600 transition-all py-5 px-8"
              >
                よくあるご質問
              </a>
            </nav>
          </div>

          {/* Social Links */}
          <div className="px-8 py-8 border-t border-gray-200">
            <div className="flex justify-center gap-8">
              <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileHeader;