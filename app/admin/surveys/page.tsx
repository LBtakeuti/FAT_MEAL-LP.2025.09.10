'use client';

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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

  const renderChart = (title: string, items: AggregatedItem[]) => (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
      <div className="mb-4" style={{ height: Math.max(250, items.length * 32) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={items} layout="vertical" margin={{ left: 200, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis type="category" dataKey="label" width={190} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value) => [`${value}件`, '回答数']} />
            <Bar dataKey="count" fill={activeTab === 'purchase' ? '#f97316' : '#ef4444'} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            {items.some(i => i.category) && (
              <th className="text-left py-2 text-gray-600">カテゴリ</th>
            )}
            <th className="text-left py-2 text-gray-600">選択肢</th>
            <th className="text-right py-2 text-gray-600">回答数</th>
            <th className="text-right py-2 text-gray-600">割合</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.value} className="border-b border-gray-100">
              {items.some(i => i.category) && (
                <td className="py-2 text-gray-500 text-xs">{item.category || '-'}</td>
              )}
              <td className="py-2 text-gray-900">{item.label}</td>
              <td className="text-right py-2 font-medium">{item.count}件</td>
              <td className="text-right py-2 text-gray-600">{item.percentage}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

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
          <div className={`border rounded-lg p-4 mb-6 ${
            activeTab === 'purchase'
              ? 'bg-orange-50 border-orange-200'
              : 'bg-red-50 border-red-200'
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

          {activeTab === 'purchase' && surveyData && (
            <>
              {renderChart('Q1. ふとるめしを何で知りましたか？', surveyData.aggregated.q1)}
              {renderChart('Q2. どなたが食べますか？', surveyData.aggregated.q2)}
              {renderChart('Q3. ふとるめしに期待することは？', surveyData.aggregated.q3)}
            </>
          )}

          {activeTab === 'cancellation' && cancelData && (
            <>{renderChart('解約理由', cancelData.aggregated)}</>
          )}
        </>
      )}
    </div>
  );
}
