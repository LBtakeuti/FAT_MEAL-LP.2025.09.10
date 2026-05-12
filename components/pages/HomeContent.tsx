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
import ReviewSection from '@/components/sections/ReviewSection';
import AmbassadorSection from '@/components/sections/AmbassadorSection';
import FeedbackSection from '@/components/sections/FeedbackSection';
import NewsSection from '@/components/sections/NewsSection';
import PromoterContentSection from '@/components/sections/PromoterContentSection';
import LineFloatingButton from '@/components/ui/LineFloatingButton';
import PurchaseCircleButton from '@/components/ui/PurchaseCircleButton';
import PromoterFloatingCta from '@/components/promoter/PromoterFloatingCta';
import type { MenuItem } from '@/types';
import type { PromoterPage } from '@/lib/types/promoter';

interface HomeContentProps {
  menuItems: MenuItem[];
  promoterPage?: PromoterPage | null;
}

export default function HomeContent({ menuItems, promoterPage = null }: HomeContentProps) {
  const isPromoter = !!promoterPage;

  return (
    <>
      <main className={`normal-scroll ${isPromoter ? 'pb-24' : ''}`}>
        <HeroSection />
        <HeroStatsSection hideCta={isPromoter} />
        {isPromoter ? (
          <PromoterContentSection blocks={promoterPage!.blocks} title={promoterPage!.title} />
        ) : (
          <MenuIntroSection />
        )}
        <ComparisonSection />
        <MediaLogosSection />
        {/* <ProblemsSection /> 一時非表示 */}
        {/* <AboutSection /> 一時非表示 */}
        <SportsScienceSection />
        <MenuSection initialMenuItems={menuItems} />
        <ReviewSection />
        {/* <TrialSection /> SubscriptionSectionにお試しカード統合済み */}
        <SubscriptionSection />
        <AmbassadorSection />
        <FeedbackSection />
        <PurchaseFlowSection />
        <NewsSection />
      </main>
      {isPromoter ? (
        <PromoterFloatingCta />
      ) : (
        <>
          <LineFloatingButton />
          <PurchaseCircleButton />
        </>
      )}
    </>
  );
}
