'use client';

import React, { useEffect, useRef, useState } from 'react';

interface MediaLogo {
  id: string;
  name: string;
  image_url: string;
  sort_order: number;
}

export default function MediaLogosSection() {
  const [logos, setLogos] = useState<MediaLogo[]>([]);
  const [loaded, setLoaded] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/media-logos')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setLogos(data);
          setLoaded(true);
        }
      })
      .catch(() => {});
  }, []);

  // IntersectionObserver: 画面外でアニメーション停止
  useEffect(() => {
    if (!sectionRef.current || !loaded) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (trackRef.current) {
          trackRef.current.style.animationPlayState = entry.isIntersecting ? 'running' : 'paused';
        }
      },
      { threshold: 0 }
    );

    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [loaded]);

  if (!loaded) return null;

  // ロゴを3セット複製して途切れなくループ
  const tripled = [...logos, ...logos, ...logos];

  return (
    <section
      ref={sectionRef}
      className="bg-white border-y border-gray-100 py-5 overflow-hidden"
      aria-label="メディア掲載実績"
    >
      <div className="max-w-6xl mx-auto px-4 mb-3">
        <p className="text-center text-[11px] font-medium tracking-widest text-gray-400 uppercase">
          メディア掲載実績
        </p>
      </div>

      <div className="relative">
        {/* 左右フェードマスク */}
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        <div
          ref={trackRef}
          className="media-logos-track flex items-center gap-10"
          aria-hidden="true"
        >
          {tripled.map((logo, i) => (
            <div key={`${logo.id}-${i}`} className="flex-shrink-0">
              <img
                src={logo.image_url}
                alt={logo.name}
                loading="lazy"
                className="h-8 w-auto object-contain opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300"
              />
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .media-logos-track {
          width: max-content;
          animation: scroll-logos 20s linear infinite;
        }

        @keyframes scroll-logos {
          0%   { transform: translateX(0); }
          100% { transform: translateX(calc(-100% / 3)); }
        }

        @media (prefers-reduced-motion: reduce) {
          .media-logos-track {
            animation: none;
            flex-wrap: wrap;
            justify-content: center;
            width: 100%;
          }
        }
      `}</style>
    </section>
  );
}
