'use client';

import React, { Suspense } from 'react';
import PurchaseFlow from '@/components/purchase/PurchaseFlow';

export default function PurchasePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">読み込み中...</div>}>
      <PurchaseFlow />
    </Suspense>
  );
}
