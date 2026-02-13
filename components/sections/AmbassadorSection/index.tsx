'use client';

import React from 'react';
import { useAmbassadors } from './useAmbassadors';
import { AmbassadorCarousel } from './AmbassadorCarousel';

export default function AmbassadorSection() {
  const { ambassadors, loading } = useAmbassadors();

  if (loading || ambassadors.length === 0) {
    return null;
  }

  return (
    <section className="py-2 bg-[#F9F8F3]" id="ambassador">
      <div className="max-w-7xl mx-auto">
        <AmbassadorCarousel ambassadors={ambassadors} />
      </div>
    </section>
  );
}
