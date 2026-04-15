'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface PurchaseSheetShellProps {
  title?: string;
  children: React.ReactNode;
}

export function PurchaseSheetShell({ title = 'プランを選ぶ', children }: PurchaseSheetShellProps) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  const close = useCallback(() => {
    setVisible(false);
    setTimeout(() => router.back(), 250);
  }, [router]);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));

    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      const top = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      if (top) window.scrollTo(0, parseInt(top.replace('-', '').replace('px', ''), 10));
    };
  }, [close]);

  return (
    <div className="fixed inset-0 z-[10002]">
      {/* Overlay */}
      <div
        onClick={close}
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${visible ? 'opacity-50' : 'opacity-0'}`}
      />

      {/* Sheet container - mobile bottom, desktop centered */}
      <div
        className={`absolute left-1/2 -translate-x-1/2 w-full max-w-2xl
          bottom-0 md:bottom-auto md:top-1/2 md:-translate-y-1/2
          transition-transform duration-300 ease-out
          ${visible ? 'translate-y-0 md:-translate-y-1/2' : 'translate-y-full md:translate-y-full'}`}
      >
        <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
            <button
              type="button"
              onClick={close}
              aria-label="閉じる"
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <h2 className="text-sm font-semibold text-[#E8593C]">{title}</h2>
            <div className="w-9" />
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 overscroll-contain">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
