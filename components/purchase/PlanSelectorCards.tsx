'use client';

import React from 'react';

export interface PlanCardData {
  id: string;
  mealCount: number;
  title: string;
  subtitle: string;
  anchorPrice?: number;
  totalPrice: number;
  badge?: string;
  highlight?: string;
  shippingNote?: string;
  isSubscription: boolean;
}

interface PlanSelectorCardsProps {
  plans: PlanCardData[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function PlanSelectorCards({ plans, selectedId, onSelect }: PlanSelectorCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {plans.map((plan) => {
        const isSelected = selectedId === plan.id;
        return (
          <button
            key={plan.id}
            type="button"
            onClick={() => onSelect(plan.id)}
            className={`relative text-left rounded-2xl border-2 bg-white p-5 transition-all
              ${isSelected ? 'border-[#E8593C] shadow-md ring-2 ring-[#E8593C]/20' : 'border-gray-200 hover:border-gray-300'}`}
          >
            {plan.badge && (
              <span className="absolute -top-3 left-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                {plan.badge}
              </span>
            )}
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-4xl font-black text-[#1a1a1a]">{plan.mealCount}</span>
              <span className="text-base font-medium text-gray-600">食</span>
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">{plan.title}</h3>
            <p className="text-xs text-gray-500 mb-3">{plan.subtitle}</p>

            {plan.highlight && (
              <span className="inline-block bg-red-600 text-white text-[11px] font-bold px-2 py-0.5 rounded mb-2">
                {plan.highlight}
              </span>
            )}

            <div className="mt-2">
              {plan.anchorPrice && plan.anchorPrice > plan.totalPrice && (
                <span className="text-sm text-gray-400 line-through mr-2">
                  ¥{plan.anchorPrice.toLocaleString()}
                </span>
              )}
              <span className="text-2xl font-black text-[#E8593C]">
                ¥{plan.totalPrice.toLocaleString()}
              </span>
              {plan.shippingNote && (
                <span className="text-xs text-green-600 font-bold ml-2">{plan.shippingNote}</span>
              )}
            </div>

            <div className={`mt-4 w-full text-center rounded-full py-2.5 text-sm font-bold transition-colors
              ${isSelected ? 'bg-[#E8593C] text-white' : 'bg-gray-100 text-gray-700'}`}>
              {isSelected ? '選択中' : 'このプランを選ぶ'}
            </div>
          </button>
        );
      })}
    </div>
  );
}
