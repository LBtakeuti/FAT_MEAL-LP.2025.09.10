'use client';

import React from 'react';
import { useAmbassadors } from './useAmbassadors';
import { AmbassadorCarousel } from './AmbassadorCarousel';
import { MOBILE_CONTAINER_MAX_WIDTH, DESKTOP_CONTAINER_MAX_WIDTH } from '@/lib/constants/card';

export default function AmbassadorSection() {
  const { ambassadors, loading } = useAmbassadors();

  if (loading) {
    return null;
  }

  if (ambassadors.length === 0) {
    return null;
  }

  return (
    <section className="py-2 bg-[#F9F8F3]" id="ambassador">
      <div className={`${MOBILE_CONTAINER_MAX_WIDTH} ${DESKTOP_CONTAINER_MAX_WIDTH} mx-auto`}>
        <AmbassadorCarousel ambassadors={ambassadors} />
      </div>
    </section>
  );
}
