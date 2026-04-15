'use client';

import React, { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PurchaseSheetShell } from '@/components/purchase/PurchaseSheetShell';
import { PlanSelectorCards, type PlanCardData } from '@/components/purchase/PlanSelectorCards';

const SHEET_PLANS: PlanCardData[] = [
  {
    id: 'trial-6',
    mealCount: 6,
    title: 'お試し6個セット',
    subtitle: '6種類×1個ずつ・1回限り',
    totalPrice: 700,
    badge: '初回限定',
    shippingNote: '料別',
    isSubscription: false,
  },
  {
    id: 'subscription-monthly-12',
    mealCount: 12,
    title: '12食 月額プラン',
    subtitle: '月1回配送',
    anchorPrice: 750,
    totalPrice: 415,
    highlight: 'ゆうさくスポーツキャンペーン 初回限定',
    shippingNote: '送料無料',
    isSubscription: true,
  },
];

function InterceptedPurchaseContent() {
  const searchParams = useSearchParams();
  const initialPlan = searchParams.get('plan');
  const [selectedId, setSelectedId] = useState<string | null>(initialPlan);

  const proceedTo = (planId: string) => {
    const refCode = searchParams.get('ref');
    const params = new URLSearchParams();
    params.set('plan', planId);
    params.set('step', 'info');
    if (refCode) params.set('ref', refCode);
    // Intercepting Route を抜けてフルページ遷移するため window.location を使用
    window.location.href = `/purchase?${params.toString()}`;
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
    proceedTo(id);
  };

  return (
    <PurchaseSheetShell title="プランを選ぶ">
      <div className="px-4 py-5 md:px-6 md:py-6 pb-8">
        <PlanSelectorCards
          plans={SHEET_PLANS}
          selectedId={selectedId}
          onSelect={handleSelect}
        />
        <p className="text-[10px] text-gray-400 text-center mt-4">
          送料無料 ・ いつでも解約可能 ・ 管理栄養士監修
        </p>
      </div>
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
