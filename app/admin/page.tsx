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
import { DateRangePicker } from '@/components/admin/dashboard/DateRangePicker';
import { SubscriptionTrendChart } from '@/components/admin/dashboard/SubscriptionTrendChart';
import { PopularArticles } from '@/components/admin/dashboard/PopularArticles';

const JST_OFFSET = 9 * 60 * 60 * 1000;

function getDefaultRange(): { from: string; to: string } {
  const now = new Date(Date.now() + JST_OFFSET);
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();
  const first = new Date(Date.UTC(y, m, 1));
  const today = new Date(Date.UTC(y, m, d));
  const fmt = (date: Date) =>
    `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
  return { from: fmt(first), to: fmt(today) };
}

interface SummaryResponse {
  rangeRevenue: number;
  newSubscriptionCount: number;
  cancellationCount: number;
  rangeDeliveriesCount: number;
  nextMonthSubscriptionForecast: number;
  activeSubscriptionCount: number;
  pendingContactsCount: number;
  popularArticles: Array<{ id: string; slug: string; title: string; view_count: number }>;
  range: { from: string; to: string };
}

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const defaultRange = getDefaultRange();
  const [range, setRange] = useState<{ from: string; to: string }>(defaultRange);

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

  const newCount = summary?.newSubscriptionCount ?? 0;
  const cancelCount = summary?.cancellationCount ?? 0;
  const netCount = newCount - cancelCount;
  const pendingContacts = summary?.pendingContactsCount ?? 0;
  const rangeLabel = `${range.from} 〜 ${range.to}`;

  return (
    <div>
      <div className="flex items-end justify-between mb-2 flex-wrap gap-3">
        <h1 className="text-3xl font-bold">ダッシュボード</h1>
        <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
          <span>期間:</span>
          <DateRangePicker
            from={range.from}
            to={range.to}
            onChange={(from, to) => setRange({ from, to })}
          />
          <button
            type="button"
            onClick={() => setRange(defaultRange)}
            className="text-xs text-orange-600 hover:underline"
          >
            今月に戻す
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-500 mb-6">
        期間: {rangeLabel} ／ 連動: 売上 / 新規・解約 / 配送予定 / 推移グラフ ／ 固定: 来月見込み / アクティブ数 / 未対応 / 記事Top5
      </p>

      {/* 6カード（PC: 3列 / タブレット: 2列 / SP: 1列） */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <DashboardCard
          title="期間内の売上"
          value={yen(summary?.rangeRevenue ?? 0)}
          hint={`${rangeLabel}（サブスク + 買い切り）`}
          icon={TrendingUpIcon}
          accent="teal"
          loading={loading}
        />
        <DashboardCard
          title="来月の見込み売上"
          value={yen(summary?.nextMonthSubscriptionForecast ?? 0)}
          hint="active サブスク 月額合計（固定）"
          icon={CalendarIcon}
          accent="indigo"
          loading={loading}
        />
        <DashboardCard
          title="アクティブサブスク数"
          value={cnt(summary?.activeSubscriptionCount ?? 0)}
          hint="現在 active 状態のサブスク（固定）"
          icon={UsersIcon}
          accent="purple"
          loading={loading}
        />

        {/* 新規 / 解約の対比カード（連動） */}
        <div className="p-5 rounded-md shadow flex flex-col gap-2 bg-amber-50 text-amber-700">
          <div className="flex items-center gap-2 text-xs">
            <UserPlusIcon className="w-4 h-4" />
            <span className="font-medium">期間内の新規契約 / 解約</span>
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
            純増 {netCount >= 0 ? '+' : ''}{netCount} 件（{rangeLabel}）
          </div>
        </div>

        <DashboardCard
          title="期間内の配送予定"
          value={cnt(summary?.rangeDeliveriesCount ?? 0)}
          hint={`${rangeLabel} の pending`}
          icon={TruckIcon}
          accent="teal"
          loading={loading}
        />

        {/* 未対応お問い合わせ（固定、赤系で目立たせる） */}
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
            {pendingContacts > 0 ? '対応が必要です（固定）' : '未対応はありません（固定）'}
          </div>
        </div>
      </div>

      {/* 1グラフ + 1ランキング（PC: 2列 / SP: 1列） */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SubscriptionTrendChart from={range.from} to={range.to} />
        <PopularArticles
          articles={summary?.popularArticles ?? []}
          loading={loading}
        />
      </div>
    </div>
  );
}
