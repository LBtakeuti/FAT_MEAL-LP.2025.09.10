'use client';

import React, { useState, useEffect } from 'react';
import { Splide, SplideSlide } from '@splidejs/react-splide';
import '@splidejs/react-splide/css';

interface FeedbackItem {
  id: string;
  thumbnail_image: string;
  thumbnail_label: string | null;
  date: string;
  title: string;
  description: string;
}

export default function FeedbackSection() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const response = await fetch('/api/feedbacks');
        if (response.ok) {
          const data = await response.json();
          setFeedbacks(data);
        }
      } catch (error) {
        console.error('Failed to fetch feedbacks:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeedbacks();
  }, []);

  if (loading || feedbacks.length === 0) {
    return null;
  }

  return (
    <section className="py-2 bg-[#F9F8F3]" id="feedback">
      <div className="max-w-7xl mx-auto">

        {/* Carousel */}
        <Splide
          options={{
            type: feedbacks.length > 4 ? 'loop' : 'slide',
            perPage: 4,
            gap: '1.5rem',
            padding: { left: '2.5rem', right: '2.5rem' },
            pagination: feedbacks.length > 4,
            arrows: feedbacks.length > 4,
            autoplay: feedbacks.length > 4,
            interval: 4000,
            pauseOnHover: true,
            breakpoints: {
              1280: {
                perPage: 3,
                arrows: feedbacks.length > 3,
                pagination: feedbacks.length > 3,
                autoplay: feedbacks.length > 3,
              },
              1024: {
                perPage: 2,
                arrows: feedbacks.length > 2,
                pagination: feedbacks.length > 2,
                autoplay: feedbacks.length > 2,
              },
              640: {
                perPage: 1,
                gap: '1rem',
                padding: { left: '1.5rem', right: '1.5rem' },
                arrows: feedbacks.length > 1,
                pagination: feedbacks.length > 1,
                autoplay: feedbacks.length > 1,
              },
            },
          }}
          aria-label="お客様の声"
          className="feedback-splide"
        >
          {feedbacks.map((item) => (
            <SplideSlide key={item.id}>
              <div className="pb-2">
                {/* Thumbnail */}
                <div className="relative rounded-lg overflow-hidden" style={{ aspectRatio: '25 / 14' }}>
                  <img
                    src={item.thumbnail_image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  {item.thumbnail_label && (
                    <span className="absolute top-2.5 left-2.5 bg-orange-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                      {item.thumbnail_label}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="mt-4">
                  {/* Meta: date */}
                  <div className="text-sm leading-[14px] tracking-[0.3px] text-[#333]">
                    <span>{item.date}</span>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-bold leading-[14px] tracking-[0.3px] text-[#333] mt-2 overflow-hidden line-clamp-1">
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs leading-[19.2px] tracking-[0.3px] text-[#333] mt-2 overflow-hidden line-clamp-3">
                    {item.description}
                  </p>
                </div>
              </div>
            </SplideSlide>
          ))}
        </Splide>
      </div>

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
    </section>
  );
}
