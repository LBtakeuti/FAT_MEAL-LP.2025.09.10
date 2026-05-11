'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  customer_type: 'member' | 'guest' | 'tiktok';
  order_count: number;
  tiktok_order_count: number;
  total_spent: number;
  subscription_status: string | null;
  last_purchase_date: string | null;
  has_survey: boolean;
  created_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Summary {
  total: number;
  members: number;
  guests: number;
  tiktok: number;
}

const TYPE_BADGES: Record<string, { label: string; color: string }> = {
  member: { label: '会員', color: 'bg-green-100 text-green-800' },
  guest: { label: 'ゲスト', color: 'bg-gray-100 text-gray-600' },
  tiktok: { label: 'TikTok', color: 'bg-pink-100 text-pink-800' },
};

const SUB_STATUS: Record<string, { label: string; color: string }> = {
  active: { label: '契約中', color: 'bg-green-100 text-green-800' },
  canceled: { label: '解約済', color: 'bg-gray-100 text-gray-600' },
  paused: { label: '一時停止', color: 'bg-yellow-100 text-yellow-800' },
  past_due: { label: '支払遅延', color: 'bg-red-100 text-red-800' },
};

export default function AdminCustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [summary, setSummary] = useState<Summary>({ total: 0, members: 0, guests: 0, tiktok: 0 });
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(pagination.page), limit: '20' });
    if (search) params.set('search', search);
    if (typeFilter) params.set('type', typeFilter);

    const res = await fetch(`/api/admin/customers?${params}`);
    if (res.ok) {
      const data = await res.json();
      setCustomers(data.customers);
      setPagination(data.pagination);
      setSummary(data.summary);
    }
    setLoading(false);
  }, [pagination.page, search, typeFilter]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">顧客管理</h1>

      {/* サマリーカード */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-xs text-gray-500">全顧客</div>
          <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-xs text-green-600">会員</div>
          <div className="text-2xl font-bold text-gray-900">{summary.members}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-xs text-gray-500">ゲスト</div>
          <div className="text-2xl font-bold text-gray-900">{summary.guests}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-xs text-pink-600">TikTok</div>
          <div className="text-2xl font-bold text-gray-900">{summary.tiktok}</div>
        </div>
      </div>

      {/* 検索＋フィルター */}
      <div className="flex flex-wrap gap-3 items-center mb-6">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
          <input
            type="text"
            placeholder="名前・メール・電話番号で検索..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
          />
          <button type="submit" className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm">検索</button>
          {search && (
            <button type="button" onClick={() => { setSearch(''); setSearchInput(''); setPagination(prev => ({ ...prev, page: 1 })); }}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm">クリア</button>
          )}
        </form>
        <div className="flex gap-1">
          {[
            { value: '', label: '全て' },
            { value: 'member', label: '会員' },
            { value: 'guest', label: 'ゲスト' },
            { value: 'tiktok', label: 'TikTok' },
          ].map(f => (
            <button key={f.value} onClick={() => { setTypeFilter(f.value); setPagination(prev => ({ ...prev, page: 1 })); }}
              className={`px-3 py-1.5 rounded-lg text-sm ${typeFilter === f.value ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* テーブル */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">お客様名</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">種別</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">注文回数</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">サブスク</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">合計金額</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">最終購入日</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4" />
                  <p className="text-gray-500">読み込み中...</p>
                </td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">顧客が見つかりません</td></tr>
              ) : customers.map(c => {
                const totalOrders = c.order_count + c.tiktok_order_count;
                const badge = TYPE_BADGES[c.customer_type];
                const goDetail = () => router.push(`/admin/customers/${encodeURIComponent(c.id)}`);
                return (
                  <tr key={c.id} className="hover:bg-gray-50 cursor-pointer" onClick={goDetail}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{c.name || '—'}</div>
                      <div className="text-xs text-gray-500">{c.email || c.phone || ''}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${badge.color}`}>{badge.label}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                      <span className="font-semibold text-gray-900">{totalOrders}</span>
                      <span className="text-gray-500"> 回</span>
                      {c.tiktok_order_count > 0 && (
                        <span className="text-xs text-pink-600 ml-1">(TikTok {c.tiktok_order_count})</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {c.subscription_status ? (
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${SUB_STATUS[c.subscription_status]?.color || 'bg-gray-100 text-gray-600'}`}>
                          {SUB_STATUS[c.subscription_status]?.label || c.subscription_status}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      ¥{c.total_spent.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(c.last_purchase_date)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-orange-600 text-sm font-medium">詳細 →</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ページネーション */}
      {pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page <= 1}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 text-sm">前へ</button>
          <span className="px-4 py-2 text-sm text-gray-600">{pagination.page} / {pagination.totalPages}</span>
          <button onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page >= pagination.totalPages}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 text-sm">次へ</button>
        </div>
      )}
    </div>
  );
}

