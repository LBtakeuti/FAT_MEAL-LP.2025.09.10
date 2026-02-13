'use client';

import React from 'react';
import type { FeedbackItem } from '@/types/feedback';
import { CARD_WIDTH, CARD_IMAGE_ASPECT_RATIO } from '@/lib/constants/card';

interface FeedbackCardProps {
  item: FeedbackItem;
}

export function FeedbackCard({ item }: FeedbackCardProps) {
  return (
    <>
      <div className="feedback-card pb-2">
        {/* Thumbnail */}
        <div
          className="relative rounded-lg overflow-hidden"
          style={{ aspectRatio: CARD_IMAGE_ASPECT_RATIO }}
        >
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
        <div className="flex flex-col gap-2 mt-4">
          {/* Meta: date */}
          <time className="text-sm text-gray-500">
            {item.date}
          </time>

          {/* Title */}
          <h3 className="text-sm font-bold text-gray-700 truncate">
            {item.title}
          </h3>

          {/* Description */}
          <p className="text-xs text-gray-700 line-clamp-3">
            {item.description}
          </p>
        </div>
      </div>

      {/* Card Styles */}
      <style jsx>{`
        @media (max-width: 640px) {
          .feedback-card {
            width: ${CARD_WIDTH}px;
          }
        }
      `}</style>
    </>
  );
}
