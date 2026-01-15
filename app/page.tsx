'use client';

import React, { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Swiper as SwiperType } from 'swiper';
import { Mousewheel } from 'swiper/modules';
import 'swiper/css';

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
import Footer from '@/components/Footer';
import LineFloatingButton from '@/components/LineFloatingButton';

export default function Home() {
  const [isSwipeMode, setIsSwipeMode] = useState(false);
  const [showFooterNav, setShowFooterNav] = useState(false);

  useEffect(() => {
    // スワイプモードを無効化し、常に通常スクロールモードを使用
    setIsSwipeMode(false);
  }, []);
  return (
    <>
      {isSwipeMode ? (
        <>
          <main className="swipe-container">
            <Swiper
            direction="vertical"
            mousewheel={true}
            speed={600}
            modules={[Mousewheel]}
            className="mySwiper"
            onInit={(swiper: SwiperType) => {
              // Store swiper instance globally for footer nav
              (window as any).swiper = swiper;
            }}
            onSlideChange={(swiper: SwiperType) => {
              // Show footer nav after hero section (slide index 0)
              console.log('Slide changed to:', swiper.activeIndex);
              setShowFooterNav(swiper.activeIndex > 0);
            }}
          >
            <SwiperSlide>
              <HeroSection />
            </SwiperSlide>
            <SwiperSlide>
              <ProblemsSection />
            </SwiperSlide>
            <SwiperSlide>
              <AboutSection />
            </SwiperSlide>
            <SwiperSlide>
              <MenuSection />
            </SwiperSlide>
            <SwiperSlide>
              <SubscriptionSection />
            </SwiperSlide>
            <SwiperSlide>
              <TrialSection />
            </SwiperSlide>
            <SwiperSlide>
              <StatsSection />
            </SwiperSlide>
            <SwiperSlide>
              <PurchaseFlowSection />
            </SwiperSlide>
            <SwiperSlide>
              <NewsSection />
            </SwiperSlide>
            <SwiperSlide>
              <div className="min-h-screen bg-gray-900 pb-20 flex flex-col">
                <Footer />
              </div>
            </SwiperSlide>
            </Swiper>
          </main>
          <MobileFooterNav isVisible={showFooterNav} />
          <LineFloatingButton />
        </>
      ) : (
        <main className="normal-scroll">
          <HeroSection />
          <ProblemsSection />
          <AboutSection />
          <MenuSection />
          <SubscriptionSection />
          <TrialSection />
          <StatsSection />
          <PurchaseFlowSection />
          <NewsSection />
          <Footer />
          {/* モバイルではフッターナビゲーションを表示 */}
          <div className="sm:hidden">
            <MobileFooterNav isVisible={true} />
          </div>
        </main>
      )}
      {/* LINE公式アカウント追従ボタン */}
      <LineFloatingButton />
    </>
  );
}
