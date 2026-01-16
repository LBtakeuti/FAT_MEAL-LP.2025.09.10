'use client';

import { usePathname } from 'next/navigation';
import { Suspense } from 'react';
import Header from '@/components/Header';
import MobileHeader from '@/components/MobileHeader';
import Footer from '@/components/Footer';

function PageLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-500">読み込み中...</p>
      </div>
    </div>
  );
}

export default function LayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');

  // 管理画面の場合はヘッダー/フッターなし
  if (isAdminPage) {
    return <>{children}</>;
  }

  // 通常ページはヘッダー/フッターあり
  return (
    <div className="min-h-screen flex flex-col">
      {/* ヘッダー */}
      <div className="sm:hidden">
        <MobileHeader />
      </div>
      <div className="hidden sm:block">
        <Header />
      </div>

      {/* メインコンテンツ */}
      <main className="flex-grow">
        <Suspense fallback={<PageLoadingFallback />}>
          {children}
        </Suspense>
      </main>

      {/* フッター */}
      <Footer />
    </div>
  );
}
