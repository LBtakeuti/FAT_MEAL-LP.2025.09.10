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
    totalPrice: 5700,
    badge: '初回限定',
    isSubscription: false,
  },
  {
    id: 'subscription-monthly-12',
    mealCount: 12,
    title: '12食 月額プラン',
    subtitle: '月1回配送',
    anchorPrice: 10500,
    totalPrice: 4980,
    highlight: 'ゆうさくスポーツキャンペーン 初回限定',
    shippingNote: '送料無料',
    isSubscription: true,
  },
];

function InterceptedPurchaseContent() {
  const searchParams = useSearchParams();
  const initialPlan = searchParams.get('plan');
  const [selectedId, setSelectedId] = useState<string | null>(initialPlan);

  const handleNext = () => {
    if (!selectedId) return;
    const refCode = searchParams.get('ref');
    const params = new URLSearchParams();
    params.set('plan', selectedId);
    params.set('step', 'info');
    if (refCode) params.set('ref', refCode);
    // Intercepting Route を抜けてフルページ遷移するため window.location を使用
    window.location.href = `/purchase?${params.toString()}`;
  };

  return (
    <PurchaseSheetShell title="プランを選ぶ">
      <div className="px-4 py-5 md:px-6 md:py-6 space-y-4">
        <div>
          <h1 className="text-lg font-bold text-gray-900">何食お届けしましょうか？</h1>
          <p className="text-xs text-gray-500 mt-1">
            初回限定価格で、お気軽に始められます。
          </p>
        </div>

        <PlanSelectorCards
          plans={SHEET_PLANS}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />

        <div className="sticky bottom-0 -mx-4 md:-mx-6 px-4 md:px-6 pt-3 pb-4 bg-white border-t border-gray-100">
          <button
            type="button"
            onClick={handleNext}
            disabled={!selectedId}
            className={`w-full rounded-full py-3.5 text-sm font-bold transition-colors
              ${selectedId
                ? 'bg-[#E8593C] text-white hover:bg-[#d64a2e]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
          >
            お客様情報の入力へ進む
          </button>
          <p className="text-[10px] text-gray-400 text-center mt-2">
            送料無料 ・ いつでも解約可能 ・ 管理栄養士監修
          </p>
        </div>
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
