'use client';

import React from 'react';
import { useFeedbacks } from './useFeedbacks';
import { FeedbackCarousel } from './FeedbackCarousel';

export default function FeedbackSection() {
  const { feedbacks, loading } = useFeedbacks();

  if (loading) {
    return null;
  }

  if (feedbacks.length === 0) {
    return null;
  }

  return (
    <section className="py-2 bg-[#F9F8F3]" id="feedback">
      <div className="max-w-7xl mx-auto">
        <FeedbackCarousel feedbacks={feedbacks} />
      </div>
    </section>
  );
}
