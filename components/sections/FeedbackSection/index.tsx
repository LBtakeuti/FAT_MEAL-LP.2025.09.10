'use client';

import React from 'react';
import { Reveal } from '@/components/ui/Reveal';
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
    <section className="pt-2 pb-10 bg-[#F9F8F3]" id="feedback">
      <div className="max-w-7xl mx-auto">
        {/* F73: フェードイン */}
        <Reveal>
          <FeedbackCarousel feedbacks={feedbacks} />
        </Reveal>
      </div>
    </section>
  );
}
