'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface MobileFooterNavProps {
  isVisible?: boolean;
}

const MobileFooterNav: React.FC<MobileFooterNavProps> = ({ isVisible = false }) => {
  const router = useRouter();
  
  useEffect(() => {
    console.log('MobileFooterNav isVisible:', isVisible);
  }, [isVisible]);

  const handleBookNowClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    // Navigate to purchase page
    router.push('/purchase');
  };

  const handleCallClick = () => {
    window.location.href = 'tel:0120-XXX-XXX';
  };

  const handleChatClick = () => {
    // Navigate to contact form page
    router.push('/contact');
  };

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 bg-orange-600 sm:hidden transition-all duration-500 ease-in-out transform ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
      }`}
      style={{ zIndex: 9999 }}>
      <div className="grid grid-cols-2 h-14">
        {/* Purchase Button */}
        <button
          type="button"
          onClick={handleBookNowClick}
          className="flex flex-col items-center justify-center text-white hover:bg-orange-700 active:bg-orange-800 transition-colors"
          style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
        >
          <svg
            className="w-5 h-5 mb-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
          </svg>
          <span className="text-xs font-medium">購入</span>
        </button>

        {/* Contact Button */}
        <button
          type="button"
          onClick={handleChatClick}
          className="flex flex-col items-center justify-center text-white hover:bg-orange-700 active:bg-orange-800 transition-colors border-l border-orange-500"
          style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
        >
          <svg
            className="w-5 h-5 mb-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
          </svg>
          <span className="text-xs font-medium">お問い合わせ</span>
        </button>
      </div>
    </div>
  );
};

export default MobileFooterNav;