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
  status: 'order_received' | 'notified' | 'shipped' | 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  created_at: string;
}

interface SubscriptionDelivery {
  id: string;
  status: string;
  scheduled_date: string;
  menu_set: string;
  carrier_notified_at: string | null;
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
  delivery_progress?: {
    total: number;
    completed: number;
    pending: number;
    next_delivery: { date: string; menu_set: string } | null;
  };
  subscription_deliveries?: SubscriptionDelivery[];
}

// JST基準で配送予定日までの残り日数を計算
function getDaysUntilDelivery(scheduledDate: string): number {
  const jstOffset = 9 * 60 * 60 * 1000;
  const now = new Date(Date.now() + jstOffset);
  const today = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const delivery = new Date(scheduledDate);
  return Math.floor((delivery.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getDeliveryReminderStatus(scheduledDate: string): 'today' | 'soon' | 'normal' | 'overdue' {
  const diff = getDaysUntilDelivery(scheduledDate);
  if (diff < 0) return 'overdue';
  if (diff === 0) return 'today';
  if (diff <= 3) return 'soon';
  return 'normal';
}

export default function AdminOrdersPage() {
  const [activeTab, setActiveTab] = useState<'one-time' | 'subscription'>('one-time');

  // 買い切り注文
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'order_received' | 'notified' | 'shipped'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // サブスクリプション
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [subFilter, setSubFilter] = useState<'all' | 'active' | 'canceled'>('all');
  const [subsLoading, setSubsLoading] = useState(false);
  const [subsLoaded, setSubsLoaded] = useState(false);
  const [notifyingDeliveryId, setNotifyingDeliveryId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (activeTab === 'subscription' && !subsLoaded) {
      fetchSubscriptions();
    }
  }, [activeTab, subsLoaded]);

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

  const handleMarkCarrierNotified = async (deliveryId: string) => {
    setNotifyingDeliveryId(deliveryId);
    try {
      const response = await fetch('/api/admin/subscriptions/deliveries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deliveryId }),
      });
      if (response.ok) {
        setSubscriptions(subscriptions.map(sub => ({
          ...sub,
          subscription_deliveries: sub.subscription_deliveries?.map(d =>
            d.id === deliveryId ? { ...d, carrier_notified_at: new Date().toISOString() } : d
          ),
        })));
      } else {
        alert('更新に失敗しました');
      }
    } catch (error) {
      console.error('Failed to mark notified:', error);
      alert('更新に失敗しました');
    } finally {
      setNotifyingDeliveryId(null);
    }
  };

  const getStatusBadgeClass = (status: Order['status']) => {
    switch (status) {
      case 'order_received':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'notified':
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter(order => {
        if (filter === 'order_received') return order.status === 'pending';
        if (filter === 'notified') return order.status === 'confirmed';
        if (filter === 'shipped') return order.status === 'shipped' || order.status === 'delivered';
        return order.status === filter;
      });

  const filteredSubscriptions = subFilter === 'all'
    ? subscriptions
    : subscriptions.filter(sub => {
        if (subFilter === 'active') return sub.status === 'active';
        if (subFilter === 'canceled') return sub.status === 'canceled';
        return true;
      });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ja-JP');
  };

  const getSubStatusBadge = (status: string, paymentStatus: string) => {
    if (status === 'canceled') return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">解約済み</span>;
    if (paymentStatus === 'past_due' || status === 'past_due') return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">支払い遅延</span>;
    if (status === 'paused') return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">一時停止</span>;
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

  const getDeliveryReminderBadge = (delivery: SubscriptionDelivery) => {
    if (delivery.status !== 'pending') return null;
    if (delivery.carrier_notified_at) return null;
    const reminderStatus = getDeliveryReminderStatus(delivery.scheduled_date);
    switch (reminderStatus) {
      case 'overdue':
        return <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-red-700 text-white">対応遅れ</span>;
      case 'today':
        return <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-red-500 text-white">本日連絡</span>;
      case 'soon':
        return <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-orange-400 text-white">3日後配送</span>;
      default:
        return null;
    }
  };

  // アラートバナー用：要対応の配送（3日以内 or 当日 or 超過、carrier_notified_at未設定）
  const alertDeliveries: Array<{ sub: Subscription; delivery: SubscriptionDelivery; reminderStatus: string; daysLeft: number }> = [];
  subscriptions.forEach(sub => {
    if (sub.status === 'canceled') return;
    sub.subscription_deliveries?.forEach(d => {
      if (d.status !== 'pending') return;
      if (d.carrier_notified_at) return;
      const diff = getDaysUntilDelivery(d.scheduled_date);
      if (diff <= 3) {
        alertDeliveries.push({ sub, delivery: d, reminderStatus: getDeliveryReminderStatus(d.scheduled_date), daysLeft: diff });
      }
    });
  });
  alertDeliveries.sort((a, b) => a.daysLeft - b.daysLeft);

  const alertBadgeStyle = (reminderStatus: string) => {
    if (reminderStatus === 'overdue') return 'bg-red-100 border-red-400 text-red-800';
    if (reminderStatus === 'today') return 'bg-red-50 border-red-300 text-red-700';
    return 'bg-orange-50 border-orange-300 text-orange-700';
  };

  const alertLabel = (reminderStatus: string, daysLeft: number) => {
    if (reminderStatus === 'overdue') return `${Math.abs(daysLeft)}日超過 - 対応遅れ`;
    if (reminderStatus === 'today') return '本日配送 - 今すぐ業者へ注文依頼';
    return `${daysLeft}日後配送 - 業者への注文依頼を準備`;
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">注文管理</h1>
        {activeTab === 'one-time' && (
          <button
            onClick={() => window.location.href = '/api/admin/orders/export-csv'}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            CSV出力
          </button>
        )}
        {activeTab === 'subscription' && (
          <button
            onClick={() => window.location.href = '/api/admin/subscriptions/export-csv'}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            CSV出力
          </button>
        )}
      </div>

      {/* 内部タブ */}
      <div className="flex gap-0 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('one-time')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'one-time'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          買い切り
        </button>
        <button
          onClick={() => setActiveTab('subscription')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'subscription'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          サブスクリプション
        </button>
      </div>

      {/* === 買い切りタブ === */}
      {activeTab === 'one-time' && (
        <>
          {ordersLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-600">読み込み中...</div>
            </div>
          ) : (
            <>
              <div className="mb-6 flex gap-2 flex-wrap">
                <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                  すべて ({orders.length})
                </button>
                <button onClick={() => setFilter('order_received')} className={`px-4 py-2 rounded-lg ${filter === 'order_received' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                  注文受付 ({orders.filter(o => o.status === 'pending').length})
                </button>
                <button onClick={() => setFilter('notified')} className={`px-4 py-2 rounded-lg ${filter === 'notified' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                  連絡済み ({orders.filter(o => o.status === 'confirmed').length})
                </button>
                <button onClick={() => setFilter('shipped')} className={`px-4 py-2 rounded-lg ${filter === 'shipped' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                  発送済み ({orders.filter(o => o.status === 'shipped' || o.status === 'delivered').length})
                </button>
              </div>

              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
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
                          <td colSpan={8} className="px-6 py-12 text-center text-gray-500">注文がありません</td>
                        </tr>
                      ) : (
                        filteredOrders.map((order) => (
                          <React.Fragment key={order.id}>
                            <tr
                              className="hover:bg-gray-50 cursor-pointer"
                              onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                            >
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
                                <td colSpan={8} className="px-6 py-4">
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

      {/* === サブスクリプションタブ === */}
      {activeTab === 'subscription' && (
        <>
          {subsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-600">読み込み中...</div>
            </div>
          ) : (
            <>
              {/* 要対応アラートバナー */}
              {alertDeliveries.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-sm font-semibold text-gray-700 mb-2">⚠ 業者連絡が必要な配送</h2>
                  <div className="space-y-2">
                    {alertDeliveries.map(({ sub, delivery, reminderStatus, daysLeft }) => (
                      <div
                        key={delivery.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${alertBadgeStyle(reminderStatus)}`}
                      >
                        <div className="flex items-center gap-4 text-sm">
                          <span className="font-bold">{alertLabel(reminderStatus, daysLeft)}</span>
                          <span className="text-gray-600">|</span>
                          <span className="font-medium">{sub.shipping_address?.name || sub.customer_name}</span>
                          <span>{sub.plan_name}</span>
                          <span>配送予定: {formatDate(delivery.scheduled_date)}</span>
                          {delivery.menu_set && <span className="text-xs text-gray-500">{delivery.menu_set}</span>}
                        </div>
                        <button
                          onClick={() => handleMarkCarrierNotified(delivery.id)}
                          disabled={notifyingDeliveryId === delivery.id}
                          className="ml-4 px-3 py-1.5 text-xs font-medium bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 whitespace-nowrap"
                        >
                          {notifyingDeliveryId === delivery.id ? '処理中...' : '対応済み'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 統計サマリー */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="text-sm text-gray-500">アクティブ</div>
                  <div className="text-2xl font-bold text-green-600">{subscriptions.filter(s => s.status === 'active').length}件</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="text-sm text-gray-500">支払い遅延</div>
                  <div className="text-2xl font-bold text-red-600">{subscriptions.filter(s => s.payment_status === 'past_due' || s.status === 'past_due').length}件</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="text-sm text-gray-500">解約済み</div>
                  <div className="text-2xl font-bold text-gray-600">{subscriptions.filter(s => s.status === 'canceled').length}件</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="text-sm text-gray-500">月間収益（アクティブ）</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(subscriptions.filter(s => s.status === 'active').reduce((sum, s) => sum + (s.monthly_total_amount || 0), 0))}
                  </div>
                </div>
              </div>

              {/* フィルター */}
              <div className="mb-6 flex gap-2 flex-wrap">
                <button onClick={() => setSubFilter('all')} className={`px-4 py-2 rounded-lg transition-colors ${subFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                  すべて ({subscriptions.length})
                </button>
                <button onClick={() => setSubFilter('active')} className={`px-4 py-2 rounded-lg transition-colors ${subFilter === 'active' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                  アクティブ ({subscriptions.filter(s => s.status === 'active').length})
                </button>
                <button onClick={() => setSubFilter('canceled')} className={`px-4 py-2 rounded-lg transition-colors ${subFilter === 'canceled' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                  解約済み ({subscriptions.filter(s => s.status === 'canceled').length})
                </button>
              </div>

              {/* 一覧テーブル */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
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
                      {filteredSubscriptions.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center text-gray-500">サブスクリプションがありません</td>
                        </tr>
                      ) : (
                        filteredSubscriptions.map((sub) => {
                          const nextPendingDelivery = sub.subscription_deliveries
                            ?.filter(d => d.status === 'pending')
                            .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())[0];
                          const reminderBadge = nextPendingDelivery ? getDeliveryReminderBadge(nextPendingDelivery) : null;

                          return (
                            <tr key={sub.id} className="hover:bg-gray-50">
                              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sub.id.slice(0, 8)}...</td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                <div>
                                  <div className="font-medium">{sub.shipping_address?.name || sub.customer_name}</div>
                                  <div className="text-xs text-gray-500">{sub.shipping_address?.email || sub.customer_email}</div>
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                <div>
                                  <div className="font-medium">{sub.plan_name}</div>
                                  <div className="text-xs text-gray-500">{sub.meals_per_delivery}食/回 × {getDeliveryFrequencyLabel(sub.deliveries_per_month)}</div>
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(sub.monthly_total_amount || 0)}</td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                {sub.delivery_progress ? (
                                  <div>
                                    <div className="font-medium">{sub.delivery_progress.completed}/{sub.delivery_progress.total}回 完了</div>
                                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                      <div
                                        className="bg-green-500 h-2 rounded-full"
                                        style={{ width: sub.delivery_progress.total > 0 ? `${(sub.delivery_progress.completed / sub.delivery_progress.total) * 100}%` : '0%' }}
                                      />
                                    </div>
                                  </div>
                                ) : <span className="text-gray-400">-</span>}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                <div>
                                  {nextPendingDelivery ? (
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <div>
                                        <div>{formatDate(nextPendingDelivery.scheduled_date)}</div>
                                        {nextPendingDelivery.menu_set && (
                                          <div className="text-xs text-gray-500">{nextPendingDelivery.menu_set}</div>
                                        )}
                                        {nextPendingDelivery.carrier_notified_at && (
                                          <div className="text-xs text-green-600">対応済み {new Date(nextPendingDelivery.carrier_notified_at).toLocaleDateString('ja-JP')}</div>
                                        )}
                                      </div>
                                      {reminderBadge}
                                    </div>
                                  ) : (
                                    <span className="text-gray-400">配送完了</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">{getSubStatusBadge(sub.status, sub.payment_status)}</td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div>
                                  <div>{formatDate(sub.started_at)}</div>
                                  {sub.canceled_at && <div className="text-xs text-red-500">解約: {formatDate(sub.canceled_at)}</div>}
                                </div>
                              </td>
                            </tr>
                          );
                        })
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
