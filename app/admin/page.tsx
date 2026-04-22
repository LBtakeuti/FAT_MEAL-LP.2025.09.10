'use client';

import { useState, useEffect } from 'react';
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
  subscriptionCount: number;
  oneTimeRevenue: number;
  total: number;
};

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';
type SubFilter = 'revenue' | 'count';

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'daily', label: '日別' },
  { value: 'weekly', label: '週別' },
  { value: 'monthly', label: '月別' },
  { value: 'yearly', label: '年月別' },
];

function RevenueCharts() {
  const [period, setPeriod] = useState<Period>('monthly');
  const [subFilter, setSubFilter] = useState<SubFilter>('revenue');
  const [data, setData] = useState<ChartEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/revenue-chart?type=${period}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [period]);

  const isAngled = period === 'daily' || period === 'weekly';

  return (
    <div>
      {/* 期間ドロップダウン */}
      <div className="flex items-center justify-end gap-2 mb-6">
        <label className="text-sm text-gray-600">表示期間：</label>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as Period)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          {PERIOD_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* サブスク */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">サブスク</h3>
            <div className="flex rounded overflow-hidden border border-orange-300 text-xs">
              <button
                onClick={() => setSubFilter('revenue')}
                className={`px-3 py-1 ${subFilter === 'revenue' ? 'bg-orange-600 text-white' : 'bg-white text-orange-600'}`}
              >
                売上
              </button>
              <button
                onClick={() => setSubFilter('count')}
                className={`px-3 py-1 ${subFilter === 'count' ? 'bg-orange-600 text-white' : 'bg-white text-orange-600'}`}
              >
                契約数
              </button>
            </div>
          </div>
          {loading ? (
            <div className="h-[250px] flex items-center justify-center text-gray-400 text-sm">読み込み中…</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: isAngled ? 50 : 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10 }}
                  angle={isAngled ? -45 : 0}
                  textAnchor={isAngled ? 'end' : 'middle'}
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickFormatter={
                    subFilter === 'revenue'
                      ? (v) => `¥${(v / 1000).toFixed(0)}k`
                      : (v) => `${v}件`
                  }
                />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) =>
                    subFilter === 'revenue'
                      ? [`¥${Number(value).toLocaleString('ja-JP')}`, '売上']
                      : [`${Number(value)}件`, '契約数']
                  }
                />
                <Bar
                  dataKey={subFilter === 'revenue' ? 'subscriptionRevenue' : 'subscriptionCount'}
                  fill="#9333ea"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 買い切り */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">買い切り</h3>
            <span className="text-xs text-gray-400">売上</span>
          </div>
          {loading ? (
            <div className="h-[250px] flex items-center justify-center text-gray-400 text-sm">読み込み中…</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: isAngled ? 50 : 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10 }}
                  angle={isAngled ? -45 : 0}
                  textAnchor={isAngled ? 'end' : 'middle'}
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => `¥${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => [`¥${Number(value).toLocaleString('ja-JP')}`, '売上']}
                />
                <Bar dataKey="oneTimeRevenue" fill="#f97316" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalMenuItems: 0,
    totalStock: 0,
    totalNews: 0,
    totalContacts: 0,
    pendingContacts: 0,
    pendingOrders: 0,
    lowStockItems: 0,
    // サブスクリプション統計
    activeSubscriptions: 0,
    upcomingDeliveries: 0,
    // 売上統計
    todaySubscriptionRevenue: 0,
    todayOneTimeRevenue: 0,
    allTimeSubRevenue: 0,
    allTimeOneTimeRevenue: 0,
    allTimeTotalRevenue: 0,
    nextMonthSubscriptionForecast: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">ダッシュボード</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-600 text-sm">メニュー数</div>
          <div className="text-3xl font-bold mt-2">{stats.totalMenuItems}</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-600 text-sm">ニュース記事</div>
          <div className="text-3xl font-bold mt-2">{stats.totalNews}</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-600 text-sm">お問い合わせ</div>
          <div className="text-3xl font-bold mt-2">{stats.totalContacts}</div>
          {stats.pendingContacts > 0 && (
            <div className="text-xs text-orange-600 mt-1">未対応: {stats.pendingContacts}件</div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-600 text-sm">未処理注文</div>
          <div className={`text-3xl font-bold mt-2 ${stats.pendingOrders > 0 ? 'text-orange-600' : 'text-gray-900'}`}>
            {stats.pendingOrders}
          </div>
          {stats.pendingOrders > 0 && (
            <div className="text-xs text-orange-600 mt-1">対応が必要です</div>
          )}
        </div>

        {/* サブスクリプション統計 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-600 text-sm">アクティブなサブスク</div>
          <div className="text-3xl font-bold mt-2 text-blue-600">{stats.activeSubscriptions}</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-600 text-sm">今週配送予定</div>
          <div className={`text-3xl font-bold mt-2 ${stats.upcomingDeliveries > 0 ? 'text-green-600' : 'text-gray-900'}`}>
            {stats.upcomingDeliveries}
          </div>
          {stats.upcomingDeliveries > 0 && (
            <div className="text-xs text-green-600 mt-1">件の配送が予定されています</div>
          )}
        </div>
      </div>

      {/* 売上統計 */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">売上統計</h2>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-orange-50 p-5 rounded-lg shadow-sm">
          <div className="text-xs text-orange-600 mb-1">今日のサブスク売上</div>
          <div className="text-2xl font-bold text-gray-900">
            ¥{stats.todaySubscriptionRevenue.toLocaleString('ja-JP')}
          </div>
          <div className="text-xs text-gray-400 mt-1">本日 JST</div>
        </div>

        <div className="bg-gray-50 p-5 rounded-lg shadow-sm">
          <div className="text-xs text-gray-600 mb-1">今日の買い切り売上</div>
          <div className="text-2xl font-bold text-gray-900">
            ¥{stats.todayOneTimeRevenue.toLocaleString('ja-JP')}
          </div>
          <div className="text-xs text-gray-400 mt-1">本日 JST</div>
        </div>

        <div className="bg-orange-50 p-5 rounded-lg shadow-sm">
          <div className="text-xs text-orange-600 mb-1">サブスク累計売上</div>
          <div className="text-2xl font-bold text-gray-900">
            ¥{stats.allTimeSubRevenue.toLocaleString('ja-JP')}
          </div>
          <div className="text-xs text-gray-400 mt-1">配送済み累計</div>
        </div>

        <div className="bg-gray-50 p-5 rounded-lg shadow-sm">
          <div className="text-xs text-gray-600 mb-1">買い切り累計売上</div>
          <div className="text-2xl font-bold text-gray-900">
            ¥{stats.allTimeOneTimeRevenue.toLocaleString('ja-JP')}
          </div>
          <div className="text-xs text-gray-400 mt-1">全期間累計</div>
        </div>

        <div className="bg-blue-50 p-5 rounded-lg shadow-sm">
          <div className="text-xs text-blue-600 mb-1">来月のサブスク見込み</div>
          <div className="text-2xl font-bold text-gray-900">
            ¥{stats.nextMonthSubscriptionForecast.toLocaleString('ja-JP')}
          </div>
          <div className="text-xs text-gray-400 mt-1">アクティブ契約ベース</div>
        </div>
      </div>

      {/* 総売上 */}
      <div className="bg-gray-900 p-5 rounded-lg shadow-sm mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <div>
            <div className="text-sm font-medium opacity-90">総売上（サブスク＋買い切り累計）</div>
            <div className="text-xs opacity-60 mt-0.5">全期間・全商品</div>
          </div>
        </div>
        <div className="text-3xl font-bold text-white">
          ¥{stats.allTimeTotalRevenue.toLocaleString('ja-JP')}
        </div>
      </div>

      {/* 売上グラフ */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">売上グラフ</h2>
      <RevenueCharts />
    </div>
  );
}
