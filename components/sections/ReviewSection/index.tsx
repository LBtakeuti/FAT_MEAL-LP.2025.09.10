'use client';

import { useReviews } from './useReviews';
import { ReviewCarousel } from './ReviewCarousel';

export default function ReviewSection() {
  const { reviews, loading } = useReviews();

  if (loading || reviews.length === 0) {
    return null;
  }

  return (
    <section className="py-10 sm:py-14 bg-[#F9F8F3]" id="reviews">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">お客様の声</h2>
          <p className="text-sm text-gray-500 mt-2">ふとるめしを選んでくださった方々の口コミ</p>
        </div>
        <ReviewCarousel reviews={reviews} />
      </div>
    </section>
  );
}
