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
  const [activeTab, setActiveTab] = useState<'ga4' | 'clarity'>('ga4');
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
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

          {/* 期間選択（GA4タブのみ表示） */}
          {activeTab === 'ga4' && (
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
          )}
        </div>

        {/* タブメニュー */}
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('ga4')}
            className={`px-6 py-2.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'ga4'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93s3.05-7.44 7-7.93v15.86zm2-15.86c1.03.13 2 .45 2.87.93H13v-.93zM13 7h5.24c.25.31.48.65.68 1H13V7zm0 3h6.74c.08.33.15.66.19 1H13v-1zm0 9.93V19h2.87c-.87.48-1.84.8-2.87.93zM18.24 17H13v-1h5.92c-.2.35-.43.69-.68 1zm1.5-3H13v-1h6.93c-.04.34-.11.67-.19 1z"/>
              </svg>
              Google Analytics
            </span>
          </button>
          <button
            onClick={() => setActiveTab('clarity')}
            className={`px-6 py-2.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'clarity'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Microsoft Clarity
            </span>
          </button>
        </div>

        {/* GA4タブ */}
        {activeTab === 'ga4' && (
          <>
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
          </>
        )}

        {/* Clarityタブ */}
        {activeTab === 'clarity' && (
          <div className="space-y-6">
            {/* Clarity概要 */}
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Microsoft Clarity</h2>
                  <p className="text-gray-500">ヒートマップ・セッション録画・行動分析</p>
                </div>
              </div>
              <p className="text-gray-600 mb-6">
                Microsoft Clarityでは、ユーザーのクリック位置、スクロール行動、セッション録画を確認できます。<br />
                実際のユーザー行動を視覚的に分析し、UI/UXの改善に役立てることができます。
              </p>
            </div>

            {/* クイックリンク */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a
                href="https://clarity.microsoft.com/projects/view/v7cwgizw86/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow group"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  ダッシュボード
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </h3>
                <p className="text-sm text-gray-500">全体の概要とKPIを確認</p>
              </a>

              <a
                href="https://clarity.microsoft.com/projects/view/v7cwgizw86/heatmaps"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow group"
              >
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  ヒートマップ
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </h3>
                <p className="text-sm text-gray-500">クリック・スクロールの可視化</p>
              </a>

              <a
                href="https://clarity.microsoft.com/projects/view/v7cwgizw86/recordings"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow group"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  セッション録画
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </h3>
                <p className="text-sm text-gray-500">実際のユーザー操作を再生</p>
              </a>
            </div>

            {/* 追加機能リンク */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">その他の機能</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <a
                  href="https://clarity.microsoft.com/projects/view/v7cwgizw86/scrollmaps"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-sm text-gray-700"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  スクロールマップ
                </a>
                <a
                  href="https://clarity.microsoft.com/projects/view/v7cwgizw86/insights"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-sm text-gray-700"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  インサイト
                </a>
                <a
                  href="https://clarity.microsoft.com/projects/view/v7cwgizw86/funnels"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-sm text-gray-700"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  ファネル
                </a>
                <a
                  href="https://clarity.microsoft.com/projects/view/v7cwgizw86/settings"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-sm text-gray-700"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  設定
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
