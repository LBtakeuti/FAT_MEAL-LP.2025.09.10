'use client';

import React, { useState, useEffect, useCallback } from 'react';

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

const SURVEY_Q1_LABELS: Record<string, string> = {
  instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube',
  google: 'Google検索', friends: '友人・知人の紹介', school_club: '学校・部活の関係者', other: 'その他',
};
const SURVEY_Q2_LABELS: Record<string, string> = {
  self: '自分', child: 'お子さま', partner: 'パートナー', other: 'その他',
};
const SURVEY_Q3_LABELS: Record<string, string> = {
  weight_gain: '体重・体格を増やしたい', muscle: '筋肉をつけてパフォーマンスを上げたい',
  convenience: '食事の準備の手間を減らしたい', nutrition: '栄養バランスをしっかり管理したい',
  competition: '試合・大会に向けて体をつくりたい', other: 'その他',
};

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [summary, setSummary] = useState<Summary>({ total: 0, members: 0, guests: 0, tiktok: 0 });
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
                const isExpanded = selectedId === c.id;
                return (
                  <React.Fragment key={c.id}>
                    <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedId(isExpanded ? null : c.id)}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="flex items-center gap-2">
                          <svg className={`w-4 h-4 transition-transform text-gray-400 flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <span>
                            <div className="text-sm font-medium text-gray-900">{c.name || '—'}</div>
                            <div className="text-xs text-gray-500">{c.email || c.phone || ''}</div>
                          </span>
                        </span>
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
                        <span className="text-orange-600 text-sm font-medium">
                          {isExpanded ? '閉じる' : '詳細'}
                        </span>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-gray-50">
                        <td colSpan={7}>
                          <CustomerDetailPanel customerId={c.id} onClose={() => setSelectedId(null)} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
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

// --- 顧客詳細パネル ---

const ORDER_STATUS: Record<string, string> = {
  order_received: '注文受付', pending: '処理中', confirmed: '確定',
  shipped: '発送済', delivered: '配達完了', cancelled: 'キャンセル',
};

function CustomerDetailPanel({ customerId, onClose }: { customerId: string; onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/customers/${encodeURIComponent(customerId)}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setData(d))
      .finally(() => setLoading(false));
  }, [customerId]);

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  if (loading) return (
    <div className="border-t border-gray-200 bg-gray-50 px-6 py-8 text-center text-gray-500">読み込み中...</div>
  );
  if (!data) return null;

  const { profile, orders, subscriptions, surveys, tiktok_orders } = data;
  const allOrders = [
    ...(orders || []).map((o: any) => ({ ...o, source: 'order', date: o.created_at })),
    ...(tiktok_orders || []).map((t: any) => ({ ...t, source: 'tiktok', date: t.created_time })),
  ].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const totalSpent = (orders || []).reduce((s: number, o: any) => s + (o.amount || 0), 0);
  const survey = (surveys || [])[0];

  return (
    <div className="bg-gray-50">
      <div className="px-6 py-3 border-b border-gray-200">
        <h3 className="text-sm font-bold text-gray-700">
          {profile.customer_name || [profile.last_name, profile.first_name].filter(Boolean).join(' ') || '顧客詳細'}
        </h3>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* プロフィール */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h4 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wider">プロフィール</h4>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-gray-500">メール</dt><dd className="font-medium">{profile.email || '—'}</dd></div>
            <div><dt className="text-gray-500">電話番号</dt><dd>{profile.phone || '—'}</dd></div>
            {profile.postal_code && (
              <div><dt className="text-gray-500">住所</dt><dd>〒{profile.postal_code} {profile.prefecture || ''}{profile.city || ''}{profile.address_detail || ''}</dd></div>
            )}
          </dl>
        </div>

        {/* サブスクリプション */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h4 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wider">サブスクリプション ({(subscriptions || []).length})</h4>
          {(subscriptions || []).length === 0 ? (
            <p className="text-sm text-gray-400">サブスクリプションなし</p>
          ) : (subscriptions || []).map((sub: any) => (
            <div key={sub.id} className="border border-gray-100 rounded p-3 mb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">{sub.plan_name}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  sub.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                }`}>{sub.status === 'active' ? '契約中' : sub.status === 'canceled' ? '解約済' : sub.status}</span>
              </div>
              <div className="text-xs text-gray-500">月額: ¥{(sub.monthly_total_amount || 0).toLocaleString()}</div>
              <div className="text-xs text-gray-500">開始: {formatDate(sub.started_at)}</div>
            </div>
          ))}
        </div>

        {/* 注文履歴 */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h4 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wider">
            注文履歴 ({allOrders.length}件 / 合計 ¥{totalSpent.toLocaleString()})
          </h4>
          {allOrders.length === 0 ? (
            <p className="text-sm text-gray-400">注文履歴なし</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {allOrders.map((order: any, i: number) => (
                <div key={order.id || i} className="border border-gray-100 rounded p-2 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {order.source === 'tiktok' ? (
                        <span className="px-1.5 py-0.5 text-[10px] rounded bg-pink-100 text-pink-800">TikTok</span>
                      ) : (
                        <span className="px-1.5 py-0.5 text-[10px] rounded bg-orange-100 text-orange-800">通常</span>
                      )}
                      <span className="font-medium">{order.order_number ? `#${order.order_number}` : order.tiktok_order_id || ''}</span>
                    </div>
                    <span className="text-gray-500 text-xs">{formatDate(order.date)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-xs text-gray-600">
                    <span>{order.menu_set || order.product_name || ''} {order.quantity ? `×${order.quantity}` : ''}</span>
                    <span className="font-medium">{order.amount ? `¥${order.amount.toLocaleString()}` : order.order_amount || ''}</span>
                  </div>
                  {order.source === 'order' && (
                    <div className="mt-1 text-xs text-gray-500">{ORDER_STATUS[order.status] || order.status}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* アンケート */}
      {survey && (
        <div className="px-6 pb-6">
          <div className="bg-blue-50 rounded-lg p-4 shadow-sm">
            <h4 className="font-semibold text-blue-900 mb-3 border-b border-blue-200 pb-2">購入時アンケート</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <dt className="text-blue-600 font-medium mb-1">Q1. どこで知りましたか</dt>
                <dd className="text-gray-800">
                  {(survey.q1_answers || []).map((a: string) => SURVEY_Q1_LABELS[a] || a).join('、')}
                  {survey.q1_other_text && <span className="text-gray-500">（{survey.q1_other_text}）</span>}
                </dd>
              </div>
              <div>
                <dt className="text-blue-600 font-medium mb-1">Q2. 誰が食べますか</dt>
                <dd className="text-gray-800">
                  {(survey.q2_answers || []).map((a: string) => SURVEY_Q2_LABELS[a] || a).join('、')}
                  {survey.q2_other_text && <span className="text-gray-500">（{survey.q2_other_text}）</span>}
                </dd>
              </div>
              <div>
                <dt className="text-blue-600 font-medium mb-1">Q3. 目的</dt>
                <dd className="text-gray-800">
                  {(survey.q3_answers || []).map((a: string) => SURVEY_Q3_LABELS[a] || a).join('、')}
                  {survey.q3_other_text && <span className="text-gray-500">（{survey.q3_other_text}）</span>}
                </dd>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
