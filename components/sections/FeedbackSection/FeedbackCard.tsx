import React from 'react';
import type { FeedbackItem } from '@/types/feedback';

interface FeedbackCardProps {
  item: FeedbackItem;
}

export function FeedbackCard({ item }: FeedbackCardProps) {
  return (
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
  );
}
