'use client';

import { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import { Badge, Button, EmptyState, LoadingSpinner, useToast } from '@/components/admin/ui';

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

type SurveyRow = {
  id: string;
  customer_email: string;
  q1_answers: string[];
  q1_other_text: string | null;
  q2_answers: string[];
  q2_other_text: string | null;
  q3_answers: string[];
  q3_other_text: string | null;
  created_at: string;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function formatDateLabel(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  const wd = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()];
  return `${d.getMonth() + 1}/${d.getDate()}（${wd}）`;
}

const STATUS_OPTIONS = [
  { value: 'pending', label: '未発送' },
  { value: 'confirmed', label: '確認済' },
  { value: 'shipped', label: '発送済' },
];

const sourceLabel = (s: 'subscription' | 'order' | 'tiktok') =>
  s === 'subscription' ? 'サブスク' : s === 'tiktok' ? 'TikTok' : '買い切り';

const sourceVariant = (s: 'subscription' | 'order' | 'tiktok') =>
  s === 'subscription' ? 'success' : s === 'tiktok' ? 'warning' : 'neutral';

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

function formatAnswers(answers: string[] | null | undefined, labelMap: Record<string, string>, otherText?: string | null): string {
  const list = (answers || []).map((a) => labelMap[a] || a);
  let out = list.join('、') || '—';
  if (otherText) out += `（${otherText}）`;
  return out;
}

export default function CalendarDayDetailPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = use(params);
  const toast = useToast();
  const [items, setItems] = useState<DeliveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // 行展開: itemId → 開いてるか
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // email → 取得済みの surveys（キャッシュ）
  const [surveysByEmail, setSurveysByEmail] = useState<Record<string, SurveyRow[]>>({});
  const [surveyLoadingEmail, setSurveyLoadingEmail] = useState<string | null>(null);

  const isValidDate = DATE_RE.test(date);

  const fetchDay = useCallback(async () => {
    if (!isValidDate) return;
    setLoading(true);
    setSelectedIds(new Set());
    try {
      const params = new URLSearchParams({ from: date, to: date });
      const res = await fetch(`/api/admin/delivery?${params}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      } else {
        toast.error('配送データの取得に失敗しました');
      }
    } catch {
      toast.error('配送データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [date, isValidDate, toast]);

  useEffect(() => {
    fetchDay();
  }, [fetchDay]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
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
      setSelectedIds(new Set(items.map((i) => i.id)));
    }
  };

  const toggleExpand = async (item: DeliveryItem) => {
    if (expandedId === item.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(item.id);
    // アンケートを email でレイジー取得（キャッシュ済みならスキップ）
    const email = item.customer_email;
    if (email && surveysByEmail[email] === undefined) {
      setSurveyLoadingEmail(email);
      try {
        const res = await fetch(`/api/admin/surveys/by-email?email=${encodeURIComponent(email)}`);
        if (res.ok) {
          const data = await res.json();
          setSurveysByEmail((prev) => ({ ...prev, [email]: Array.isArray(data) ? data : [] }));
        } else {
          setSurveysByEmail((prev) => ({ ...prev, [email]: [] }));
        }
      } catch {
        setSurveysByEmail((prev) => ({ ...prev, [email]: [] }));
      } finally {
        setSurveyLoadingEmail(null);
      }
    }
  };

  const handleExportCSV = () => {
    const subIds = items.filter((i) => i.source === 'subscription' && selectedIds.has(i.id)).map((i) => i.id).join(',');
    const orderIds = items.filter((i) => i.source === 'order' && selectedIds.has(i.id)).map((i) => i.id).join(',');
    const tiktokIds = items.filter((i) => i.source === 'tiktok' && selectedIds.has(i.id)).map((i) => i.id).join(',');
    const params = new URLSearchParams();
    if (subIds) params.set('sub_ids', subIds);
    if (orderIds) params.set('order_ids', orderIds);
    if (tiktokIds) params.set('tiktok_ids', tiktokIds);
    window.location.href = `/api/admin/delivery/export-csv?${params}`;
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
        setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: newStatus } : i));
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

  if (!isValidDate) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <h1 className="text-xl font-bold text-red-600 mb-2">不正な日付です</h1>
        <Link href="/admin/calendar" className="text-orange-600 hover:underline text-sm">← カレンダーに戻る</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <Link href="/admin/calendar" className="text-sm text-orange-600 hover:underline inline-block mb-2">
          ← カレンダーに戻る
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {formatDateLabel(date)} の配送
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {loading ? '読み込み中...' : `この日は配送が ${items.length} 件あります`}
        </p>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : items.length === 0 ? (
        <EmptyState
          message={`${formatDateLabel(date)} の配送はありません`}
          description="他の日付はカレンダーから選び直してください"
          action={<Link href="/admin/calendar"><Button variant="secondary">カレンダーへ戻る</Button></Link>}
        />
      ) : (
        <>
          <div className="flex flex-wrap gap-2 items-center mb-3">
            <span className="text-sm text-gray-600">
              {selectedIds.size > 0 ? `${selectedIds.size} 件選択中` : 'チェックして CSV 出力 / 行をクリックで詳細展開'}
            </span>
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
                    <th className="px-2 py-3"></th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">種別</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">お客様名</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">プラン / セット</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">個数</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ステータス</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">配送回数</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.flatMap((item) => {
                    const isOpen = expandedId === item.id;
                    const surveys = item.customer_email ? surveysByEmail[item.customer_email] : undefined;
                    const isSurveyLoading = surveyLoadingEmail === item.customer_email;
                    const baseRow = (
                      <tr
                        key={`${item.source}-${item.id}`}
                        className={`hover:bg-gray-50 cursor-pointer ${isOpen ? 'bg-orange-50/40' : ''}`}
                        onClick={() => toggleExpand(item)}
                      >
                        <td className="px-3 py-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(item.id)}
                            onChange={() => toggleSelect(item.id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-2 py-4 w-4">
                          <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Badge variant={sourceVariant(item.source)}>{sourceLabel(item.source)}</Badge>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>{item.customer_name}</div>
                          {item.customer_email && <div className="text-xs text-gray-500">{item.customer_email}</div>}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900 max-w-xs">
                          <div className="truncate" title={item.plan_name}>{item.plan_name}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity}個</td>
                        <td className="px-4 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={item.status}
                            onChange={(e) => handleStatusChange(item, e.target.value)}
                            disabled={updatingId === item.id}
                            className={`px-2 py-1 text-xs rounded-full font-medium border-0 cursor-pointer focus:ring-2 focus:ring-orange-500 ${
                              item.status === 'shipped' ? 'bg-green-100 text-green-800' :
                              item.status === 'confirmed' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-700'
                            } ${updatingId === item.id ? 'opacity-50' : ''}`}
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                          {/* F11: 「N回目」表記は撤廃 */}
                          -
                        </td>
                      </tr>
                    );

                    if (!isOpen) return [baseRow];

                    const expandRow = (
                      <tr key={`${item.source}-${item.id}-detail`} className="bg-orange-50/30">
                        <td colSpan={8} className="px-6 py-5">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* 注文者詳細 */}
                            <div className="bg-white rounded border border-orange-100 p-4">
                              <h4 className="text-sm font-bold text-gray-700 mb-3">注文者詳細</h4>
                              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-sm">
                                <Field label="氏名" value={item.customer_name} />
                                <Field label="メール" value={item.customer_email} />
                                <Field label="電話" value={item.phone} />
                                <Field label="郵便番号" value={item.postal_code ? `〒${item.postal_code}` : ''} />
                                <Field label="住所" value={`${item.prefecture || ''}${item.city || ''}${item.address_detail || ''}`.trim()} className="sm:col-span-2" />
                                {item.building && <Field label="建物名" value={item.building} className="sm:col-span-2" />}
                                <Field label="プラン / セット" value={item.plan_name} className="sm:col-span-2" />
                                <Field label="個数" value={`${item.quantity}個 × ${item.meals_per_delivery}食`} />
                                {item.subscription_id && (
                                  <Field label="サブスクID" value={item.subscription_id} className="sm:col-span-2" mono />
                                )}
                              </dl>
                            </div>

                            {/* アンケート結果 */}
                            <div className="bg-white rounded border border-orange-100 p-4">
                              <h4 className="text-sm font-bold text-gray-700 mb-3">購入時アンケート</h4>
                              {!item.customer_email ? (
                                <p className="text-xs text-gray-500">メールアドレスが不明のためアンケートを取得できません</p>
                              ) : isSurveyLoading ? (
                                <p className="text-xs text-gray-500">読み込み中...</p>
                              ) : !surveys || surveys.length === 0 ? (
                                <p className="text-xs text-gray-500">この方のアンケート回答はまだありません</p>
                              ) : (
                                <div className="space-y-3">
                                  {surveys.map((s) => (
                                    <div key={s.id} className="border-l-2 border-orange-300 pl-3 py-1">
                                      <div className="text-[10px] text-gray-400 mb-1">
                                        回答日: {new Date(s.created_at).toLocaleString('ja-JP')}
                                      </div>
                                      <dl className="space-y-1.5 text-sm">
                                        <div>
                                          <dt className="text-xs text-blue-600 font-medium">Q1. どこで知った？</dt>
                                          <dd className="text-gray-800">{formatAnswers(s.q1_answers, SURVEY_Q1_LABELS, s.q1_other_text)}</dd>
                                        </div>
                                        <div>
                                          <dt className="text-xs text-blue-600 font-medium">Q2. 誰が食べる？</dt>
                                          <dd className="text-gray-800">{formatAnswers(s.q2_answers, SURVEY_Q2_LABELS, s.q2_other_text)}</dd>
                                        </div>
                                        <div>
                                          <dt className="text-xs text-blue-600 font-medium">Q3. 目的</dt>
                                          <dd className="text-gray-800">{formatAnswers(s.q3_answers, SURVEY_Q3_LABELS, s.q3_other_text)}</dd>
                                        </div>
                                      </dl>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );

                    return [baseRow, expandRow];
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Field({ label, value, mono, className = '' }: { label: string; value: string | null | undefined; mono?: boolean; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className={mono ? 'font-mono text-xs text-gray-700' : 'text-gray-900 break-words'}>{value || '—'}</dd>
    </div>
  );
}
