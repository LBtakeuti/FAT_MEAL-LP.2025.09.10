'use client';

import { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

type AggregatedReason = {
  value: string;
  label: string;
  category: string;
  count: number;
  percentage: number;
};

const PIE_COLORS = [
  '#ea580c', '#9333ea', '#0d9488', '#facc15', '#3b82f6',
  '#f97316', '#a855f7', '#14b8a6', '#eab308', '#6366f1',
  '#d946ef', '#22c55e', '#ec4899', '#06b6d4',
];

interface Props {
  from: string;
  to: string;
}

export function CancellationPieChart({ from, to }: Props) {
  const [data, setData] = useState<AggregatedReason[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const url = `/api/admin/cancellations?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
    fetch(url)
      .then((r) => (r.ok ? r.json() : { aggregated: [] }))
      .then((d) => setData(Array.isArray(d.aggregated) ? d.aggregated : []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [from, to]);

  // 件数が 0 の理由を除外して表示
  const filtered = data.filter((d) => d.count > 0);

  return (
    <div className="bg-white p-5 rounded-lg shadow">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">解約理由（{from} 〜 {to}）</h3>
      {loading ? (
        <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">読み込み中…</div>
      ) : filtered.length === 0 ? (
        <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">該当期間の解約データがありません</div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={filtered}
              dataKey="count"
              nameKey="label"
              cx="40%"
              cy="50%"
              outerRadius={90}
              innerRadius={40}
              label={(entry) => {
                const pct = (entry as { percentage?: number }).percentage ?? 0;
                return `${pct}%`;
              }}
              labelLine={false}
            >
              {filtered.map((_, idx) => (
                <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value, name) => [`${value}件`, String(name)]} />
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              wrapperStyle={{ fontSize: '11px', maxWidth: '45%' }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
