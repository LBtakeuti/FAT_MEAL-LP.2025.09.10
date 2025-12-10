'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

const HeroSection: React.FC = () => {
  // PC用画像
  const pcImages = [
    '/hero-slide-1.jpeg',
    '/hero-slide-2.jpeg',
    '/hero-slide-3.jpeg',
  ];

  // SP用画像
  const spImages = [
    '/hero-slide-4.jpeg',
    '/hero-slide-5.jpeg',
    '/hero-slide-6.jpeg',
  ];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % pcImages.length);
    }, 4000); // 4秒ごとに切り替え

    return () => clearInterval(interval);
  }, [pcImages.length]);

  return (
    <section id="hero" className="relative overflow-hidden">
      {/* PC用お弁当画像 - 16:9 */}
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
        
        {/* 固定テキスト画像（PC用） - 左下に配置 */}
        <div className="absolute bottom-0 left-0 z-20 p-4 sm:p-6 lg:p-8">
          <Image
            src="/hero-title-text.png"
            alt=""
            width={500}
            height={250}
            className="w-[500px] h-auto"
            style={{ objectFit: 'contain' }}
          />
        </div>
      </div>

      {/* SP用お弁当画像 - 3:4（縦長）でフル表示 */}
      <div className="sm:hidden relative w-full" style={{ aspectRatio: '3/4' }}>
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
        
        {/* 固定テキスト画像（SP用） - 左下に配置 */}
        <div className="absolute bottom-0 left-0 z-20 p-3">
          <Image
            src="/hero-title-text.png"
            alt=""
            width={220}
            height={110}
            className="w-[220px] h-auto"
            style={{ objectFit: 'contain' }}
          />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
