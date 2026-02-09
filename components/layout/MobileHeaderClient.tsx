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
            {/* マイページボタン */}
            <Link
              href="/mypage"
              className={`flex items-center justify-center w-9 h-9 rounded-full ${
                isLoggedIn === null
                  ? 'text-[#374151] border border-[#374151]'
                  : isLoggedIn
                    ? 'bg-[#FF6B35] text-white hover:bg-[#E55220] transition-all duration-300'
                    : 'text-[#374151] border border-[#374151] hover:text-[#FF6B35] hover:border-[#FF6B35] transition-all duration-300'
              }`}
              aria-label="マイページ"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
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
          className="fixed inset-0 bg-black bg-opacity-0 sm:hidden z-[9999]"
          onClick={closeMenu}
          onTouchStart={closeMenu}
          aria-hidden="true"
        />
      )}

      {/* Dropdown Menu */}
      <div
        className={`fixed top-20 left-0 right-0 overflow-hidden transition-all duration-300 ease-in-out bg-white sm:hidden z-[10000] ${
          isMenuOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <nav className="border-t border-gray-200 shadow-lg">
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

          {/* LINE Button */}
          <div className="px-6 py-4 border-t border-gray-200">
            <a
              href="https://lin.ee/AqKWBrV"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-[#06C755] text-white py-4 rounded-lg hover:bg-[#05b04b] transition-colors font-medium"
              style={{
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
              </svg>
              LINEで友だち追加
            </a>
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
