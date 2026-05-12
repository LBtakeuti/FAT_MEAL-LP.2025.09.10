'use client';

import { Splide, SplideSlide } from '@splidejs/react-splide';
import '@splidejs/react-splide/css';
import { ReviewCard } from './ReviewCard';
import { getReviewCarouselOptions } from './constants';
import type { ReviewItem } from '@/types/review';

interface Props {
  reviews: ReviewItem[];
}

export function ReviewCarousel({ reviews }: Props) {
  return (
    <>
      <Splide
        options={getReviewCarouselOptions(reviews.length)}
        aria-label="お客様のレビュー"
        className="review-splide"
      >
        {reviews.map((item) => (
          <SplideSlide key={item.id}>
            <ReviewCard item={item} />
          </SplideSlide>
        ))}
      </Splide>

      <style jsx global>{`
        .review-splide .splide__arrow {
          background: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          width: 2.5rem;
          height: 2.5rem;
          opacity: 1;
          top: 50%;
          transform: translateY(-50%);
        }
        .review-splide .splide__arrow--prev { left: -0.5rem; }
        .review-splide .splide__arrow--next { right: -0.5rem; }
        .review-splide .splide__arrow svg {
          fill: #374151;
          width: 1rem;
          height: 1rem;
        }
        .review-splide .splide__arrow:hover {
          background: #f9fafb;
          transform: translateY(-50%);
        }
        .review-splide .splide__pagination__page {
          background: #d1d5db;
          width: 8px;
          height: 8px;
        }
        .review-splide .splide__pagination__page.is-active {
          background: #ea580c;
          transform: scale(1);
        }
        .review-splide .splide__pagination {
          bottom: -1.75rem;
        }
        .review-splide .splide__slide {
          height: auto;
        }
        .review-splide .splide__slide > * {
          height: 100%;
        }
      `}</style>
    </>
  );
}
