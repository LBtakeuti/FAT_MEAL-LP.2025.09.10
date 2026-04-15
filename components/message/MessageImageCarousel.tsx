'use client';

import React from 'react';
import { Splide, SplideSlide } from '@splidejs/react-splide';
import '@splidejs/react-splide/css';

interface MessageImageCarouselProps {
  images: string[];
  alt?: string;
}

export function MessageImageCarousel({ images, alt = '' }: MessageImageCarouselProps) {
  const showControls = images.length > 1;

  return (
    <>
      <Splide
        className="message-splide"
        aria-label="メッセージ画像"
        options={{
          type: 'slide',
          perPage: 1,
          arrows: showControls,
          pagination: showControls,
          drag: showControls,
          autoplay: false,
          speed: 500,
        }}
      >
        {images.map((src, i) => (
          <SplideSlide key={i}>
            <div className="w-full bg-gray-50 flex items-center justify-center overflow-hidden rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`${alt} ${i + 1}`}
                className="w-full h-auto object-contain"
                loading={i === 0 ? 'eager' : 'lazy'}
              />
            </div>
          </SplideSlide>
        ))}
      </Splide>

      <style jsx global>{`
        .message-splide .splide__arrow {
          background: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          width: 2.5rem;
          height: 2.5rem;
          opacity: 1;
        }
        .message-splide .splide__arrow svg {
          fill: #374151;
          width: 1rem;
          height: 1rem;
        }
        .message-splide .splide__pagination {
          bottom: -1.5rem;
        }
        .message-splide .splide__pagination__page {
          background: #d1d5db;
          width: 8px;
          height: 8px;
        }
        .message-splide .splide__pagination__page.is-active {
          background: #E8593C;
          transform: scale(1.2);
        }
      `}</style>
    </>
  );
}
