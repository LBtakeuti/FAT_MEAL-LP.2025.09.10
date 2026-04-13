'use client';

import { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface AggregatedItem {
  value: string;
  label: string;
  count: number;
  percentage: number;
  category?: string;
}

interface SurveyData {
  totalCount: number;
  aggregated: {
    q1: AggregatedItem[];
    q2: AggregatedItem[];
    q3: AggregatedItem[];
  };
}

interface CancellationData {
  totalCount: number;
  aggregated: AggregatedItem[];
}

type Tab = 'purchase' | 'cancellation';

const COLORS = [
  '#f97316', '#3b82f6', '#10b981', '#8b5cf6',
  '#ef4444', '#f59e0b', '#06b6d4', '#ec4899',
];

export default function SurveysPage() {
  const [activeTab, setActiveTab] = useState<Tab>('purchase');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
  const [cancelData, setCancelData] = useState<CancellationData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo) params.set('to', dateTo);

      if (activeTab === 'purchase') {
        const res = await fetch(`/api/admin/surveys?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          setSurveyData(json);
        }
      } else {
        const res = await fetch(`/api/admin/cancellations?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          setCancelData(json);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleFilter = () => {
    fetchData();
  };

  const handleExportCSV = () => {
    const params = new URLSearchParams();
    if (dateFrom) params.set('from', dateFrom);
    if (dateTo) params.set('to', dateTo);
    const endpoint = activeTab === 'purchase'
      ? '/api/admin/surveys/export-csv'
      : '/api/admin/cancellations/export-csv';
    window.location.href = `${endpoint}?${params.toString()}`;
  };

  const renderDonutCard = (title: string, items: AggregatedItem[]) => {
    const sorted = [...items].sort((a, b) => b.count - a.count);
    const hasData = sorted.some(item => item.count > 0);
    const totalAnswers = sorted.reduce((sum, item) => sum + item.count, 0);

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-sm font-bold text-gray-700 mb-4 leading-snug">{title}</h3>

        {!hasData ? (
          <p className="text-center text-gray-400 text-sm py-8">データなし</p>
        ) : (
          <>
            {/* ドーナツチャート */}
            <div className="relative mx-auto" style={{ width: 180, height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sorted.filter(i => i.count > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="count"
                    stroke="none"
                  >
                    {sorted.filter(i => i.count > 0).map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, _, entry: any) => [
                      `${value}件 (${entry.payload.percentage}%)`,
                      entry.payload.label,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* 中央の回答数 */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-gray-900">{totalAnswers}</span>
                <span className="text-[10px] text-gray-400">回答</span>
              </div>
            </div>

            {/* ランキング */}
            <div className="mt-4 space-y-2">
              {sorted.map((item, idx) => {
                const rank = idx + 1;
                const isTop = rank <= 3 && item.count > 0;
                return (
                  <div key={item.value} className="flex items-center gap-2">
                    {/* 順位バッジ */}
                    <span
                      className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        item.count === 0
                          ? 'bg-gray-100 text-gray-300'
                          : isTop
                          ? 'text-white'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                      style={item.count > 0 && isTop ? { backgroundColor: COLORS[idx % COLORS.length] } : undefined}
                    >
                      {rank}
                    </span>
                    {/* ラベル */}
                    <span className={`flex-1 text-sm truncate ${item.count === 0 ? 'text-gray-300' : 'text-gray-700'}`}>
                      {item.label}
                    </span>
                    {/* 件数＋バー */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${item.percentage}%`,
                            backgroundColor: item.count > 0 ? COLORS[idx % COLORS.length] : 'transparent',
                          }}
                        />
                      </div>
                      <span className={`text-xs font-medium w-8 text-right ${item.count === 0 ? 'text-gray-300' : 'text-gray-600'}`}>
                        {item.count}件
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  };

  const totalCount = activeTab === 'purchase' ? (surveyData?.totalCount || 0) : (cancelData?.totalCount || 0);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">アンケート集計</h1>
        <button
          onClick={handleExportCSV}
          disabled={totalCount === 0}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
        >
          CSV エクスポート
        </button>
      </div>

      {/* タブ */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('purchase')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'purchase'
              ? 'text-orange-600 border-b-2 border-orange-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          購入時アンケート
        </button>
        <button
          onClick={() => setActiveTab('cancellation')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'cancellation'
              ? 'text-red-600 border-b-2 border-red-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          解約理由
        </button>
      </div>

      {/* フィルター */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs text-gray-600 mb-1">開始日</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">終了日</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <button
          onClick={handleFilter}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
        >
          絞り込み
        </button>
        {(dateFrom || dateTo) && (
          <button
            onClick={() => { setDateFrom(''); setDateTo(''); setTimeout(fetchData, 0); }}
            className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            リセット
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">読み込み中...</div>
      ) : totalCount === 0 ? (
        <div className="text-center py-12 text-gray-500">
          該当期間のデータがありません
        </div>
      ) : (
        <>
          {/* サマリー */}
          <div className={`rounded-xl p-4 mb-6 ${
            activeTab === 'purchase'
              ? 'bg-orange-50 border border-orange-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            <p className={`text-sm ${activeTab === 'purchase' ? 'text-orange-800' : 'text-red-800'}`}>
              合計 <span className="font-bold text-lg">{totalCount}</span> 件
              {activeTab === 'purchase' ? 'の回答' : 'の解約'}
              {dateFrom && dateTo && (
                <span className="ml-2 opacity-75">
                  （{dateFrom} 〜 {dateTo}）
                </span>
              )}
            </p>
          </div>

          {/* ドーナツチャート 3列 */}
          {activeTab === 'purchase' && surveyData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {renderDonutCard('Q1. ふとるめしを何で知りましたか？', surveyData.aggregated.q1)}
              {renderDonutCard('Q2. どなたが食べますか？', surveyData.aggregated.q2)}
              {renderDonutCard('Q3. ふとるめしに期待することは？', surveyData.aggregated.q3)}
            </div>
          )}

          {activeTab === 'cancellation' && cancelData && (
            <div className="max-w-md mx-auto">
              {renderDonutCard('解約理由', cancelData.aggregated)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
