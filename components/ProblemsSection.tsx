'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

const ProblemsSection: React.FC = () => {
  const images = [
    '/problems-worry.jpeg',
    '/problems-skinny.jpeg',
  ];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 4000); // 4秒ごとに切り替え

    return () => clearInterval(interval);
  }, [images.length]);

  useEffect(() => {
    // 最初の画像を非表示で読み込んでアスペクト比を取得
    const img = new window.Image();
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) {
        setAspectRatio(img.naturalHeight / img.naturalWidth);
      }
    };
    img.src = images[0];
  }, [images]);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white to-orange-50 pt-4 sm:pt-6 pb-12 sm:pb-20">
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* セクション見出し */}
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-base sm:text-lg md:text-xl lg:text-3xl xl:text-4xl font-bold text-gray-900 leading-relaxed font-antique">
            <span className="whitespace-nowrap block">ふとるめしは</span>
            <span className="whitespace-nowrap block">「量」「味」「タンパク質」に振り切った</span>
            <span className="whitespace-nowrap block">今までにない冷凍弁当サービスです。</span>
          </h2>
        </div>

        {/* ヒーローセクション風の画像スライダー */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="relative w-full max-w-[250px] sm:max-w-[300px] lg:max-w-[400px] overflow-hidden">
            <div 
              className="relative w-full" 
              style={{ paddingBottom: aspectRatio ? `${aspectRatio * 100}%` : '75%' }}
            >
              {images.map((src, index) => (
                <div
                  key={src}
                  className={`absolute inset-0 transition-opacity duration-1000 ${
                    index === currentImageIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                  }`}
                >
                  <Image
                    src={src}
                    alt="スポーツ選手"
                    fill
                    className="object-contain"
                    priority={index === 0}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 追加テキスト */}
        <div className="text-center">
          <p className="text-base sm:text-lg md:text-xl lg:text-3xl xl:text-4xl font-bold text-gray-900 leading-relaxed font-antique">
            <span className="whitespace-nowrap block mb-2">楽しくトレーニング。</span>
            <span className="whitespace-nowrap block mb-4 sm:mb-6">努力にブーストを。</span>
            <span className="whitespace-nowrap block">それが、「<span className="text-orange-600">ふとるめし</span>」の掲げるビジョンです。</span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProblemsSection;
