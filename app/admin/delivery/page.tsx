'use client';

import React, { useState, useEffect, useCallback } from 'react';

type DeliveryItem = {
  id: string;
  source: 'subscription' | 'order';
  date: string;
  customer_name: string;
  customer_email: string;
  phone: string;
  postal_code: string;
  prefecture: string;
  city: string;
  address_detail: string;
  building: string;
  plan_name: string;
  menu_set: string;
  meals_per_delivery: number;
  quantity: number;
  status: string;
  subscription_id?: string;
  delivery_number?: number;
};

const getJSTToday = () => {
  const jstOffset = 9 * 60 * 60 * 1000;
  return new Date(Date.now() + jstOffset).toISOString().slice(0, 10);
};

const getMonthRange = (year: number, month: number) => {
  const from = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { from, to };
};

export default function AdminDeliveryPage() {
  const today = getJSTToday();
  const nowJST = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const [year, setYear] = useState(nowJST.getUTCFullYear());
  const [month, setMonth] = useState(nowJST.getUTCMonth() + 1);

  const [items, setItems] = useState<DeliveryItem[]>([]);
  const [overdueCount, setOverdueCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<'' | 'subscription' | 'order'>('');
  const [statusFilter, setStatusFilter] = useState<'' | 'pending' | 'shipped'>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchDeliveries = useCallback(async () => {
    setLoading(true);
    setSelectedIds(new Set());
    try {
      const { from, to } = getMonthRange(year, month);
      const params = new URLSearchParams({ from, to });
      if (sourceFilter) params.set('source', sourceFilter);
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/admin/delivery?${params}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
        setOverdueCount(data.overdueCount);
      }
    } catch (err) {
      console.error('Failed to fetch deliveries:', err);
    } finally {
      setLoading(false);
    }
  }, [year, month, sourceFilter, statusFilter]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === items.length && items.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map(i => i.id)));
    }
  };

  const handleExportCSV = () => {
    const subIds = items
      .filter(i => i.source === 'subscription' && selectedIds.has(i.id))
      .map(i => i.id)
      .join(',');
    const orderIds = items
      .filter(i => i.source === 'order' && selectedIds.has(i.id))
      .map(i => i.id)
      .join(',');
    const params = new URLSearchParams();
    if (subIds) params.set('sub_ids', subIds);
    if (orderIds) params.set('order_ids', orderIds);
    window.location.href = `/api/admin/delivery/export-csv?${params}`;
  };

  const sortedItems = sortOrder === 'asc'
    ? [...items].sort((a, b) => a.date.localeCompare(b.date))
    : [...items].sort((a, b) => b.date.localeCompare(a.date));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700 font-medium">未発送</span>;
      case 'confirmed': return <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800 font-medium">確認済</span>;
      case 'shipped': return <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800 font-medium">発送済</span>;
      default: return <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 font-medium">{status}</span>;
    }
  };

  const getSourceBadge = (source: 'subscription' | 'order') => {
    if (source === 'subscription') {
      return <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-800 font-medium">サブスク</span>;
    }
    return <span className="px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-800 font-medium">買い切り</span>;
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">配送管理</h1>

      {/* リマインダーバナー */}
      {overdueCount > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center gap-2 mb-4">
          <svg className="text-orange-500 flex-shrink-0 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <span className="text-sm text-orange-800">
            未発送の期限切れ配送が <strong>{overdueCount}</strong> 件あります
          </span>
          <button
            onClick={() => setStatusFilter('pending')}
            className="ml-2 text-xs text-orange-600 underline hover:text-orange-800"
          >
            未発送を表示
          </button>
        </div>
      )}

      {/* フィルター行 */}
      <div className="flex flex-wrap gap-3 items-center mb-4">
        {/* 月切り替え */}
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm">‹</button>
          <span className="px-3 py-1 text-sm font-medium text-gray-700 min-w-[90px] text-center">
            {year}年{month}月
          </span>
          <button onClick={nextMonth} className="px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm">›</button>
        </div>

        {/* 種別フィルター */}
        <div className="flex gap-1">
          {(['', 'subscription', 'order'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setSourceFilter(v)}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                sourceFilter === v
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {v === '' ? '全て' : v === 'subscription' ? 'サブスク' : '買い切り'}
            </button>
          ))}
        </div>

        {/* ステータスフィルター */}
        <div className="flex gap-1">
          {(['', 'pending', 'shipped'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setStatusFilter(v)}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                statusFilter === v
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {v === '' ? '全ステータス' : v === 'pending' ? '未発送' : '発送済み'}
            </button>
          ))}
        </div>

        {/* CSV出力ボタン */}
        <div className="ml-auto">
          <button
            onClick={handleExportCSV}
            disabled={selectedIds.size === 0}
            className="px-4 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            配送用CSV出力 ({selectedIds.size})
          </button>
        </div>
      </div>

      {/* テーブル */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">読み込み中...</div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={items.length > 0 && selectedIds.size === items.length}
                      onChange={toggleAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
                      className="flex items-center gap-1 hover:text-gray-800 transition-colors"
                    >
                      配送日
                      <span className="text-gray-400">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">種別</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">お客様名</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">プラン / セット</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">個数</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">配送回数</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      該当する配送データがありません
                    </td>
                  </tr>
                ) : (
                  sortedItems.map((item) => {
                    const isOverdue = item.date <= today && item.status !== 'shipped';
                    return (
                      <tr
                        key={`${item.source}-${item.id}`}
                        className={`hover:bg-gray-50 ${isOverdue ? 'bg-orange-50' : ''}`}
                      >
                        <td className="px-3 py-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(item.id)}
                            onChange={() => toggleSelect(item.id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.date}
                          {isOverdue && (
                            <span className="ml-1 text-orange-500 text-xs">⚠</span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {getSourceBadge(item.source)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>{item.customer_name}</div>
                          {item.customer_email && (
                            <div className="text-xs text-gray-500">{item.customer_email}</div>
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900 max-w-xs">
                          <div className="truncate" title={item.plan_name}>{item.plan_name}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.quantity}個
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {getStatusBadge(item.status)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                          {item.source === 'subscription' && item.delivery_number != null
                            ? `${item.delivery_number}回目`
                            : '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
