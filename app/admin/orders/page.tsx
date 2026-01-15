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
  email?: string; // 後方互換性のため
  amount: number;
  status: 'order_received' | 'notified' | 'shipped' | 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  created_at: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'order_received' | 'notified' | 'shipped'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

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
      setLoading(false);
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

  const handleExportCSV = () => {
    window.location.href = '/api/admin/orders/export-csv';
  };

  const handleDeleteOrder = async (orderId: string) => {
    setDeletingId(orderId);
    try {
      const response = await fetch(`/api/admin/orders?id=${orderId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setOrders(orders.filter(order => order.id !== orderId));
        setDeleteConfirmId(null);
        setExpandedOrderId(null);
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
      case 'order_received':
      case 'pending': // 後方互換性
        return 'bg-yellow-100 text-yellow-800';
      case 'notified':
      case 'confirmed': // 後方互換性
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
      case 'delivered': // 後方互換性
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
        // 後方互換性：旧ステータスも新ステータスと一緒にフィルタリング
        if (filter === 'order_received') {
          return order.status === 'order_received' || order.status === 'pending';
        }
        if (filter === 'notified') {
          return order.status === 'notified' || order.status === 'confirmed';
        }
        if (filter === 'shipped') {
          return order.status === 'shipped' || order.status === 'delivered';
        }
        return order.status === filter;
      });

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
        <h1 className="text-3xl font-bold text-gray-900">注文管理</h1>
        <button
          onClick={handleExportCSV}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          CSV出力
        </button>
      </div>

      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          すべて ({orders.length})
        </button>
        <button
          onClick={() => setFilter('order_received')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'order_received'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          注文受付 ({orders.filter(o => o.status === 'order_received' || o.status === 'pending').length})
        </button>
        <button
          onClick={() => setFilter('notified')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'notified'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          連絡済み ({orders.filter(o => o.status === 'notified' || o.status === 'confirmed').length})
        </button>
        <button
          onClick={() => setFilter('shipped')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'shipped'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          発送済み ({orders.filter(o => o.status === 'shipped' || o.status === 'delivered').length})
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  注文番号
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  氏名
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  メール
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  セット内容
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  金額
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  注文日時
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    注文がありません
                  </td>
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
                          <svg
                            className={`w-4 h-4 transition-transform ${expandedOrderId === order.id ? 'rotate-90' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          #{order.order_number}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.customer_name}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {order.customer_email || order.email}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 max-w-xs">
                        <div className="truncate" title={order.menu_set}>
                          {order.menu_set}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ¥{order.amount?.toLocaleString() || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                          disabled={updatingId === order.id}
                          className={`text-sm rounded-lg border-gray-300 focus:ring-orange-500 focus:border-orange-500 ${getStatusBadgeClass(order.status)} ${updatingId === order.id ? 'opacity-50' : ''}`}
                        >
                          <option value="order_received">注文受付</option>
                          <option value="notified">連絡済み</option>
                          <option value="shipped">発送済み</option>
                        </select>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleString('ja-JP')}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        {deleteConfirmId === order.id ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDeleteOrder(order.id)}
                              disabled={deletingId === order.id}
                              className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50"
                            >
                              {deletingId === order.id ? '削除中' : '確定'}
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300"
                            >
                              取消
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(order.id)}
                            className="px-3 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200"
                          >
                            削除
                          </button>
                        )}
                      </td>
                    </tr>
                    {/* 詳細表示行 */}
                    {expandedOrderId === order.id && (
                      <tr className="bg-gray-50">
                        <td colSpan={8} className="px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* お客様情報 */}
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                              <h4 className="font-semibold text-gray-900 mb-3 border-b pb-2">お客様情報</h4>
                              <dl className="space-y-2 text-sm">
                                <div className="flex">
                                  <dt className="w-24 text-gray-500">お名前</dt>
                                  <dd className="text-gray-900">{order.customer_name}</dd>
                                </div>
                                {order.customer_name_kana && (
                                  <div className="flex">
                                    <dt className="w-24 text-gray-500">フリガナ</dt>
                                    <dd className="text-gray-900">{order.customer_name_kana}</dd>
                                  </div>
                                )}
                                <div className="flex">
                                  <dt className="w-24 text-gray-500">メール</dt>
                                  <dd className="text-gray-900">{order.customer_email || order.email}</dd>
                                </div>
                                <div className="flex">
                                  <dt className="w-24 text-gray-500">電話番号</dt>
                                  <dd className="text-gray-900">{order.phone || '-'}</dd>
                                </div>
                              </dl>
                            </div>
                            {/* 配送先情報 */}
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                              <h4 className="font-semibold text-gray-900 mb-3 border-b pb-2">配送先</h4>
                              <dl className="space-y-2 text-sm">
                                <div className="flex">
                                  <dt className="w-24 text-gray-500">郵便番号</dt>
                                  <dd className="text-gray-900">〒{order.postal_code || '-'}</dd>
                                </div>
                                <div className="flex">
                                  <dt className="w-24 text-gray-500">住所</dt>
                                  <dd className="text-gray-900">
                                    {order.prefecture || order.city || order.address_detail ? (
                                      <>
                                        {order.prefecture}{order.city}{order.address_detail}
                                        {order.building && <><br />{order.building}</>}
                                      </>
                                    ) : (
                                      order.address || '-'
                                    )}
                                  </dd>
                                </div>
                              </dl>
                            </div>
                          </div>
                          {/* 削除ボタン */}
                          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
                            {deleteConfirmId === order.id ? (
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-red-600">本当に削除しますか？</span>
                                <button
                                  onClick={() => handleDeleteOrder(order.id)}
                                  disabled={deletingId === order.id}
                                  className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
                                >
                                  {deletingId === order.id ? '削除中...' : '削除する'}
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300"
                                >
                                  キャンセル
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirmId(order.id)}
                                className="px-4 py-2 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200"
                              >
                                この注文を削除
                              </button>
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
    </div>
  );
}
