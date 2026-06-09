'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DateRangePicker } from '@/components/admin/ui';

// 今月（JST月初〜今日）の初期範囲
const getThisMonthRange = (): { from: string; to: string } => {
  const jstOffset = 9 * 60 * 60 * 1000;
  const jst = new Date(Date.now() + jstOffset);
  const y = jst.getUTCFullYear();
  const m = jst.getUTCMonth();
  const d = jst.getUTCDate();
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    from: `${y}-${pad(m + 1)}-01`,
    to: `${y}-${pad(m + 1)}-${pad(d)}`,
  };
};

// 解約理由ラベル（cancel API と同一）
const REASON_LABELS: Record<string, string> = {
  too_much_quantity: '届く量が多すぎた',
  too_frequent: '配送の頻度が多すぎた',
  freezer_full: '冷凍庫に入りきらなかった',
  taste_mismatch: '味が自分に合わなかった',
  menu_variety: 'メニューのバリエーションが少なかった',
  nutrition_mismatch: 'カロリーや栄養バランスが合わなかった',
  too_expensive: '料金が高いと感じた',
  unexpected_price: '想定していた料金と違った',
  goal_reached: '目標体重・体型に達した',
  sports_stopped: '部活・スポーツをやめた・休止した',
  self_managed: '自分で食事管理できるようになった',
  family_cooking: '家族・保護者が食事を用意できるようになった',
  confusing_ui: '注文・解約の操作がわかりにくかった',
  didnt_know_2pieces: '1食が2個であることを知らなかった',
  delivery_schedule: '配送日の調整が難しかった',
};

interface CancellationRequest {
  id: string;
  subscription_id: string;
  stripe_subscription_id: string | null;
  customer_email: string;
  customer_name: string;
  reasons: string[] | null;
  reason: string | null;
  message: string | null;
  status: string;
  user_id: string | null;
  cancelled_at: string | null;
  created_at: string;
}

const STATUS_FILTERS = [
  { value: 'all', label: 'すべて' },
  { value: 'completed', label: '完了' },
  { value: 'pending', label: '保留' },
] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number]['value'];

function CancellationsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStatus = (searchParams.get('status') as StatusFilter) || 'all';
  const initialRange = (() => {
    const f = searchParams.get('from');
    const t = searchParams.get('to');
    if (f && t) return { from: f, to: t };
    return getThisMonthRange();
  })();

  const [items, setItems] = useState<CancellationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(initialStatus);
  const [dateFrom, setDateFrom] = useState<string>(initialRange.from);
  const [dateTo, setDateTo] = useState<string>(initialRange.to);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchItems = useCallback(async (from: string, to: string) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const url = `/api/admin/cancellations${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('取得に失敗しました');
      }
      const data = await res.json();
      // 既存 API レスポンス: { requests, totalCount, aggregated }
      setItems(Array.isArray(data) ? data : data.requests || data.items || []);
    } catch (e: any) {
      setError(e?.message || '取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems(dateFrom, dateTo);
  }, [fetchItems, dateFrom, dateTo]);

  const updateDateRange = (from: string, to: string) => {
    setDateFrom(from);
    setDateTo(to);
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    router.replace(`/admin/cancellations${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false });
  };

  const filteredItems = items.filter((it) => statusFilter === 'all' || it.status === statusFilter);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">解約申請一覧</h1>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <DateRangePicker from={dateFrom} to={dateTo} onChange={updateDateRange} />
        <span className="text-sm text-gray-600">
          期間: {dateFrom || '指定なし'} 〜 {dateTo || '指定なし'} / 全 {items.length} 件
        </span>
      </div>

      <div className="mb-4 flex gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-4 py-2 rounded-lg text-sm ${
              statusFilter === f.value
                ? 'bg-orange-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {f.label} ({items.filter((it) => f.value === 'all' || it.status === f.value).length})
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-500">読み込み中...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">解約日時</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">お客様</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">解約理由</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      該当する解約申請がありません
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((it) => {
                    const isOpen = expandedId === it.id;
                    const reasons = it.reasons && it.reasons.length > 0
                      ? it.reasons
                      : (it.reason ? it.reason.split(',').map((r) => r.trim()) : []);
                    return (
                      <React.Fragment key={it.id}>
                        <tr
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => setExpandedId(isOpen ? null : it.id)}
                        >
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {it.cancelled_at
                              ? new Date(it.cancelled_at).toLocaleString('ja-JP')
                              : new Date(it.created_at).toLocaleString('ja-JP')}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{it.customer_name}</div>
                            <div className="text-xs text-gray-500">{it.customer_email}</div>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-700 max-w-md">
                            <div className="truncate">
                              {reasons.slice(0, 2).map((r) => REASON_LABELS[r] || r).join(' / ')}
                              {reasons.length > 2 && ` 他${reasons.length - 2}件`}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs rounded-full font-medium ${
                                it.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : it.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {it.status}
                            </span>
                          </td>
                        </tr>
                        {isOpen && (
                          <tr className="bg-gray-50">
                            <td colSpan={4} className="px-6 py-4 text-sm text-gray-700">
                              <div className="space-y-2">
                                <div>
                                  <span className="font-medium">解約理由（詳細）:</span>
                                  <ul className="mt-1 ml-4 list-disc text-xs">
                                    {reasons.map((r, idx) => (
                                      <li key={idx}>{REASON_LABELS[r] || r}</li>
                                    ))}
                                  </ul>
                                </div>
                                {it.message && (
                                  <div>
                                    <span className="font-medium">コメント:</span>
                                    <div className="mt-1 ml-4 text-xs whitespace-pre-wrap">{it.message}</div>
                                  </div>
                                )}
                                <div className="text-xs text-gray-500 mt-2">
                                  subscription_id: {it.subscription_id}
                                  {it.stripe_subscription_id ? ` / stripe: ${it.stripe_subscription_id}` : ''}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
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

export default function AdminCancellationsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-500">読み込み中...</div>}>
      <CancellationsPageInner />
    </Suspense>
  );
}
