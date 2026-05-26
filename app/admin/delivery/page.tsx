'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Badge, Button, DateRangePicker, EmptyState, LoadingSpinner, useToast } from '@/components/admin/ui';
import { StockHealthBanner } from '@/components/admin/delivery/StockHealthBanner';

interface StockSummary {
  currentSets: number;
  itemsPerSet: number;
  requiredSets30d: number;
  requiredMeals30d: number;
  level: 'ok' | 'warn' | 'danger';
}

type DeliveryItem = {
  id: string;
  source: 'subscription' | 'order' | 'tiktok';
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

type TabKey = 'today' | 'tomorrow' | 'dayAfter' | 'custom';

const getJSTToday = () => {
  const jstOffset = 9 * 60 * 60 * 1000;
  return new Date(Date.now() + jstOffset).toISOString().slice(0, 10);
};

const addDays = (yyyymmdd: string, n: number) => {
  const d = new Date(yyyymmdd + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

const formatDate = (iso: string) => {
  const d = new Date(iso + 'T00:00:00');
  const wd = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()];
  return `${d.getMonth() + 1}/${d.getDate()}（${wd}）`;
};

function DeliveryPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const today = getJSTToday();
  const tomorrow = addDays(today, 1);
  const dayAfter = addDays(today, 2);

  // URL から初期タブと範囲を復元
  const initialTab = (searchParams.get('tab') as TabKey) || 'today';
  const initialFrom = searchParams.get('from') || today;
  const initialTo = searchParams.get('to') || today;

  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [customFrom, setCustomFrom] = useState(initialFrom);
  const [customTo, setCustomTo] = useState(initialTo);

  const [items, setItems] = useState<DeliveryItem[]>([]);
  const [overdueCount, setOverdueCount] = useState(0);
  const [stockSummary, setStockSummary] = useState<StockSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<'' | 'subscription' | 'order' | 'tiktok'>('');
  const [statusFilter, setStatusFilter] = useState<'' | 'pending' | 'shipped'>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  // F2: 配送希望日の編集中アイテム
  const [editingDateId, setEditingDateId] = useState<string | null>(null);
  const [editingDateValue, setEditingDateValue] = useState<string>('');

  const tabRange = useCallback((): { from: string; to: string } => {
    if (activeTab === 'today') return { from: today, to: today };
    if (activeTab === 'tomorrow') return { from: tomorrow, to: tomorrow };
    if (activeTab === 'dayAfter') return { from: dayAfter, to: dayAfter };
    return { from: customFrom, to: customTo };
  }, [activeTab, today, tomorrow, dayAfter, customFrom, customTo]);

  const fetchDeliveries = useCallback(async () => {
    setLoading(true);
    setSelectedIds(new Set());
    try {
      const { from, to } = tabRange();
      const params = new URLSearchParams({ from, to });
      if (sourceFilter) params.set('source', sourceFilter);
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/admin/delivery?${params}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
        setOverdueCount(data.overdueCount);
        setStockSummary(data.stockSummary || null);
      }
    } catch (err) {
      console.error('Failed to fetch deliveries:', err);
      toast.error('配送データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [tabRange, sourceFilter, statusFilter, toast]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  // URL同期（タブ・カスタム範囲）
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('tab', activeTab);
    if (activeTab === 'custom') {
      params.set('from', customFrom);
      params.set('to', customTo);
    }
    router.replace(`/admin/delivery?${params.toString()}`, { scroll: false });
  }, [activeTab, customFrom, customTo, router]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
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
    const subIds = items.filter(i => i.source === 'subscription' && selectedIds.has(i.id)).map(i => i.id).join(',');
    const orderIds = items.filter(i => i.source === 'order' && selectedIds.has(i.id)).map(i => i.id).join(',');
    const tiktokIds = items.filter(i => i.source === 'tiktok' && selectedIds.has(i.id)).map(i => i.id).join(',');
    const params = new URLSearchParams();
    if (subIds) params.set('sub_ids', subIds);
    if (orderIds) params.set('order_ids', orderIds);
    if (tiktokIds) params.set('tiktok_ids', tiktokIds);
    window.location.href = `/api/admin/delivery/export-csv?${params}`;
  };

  // F2: 配送希望日を PATCH で更新
  const handlePreferredDateSave = async (item: DeliveryItem) => {
    if (item.source === 'tiktok') return; // TikTok は対象外
    if (!/^\d{4}-\d{2}-\d{2}$/.test(editingDateValue)) {
      toast.error('YYYY-MM-DD 形式で入力してください');
      return;
    }
    setUpdatingId(item.id);
    try {
      const res = await fetch(`/api/admin/delivery/${item.id}/preferred-date`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: item.source, preferred_delivery_date: editingDateValue }),
      });
      if (res.ok) {
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, date: editingDateValue } : i));
        toast.success('配送希望日を更新しました');
        setEditingDateId(null);
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.message || '配送希望日の更新に失敗しました');
      }
    } catch {
      toast.error('配送希望日の更新に失敗しました');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStatusChange = async (item: DeliveryItem, newStatus: string) => {
    setUpdatingId(item.id);
    try {
      const res = await fetch('/api/admin/delivery', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, source: item.source, status: newStatus }),
      });
      if (res.ok) {
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: newStatus } : i));
        toast.success('ステータスを更新しました');
      } else {
        const data = await res.json();
        toast.error(data.message || 'ステータス更新に失敗しました');
      }
    } catch {
      toast.error('ステータス更新に失敗しました');
    } finally {
      setUpdatingId(null);
    }
  };

  const sortedItems = sortOrder === 'asc'
    ? [...items].sort((a, b) => a.date.localeCompare(b.date))
    : [...items].sort((a, b) => b.date.localeCompare(a.date));

  const STATUS_OPTIONS = [
    { value: 'pending', label: '未発送' },
    { value: 'confirmed', label: '確認済' },
    { value: 'shipped', label: '発送済' },
  ];

  const sourceLabel = (source: 'subscription' | 'order' | 'tiktok') => {
    if (source === 'subscription') return 'サブスク';
    if (source === 'tiktok') return 'TikTok';
    return '買い切り';
  };

  const tabBadge = (count: number) => count > 0 ? <span className="ml-1.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold bg-white text-orange-600">{count}</span> : null;

  // 各タブの件数を計算（fetched は active タブの分のみ。各タブ分は別途軽量取得しても良いが、まずは active のみ表示）
  const currentRangeCount = items.length;

  const tabs: { key: TabKey; label: string; range?: { from: string; to: string } }[] = [
    { key: 'today', label: `今日 ${formatDate(today)}` },
    { key: 'tomorrow', label: `明日 ${formatDate(tomorrow)}` },
    { key: 'dayAfter', label: `明後日 ${formatDate(dayAfter)}` },
    { key: 'custom', label: 'カスタム' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">配送管理</h1>

      {/* 在庫健康度バナー */}
      <StockHealthBanner summary={stockSummary} />

      {/* 過去未出荷バナー */}
      {overdueCount > 0 && activeTab !== 'custom' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 mb-4">
          <span className="text-red-600 text-sm">⚠️</span>
          <span className="text-sm text-red-800">
            過去で未出荷の配送が <strong>{overdueCount}</strong> 件あります
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setActiveTab('custom');
              setCustomFrom('2024-01-01');
              setCustomTo(today);
              setStatusFilter('pending');
            }}
            className="ml-auto text-red-700 hover:bg-red-100"
          >
            未出荷一覧へ →
          </Button>
        </div>
      )}

      {/* クイックタブ */}
      <div className="flex flex-wrap gap-2 mb-4 border-b border-gray-200">
        {tabs.map((t) => {
          const active = activeTab === t.key;
          const isThisActive = active;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                active
                  ? 'border-orange-600 text-orange-700 bg-orange-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {t.label}
              {isThisActive && tabBadge(currentRangeCount)}
            </button>
          );
        })}
      </div>

      {/* カスタム範囲ピッカー */}
      {activeTab === 'custom' && (
        <div className="mb-4">
          <DateRangePicker
            from={customFrom}
            to={customTo}
            onChange={(f, t) => { setCustomFrom(f); setCustomTo(t); }}
          />
        </div>
      )}

      {/* フィルター行 */}
      <div className="flex flex-wrap gap-3 items-center mb-4">
        <div className="flex gap-1">
          {(['', 'subscription', 'order', 'tiktok'] as const).map((v) => (
            <Button
              key={v}
              size="sm"
              variant={sourceFilter === v ? 'primary' : 'secondary'}
              onClick={() => setSourceFilter(v)}
            >
              {v === '' ? '全て' : v === 'subscription' ? 'サブスク' : v === 'order' ? '買い切り' : 'TikTok'}
            </Button>
          ))}
        </div>

        <div className="flex gap-1">
          {(['', 'pending', 'shipped'] as const).map((v) => (
            <Button
              key={v}
              size="sm"
              variant={statusFilter === v ? 'primary' : 'secondary'}
              onClick={() => setStatusFilter(v)}
            >
              {v === '' ? '全ステータス' : v === 'pending' ? '未発送' : '発送済'}
            </Button>
          ))}
        </div>

        <div className="ml-auto">
          <Button
            variant="primary"
            disabled={selectedIds.size === 0}
            onClick={handleExportCSV}
          >
            配送用CSV出力 ({selectedIds.size})
          </Button>
        </div>
      </div>

      {/* テーブル */}
      {loading ? (
        <LoadingSpinner />
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    <button onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')} className="flex items-center gap-1 hover:text-gray-800">
                      配送日 <span className="text-gray-400">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">種別</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">お客様名</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">プラン / セット</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">個数</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ステータス</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">配送回数</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedItems.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <EmptyState message="該当する配送はありません" description="日付やフィルターを変更して再度お試しください" />
                    </td>
                  </tr>
                ) : (
                  sortedItems.map((item) => {
                    const isOverdue = item.date <= today && item.status !== 'shipped';
                    const statusVariant = item.status === 'shipped' ? 'success' : item.status === 'confirmed' ? 'warning' : 'neutral';
                    return (
                      <tr key={`${item.source}-${item.id}`} className={`hover:bg-gray-50 ${isOverdue ? 'bg-red-50/40' : ''}`}>
                        <td className="px-3 py-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(item.id)}
                            onChange={() => toggleSelect(item.id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {editingDateId === item.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="date"
                                value={editingDateValue}
                                onChange={(e) => setEditingDateValue(e.target.value)}
                                className="text-sm px-2 py-1 border border-gray-300 rounded"
                                disabled={updatingId === item.id}
                              />
                              <button
                                onClick={() => handlePreferredDateSave(item)}
                                disabled={updatingId === item.id}
                                className="text-xs px-2 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
                              >
                                保存
                              </button>
                              <button
                                onClick={() => setEditingDateId(null)}
                                disabled={updatingId === item.id}
                                className="text-xs px-2 py-1 text-gray-600 hover:text-gray-900"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span>{item.date}</span>
                              {isOverdue && <span className="text-red-500 text-xs">⚠</span>}
                              {item.source !== 'tiktok' && (
                                <button
                                  onClick={() => { setEditingDateId(item.id); setEditingDateValue(item.date); }}
                                  className="text-xs text-gray-400 hover:text-orange-600"
                                  title="配送希望日を編集"
                                  aria-label="配送希望日を編集"
                                >
                                  ✎
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Badge variant={item.source === 'subscription' ? 'success' : item.source === 'tiktok' ? 'warning' : 'neutral'}>
                            {sourceLabel(item.source)}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>{item.customer_name}</div>
                          {item.customer_email && <div className="text-xs text-gray-500">{item.customer_email}</div>}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900 max-w-xs">
                          <div className="truncate" title={item.plan_name}>{item.plan_name}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity}個</td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <select
                            value={item.status}
                            onChange={(e) => handleStatusChange(item, e.target.value)}
                            disabled={updatingId === item.id}
                            className={`px-2 py-1 text-xs rounded-full font-medium border-0 cursor-pointer focus:ring-2 focus:ring-orange-500 ${
                              statusVariant === 'success' ? 'bg-green-100 text-green-800' :
                              statusVariant === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-700'
                            } ${updatingId === item.id ? 'opacity-50' : ''}`}
                          >
                            {STATUS_OPTIONS.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                          </select>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                          {/* F11: 「N回目」表記は撤廃（プラン名統一に合わせて単一表示に） */}
                          -
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

export default function AdminDeliveryPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <DeliveryPageContent />
    </Suspense>
  );
}
