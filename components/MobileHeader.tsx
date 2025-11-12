'use client';
// Force reload
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

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
    // TOPの場合（ホームページへ遷移またはトップへスクロール）
    if (href === '#hero' || href === '/') {
      if (window.location.pathname === '/') {
        // 既にホームページにいる場合はトップへスクロール
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // 他のページからはホームページへ遷移
        window.location.href = '/';
      }
    } else if (href.startsWith('#')) {
      // アンカーリンクの場合
      if (window.location.pathname !== '/') {
        // ホームページ以外からの場合は、ホームページに遷移してからスクロール
        window.location.href = '/' + href;
      } else {
        // 既にホームページにいる場合は、その場所へスクロール
        const targetId = href.replace('#', '');
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
    closeMenu();
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md sm:hidden">
        <div className="flex items-center justify-between h-14 px-4">
          <Link href="/" className="text-xl font-bold text-orange-600">
            ふとるめし
          </Link>
          {/* Hamburger Menu Button */}
          <button
            onClick={toggleMenu}
            className="h-10 w-10 flex flex-col justify-center items-center rounded-lg hover:bg-gray-100 transition-colors"
            aria-label={isMenuOpen ? 'メニューを閉じる' : 'メニューを開く'}
          >
            <div className="relative w-6 h-5">
              <span className={`absolute left-0 w-full h-0.5 bg-gray-500 transition-all duration-300 ${
                isMenuOpen ? 'top-2 rotate-45' : 'top-0'
              }`} />
              <span className={`absolute left-0 top-2 w-full h-0.5 bg-gray-500 transition-all duration-300 ${
                isMenuOpen ? 'opacity-0' : 'opacity-100'
              }`} />
              <span className={`absolute left-0 w-full h-0.5 bg-gray-500 transition-all duration-300 ${
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
        className={`fixed inset-y-0 right-0 w-full bg-white shadow-xl z-[100] transform transition-transform duration-300 sm:hidden ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-label="サイトナビゲーション"
        aria-modal="true"
      >
        {/* Close button */}
        <div className="flex justify-end p-4 border-b border-gray-100 bg-white">
          <button
            onClick={closeMenu}
            className="text-gray-400 hover:text-gray-600 text-sm font-medium tracking-wider"
          >
            CLOSE
          </button>
        </div>

        <div className="h-full overflow-y-auto pb-20 bg-white">
          {/* Main Navigation */}
          <div className="py-8 bg-white">
            <nav className="bg-white">
              <button
                onClick={() => {
                  // Swiperのスライド0（HeroSection）に移動
                  if (window.location.pathname === '/') {
                    const swiper = (window as any).swiper;
                    if (swiper) {
                      swiper.slideTo(0);
                    }
                  } else {
                    window.location.href = '/';
                  }
                  closeMenu();
                }}
                className="block w-full text-left text-2xl font-medium text-orange-600 transition-all py-6 px-8"
              >
                TOP
              </button>
              
              <button
                onClick={() => {
                  // Swiperのスライド1（FeaturesSectionMobile）に移動
                  if (window.location.pathname === '/') {
                    const swiper = (window as any).swiper;
                    if (swiper) {
                      swiper.slideTo(1);
                    }
                  } else {
                    window.location.href = '/';
                  }
                  closeMenu();
                }}
                className="block w-full text-left text-2xl font-medium text-orange-600 transition-all py-6 px-8"
              >
                ふとるめしのこだわり
              </button>
              
              <button
                onClick={() => {
                  // Swiperのスライド2（TargetUserSlide1）に移動
                  if (window.location.pathname === '/') {
                    const swiper = (window as any).swiper;
                    if (swiper) {
                      swiper.slideTo(2);
                    }
                  } else {
                    window.location.href = '/';
                  }
                  closeMenu();
                }}
                className="block w-full text-left text-2xl font-medium text-orange-600 transition-all py-6 px-8"
              >
                どんな人に必要？
              </button>
              
              <button
                onClick={() => {
                  // Swiperのスライド4（MenuSection）に移動
                  if (window.location.pathname === '/') {
                    const swiper = (window as any).swiper;
                    if (swiper) {
                      swiper.slideTo(4);
                    }
                  } else {
                    window.location.href = '/';
                  }
                  closeMenu();
                }}
                className="block w-full text-left text-2xl font-medium text-orange-600 transition-all py-6 px-8"
              >
                メニュー一覧
              </button>
              
              <button
                onClick={() => {
                  // Swiperのスライド6（NewsSection）に移動
                  if (window.location.pathname === '/') {
                    const swiper = (window as any).swiper;
                    if (swiper) {
                      swiper.slideTo(6);
                    }
                  } else {
                    window.location.href = '/';
                  }
                  closeMenu();
                }}
                className="block w-full text-left text-2xl font-medium text-orange-600 transition-all py-6 px-8"
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
                onClick={() => {
                  window.location.href = '/contact';
                  closeMenu();
                }}
                className="block w-full text-left text-lg text-gray-700 hover:bg-gray-50 hover:text-orange-600 transition-all py-5 px-8"
              >
                お問い合わせ
              </button>
              <button
                onClick={() => {
                  window.location.href = '/menu-list';
                  closeMenu();
                }}
                className="block w-full text-left text-lg text-gray-700 hover:bg-gray-50 hover:text-orange-600 transition-all py-5 px-8"
              >
                全メニューを見る
              </button>
              <button
                onClick={() => {
                  window.location.href = '/terms';
                  closeMenu();
                }}
                className="block w-full text-left text-lg text-gray-700 hover:bg-gray-50 hover:text-orange-600 transition-all py-5 px-8"
              >
                利用規約
              </button>
              <button
                onClick={() => {
                  window.location.href = '/privacy';
                  closeMenu();
                }}
                className="block w-full text-left text-lg text-gray-700 hover:bg-gray-50 hover:text-orange-600 transition-all py-5 px-8"
              >
                プライバシーポリシー
              </button>
            </nav>
          </div>

          {/* Social Links - 準備中 */}
          <div className="px-8 py-8 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-400">SNSアカウント準備中</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileHeader;