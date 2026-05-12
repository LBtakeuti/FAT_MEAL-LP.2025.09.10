'use client';

import { ReviewAvatar } from './ReviewAvatar';
import { ReviewStars } from './ReviewStars';
import type { ReviewItem } from '@/types/review';

interface Props {
  item: ReviewItem;
}

export function ReviewCard({ item }: Props) {
  return (
    <article className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 h-full flex flex-col">
      <header className="flex items-center gap-3 mb-3">
        <ReviewAvatar
          url={item.icon_url}
          preset={item.icon_preset}
          name={item.name}
          size={44}
        />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-gray-900 truncate">{item.name}</h3>
          <ReviewStars rating={item.rating} />
        </div>
      </header>
      <p className="text-xs sm:text-sm text-gray-700 leading-relaxed flex-1 whitespace-pre-wrap">
        {item.comment}
      </p>
    </article>
  );
}
