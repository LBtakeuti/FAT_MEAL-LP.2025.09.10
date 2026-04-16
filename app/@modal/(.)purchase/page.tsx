'use client';

export const dynamic = 'force-dynamic';

import React, { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { PurchaseSheetShell } from '@/components/purchase/PurchaseSheetShell';
import PurchaseFlow from '@/components/purchase/PurchaseFlow';

function InterceptedPurchaseContent() {
  const router = useRouter();
  return (
    <PurchaseSheetShell title="ご購入手続き">
      <PurchaseFlow inSheet onClose={() => router.back()} />
    </PurchaseSheetShell>
  );
}

export default function InterceptedPurchasePage() {
  return (
    <Suspense fallback={null}>
      <InterceptedPurchaseContent />
    </Suspense>
  );
}
