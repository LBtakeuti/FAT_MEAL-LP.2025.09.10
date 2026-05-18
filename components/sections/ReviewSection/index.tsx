'use client';

import { useState } from 'react';
import { useReviews } from './useReviews';
import { ReviewCarousel } from './ReviewCarousel';
import { ReviewModal } from './ReviewModal';
import type { ReviewItem } from '@/types/review';

export default function ReviewSection() {
  const { reviews, loading } = useReviews();
  const [expanded, setExpanded] = useState<ReviewItem | null>(null);

  if (loading || reviews.length === 0) {
    return null;
  }

  return (
    <section className="py-10 sm:py-14 bg-[#F9F8F3]" id="reviews">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">お客様の声</h2>
        </div>
        <ReviewCarousel reviews={reviews} onExpand={setExpanded} />
      </div>

      <ReviewModal item={expanded} onClose={() => setExpanded(null)} />
    </section>
  );
}
