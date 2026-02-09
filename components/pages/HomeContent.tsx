'use client';

import React from 'react';
import MobileFooterNav from '@/components/layout/MobileFooterNav';
import HeroSection from '@/components/sections/HeroSection';
import ProblemsSection from '@/components/sections/ProblemsSection';
import AboutSection from '@/components/sections/AboutSection';
import StatsSection from '@/components/sections/StatsSection';
import PurchaseFlowSection from '@/components/sections/PurchaseFlowSection';
import TrialSection from '@/components/sections/TrialSection';
import SubscriptionSection from '@/components/sections/SubscriptionSection';
import MenuSection from '@/components/sections/MenuSection';
import NewsSection from '@/components/sections/NewsSection';
import LineFloatingButton from '@/components/ui/LineFloatingButton';
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
