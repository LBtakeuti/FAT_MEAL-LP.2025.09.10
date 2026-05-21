'use client';

import React from 'react';
import HeroSection from '@/components/sections/HeroSection';
import HeroStatsSection from '@/components/sections/HeroStatsSection';
import MenuIntroSection from '@/components/sections/MenuIntroSection';
import ComparisonSection from '@/components/sections/ComparisonSection';
import MediaLogosSection from '@/components/sections/MediaLogosSection';
import SportsScienceSection from '@/components/sections/SportsScienceSection';
import PurchaseFlowSection from '@/components/sections/PurchaseFlowSection';
import SubscriptionSection from '@/components/sections/SubscriptionSection';
import MenuSection from '@/components/sections/MenuSection';
import ReviewSection from '@/components/sections/ReviewSection';
import AmbassadorSection from '@/components/sections/AmbassadorSection';
import FeedbackSection from '@/components/sections/FeedbackSection';
import NewsSection from '@/components/sections/NewsSection';
import FaqSection from '@/components/sections/FaqSection';
import { ShareContentSection } from '@/components/sections/ShareContentSection';
import LineFloatingButton from '@/components/ui/LineFloatingButton';
import PurchaseCircleButton from '@/components/ui/PurchaseCircleButton';
import type { MenuItem } from '@/types';
import type { SharePhotoLike } from '@/lib/share-download';

interface ShareData {
  link: {
    slug: string;
    label: string | null;
    title: string | null;
    body_html: string;
  };
  photos: SharePhotoLike[];
}

interface HomeContentProps {
  menuItems: MenuItem[];
  shareData?: ShareData | null;
}

export default function HomeContent({ menuItems, shareData = null }: HomeContentProps) {
  const isShare = !!shareData;

  return (
    <>
      <main className="normal-scroll">
        <HeroSection />
        <HeroStatsSection />
        {isShare && shareData ? (
          <ShareContentSection link={shareData.link} photos={shareData.photos} />
        ) : (
          <MenuIntroSection />
        )}
        <MediaLogosSection />
        <ComparisonSection />
        <SportsScienceSection />
        <MenuSection initialMenuItems={menuItems} />
        <ReviewSection />
        <SubscriptionSection />
        <AmbassadorSection />
        <FeedbackSection />
        <PurchaseFlowSection />
        <NewsSection />
        <FaqSection />
      </main>
      <LineFloatingButton />
      <PurchaseCircleButton />
    </>
  );
}
