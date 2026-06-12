'use client';

import React from 'react';
import HeroSection from '@/components/sections/HeroSection';
import HeroStatsSection from '@/components/sections/HeroStatsSection';
import MenuIntroSection from '@/components/sections/MenuIntroSection';
import ComparisonSection from '@/components/sections/ComparisonSection';
import MediaLogosSection from '@/components/sections/MediaLogosSection';
import DailyScenesSection from '@/components/sections/DailyScenesSection';
import BentoTvSection from '@/components/sections/BentoTvSection';
import SportsScienceSection from '@/components/sections/SportsScienceSection';
import PurchaseFlowSection from '@/components/sections/PurchaseFlowSection';
import SubscriptionSection from '@/components/sections/SubscriptionSection';
import MenuSection from '@/components/sections/MenuSection';
import ReviewSection from '@/components/sections/ReviewSection';
import AmbassadorSection from '@/components/sections/AmbassadorSection';
import FeedbackSection from '@/components/sections/FeedbackSection';
import NewsSection from '@/components/sections/NewsSection';
import BlogSection from '@/components/sections/BlogSection';
import FaqSection from '@/components/sections/FaqSection';
import { ShareContentSection } from '@/components/sections/ShareContentSection';
import LineFloatingButton from '@/components/ui/LineFloatingButton';
import PurchaseCircleButton from '@/components/ui/PurchaseCircleButton';
import type { MenuItem } from '@/types';
import type { SharePhotoLike } from '@/lib/share-download';
import type { FaqServerItem, ArticleListServerItem, NewsServerItem } from '@/lib/supabase';

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
  /** SEO-S1: サーバー取得した FAQ（SSRで初期表示するため） */
  initialFaqs?: FaqServerItem[];
  /** SEO-S2: サーバー取得した最新コラム/お知らせ（SSRで初期表示するため） */
  initialArticles?: ArticleListServerItem[];
  initialNews?: NewsServerItem[];
}

export default function HomeContent({
  menuItems,
  shareData = null,
  initialFaqs = [],
  initialArticles = [],
  initialNews = [],
}: HomeContentProps) {
  const isShare = !!shareData;

  return (
    <>
      <main className="normal-scroll">
        <HeroSection />
        <HeroStatsSection hideCta />
        {isShare && shareData ? (
          <ShareContentSection link={shareData.link} photos={shareData.photos} />
        ) : (
          <MenuIntroSection />
        )}
        {/* F8: TV取材風の弁当画像。share モードでは出さない（メディアロゴの直前） */}
        {!isShare && <BentoTvSection />}
        <MediaLogosSection />
        {/* F60: 朝昼夜の食卓3カード（メディアロゴ直後） */}
        <DailyScenesSection />
        <ComparisonSection />
        <SportsScienceSection />
        <MenuSection initialMenuItems={menuItems} />
        <ReviewSection />
        <SubscriptionSection />
        <AmbassadorSection />
        <FeedbackSection />
        <PurchaseFlowSection />
        <NewsSection initialNews={initialNews} />
        {/* F14-1: 最新コラム（両モード表示） */}
        <BlogSection initialArticles={initialArticles} />
        <FaqSection initialFaqs={initialFaqs} />
      </main>
      <LineFloatingButton />
      <PurchaseCircleButton />
    </>
  );
}
