import React from 'react';
import { Splide, SplideSlide } from '@splidejs/react-splide';
import '@splidejs/react-splide/css';
import { FeedbackCard } from './FeedbackCard';
import { getCarouselOptions } from './constants';
import type { FeedbackItem } from '@/types/feedback';

interface FeedbackCarouselProps {
  feedbacks: FeedbackItem[];
}

export function FeedbackCarousel({ feedbacks }: FeedbackCarouselProps) {
  return (
    <>
      <Splide
        options={getCarouselOptions(feedbacks.length)}
        aria-label="お客様の声"
        className="feedback-splide"
      >
        {feedbacks.map((item) => (
          <SplideSlide key={item.id}>
            <FeedbackCard item={item} />
          </SplideSlide>
        ))}
      </Splide>

      {/* Custom Splide Styles */}
      <style jsx global>{`
        .feedback-splide .splide__arrow {
          background: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          width: 2.5rem;
          height: 2.5rem;
          opacity: 1;
          top: 50%;
          transform: translateY(-50%);
        }
        .feedback-splide .splide__arrow--prev {
          left: -0.5rem;
        }
        .feedback-splide .splide__arrow--next {
          right: -0.5rem;
        }
        .feedback-splide .splide__arrow svg {
          fill: #374151;
          width: 1rem;
          height: 1rem;
        }
        .feedback-splide .splide__arrow:hover {
          background: #f9fafb;
          transform: translateY(-50%);
        }
        .feedback-splide .splide__pagination__page {
          background: #d1d5db;
          width: 8px;
          height: 8px;
        }
        .feedback-splide .splide__pagination__page.is-active {
          background: #ea580c;
          transform: scale(1);
        }
        .feedback-splide .splide__pagination {
          bottom: -2rem;
        }
      `}</style>
    </>
  );
}
