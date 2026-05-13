'use client';

import { ReviewAvatar } from './ReviewAvatar';
import { ReviewStars } from './ReviewStars';
import type { ReviewItem } from '@/types/review';

// SP表示時、コメントがこの文字数を超えたら「全てを見る」ボタンを出す
const SP_TRUNCATE_THRESHOLD = 50;

interface Props {
  item: ReviewItem;
  onExpand: (item: ReviewItem) => void;
}

export function ReviewCard({ item, onExpand }: Props) {
  const isLong = item.comment.length > SP_TRUNCATE_THRESHOLD;

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

      <p
        className={`text-xs sm:text-sm text-gray-700 leading-relaxed flex-1 whitespace-pre-wrap ${
          isLong ? 'line-clamp-3 sm:line-clamp-none' : ''
        }`}
      >
        {item.comment}
      </p>

      {isLong && (
        <button
          type="button"
          onClick={() => onExpand(item)}
          className="sm:hidden self-start mt-2 text-xs font-medium text-orange-600 hover:text-orange-700 active:text-orange-800"
          aria-label={`${item.name}さんのレビュー全文を見る`}
        >
          全てを見る →
        </button>
      )}
    </article>
  );
}
