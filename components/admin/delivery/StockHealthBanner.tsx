'use client';

interface StockSummary {
  currentSets: number;
  itemsPerSet: number;
  requiredSets30d: number;
  requiredMeals30d: number;
  level: 'ok' | 'warn' | 'danger';
}

interface Props {
  summary: StockSummary | null;
}

const LEVEL_STYLE: Record<StockSummary['level'], { bg: string; border: string; text: string; icon: string; label: string }> = {
  ok: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', icon: '🟢', label: '余裕あり' },
  warn: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', icon: '🟡', label: '要発注' },
  danger: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: '🔴', label: '不足' },
};

export function StockHealthBanner({ summary }: Props) {
  if (!summary) return null;
  const s = LEVEL_STYLE[summary.level];
  return (
    <div className={`border ${s.border} ${s.bg} rounded-lg px-4 py-3 mb-4`}>
      <div className={`flex items-center gap-3 text-sm ${s.text}`}>
        <span className="text-base">{s.icon}</span>
        <span>
          在庫: <strong>{summary.currentSets}セット</strong>
          <span className="mx-2 text-gray-400">|</span>
          今後30日の必要: <strong>{summary.requiredSets30d}セット</strong>（{summary.requiredMeals30d}食）
          <span className="mx-2 text-gray-400">→</span>
          <strong>{s.label}</strong>
        </span>
      </div>
    </div>
  );
}
