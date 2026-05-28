'use client';

import { useEffect, useState } from 'react';
import {
  TrendingUpIcon,
  CalendarIcon,
  PiggyBankIcon,
  UserPlusIcon,
  UserMinusIcon,
} from '@/components/admin/dashboard/icons';
import { DashboardCard } from '@/components/admin/dashboard/DashboardCard';
import { DateRangePicker } from '@/components/admin/dashboard/DateRangePicker';
import { RevenueBarChart } from '@/components/admin/dashboard/RevenueBarChart';
import { SubscriptionTrendChart } from '@/components/admin/dashboard/SubscriptionTrendChart';
import { CancellationPieChart } from '@/components/admin/dashboard/CancellationPieChart';

const JST_OFFSET = 9 * 60 * 60 * 1000;

function getCurrentMonthRange(): { from: string; to: string } {
  const now = new Date(Date.now() + JST_OFFSET);
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const first = new Date(Date.UTC(y, m, 1));
  const lastDay = new Date(Date.UTC(y, m + 1, 0));
  const fmt = (d: Date) =>
    `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
  return { from: fmt(first), to: fmt(lastDay) };
}

interface SummaryResponse {
  currentMonthRevenue: number;
  nextMonthSubscriptionForecast: number;
  allTimeRevenue: number;
  newSubscriptionCount: number;
  cancellationCount: number;
}

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const currentMonth = getCurrentMonthRange();
  const [range, setRange] = useState<{ from: string; to: string }>(currentMonth);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (range.from) params.set('from', range.from);
    if (range.to) params.set('to', range.to);
    fetch(`/api/admin/dashboard/summary?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setSummary(d))
      .catch((err) => {
        console.error('Failed to fetch summary', err);
        setSummary(null);
      })
      .finally(() => setLoading(false));
  }, [range.from, range.to]);

  const yen = (n: number) => `¥${n.toLocaleString('ja-JP')}`;
  const cnt = (n: number) => `${n.toLocaleString('ja-JP')}件`;

  return (
    <div>
      <div className="flex items-end justify-between mb-6">
        <h1 className="text-3xl font-bold">ダッシュボード</h1>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>カード範囲:</span>
          <DateRangePicker
            from={range.from}
            to={range.to}
            onChange={(from, to) => setRange({ from, to })}
          />
          <button
            type="button"
            onClick={() => setRange(currentMonth)}
            className="text-xs text-orange-600 hover:underline"
          >
            今月に戻す
          </button>
        </div>
      </div>

      {/* 5カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <DashboardCard
          title="今月の売上"
          value={yen(summary?.currentMonthRevenue ?? 0)}
          hint="当月のサブスク + 買い切り"
          icon={TrendingUpIcon}
          accent="teal"
          loading={loading}
        />
        <DashboardCard
          title="来月の見込み売上"
          value={yen(summary?.nextMonthSubscriptionForecast ?? 0)}
          hint="active サブスク 月額合計"
          icon={CalendarIcon}
          accent="indigo"
          loading={loading}
        />
        <DashboardCard
          title="累計売上（範囲内）"
          value={yen(summary?.allTimeRevenue ?? 0)}
          hint={`${range.from} 〜 ${range.to}`}
          icon={PiggyBankIcon}
          accent="purple"
          loading={loading}
        />
        <DashboardCard
          title="新規サブスク契約数"
          value={cnt(summary?.newSubscriptionCount ?? 0)}
          hint={`${range.from} 〜 ${range.to}`}
          icon={UserPlusIcon}
          accent="amber"
          loading={loading}
        />
        <DashboardCard
          title="解約数"
          value={cnt(summary?.cancellationCount ?? 0)}
          hint={`${range.from} 〜 ${range.to}`}
          icon={UserMinusIcon}
          accent="rose"
          loading={loading}
        />
      </div>

      {/* 3グラフ */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <RevenueBarChart />
        <SubscriptionTrendChart />
      </div>
      <div className="grid grid-cols-1 gap-6">
        <CancellationPieChart from={range.from} to={range.to} />
      </div>
    </div>
  );
}
