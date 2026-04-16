'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface UserSubscription {
  status: string;
  plan_name: string;
  monthly_total_amount: number;
}

interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  first_name_kana: string | null;
  last_name_kana: string | null;
  phone: string | null;
  prefecture: string | null;
  city: string | null;
  created_at: string;
  order_count: number;
  subscriptions: UserSubscription[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: '契約中', color: 'bg-green-100 text-green-800' },
  paused: { label: '一時停止', color: 'bg-yellow-100 text-yellow-800' },
  canceled: { label: '解約済', color: 'bg-gray-100 text-gray-600' },
  past_due: { label: '支払遅延', color: 'bg-red-100 text-red-800' },
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(pagination.page),
      limit: '20',
    });
    if (search) params.set('search', search);

    const res = await fetch(`/api/admin/users?${params}`);
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
      setPagination(data.pagination);
    }
    setLoading(false);
  }, [pagination.page, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getUserName = (user: User) => {
    if (user.last_name || user.first_name) {
      return `${user.last_name || ''} ${user.first_name || ''}`.trim();
    }
    return '—';
  };

  const getActiveSubscription = (user: User) => {
    return user.subscriptions.find((s) => s.status === 'active');
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">ユーザー管理</h1>

      {/* 検索 */}
      <form onSubmit={handleSearch} className="mb-6 flex gap-3">
        <input
          type="text"
          placeholder="名前・メールアドレスで検索..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="flex-1 max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <button
          type="submit"
          className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          検索
        </button>
        {search && (
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setSearchInput('');
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            クリア
          </button>
        )}
      </form>

      {/* 統計 */}
      <div className="mb-6 text-sm text-gray-600">
        全 {pagination.total} 件のユーザー
        {search && <span>（「{search}」で検索中）</span>}
      </div>

      {/* ユーザー一覧テーブル */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">名前</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">メール</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">注文回数</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">サブスク状態</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">登録日</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  読み込み中...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  ユーザーが見つかりません
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const activeSub = getActiveSubscription(user);
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{getUserName(user)}</div>
                      {user.phone && <div className="text-xs text-gray-500">{user.phone}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className="font-semibold text-gray-900">{user.order_count}</span>
                      <span className="text-gray-500"> 回</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {activeSub ? (
                        <div>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${STATUS_LABELS[activeSub.status]?.color || 'bg-gray-100 text-gray-600'}`}>
                            {STATUS_LABELS[activeSub.status]?.label || activeSub.status}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">{activeSub.plan_name}</div>
                        </div>
                      ) : user.subscriptions.length > 0 ? (
                        <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          解約済
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedUser(selectedUser === user.id ? null : user.id)}
                        className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                      >
                        {selectedUser === user.id ? '閉じる' : '詳細'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* ユーザー詳細パネル */}
        {selectedUser && (
          <UserDetailPanel userId={selectedUser} onClose={() => setSelectedUser(null)} />
        )}
      </div>

      {/* ページネーション */}
      {pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page <= 1}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            前へ
          </button>
          <span className="px-4 py-2 text-sm text-gray-600">
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page >= pagination.totalPages}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            次へ
          </button>
        </div>
      )}
    </div>
  );
}

// --- ユーザー詳細パネル ---

interface OrderDetail {
  id: string;
  order_number: number;
  menu_set: string;
  quantity: number;
  amount: number;
  status: string;
  created_at: string;
}

interface SubscriptionDetail {
  id: string;
  plan_name: string;
  meals_per_delivery: number;
  deliveries_per_month: number;
  monthly_total_amount: number;
  status: string;
  started_at: string;
  canceled_at: string | null;
  next_delivery_date: string | null;
}

interface UserDetail {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  first_name_kana: string | null;
  last_name_kana: string | null;
  phone: string | null;
  postal_code: string | null;
  prefecture: string | null;
  city: string | null;
  address_detail: string | null;
  building: string | null;
  created_at: string;
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  order_received: '注文受付',
  pending: '処理中',
  notified: '通知済',
  confirmed: '確定',
  shipped: '発送済',
  delivered: '配達完了',
  cancelled: 'キャンセル',
};

function UserDetailPanel({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      const res = await fetch(`/api/admin/users/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setOrders(data.orders);
        setSubscriptions(data.subscriptions);
      }
      setLoading(false);
    };
    fetchDetail();
  }, [userId]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });

  const totalSpent = orders.reduce((sum, o) => sum + o.amount, 0);

  if (loading) {
    return (
      <div className="border-t border-gray-200 bg-gray-50 px-6 py-8 text-center text-gray-500">
        読み込み中...
      </div>
    );
  }

  if (!user) return null;

  const STATUS_COLORS: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    paused: 'bg-yellow-100 text-yellow-800',
    canceled: 'bg-gray-100 text-gray-600',
    past_due: 'bg-red-100 text-red-800',
  };

  return (
    <div className="border-t-2 border-orange-200 bg-orange-50/30">
      <div className="px-6 py-4 flex items-center justify-between border-b border-orange-100">
        <h3 className="text-lg font-bold text-gray-800">
          {user.last_name || ''} {user.first_name || ''} さんの詳細
        </h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">&times;</button>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* プロフィール */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h4 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wider">プロフィール</h4>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-gray-500">メール</dt><dd className="font-medium">{user.email}</dd></div>
            <div><dt className="text-gray-500">電話番号</dt><dd>{user.phone || '—'}</dd></div>
            <div>
              <dt className="text-gray-500">住所</dt>
              <dd>
                {user.postal_code ? `〒${user.postal_code} ` : ''}
                {user.prefecture || ''}{user.city || ''}{user.address_detail || ''}
                {user.building ? ` ${user.building}` : ''}
                {!user.postal_code && !user.prefecture ? '—' : ''}
              </dd>
            </div>
            <div><dt className="text-gray-500">登録日</dt><dd>{formatDate(user.created_at)}</dd></div>
          </dl>
        </div>

        {/* サブスクリプション */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h4 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wider">
            サブスクリプション ({subscriptions.length})
          </h4>
          {subscriptions.length === 0 ? (
            <p className="text-sm text-gray-400">サブスクリプションなし</p>
          ) : (
            <div className="space-y-3">
              {subscriptions.map((sub) => (
                <div key={sub.id} className="border border-gray-100 rounded p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{sub.plan_name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[sub.status] || 'bg-gray-100 text-gray-600'}`}>
                      {sub.status === 'active' ? '契約中' : sub.status === 'canceled' ? '解約済' : sub.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>月額: ¥{sub.monthly_total_amount.toLocaleString()}</div>
                    <div>開始: {formatDate(sub.started_at)}</div>
                    {sub.canceled_at && <div className="text-red-500">解約: {formatDate(sub.canceled_at)}</div>}
                    {sub.next_delivery_date && <div>次回配送: {formatDate(sub.next_delivery_date)}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 注文履歴 */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h4 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wider">
            注文履歴 ({orders.length}件 / 合計 ¥{totalSpent.toLocaleString()})
          </h4>
          {orders.length === 0 ? (
            <p className="text-sm text-gray-400">注文履歴なし</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {orders.map((order) => (
                <div key={order.id} className="border border-gray-100 rounded p-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">#{order.order_number}</span>
                    <span className="text-gray-500 text-xs">{formatDate(order.created_at)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-xs text-gray-600">
                    <span>{order.menu_set} ×{order.quantity}</span>
                    <span className="font-medium">¥{order.amount.toLocaleString()}</span>
                  </div>
                  <div className="mt-1">
                    <span className="text-xs text-gray-500">
                      {ORDER_STATUS_LABELS[order.status] || order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
