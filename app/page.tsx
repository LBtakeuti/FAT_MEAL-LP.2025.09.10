'use client';

import React from 'react';

import Header from '@/components/Header';
import MobileHeader from '@/components/MobileHeader';
import MobileFooterNav from '@/components/MobileFooterNav';
import HeroSection from '@/components/HeroSection';
import ProblemsSection from '@/components/ProblemsSection';
import AboutSection from '@/components/AboutSection';
import StatsSection from '@/components/StatsSection';
import TargetUsersSection from '@/components/TargetUsersSection';
import MenuSection from '@/components/MenuSection';
import CTASection from '@/components/CTASection';
import FAQSection from '@/components/FAQSection';
import PurchaseFlowSection from '@/components/PurchaseFlowSection';
import NewsSection from '@/components/NewsSection';
import Footer from '@/components/Footer';
import LineFloatingButton from '@/components/LineFloatingButton';

export default function Home() {
  return (
    <>
      {/* ヘッダー */}
      <div className="sm:hidden">
        <MobileHeader />
      </div>
      <div className="hidden sm:block">
        <Header />
      </div>

      {/* メインコンテンツ */}
      <main className="normal-scroll">
        {/* モバイル用スペーサー（ヘッダー分の余白） */}
        <div className="h-16 sm:hidden"></div>
        
        {/* 1. ヒーローセクション */}
        <HeroSection />

        {/* 2. 共感・課題提起セクション */}
        <ProblemsSection />

        {/* 3. ふとるめしとは（簡潔版） */}
        <AboutSection />

        {/* 4. 数字で見る「ふとるめし」 */}
        <StatsSection />

        {/* 5. どんな人にふとるめしが必要なのか */}
        <TargetUsersSection />

        {/* 6. メニュー紹介 */}
        <MenuSection />

        {/* 7. セット・プラン */}
        <CTASection />

        {/* 8. よくある質問（FAQ） */}
        <FAQSection />

        {/* 9. 購入の流れ */}
        <PurchaseFlowSection />

        {/* 10. お知らせ */}
        <NewsSection />

        {/* フッター */}
        <Footer />

        {/* モバイルフッターナビゲーション */}
        <div className="sm:hidden">
          <MobileFooterNav isVisible={true} />
        </div>
      </main>

      {/* LINE公式アカウント追従ボタン */}
      <LineFloatingButton />
    </>
  );
}
