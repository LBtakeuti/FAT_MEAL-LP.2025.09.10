'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const HeroSection: React.FC = () => {
  // PC用画像
  const pcImages = [
    '/images/hero/hero-slide-1.jpeg',
    '/images/hero/hero-slide-2.jpeg',
    '/images/hero/hero-slide-3.jpeg',
  ];

  // SP用画像
  const spImages = [
    '/images/hero/hero-slide-4.jpeg',
    '/images/hero/hero-slide-5.jpeg',
    '/images/hero/hero-slide-6.jpeg',
  ];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % pcImages.length);
    }, 4000); // 4秒ごとに切り替え

    return () => clearInterval(interval);
  }, [pcImages.length]);

  // CTAボタンのインラインスタイル（ホバー・フォーカス・アクティブで変化させない）
  const ctaStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    color: '#1a1a1a',
    borderRadius: '40px',
    fontFamily: '"Noto Sans JP", sans-serif',
    fontWeight: 500,
    letterSpacing: '0.04em',
    display: 'inline-block',
    textAlign: 'center',
    textDecoration: 'none',
    border: 'none',
  };

  // 3カラム統計バー（テキスト白統一・サイズ拡大）
  const StatsBar: React.FC<{ isMobile?: boolean }> = ({ isMobile = false }) => (
    <div
      className={`grid grid-cols-3 ${isMobile ? 'gap-2 px-4 py-3' : 'gap-4 px-6 py-4'}`}
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        border: '0.5px solid rgba(255, 255, 255, 0.25)',
        borderRadius: isMobile ? '12px' : '14px',
      }}
    >
      {/* 左カラム */}
      <div className="text-center flex flex-col justify-center" style={{ color: '#ffffff' }}>
        <p
          className={`${isMobile ? 'text-[10px]' : 'text-sm'} leading-tight mb-1`}
          style={{ color: '#ffffff' }}
        >
          全メニュー<br />管理栄養士監修
        </p>
        <p
          className={`${isMobile ? 'text-sm' : 'text-[22px]'} font-bold leading-tight`}
          style={{ color: '#ffffff' }}
        >
          国内生産<br />高カロリー設計
        </p>
      </div>

      {/* 中央カラム */}
      <div
        className="text-center flex flex-col justify-center"
        style={{
          color: '#ffffff',
          borderLeft: '0.5px solid rgba(255, 255, 255, 0.35)',
          borderRight: '0.5px solid rgba(255, 255, 255, 0.35)',
        }}
      >
        <p
          className={`${isMobile ? 'text-[10px]' : 'text-sm'} leading-tight mb-1`}
          style={{ color: '#ffffff' }}
        >
          1食平均<br />タンパク質
        </p>
        <p style={{ color: '#ffffff' }} className="font-bold leading-none">
          <span className={isMobile ? 'text-[30px]' : 'text-[48px]'}>30</span>
          <span className={isMobile ? 'text-sm' : 'text-lg'}>g以上</span>
        </p>
        <p
          className={`${isMobile ? 'text-[10px]' : 'text-sm'} leading-tight mt-1`}
          style={{ color: '#ffffff' }}
        >
          筋肉づくりに最適
        </p>
      </div>

      {/* 右カラム */}
      <div className="text-center flex flex-col justify-center" style={{ color: '#ffffff' }}>
        <p
          className={`${isMobile ? 'text-[10px]' : 'text-sm'} leading-tight mb-1`}
          style={{ color: '#ffffff' }}
        >
          1食平均<br />カロリー
        </p>
        <p style={{ color: '#ffffff' }} className="font-bold leading-none">
          <span className={isMobile ? 'text-[30px]' : 'text-[48px]'}>450</span>
          <span className={isMobile ? 'text-sm' : 'text-lg'}>kcal</span>
        </p>
        <p
          className={`${isMobile ? 'text-[10px]' : 'text-sm'} leading-tight mt-1`}
          style={{ color: '#ffffff' }}
        >
          以上
        </p>
      </div>
    </div>
  );

  // キャッチコピー（サブコピー / メインコピー / ブランドライン・全て白で統一）
  const Catchphrase: React.FC<{ isMobile?: boolean }> = ({ isMobile = false }) => (
    <div className={`text-center flex flex-col items-center ${isMobile ? 'mb-6' : 'mb-10'}`}>
      {/* サブコピー */}
      <p
        style={{
          color: '#ffffff',
          fontFamily: '"Noto Sans JP", sans-serif',
          fontWeight: 500,
          fontSize: isMobile ? '18px' : '22px',
          marginBottom: isMobile ? '12px' : '16px',
        }}
      >
        練習より食事がきつい、という君へ。
      </p>
      {/* メインコピー */}
      <h1
        style={{
          color: '#ffffff',
          fontFamily: '"Noto Sans JP", sans-serif',
          fontWeight: 700,
          fontSize: isMobile ? '40px' : '55px',
          lineHeight: 1.1,
          margin: 0,
        }}
      >
        ふとるめし
      </h1>
      {/* ブランドライン（細い横線付き） */}
      <p
        style={{
          color: '#ffffff',
          fontFamily: '"Noto Sans JP", sans-serif',
          fontWeight: 500,
          fontSize: isMobile ? '12px' : '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.6)',
          paddingTop: isMobile ? '10px' : '14px',
          marginTop: isMobile ? '12px' : '16px',
          display: 'inline-block',
        }}
      >
        太るための冷凍弁当
      </p>
    </div>
  );

  return (
    <section id="hero" className="relative overflow-hidden">
      {/* PC用 - 16:9 */}
      <div className="hidden sm:block relative w-full" style={{ aspectRatio: '16/9' }}>
        {pcImages.map((src, index) => (
          <div
            key={src}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentImageIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <Image
              src={src}
              alt="和食料理"
              fill
              className="object-cover object-center"
              priority={index === 0}
            />
          </div>
        ))}

        {/* 黒オーバーレイ（テキスト視認性向上・常時表示） */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)', zIndex: 15 }}
        />

        {/* PC用 コンテンツレイヤー（NASH風: 中央寄せ） */}
        <div className="absolute inset-0 z-20 flex flex-col items-center px-8 lg:px-12 py-10 lg:py-14">
          {/* 上部余白で中央寄りに配置 */}
          <div className="flex-1 flex flex-col items-center justify-center w-full">
            <Catchphrase />
            <Link
              href="/purchase?type=subscription"
              style={{
                ...ctaStyle,
                padding: '18px 72px',
                fontSize: '18px',
              }}
              className="hover:!bg-white hover:!text-[#1a1a1a] focus:!bg-white focus:!text-[#1a1a1a] active:!bg-white active:!text-[#1a1a1a]"
            >
              今すぐお得に始める
            </Link>
          </div>
          {/* 3カラム統計バー（下部・中央配置） */}
          <div className="w-full max-w-4xl">
            <StatsBar />
          </div>
        </div>
      </div>

      {/* SP用 - 4:5 */}
      <div className="sm:hidden relative w-full" style={{ aspectRatio: '4/5' }}>
        {spImages.map((src, index) => (
          <div
            key={src}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentImageIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <Image
              src={src}
              alt="和食料理"
              fill
              className="object-cover object-center"
              priority={index === 0}
            />
          </div>
        ))}

        {/* 黒オーバーレイ（テキスト視認性向上・常時表示） */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)', zIndex: 15 }}
        />

        {/* SP用 コンテンツレイヤー（NASH風: 中央寄せ） */}
        <div className="absolute inset-0 z-20 flex flex-col items-center px-4 py-6">
          {/* 上部余白で中央寄りに配置 */}
          <div className="flex-1 flex flex-col items-center justify-center w-full">
            <Catchphrase isMobile />
            <Link
              href="/purchase?type=subscription"
              style={{
                ...ctaStyle,
                width: '100%',
                maxWidth: '340px',
                padding: '16px 0',
                fontSize: '15px',
              }}
              className="hover:!bg-white hover:!text-[#1a1a1a] focus:!bg-white focus:!text-[#1a1a1a] active:!bg-white active:!text-[#1a1a1a]"
            >
              今すぐお得に始める
            </Link>
          </div>
          {/* 3カラム統計バー（下部・中央配置） */}
          <div className="w-full">
            <StatsBar isMobile />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
