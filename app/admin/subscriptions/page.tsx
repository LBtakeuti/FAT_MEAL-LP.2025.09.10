'use client';

import React, { useState, useEffect } from 'react';

interface DeliveryProgress {
  total: number;
  completed: number;
  pending: number;
  next_delivery: {
    date: string;
    menu_set: string;
  } | null;
}

interface Subscription {
  id: string;
  customer_name: string;
  customer_email: string;
  plan_name: string;
  plan_id: string;
  meals_per_delivery: number;
  deliveries_per_month: number;
  monthly_total_amount: number;
  next_delivery_date: string | null;
  preferred_delivery_date: string | null;
  status: 'active' | 'paused' | 'canceled' | 'past_due';
  payment_status: 'active' | 'past_due' | 'canceled' | 'unpaid';
  started_at: string;
  canceled_at: string | null;
  shipping_address: {
    name?: string;
    email?: string;
    phone?: string;
    postal_code?: string;
    prefecture?: string;
    city?: string;
    address_detail?: string;
    building?: string;
  };
  delivery_progress?: DeliveryProgress;
}

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'canceled'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch('/api/admin/subscriptions');
      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data);
      }
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    window.location.href = '/api/admin/subscriptions/export-csv';
  };

  const filteredSubscriptions = filter === 'all'
    ? subscriptions
    : subscriptions.filter(sub => {
        if (filter === 'active') return sub.status === 'active';
        if (filter === 'canceled') return sub.status === 'canceled';
        return true;
      });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ja-JP');
  };

  const getStatusBadge = (status: string, paymentStatus: string) => {
    if (status === 'canceled') {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">解約済み</span>;
    }
    if (paymentStatus === 'past_due' || status === 'past_due') {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">支払い遅延</span>;
    }
    if (status === 'paused') {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">一時停止</span>;
    }
    return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">アクティブ</span>;
  };

  const getDeliveryFrequencyLabel = (deliveriesPerMonth: number) => {
    switch (deliveriesPerMonth) {
      case 1: return '月1回';
      case 2: return '月2回';
      case 4: return '月4回';
      default: return `月${deliveriesPerMonth}回`;
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">読み込み中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">サブスクリプション管理</h1>
        <button
          onClick={handleExportCSV}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          CSV出力
        </button>
      </div>

      {/* 統計サマリー */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">アクティブ</div>
          <div className="text-2xl font-bold text-green-600">
            {subscriptions.filter(s => s.status === 'active').length}件
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">支払い遅延</div>
          <div className="text-2xl font-bold text-red-600">
            {subscriptions.filter(s => s.payment_status === 'past_due' || s.status === 'past_due').length}件
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">解約済み</div>
          <div className="text-2xl font-bold text-gray-600">
            {subscriptions.filter(s => s.status === 'canceled').length}件
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">月間収益（アクティブ）</div>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(
              subscriptions
                .filter(s => s.status === 'active')
                .reduce((sum, s) => sum + (s.monthly_total_amount || 0), 0)
            )}
          </div>
        </div>
      </div>

      {/* フィルター */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          すべて ({subscriptions.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'active'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          アクティブ ({subscriptions.filter(s => s.status === 'active').length})
        </button>
        <button
          onClick={() => setFilter('canceled')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'canceled'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          解約済み ({subscriptions.filter(s => s.status === 'canceled').length})
        </button>
      </div>

      {/* 一覧テーブル */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  お客様
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  プラン
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  月額
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  配送進捗
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  次回配送
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  契約開始日
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    サブスクリプションがありません
                  </td>
                </tr>
              ) : (
                filteredSubscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {sub.id.slice(0, 8)}...
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{sub.shipping_address?.name || sub.customer_name}</div>
                        <div className="text-xs text-gray-500">{sub.shipping_address?.email || sub.customer_email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{sub.plan_name}</div>
                        <div className="text-xs text-gray-500">
                          {sub.meals_per_delivery}食/回 × {getDeliveryFrequencyLabel(sub.deliveries_per_month)}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(sub.monthly_total_amount || 0)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sub.delivery_progress ? (
                        <div>
                          <div className="font-medium">
                            {sub.delivery_progress.completed}/{sub.delivery_progress.total}回 完了
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{
                                width: sub.delivery_progress.total > 0
                                  ? `${(sub.delivery_progress.completed / sub.delivery_progress.total) * 100}%`
                                  : '0%'
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        {sub.delivery_progress?.next_delivery ? (
                          <>
                            <div>{formatDate(sub.delivery_progress.next_delivery.date)}</div>
                            <div className="text-xs text-gray-500">
                              {sub.delivery_progress.next_delivery.menu_set}
                            </div>
                          </>
                        ) : (
                          <span className="text-gray-400">配送完了</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {getStatusBadge(sub.status, sub.payment_status)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <div>{formatDate(sub.started_at)}</div>
                        {sub.canceled_at && (
                          <div className="text-xs text-red-500">
                            解約: {formatDate(sub.canceled_at)}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
