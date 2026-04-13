'use client';

import React from 'react';
import HeroSection from '@/components/sections/HeroSection';
import HeroStatsSection from '@/components/sections/HeroStatsSection';
import MenuIntroSection from '@/components/sections/MenuIntroSection';
import ComparisonSection from '@/components/sections/ComparisonSection';
import MediaLogosSection from '@/components/sections/MediaLogosSection';
import ProblemsSection from '@/components/sections/ProblemsSection';
import AboutSection from '@/components/sections/AboutSection';
import SportsScienceSection from '@/components/sections/SportsScienceSection';
import PurchaseFlowSection from '@/components/sections/PurchaseFlowSection';
import TrialSection from '@/components/sections/TrialSection';
import SubscriptionSection from '@/components/sections/SubscriptionSection';
import MenuSection from '@/components/sections/MenuSection';
import AmbassadorSection from '@/components/sections/AmbassadorSection';
import FeedbackSection from '@/components/sections/FeedbackSection';
import NewsSection from '@/components/sections/NewsSection';
import LineFloatingButton from '@/components/ui/LineFloatingButton';
import PurchaseCircleButton from '@/components/ui/PurchaseCircleButton';
import type { MenuItem } from '@/types';

interface HomeContentProps {
  menuItems: MenuItem[];
}

export default function HomeContent({ menuItems }: HomeContentProps) {
  return (
    <>
      <main className="normal-scroll">
        <HeroSection />
        <HeroStatsSection />
        <MenuIntroSection />
        <ComparisonSection />
        <MediaLogosSection />
        {/* <ProblemsSection /> 一時非表示 */}
        {/* <AboutSection /> 一時非表示 */}
        <SportsScienceSection />
        <MenuSection initialMenuItems={menuItems} />
        {/* <TrialSection /> SubscriptionSectionにお試しカード統合済み */}
        <SubscriptionSection />
        <AmbassadorSection />
        <FeedbackSection />
        <PurchaseFlowSection />
        <NewsSection />
      </main>
      {/* LINE公式アカウント追従ボタン */}
      <LineFloatingButton />
      {/* 購入円形ボタン（右下） */}
      <PurchaseCircleButton />
    </>
  );
}
