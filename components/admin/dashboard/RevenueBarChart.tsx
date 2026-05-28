'use client';

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

type ChartEntry = {
  label: string;
  subscriptionRevenue: number;
  oneTimeRevenue: number;
  total: number;
};

export function RevenueBarChart() {
  const [data, setData] = useState<ChartEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('/api/admin/revenue-chart?type=monthly')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setData(Array.isArray(d) ? d : []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white p-5 rounded-lg shadow">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">売上月次グラフ（直近12ヶ月）</h3>
      {loading ? (
        <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">読み込み中…</div>
      ) : data.length === 0 ? (
        <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">データがありません</div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 16 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `¥${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(value, name) => {
                const label = name === 'subscriptionRevenue' ? 'サブスク' : '買い切り';
                return [`¥${Number(value).toLocaleString('ja-JP')}`, label];
              }}
            />
            <Legend
              formatter={(value) =>
                value === 'subscriptionRevenue' ? 'サブスク売上' : '買い切り売上'
              }
            />
            <Bar dataKey="subscriptionRevenue" stackId="rev" fill="#9333ea" radius={[0, 0, 0, 0]} />
            <Bar dataKey="oneTimeRevenue" stackId="rev" fill="#ea580c" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
