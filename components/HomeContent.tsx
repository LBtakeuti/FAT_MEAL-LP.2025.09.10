'use client';

import React from 'react';
import MobileFooterNav from '@/components/MobileFooterNav';
import HeroSection from '@/components/HeroSection';
import ProblemsSection from '@/components/ProblemsSection';
import AboutSection from '@/components/AboutSection';
import StatsSection from '@/components/StatsSection';
import PurchaseFlowSection from '@/components/PurchaseFlowSection';
import TrialSection from '@/components/TrialSection';
import SubscriptionSection from '@/components/SubscriptionSection';
import MenuSection from '@/components/MenuSection';
import NewsSection from '@/components/NewsSection';
import LineFloatingButton from '@/components/LineFloatingButton';
import type { MenuItem } from '@/types';

interface HomeContentProps {
  menuItems: MenuItem[];
}

export default function HomeContent({ menuItems }: HomeContentProps) {
  return (
    <>
      <main className="normal-scroll">
        <HeroSection />
        <ProblemsSection />
        <AboutSection />
        <MenuSection initialMenuItems={menuItems} />
        <SubscriptionSection />
        <TrialSection />
        <StatsSection />
        <PurchaseFlowSection />
        <NewsSection />
        {/* モバイルではフッターナビゲーションを表示 */}
        <div className="sm:hidden">
          <MobileFooterNav isVisible={true} />
        </div>
      </main>
      {/* LINE公式アカウント追従ボタン */}
      <LineFloatingButton />
    </>
  );
}
