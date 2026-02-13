'use client';

import React from 'react';
import { useFeedbacks } from './useFeedbacks';
import { FeedbackCarousel } from './FeedbackCarousel';
import { MOBILE_CONTAINER_MAX_WIDTH, DESKTOP_CONTAINER_MAX_WIDTH } from '@/lib/constants/card';

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
      <div className={`${MOBILE_CONTAINER_MAX_WIDTH} ${DESKTOP_CONTAINER_MAX_WIDTH} mx-auto`}>
        <FeedbackCarousel feedbacks={feedbacks} />
      </div>
    </section>
  );
}
