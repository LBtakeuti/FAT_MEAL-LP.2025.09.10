'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface AnalyticsData {
  period: string;
  startDate: string;
  endDate: string;
  overview: {
    activeUsers: number;
    sessions: number;
    pageViews: number;
    bounceRate: number;
    avgSessionDuration: number;
  };
  daily: Array<{
    date: string;
    users: number;
    pageViews: number;
  }>;
  devices: Array<{
    device: string;
    users: number;
  }>;
  sources: Array<{
    source: string;
    sessions: number;
  }>;
  pages: Array<{
    path: string;
    pageViews: number;
  }>;
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<'today' | '7days' | '30days'>('7days');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/analytics?period=${period}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch data');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 日付をフォーマット（YYYYMMDD → MM/DD）
  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr.length !== 8) return dateStr;
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${parseInt(month)}/${parseInt(day)}`;
  };

  // 秒を分:秒にフォーマット
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}分${secs}秒`;
  };

  // デバイス名を日本語に
  const deviceNameJa = (device: string) => {
    const map: Record<string, string> = {
      desktop: 'PC',
      mobile: 'モバイル',
      tablet: 'タブレット',
    };
    return map[device.toLowerCase()] || device;
  };

  // グラフの最大値を計算
  const getMaxValue = (values: number[]) => {
    const max = Math.max(...values);
    return max === 0 ? 1 : max;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div className="flex items-center gap-4 mb-4 sm:mb-0">
            <Link
              href="/admin"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">アナリティクス</h1>
          </div>

          {/* 期間選択 */}
          <div className="flex gap-2">
            {[
              { value: 'today', label: '今日' },
              { value: '7days', label: '7日間' },
              { value: '30days', label: '30日間' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setPeriod(option.value as typeof period)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  period === option.value
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* ローディング */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        )}

        {/* エラー */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              再試行
            </button>
          </div>
        )}

        {/* データ表示 */}
        {!loading && !error && data && (
          <div className="space-y-6">
            {/* 概要カード */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <p className="text-sm text-gray-500 mb-1">ユーザー</p>
                <p className="text-3xl font-bold text-gray-900">{data.overview.activeUsers.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <p className="text-sm text-gray-500 mb-1">セッション</p>
                <p className="text-3xl font-bold text-gray-900">{data.overview.sessions.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <p className="text-sm text-gray-500 mb-1">ページビュー</p>
                <p className="text-3xl font-bold text-gray-900">{data.overview.pageViews.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <p className="text-sm text-gray-500 mb-1">直帰率</p>
                <p className="text-3xl font-bold text-gray-900">{(data.overview.bounceRate * 100).toFixed(1)}%</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6 col-span-2 lg:col-span-1">
                <p className="text-sm text-gray-500 mb-1">平均セッション時間</p>
                <p className="text-3xl font-bold text-gray-900">{formatDuration(data.overview.avgSessionDuration)}</p>
              </div>
            </div>

            {/* 日別グラフ */}
            {data.daily.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">日別推移</h2>
                <div className="space-y-6">
                  {/* ユーザー数 */}
                  <div>
                    <p className="text-sm text-gray-500 mb-2">ユーザー数</p>
                    <div className="flex items-end gap-1 h-32">
                      {data.daily.map((day, index) => {
                        const maxUsers = getMaxValue(data.daily.map((d) => d.users));
                        const height = (day.users / maxUsers) * 100;
                        return (
                          <div key={index} className="flex-1 flex flex-col items-center">
                            <div
                              className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer relative group"
                              style={{ height: `${Math.max(height, 2)}%` }}
                            >
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block">
                                <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                  {day.users.toLocaleString()}
                                </div>
                              </div>
                            </div>
                            <span className="text-xs text-gray-500 mt-1 hidden sm:block">{formatDate(day.date)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* PV */}
                  <div>
                    <p className="text-sm text-gray-500 mb-2">ページビュー</p>
                    <div className="flex items-end gap-1 h-32">
                      {data.daily.map((day, index) => {
                        const maxPV = getMaxValue(data.daily.map((d) => d.pageViews));
                        const height = (day.pageViews / maxPV) * 100;
                        return (
                          <div key={index} className="flex-1 flex flex-col items-center">
                            <div
                              className="w-full bg-orange-500 rounded-t hover:bg-orange-600 transition-colors cursor-pointer relative group"
                              style={{ height: `${Math.max(height, 2)}%` }}
                            >
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block">
                                <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                  {day.pageViews.toLocaleString()}
                                </div>
                              </div>
                            </div>
                            <span className="text-xs text-gray-500 mt-1 hidden sm:block">{formatDate(day.date)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2カラムレイアウト */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* デバイス別 */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">デバイス別</h2>
                {data.devices.length > 0 ? (
                  <div className="space-y-3">
                    {data.devices.map((device, index) => {
                      const totalUsers = data.devices.reduce((sum, d) => sum + d.users, 0);
                      const percentage = totalUsers > 0 ? (device.users / totalUsers) * 100 : 0;
                      return (
                        <div key={index}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-gray-700">{deviceNameJa(device.device)}</span>
                            <span className="text-sm text-gray-500">
                              {device.users.toLocaleString()} ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">データがありません</p>
                )}
              </div>

              {/* 流入元 */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">流入元</h2>
                {data.sources.length > 0 ? (
                  <div className="space-y-3">
                    {data.sources.slice(0, 5).map((source, index) => {
                      const totalSessions = data.sources.reduce((sum, s) => sum + s.sessions, 0);
                      const percentage = totalSessions > 0 ? (source.sessions / totalSessions) * 100 : 0;
                      return (
                        <div key={index}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-gray-700">{source.source}</span>
                            <span className="text-sm text-gray-500">
                              {source.sessions.toLocaleString()} ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                              className="bg-purple-500 h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">データがありません</p>
                )}
              </div>
            </div>

            {/* 人気ページ */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">人気ページ</h2>
              {data.pages.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">順位</th>
                        <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">ページ</th>
                        <th className="text-right py-3 px-2 text-sm font-medium text-gray-500">PV</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.pages.map((page, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-2 text-sm text-gray-900">{index + 1}</td>
                          <td className="py-3 px-2 text-sm text-gray-900 font-mono">{page.path}</td>
                          <td className="py-3 px-2 text-sm text-gray-900 text-right">
                            {page.pageViews.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">データがありません</p>
              )}
            </div>

            {/* 期間情報 */}
            <div className="text-center text-sm text-gray-500">
              期間: {data.startDate} 〜 {data.endDate}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
