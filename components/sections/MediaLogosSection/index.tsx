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
      className="bg-white py-5 overflow-hidden"
      aria-label="メディア掲載実績"
    >
      <div className="relative">
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
                className="h-14 sm:h-[60px] w-auto object-contain"
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
