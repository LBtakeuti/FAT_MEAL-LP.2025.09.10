'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase';
import LogoutModal from '@/components/ui/LogoutModal';
import MobileHeaderLogo from './MobileHeaderLogo';

const MobileHeaderClient: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const initialCheckDone = useRef(false);

  useEffect(() => {
    const supabase = createBrowserClient();

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
      initialCheckDone.current = true;
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (initialCheckDone.current) {
        setIsLoggedIn(!!session);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    closeMenu();
    window.location.href = '/';
  };

  const openLogoutModal = () => {
    closeMenu();
    setShowLogoutModal(true);
  };

  return (
    <>
      {/* Header - 常に表示 */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow-md sm:hidden z-[10001]">
        <div className="flex items-center justify-between h-20 px-4">
          {/* ロゴ - サーバーコンポーネント */}
          <div onClick={() => isMenuOpen && closeMenu()}>
            <MobileHeaderLogo />
          </div>

          <div className="flex items-center gap-3">
            {/* 購入ボタン */}
            <Link
              href="/purchase"
              className="flex items-center justify-center px-4 h-9 rounded-full bg-[#FF6B35] text-white font-bold text-sm hover:bg-[#E55220] transition-all duration-300 whitespace-nowrap"
              aria-label="購入"
            >
              購入
            </Link>

            {/* Hamburger Menu Button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleMenu();
              }}
              className="h-12 w-12 flex flex-col justify-center items-center bg-transparent border-none cursor-pointer"
              style={{
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation'
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
        </div>
      </header>

      {/* 背景オーバーレイ */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 sm:hidden z-[9999]"
          onClick={closeMenu}
          onTouchStart={closeMenu}
          aria-hidden="true"
        />
      )}

      {/* Dropdown Menu */}
      <div
        className={`fixed top-20 left-0 right-0 overflow-hidden transition-all duration-300 ease-in-out bg-white sm:hidden z-[10000] shadow-[0_8px_30px_rgba(0,0,0,0.12)] ${
          isMenuOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0 shadow-none'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <nav className="border-t border-gray-200">
          <div className="py-2">
            <Link
              href="/menu-list"
              onClick={closeMenu}
              className="block w-full text-left px-6 py-4 text-orange-600 hover:bg-orange-50 active:bg-orange-100 transition-colors font-medium text-lg"
              style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
            >
              メニュー一覧
            </Link>

            <Link
              href="/news"
              onClick={closeMenu}
              className="block w-full text-left px-6 py-4 text-orange-600 hover:bg-orange-50 active:bg-orange-100 transition-colors font-medium text-lg"
              style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
            >
              お知らせ
            </Link>

            <Link
              href="/contact"
              onClick={closeMenu}
              className="block w-full text-left px-6 py-4 text-orange-600 hover:bg-orange-50 active:bg-orange-100 transition-colors font-medium text-lg"
              style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
            >
              お問い合わせ
            </Link>

            <Link
              href="/mypage"
              onClick={closeMenu}
              className="block w-full text-left px-6 py-4 text-orange-600 hover:bg-orange-50 active:bg-orange-100 transition-colors font-medium text-lg"
              style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
            >
              マイページ
            </Link>
          </div>

          {/* ログアウトボタン */}
          {isLoggedIn && (
            <div className="px-6 py-4 border-t border-gray-200">
              <button
                type="button"
                onClick={openLogoutModal}
                className="flex items-center justify-center gap-2 w-full text-gray-500 py-3 rounded-lg border border-gray-300 hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition-colors font-medium"
                style={{
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation'
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                ログアウト
              </button>
            </div>
          )}
        </nav>
      </div>

      {/* ログアウトモーダル */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        loading={logoutLoading}
      />
    </>
  );
};

export default MobileHeaderClient;
