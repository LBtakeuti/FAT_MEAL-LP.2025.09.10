'use client';

import React, { useState, useEffect } from 'react';

interface Order {
  id: string;
  order_number: number;
  customer_name: string;
  customer_name_kana: string;
  customer_email: string;
  phone: string;
  postal_code: string;
  prefecture: string;
  city: string;
  address_detail: string;
  building: string;
  address: string;
  menu_set: string;
  quantity: number;
  email?: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  created_at: string;
}

interface Subscription {
  id: string;
  customer_name: string;
  customer_email: string;
  plan_name: string;
  monthly_total_amount: number;
  status: string;
  started_at: string;
  next_delivery_date: string | null;
  delivery_progress: {
    total: number;
    completed: number;
    pending: number;
    next_delivery: { date: string; menu_set: string } | null;
  };
}

const getJSTToday = () => {
  const jstOffset = 9 * 60 * 60 * 1000;
  const jst = new Date(Date.now() + jstOffset);
  return jst.toISOString().slice(0, 10);
};

export default function AdminOrdersPage() {
  const [activeTab, setActiveTab] = useState<'one-time' | 'subscription'>('one-time');

  // 買い切り
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'shipped'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());

  // サブスクリプション
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [subsLoading, setSubsLoading] = useState(false);
  const [subsLoaded, setSubsLoaded] = useState(false);
  const [selectedSubIds, setSelectedSubIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (activeTab === 'subscription' && !subsLoaded) {
      fetchSubscriptions();
    }
  }, [activeTab]);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/admin/orders');
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    setSubsLoading(true);
    try {
      const response = await fetch('/api/admin/subscriptions');
      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data);
        setSubsLoaded(true);
      }
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
    } finally {
      setSubsLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    setUpdatingId(orderId);
    try {
      const response = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });
      if (response.ok) {
        setOrders(orders.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        ));
      } else {
        alert('ステータスの更新に失敗しました');
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('ステータスの更新に失敗しました');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    setDeletingId(orderId);
    try {
      const response = await fetch(`/api/admin/orders?id=${orderId}`, { method: 'DELETE' });
      if (response.ok) {
        setDeleteConfirmId(null);
        setExpandedOrderId(null);
        await fetchOrders();
      } else {
        alert('注文の削除に失敗しました');
      }
    } catch (error) {
      console.error('Failed to delete order:', error);
      alert('注文の削除に失敗しました');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadgeClass = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'shipped':
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSubStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'canceled': return 'bg-red-100 text-red-800';
      case 'past_due': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const translateSubStatus = (status: string) => {
    switch (status) {
      case 'active': return 'アクティブ';
      case 'paused': return '一時停止';
      case 'canceled': return '解約済み';
      case 'past_due': return '支払い遅延';
      default: return status;
    }
  };

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter(order => {
        if (filter === 'pending') return order.status === 'pending';
        if (filter === 'confirmed') return order.status === 'confirmed';
        if (filter === 'shipped') return order.status === 'shipped' || order.status === 'delivered';
        return true;
      });

  // 買い切りチェックボックス操作
  const toggleOrderSelect = (id: string) => {
    setSelectedOrderIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAllOrders = () => {
    if (selectedOrderIds.size === filteredOrders.length) {
      setSelectedOrderIds(new Set());
    } else {
      setSelectedOrderIds(new Set(filteredOrders.map(o => o.id)));
    }
  };

  // サブスクリプションチェックボックス操作
  const toggleSubSelect = (id: string) => {
    setSelectedSubIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAllSubs = () => {
    if (selectedSubIds.size === subscriptions.length) {
      setSelectedSubIds(new Set());
    } else {
      setSelectedSubIds(new Set(subscriptions.map(s => s.id)));
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">注文管理</h1>

      {/* 内タブ */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('one-time')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'one-time'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          買い切り（お試しプラン）
        </button>
        <button
          onClick={() => setActiveTab('subscription')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'subscription'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          サブスクリプション（定期プラン）
        </button>
      </div>

      {/* 買い切りタブ */}
      {activeTab === 'one-time' && (
        <>
          {ordersLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-600">読み込み中...</div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg text-sm ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                    すべて ({orders.length})
                  </button>
                  <button onClick={() => setFilter('pending')} className={`px-4 py-2 rounded-lg text-sm ${filter === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                    注文受付 ({orders.filter(o => o.status === 'pending').length})
                  </button>
                  <button onClick={() => setFilter('confirmed')} className={`px-4 py-2 rounded-lg text-sm ${filter === 'confirmed' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                    連絡済み ({orders.filter(o => o.status === 'confirmed').length})
                  </button>
                  <button onClick={() => setFilter('shipped')} className={`px-4 py-2 rounded-lg text-sm ${filter === 'shipped' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                    発送済み ({orders.filter(o => o.status === 'shipped' || o.status === 'delivered').length})
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { window.location.href = `/api/admin/orders/export-csv?date=${getJSTToday()}`; }}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    本日分CSV出力
                  </button>
                  <button
                    onClick={() => {
                      const ids = [...selectedOrderIds].join(',');
                      window.location.href = `/api/admin/orders/export-csv?ids=${ids}`;
                    }}
                    disabled={selectedOrderIds.size === 0}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    選択CSV出力 ({selectedOrderIds.size})
                  </button>
                  <button
                    onClick={() => { window.location.href = '/api/admin/orders/export-csv'; }}
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                  >
                    CSV出力（全件）
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={filteredOrders.length > 0 && selectedOrderIds.size === filteredOrders.length}
                            onChange={toggleAllOrders}
                            className="rounded border-gray-300"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">注文番号</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">氏名</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">メール</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">セット内容</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金額</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">注文日時</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="px-6 py-12 text-center text-gray-500">注文がありません</td>
                        </tr>
                      ) : (
                        filteredOrders.map((order) => (
                          <React.Fragment key={order.id}>
                            <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}>
                              <td className="px-3 py-4" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={selectedOrderIds.has(order.id)}
                                  onChange={() => toggleOrderSelect(order.id)}
                                  className="rounded border-gray-300"
                                />
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                <span className="flex items-center gap-2">
                                  <svg className={`w-4 h-4 transition-transform ${expandedOrderId === order.id ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                  #{order.order_number}
                                </span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{order.customer_name}</td>
                              <td className="px-4 py-4 text-sm text-gray-900">{order.customer_email || order.email}</td>
                              <td className="px-4 py-4 text-sm text-gray-900 max-w-xs">
                                <div className="truncate" title={order.menu_set}>{order.menu_set}</div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">¥{order.amount?.toLocaleString() || '-'}</td>
                              <td className="px-4 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                <select
                                  value={order.status}
                                  onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                                  disabled={updatingId === order.id}
                                  className={`text-sm rounded-lg border-gray-300 focus:ring-orange-500 focus:border-orange-500 ${getStatusBadgeClass(order.status)} ${updatingId === order.id ? 'opacity-50' : ''}`}
                                >
                                  <option value="pending">注文受付</option>
                                  <option value="confirmed">連絡済み</option>
                                  <option value="shipped">発送済み</option>
                                </select>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(order.created_at).toLocaleString('ja-JP')}</td>
                              <td className="px-4 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                {deleteConfirmId === order.id ? (
                                  <div className="flex items-center gap-2">
                                    <button onClick={() => handleDeleteOrder(order.id)} disabled={deletingId === order.id} className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50">
                                      {deletingId === order.id ? '削除中' : '確定'}
                                    </button>
                                    <button onClick={() => setDeleteConfirmId(null)} className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300">取消</button>
                                  </div>
                                ) : (
                                  <button onClick={() => setDeleteConfirmId(order.id)} className="px-3 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200">削除</button>
                                )}
                              </td>
                            </tr>
                            {expandedOrderId === order.id && (
                              <tr className="bg-gray-50">
                                <td colSpan={9} className="px-6 py-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white rounded-lg p-4 shadow-sm">
                                      <h4 className="font-semibold text-gray-900 mb-3 border-b pb-2">お客様情報</h4>
                                      <dl className="space-y-2 text-sm">
                                        <div className="flex"><dt className="w-24 text-gray-500">お名前</dt><dd className="text-gray-900">{order.customer_name}</dd></div>
                                        {order.customer_name_kana && <div className="flex"><dt className="w-24 text-gray-500">フリガナ</dt><dd className="text-gray-900">{order.customer_name_kana}</dd></div>}
                                        <div className="flex"><dt className="w-24 text-gray-500">メール</dt><dd className="text-gray-900">{order.customer_email || order.email}</dd></div>
                                        <div className="flex"><dt className="w-24 text-gray-500">電話番号</dt><dd className="text-gray-900">{order.phone || '-'}</dd></div>
                                      </dl>
                                    </div>
                                    <div className="bg-white rounded-lg p-4 shadow-sm">
                                      <h4 className="font-semibold text-gray-900 mb-3 border-b pb-2">配送先</h4>
                                      <dl className="space-y-2 text-sm">
                                        <div className="flex"><dt className="w-24 text-gray-500">郵便番号</dt><dd className="text-gray-900">〒{order.postal_code || '-'}</dd></div>
                                        <div className="flex">
                                          <dt className="w-24 text-gray-500">住所</dt>
                                          <dd className="text-gray-900">
                                            {order.prefecture || order.city || order.address_detail ? (
                                              <>{order.prefecture}{order.city}{order.address_detail}{order.building && <><br />{order.building}</>}</>
                                            ) : (order.address || '-')}
                                          </dd>
                                        </div>
                                      </dl>
                                    </div>
                                  </div>
                                  <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
                                    {deleteConfirmId === order.id ? (
                                      <div className="flex items-center gap-3">
                                        <span className="text-sm text-red-600">本当に削除しますか？</span>
                                        <button onClick={() => handleDeleteOrder(order.id)} disabled={deletingId === order.id} className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50">
                                          {deletingId === order.id ? '削除中...' : '削除する'}
                                        </button>
                                        <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300">キャンセル</button>
                                      </div>
                                    ) : (
                                      <button onClick={() => setDeleteConfirmId(order.id)} className="px-4 py-2 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200">この注文を削除</button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* サブスクリプションタブ */}
      {activeTab === 'subscription' && (
        <>
          {subsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-600">読み込み中...</div>
            </div>
          ) : (
            <>
              <div className="flex justify-end items-center mb-4 gap-2">
                <button
                  onClick={() => { window.location.href = `/api/admin/subscriptions/export-csv?date=${getJSTToday()}`; }}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  本日分CSV出力
                </button>
                <button
                  onClick={() => {
                    const ids = [...selectedSubIds].join(',');
                    window.location.href = `/api/admin/subscriptions/export-csv?ids=${ids}`;
                  }}
                  disabled={selectedSubIds.size === 0}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  選択CSV出力 ({selectedSubIds.size})
                </button>
                <button
                  onClick={() => { window.location.href = '/api/admin/subscriptions/export-csv'; }}
                  className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                >
                  CSV出力（全件）
                </button>
              </div>

              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={subscriptions.length > 0 && selectedSubIds.size === subscriptions.length}
                            onChange={toggleAllSubs}
                            className="rounded border-gray-300"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">お客様</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">プラン</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">月額</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">配送進捗</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">次回配送</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">契約開始日</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {subscriptions.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center text-gray-500">サブスクリプションがありません</td>
                        </tr>
                      ) : (
                        subscriptions.map((sub) => (
                          <tr key={sub.id} className="hover:bg-gray-50">
                            <td className="px-3 py-4">
                              <input
                                type="checkbox"
                                checked={selectedSubIds.has(sub.id)}
                                onChange={() => toggleSubSelect(sub.id)}
                                className="rounded border-gray-300"
                              />
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{sub.customer_name}</div>
                              <div className="text-xs text-gray-500">{sub.customer_email}</div>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900">{sub.plan_name}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">¥{sub.monthly_total_amount?.toLocaleString() || '-'}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                              {sub.delivery_progress ? (
                                <span>{sub.delivery_progress.completed} / {sub.delivery_progress.total} 回</span>
                              ) : '-'}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                              {sub.delivery_progress?.next_delivery?.date
                                ? new Date(sub.delivery_progress.next_delivery.date).toLocaleDateString('ja-JP')
                                : (sub.next_delivery_date ? new Date(sub.next_delivery_date).toLocaleDateString('ja-JP') : '-')}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs rounded-full font-medium ${getSubStatusBadgeClass(sub.status)}`}>
                                {translateSubStatus(sub.status)}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(sub.started_at).toLocaleDateString('ja-JP')}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
