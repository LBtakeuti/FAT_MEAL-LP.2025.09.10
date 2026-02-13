import React from 'react';
import { Splide, SplideSlide } from '@splidejs/react-splide';
import '@splidejs/react-splide/css';
import { AmbassadorCard } from './AmbassadorCard';
import { getCarouselOptions } from './constants';
import type { AmbassadorItem } from '@/types/ambassador';

interface AmbassadorCarouselProps {
  ambassadors: AmbassadorItem[];
}

export function AmbassadorCarousel({ ambassadors }: AmbassadorCarouselProps) {
  return (
    <>
      <Splide
        options={getCarouselOptions(ambassadors.length)}
        aria-label="ふとるめしアンバサダー"
        className="ambassador-splide"
      >
        {ambassadors.map((item) => (
          <SplideSlide key={item.id}>
            <AmbassadorCard item={item} />
          </SplideSlide>
        ))}
      </Splide>

      {/* Carousel Styles */}
      <style jsx global>{`
        /* Splide arrows */
        .ambassador-splide {
          position: relative;
        }
        .ambassador-splide .splide__arrows {
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          transform: translateY(-50%);
          display: flex;
          justify-content: space-between;
          pointer-events: none;
          padding: 0 8px;
          z-index: 10;
        }
        .ambassador-splide .splide__arrow {
          position: static;
          transform: none;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: #ffffff;
          border: 1.5px solid #d0d0d0;
          box-shadow: 0 2px 8px rgba(0,0,0,.15);
          opacity: 1;
          cursor: pointer;
          transition: background .2s, border-color .2s;
          pointer-events: auto;
        }
        .ambassador-splide .splide__arrow:hover {
          background: #333;
          border-color: #333;
        }
        .ambassador-splide .splide__arrow:hover svg {
          fill: #fff;
        }
        .ambassador-splide .splide__arrow svg {
          width: 14px;
          height: 14px;
          fill: #333;
          transition: fill .2s;
        }
        .ambassador-splide .splide__arrow--prev svg {
          transform: scaleX(-1);
        }

        /* Splide pagination */
        .ambassador-splide .splide__pagination {
          bottom: -30px;
          gap: 6px;
        }
        .ambassador-splide .splide__pagination__page {
          width: 6px;
          height: 6px;
          background: #c8c8c8;
          opacity: 1;
          transition: .2s;
        }
        .ambassador-splide .splide__pagination__page.is-active {
          background: #333;
          transform: scale(1.2);
        }
      `}</style>
    </>
  );
}
