'use client';

import React, { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Mousewheel } from 'swiper/modules';
import 'swiper/css';

import Header from '@/components/Header';
import MobileHeader from '@/components/MobileHeader';
import HeroSection from '@/components/HeroSection';
import FeaturesSection from '@/components/FeaturesSection';
import { FeatureSlide1, FeatureSlide2, FeatureSlide3 } from '@/components/FeatureSlides';
import TargetUserSection from '@/components/TargetUserSection';
import { TargetUserSlide1, TargetUserSlide2 } from '@/components/TargetUserSlides';
import MenuSection from '@/components/MenuSection';
import CTASection from '@/components/CTASection';
import Footer from '@/components/Footer';

export default function Home() {
  const [isSwipeMode, setIsSwipeMode] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      // モバイル（640px以下）で縦スワイプモード、タブレット/PC（641px以上）で通常スクロール
      const shouldSwipe = window.innerWidth <= 640;
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
        <main className="swipe-container">
          <Swiper
          direction="vertical"
          mousewheel={true}
          speed={600}
          modules={[Mousewheel]}
          className="mySwiper"
        >
          <SwiperSlide>
            <HeroSection />
          </SwiperSlide>
          <SwiperSlide>
            <FeatureSlide1 />
          </SwiperSlide>
          <SwiperSlide>
            <FeatureSlide2 />
          </SwiperSlide>
          <SwiperSlide>
            <FeatureSlide3 />
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
            <div className="min-h-screen">
              <Footer />
            </div>
          </SwiperSlide>
          </Swiper>
        </main>
      ) : (
        <main className="normal-scroll">
        <HeroSection />
        <FeaturesSection />
        <TargetUserSection />
        <MenuSection />
        <CTASection />
          <Footer />
        </main>
      )}
    </>
  );
}
