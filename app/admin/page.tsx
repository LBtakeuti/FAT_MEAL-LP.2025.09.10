'use client';

import { useEffect, useState } from 'react';
import {
  TrendingUpIcon,
  CalendarIcon,
  UsersIcon,
  UserPlusIcon,
  TruckIcon,
  MailIcon,
} from '@/components/admin/dashboard/icons';
import { DashboardCard } from '@/components/admin/dashboard/DashboardCard';
import { SubscriptionTrendChart } from '@/components/admin/dashboard/SubscriptionTrendChart';
import { PopularArticles } from '@/components/admin/dashboard/PopularArticles';

interface SummaryResponse {
  currentMonthRevenue: number;
  nextMonthSubscriptionForecast: number;
  newSubscriptionCount: number;
  cancellationCount: number;
  activeSubscriptionCount: number;
  upcomingDeliveriesCount: number;
  pendingContactsCount: number;
  popularArticles: Array<{ id: string; slug: string; title: string; view_count: number }>;
}

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('/api/admin/dashboard/summary')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setSummary(d))
      .catch((err) => {
        console.error('Failed to fetch summary', err);
        setSummary(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const yen = (n: number) => `¥${n.toLocaleString('ja-JP')}`;
  const cnt = (n: number) => `${n.toLocaleString('ja-JP')}件`;

  const newCount = summary?.newSubscriptionCount ?? 0;
  const cancelCount = summary?.cancellationCount ?? 0;
  const netCount = newCount - cancelCount;
  const pendingContacts = summary?.pendingContactsCount ?? 0;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">ダッシュボード</h1>

      {/* 6カード（PC: 3列 / タブレット: 2列 / SP: 1列） */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
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
          title="アクティブサブスク数"
          value={cnt(summary?.activeSubscriptionCount ?? 0)}
          hint="現在 active 状態のサブスク"
          icon={UsersIcon}
          accent="purple"
          loading={loading}
        />

        {/* 新規 / 解約の対比カード */}
        <div className="p-5 rounded-md shadow flex flex-col gap-2 bg-amber-50 text-amber-700">
          <div className="flex items-center gap-2 text-xs">
            <UserPlusIcon className="w-4 h-4" />
            <span className="font-medium">今月の新規契約数 / 解約数</span>
          </div>
          {loading ? (
            <div className="text-2xl font-bold text-amber-900">…</div>
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-900">{cnt(newCount)}</span>
              <span className="text-sm text-amber-700">/</span>
              <span className="text-2xl font-bold text-rose-900">{cnt(cancelCount)}</span>
            </div>
          )}
          <div className="text-[11px] opacity-75">
            純増 {netCount >= 0 ? '+' : ''}{netCount} 件（今月）
          </div>
        </div>

        <DashboardCard
          title="今週の配送予定"
          value={cnt(summary?.upcomingDeliveriesCount ?? 0)}
          hint="JST 今日〜+7日 の pending"
          icon={TruckIcon}
          accent="teal"
          loading={loading}
        />

        {/* 未対応お問い合わせ（赤系で目立たせる） */}
        <div
          className={`p-5 rounded-md shadow flex flex-col gap-2 ${
            pendingContacts > 0 ? 'bg-rose-50 text-rose-700' : 'bg-gray-50 text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2 text-xs">
            <MailIcon className="w-4 h-4" />
            <span className="font-medium">未対応お問い合わせ</span>
          </div>
          <div
            className={`text-2xl font-bold ${
              pendingContacts > 0 ? 'text-rose-900' : 'text-gray-900'
            }`}
          >
            {loading ? '…' : cnt(pendingContacts)}
          </div>
          <div className="text-[11px] opacity-75">
            {pendingContacts > 0 ? '対応が必要です' : '未対応はありません'}
          </div>
        </div>
      </div>

      {/* 1グラフ + 1ランキング（PC: 2列 / SP: 1列） */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SubscriptionTrendChart />
        <PopularArticles
          articles={summary?.popularArticles ?? []}
          loading={loading}
        />
      </div>
    </div>
  );
}
