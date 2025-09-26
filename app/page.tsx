'use client';

import React, { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Swiper as SwiperType } from 'swiper';
import { Mousewheel } from 'swiper/modules';
import 'swiper/css';

import Header from '@/components/Header';
import MobileHeader from '@/components/MobileHeader';
import MobileFooterNav from '@/components/MobileFooterNav';
import HeroSection from '@/components/HeroSection';
import FeaturesSection from '@/components/FeaturesSection';
import FeaturesSectionMobile from '@/components/FeaturesSectionMobile';
import { FeatureSlide1, FeatureSlide2, FeatureSlide3 } from '@/components/FeatureSlides';
import TargetUserSection from '@/components/TargetUserSection';
import { TargetUserSlide1, TargetUserSlide2 } from '@/components/TargetUserSlides';
import TargetUserSlideMobile from '@/components/TargetUserSlideMobile';
import MenuSection from '@/components/MenuSection';
import CTASection from '@/components/CTASection';
import NewsSection from '@/components/NewsSection';
import Footer from '@/components/Footer';

export default function Home() {
  const [isSwipeMode, setIsSwipeMode] = useState(false);
  const [showFooterNav, setShowFooterNav] = useState(false);
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);

  useEffect(() => {
    const checkScreenSize = () => {
      // モバイル（640px未満）で縦スワイプモード、タブレット/PC（640px以上）で通常スクロール
      // Tailwindの sm: ブレークポイントと一致させる
      const shouldSwipe = window.innerWidth < 640;
      setIsSwipeMode(shouldSwipe);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  return (
    <>
      {!isSwipeMode && <Header />}
      {isSwipeMode && <MobileHeader />}
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
              setSwiperInstance(swiper);
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
              <FeaturesSectionMobile />
            </SwiperSlide>
            <SwiperSlide>
              <TargetUserSlide1 />
            </SwiperSlide>
            <SwiperSlide>
              <TargetUserSlide2 />
            </SwiperSlide>
            <SwiperSlide>
              <MenuSection />
            </SwiperSlide>
            <SwiperSlide>
              <CTASection />
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
        </>
      ) : (
        <main className="normal-scroll">
          <HeroSection />
          <FeaturesSection />
          <TargetUserSection />
          <MenuSection />
          <CTASection />
          <NewsSection />
          <Footer />
        </main>
      )}
    </>
  );
}
