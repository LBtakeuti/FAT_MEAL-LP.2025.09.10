'use client';

import React from 'react';
import MobileFooterNav from '@/components/layout/MobileFooterNav';
import HeroSection from '@/components/sections/HeroSection';
import MediaLogosSection from '@/components/sections/MediaLogosSection';
import ProblemsSection from '@/components/sections/ProblemsSection';
import AboutSection from '@/components/sections/AboutSection';
import PurchaseFlowSection from '@/components/sections/PurchaseFlowSection';
import TrialSection from '@/components/sections/TrialSection';
import SubscriptionSection from '@/components/sections/SubscriptionSection';
import MenuSection from '@/components/sections/MenuSection';
import AmbassadorSection from '@/components/sections/AmbassadorSection';
import FeedbackSection from '@/components/sections/FeedbackSection';
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
        <MediaLogosSection />
        <ProblemsSection />
        <AboutSection />
        <MenuSection initialMenuItems={menuItems} />
        {/* <TrialSection /> SubscriptionSectionにお試しカード統合済み */}
        <SubscriptionSection />
        <AmbassadorSection />
        <FeedbackSection />
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
