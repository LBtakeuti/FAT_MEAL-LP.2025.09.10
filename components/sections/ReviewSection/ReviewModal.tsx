'use client';

import { useEffect } from 'react';
import { ReviewAvatar } from './ReviewAvatar';
import { ReviewStars } from './ReviewStars';
import type { ReviewItem } from '@/types/review';

interface Props {
  item: ReviewItem | null;
  onClose: () => void;
}

export function ReviewModal({ item, onClose }: Props) {
  useEffect(() => {
    if (!item) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [item, onClose]);

  if (!item) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${item.name}さんのレビュー`}
      className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl max-h-[85vh] overflow-y-auto animate-zoomIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white px-5 py-4 border-b border-gray-100 flex items-start gap-3">
          <ReviewAvatar
            url={item.icon_url}
            preset={item.icon_preset}
            name={item.name}
            size={52}
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-base">{item.name}</h3>
            <ReviewStars rating={item.rating} size={16} />
          </div>
          <button
            onClick={onClose}
            aria-label="閉じる"
            className="text-gray-400 hover:text-gray-700 text-2xl leading-none flex-shrink-0 p-1 -mt-1"
          >
            ×
          </button>
        </div>

        <div className="px-5 py-5">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {item.comment}
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes zoomIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-zoomIn { animation: zoomIn 0.2s ease-out; }
      `}</style>
    </div>
  );
}
