'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type TrendEntry = {
  label: string;
  sortKey: string;
  count: number;
};

export function SubscriptionTrendChart() {
  const [data, setData] = useState<TrendEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('/api/admin/dashboard/subscription-trend?type=monthly&months=12')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setData(Array.isArray(d) ? d : []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white p-5 rounded-lg shadow">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">新規サブスク契約数 推移（直近12ヶ月）</h3>
      {loading ? (
        <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">読み込み中…</div>
      ) : data.length === 0 ? (
        <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">データがありません</div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={{ top: 4, right: 16, left: 8, bottom: 16 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}件`} />
            <Tooltip formatter={(value) => [`${Number(value)}件`, '新規契約数']} />
            <Line type="monotone" dataKey="count" stroke="#ea580c" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
