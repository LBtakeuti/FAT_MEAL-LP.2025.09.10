'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';

type CustomerType = 'member' | 'guest' | 'tiktok';

interface CustomerDetailData {
  profile: any;
  orders: any[];
  subscriptions: any[];
  surveys: any[];
  tiktok_orders: any[];
  contacts: any[];
  messages: any[];
}

const TAB_DEFS: Array<{ key: string; label: string; visibleFor: CustomerType[] }> = [
  { key: 'overview', label: '概要', visibleFor: ['member', 'guest', 'tiktok'] },
  { key: 'member', label: '会員アカウント', visibleFor: ['member'] },
  { key: 'subscription', label: 'サブスク', visibleFor: ['member', 'guest'] },
  { key: 'orders', label: '注文履歴', visibleFor: ['member', 'guest', 'tiktok'] },
  { key: 'contacts', label: 'お問い合わせ', visibleFor: ['member', 'guest', 'tiktok'] },
  { key: 'survey', label: 'アンケート', visibleFor: ['member', 'guest', 'tiktok'] },
];

function detectType(rawId: string): CustomerType | null {
  if (rawId.startsWith('member:')) return 'member';
  if (rawId.startsWith('guest:')) return 'guest';
  if (rawId.startsWith('tiktok:')) return 'tiktok';
  return null;
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });
  } catch {
    return value;
  }
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
  } catch {
    return value;
  }
}

const TYPE_BADGE: Record<CustomerType, { label: string; color: string }> = {
  member: { label: '会員', color: 'bg-green-100 text-green-800' },
  guest: { label: 'ゲスト', color: 'bg-gray-100 text-gray-600' },
  tiktok: { label: 'TikTok', color: 'bg-pink-100 text-pink-800' },
};

const SUB_STATUS_BADGE: Record<string, { label: string; color: string }> = {
  active: { label: '契約中', color: 'bg-green-100 text-green-800' },
  canceled: { label: '解約済', color: 'bg-gray-100 text-gray-600' },
  paused: { label: '一時停止', color: 'bg-yellow-100 text-yellow-800' },
  past_due: { label: '支払遅延', color: 'bg-red-100 text-red-800' },
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  order_received: '注文受付', pending: '処理中', notified: '通知済', confirmed: '確定',
  shipped: '発送済', delivered: '配達完了', cancelled: 'キャンセル',
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

export default function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = use(params);
  const customerId = decodeURIComponent(rawId);
  const customerType = detectType(customerId);

  const [data, setData] = useState<CustomerDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/admin/customers/${encodeURIComponent(customerId)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'データ取得に失敗しました');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  if (!customerType) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <h1 className="text-xl font-bold text-red-600 mb-2">不正な顧客IDです</h1>
        <p className="text-gray-600 text-sm mb-4">顧客IDは <code>member:</code> / <code>guest:</code> / <code>tiktok:</code> のいずれかで始まる必要があります。</p>
        <Link href="/admin/customers" className="text-orange-600 hover:underline text-sm">← 顧客一覧に戻る</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        読み込み中...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <h1 className="text-xl font-bold text-red-600 mb-2">顧客が見つかりません</h1>
        <p className="text-gray-600 text-sm mb-4">{error || '対象の顧客データが取得できませんでした。'}</p>
        <Link href="/admin/customers" className="text-orange-600 hover:underline text-sm">← 顧客一覧に戻る</Link>
      </div>
    );
  }

  const visibleTabs = TAB_DEFS.filter((t) => t.visibleFor.includes(customerType));
  const profile = data.profile || {};
  const displayName =
    profile.customer_name ||
    [profile.last_name, profile.first_name].filter(Boolean).join(' ') ||
    '—';
  const badge = TYPE_BADGE[customerType];

  return (
    <div>
      {/* ヘッダー */}
      <div className="mb-6">
        <Link href="/admin/customers" className="text-sm text-orange-600 hover:underline mb-2 inline-block">
          ← 顧客一覧に戻る
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
          <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${badge.color}`}>{badge.label}</span>
        </div>
        <div className="text-sm text-gray-500 mt-1">
          {profile.email && <span className="mr-3">📧 {profile.email}</span>}
          {profile.phone && <span>📞 {profile.phone}</span>}
        </div>
      </div>

      {/* タブナビ */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex gap-6 overflow-x-auto">
          {visibleTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-orange-600 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* タブコンテンツ */}
      <div>
        {activeTab === 'overview' && <OverviewTab data={data} customerType={customerType} />}
        {activeTab === 'member' && customerType === 'member' && <MemberAccountTab profile={profile} />}
        {activeTab === 'subscription' && <SubscriptionTab subs={data.subscriptions} />}
        {activeTab === 'orders' && <OrdersTab orders={data.orders} tiktokOrders={data.tiktok_orders} />}
        {activeTab === 'contacts' && <ContactsTab contacts={data.contacts} messages={data.messages} />}
        {activeTab === 'survey' && <SurveyTab surveys={data.surveys} />}
      </div>
    </div>
  );
}

// ----- Tab: Overview -----
function OverviewTab({ data, customerType }: { data: CustomerDetailData; customerType: CustomerType }) {
  const { profile, orders, tiktok_orders, subscriptions } = data;
  const orderCount = (orders || []).length;
  const tiktokCount = (tiktok_orders || []).length;
  const totalOrders = orderCount + tiktokCount;
  const totalSpent = (orders || []).reduce((s, o) => s + (o.amount || 0), 0);
  const tiktokSpent = (tiktok_orders || []).reduce((s, t) => {
    const a = parseFloat((t.order_amount || '0').toString().replace(/[^0-9.]/g, '')) || 0;
    return s + a;
  }, 0);
  const lastOrder = [...(orders || []).map((o) => o.created_at), ...(tiktok_orders || []).map((t) => t.created_time)]
    .filter(Boolean)
    .sort()
    .pop();
  const firstOrder = [...(orders || []).map((o) => o.created_at), ...(tiktok_orders || []).map((t) => t.created_time)]
    .filter(Boolean)
    .sort()[0];
  const activeSub = (subscriptions || []).find((s) => s.status === 'active');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <SummaryCard label="累計購入額" value={`¥${(totalSpent + tiktokSpent).toLocaleString()}`} />
      <SummaryCard label="注文回数" value={`${totalOrders} 回`} sub={tiktokCount > 0 ? `（うちTikTok ${tiktokCount}回）` : undefined} />
      <SummaryCard
        label="サブスク状態"
        value={activeSub ? (SUB_STATUS_BADGE[activeSub.status]?.label || activeSub.status) : '—'}
        sub={activeSub?.plan_name}
      />
      <SummaryCard label="初回購入" value={formatDate(firstOrder)} />
      <SummaryCard label="最終購入" value={formatDate(lastOrder)} />
      <SummaryCard label="顧客種別" value={TYPE_BADGE[customerType].label} />
      <div className="lg:col-span-3 bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">プロフィール</h3>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-6 text-sm">
          <Field label="名前" value={profile.customer_name || [profile.last_name, profile.first_name].filter(Boolean).join(' ')} />
          <Field label="メール" value={profile.email} />
          <Field label="電話番号" value={profile.phone} />
          {profile.postal_code && (
            <Field
              label="住所"
              value={`〒${profile.postal_code} ${profile.prefecture || ''}${profile.city || ''}${profile.address_detail || ''}${profile.building ? ' ' + profile.building : ''}`}
            />
          )}
        </dl>
      </div>
    </div>
  );
}

// ----- Tab: Member Account -----
function MemberAccountTab({ profile }: { profile: any }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">会員アカウント</h3>
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8 text-sm">
        <Field label="ユーザーID" value={profile.id} mono />
        <Field label="メール" value={profile.email} />
        <Field label="姓" value={profile.last_name} />
        <Field label="名" value={profile.first_name} />
        <Field label="姓 (カナ)" value={profile.last_name_kana} />
        <Field label="名 (カナ)" value={profile.first_name_kana} />
        <Field label="電話番号" value={profile.phone} />
        <Field label="郵便番号" value={profile.postal_code} />
        <Field label="都道府県" value={profile.prefecture} />
        <Field label="市区町村" value={profile.city} />
        <Field label="住所詳細" value={profile.address_detail} />
        <Field label="建物名" value={profile.building} />
        <Field label="登録日" value={formatDateTime(profile.created_at)} />
        <Field label="最終更新" value={formatDateTime(profile.updated_at)} />
      </dl>
      <p className="text-xs text-gray-400 mt-6">※ 編集機能は今後追加予定です。</p>
    </div>
  );
}

// ----- Tab: Subscription -----
function SubscriptionTab({ subs }: { subs: any[] }) {
  if (!subs || subs.length === 0) {
    return <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400 text-sm">サブスクリプションはありません</div>;
  }
  return (
    <div className="space-y-4">
      {subs.map((sub) => {
        const badge = SUB_STATUS_BADGE[sub.status] || { label: sub.status, color: 'bg-gray-100 text-gray-600' };
        const addr = sub.shipping_address || {};
        return (
          <div key={sub.id} className="bg-white rounded-lg shadow p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-bold text-gray-900">{sub.plan_name}</div>
                <div className="text-xs text-gray-500 font-mono">{sub.stripe_subscription_id || sub.id}</div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>{badge.label}</span>
            </div>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-6 text-sm">
              <Field label="月額" value={`¥${(sub.monthly_total_amount || 0).toLocaleString()}`} />
              <Field label="開始日" value={formatDate(sub.started_at)} />
              {sub.canceled_at && <Field label="解約日" value={formatDate(sub.canceled_at)} />}
              {sub.next_delivery_date && <Field label="次回配送日" value={formatDate(sub.next_delivery_date)} />}
              {sub.current_period_start && <Field label="当期開始" value={formatDate(sub.current_period_start)} />}
              {sub.current_period_end && <Field label="当期終了" value={formatDate(sub.current_period_end)} />}
              <Field label="配送先" value={`${addr.prefecture || ''}${addr.city || ''}${addr.address_detail || ''}`} />
              <Field label="配送先 電話" value={addr.phone} />
            </dl>
          </div>
        );
      })}
    </div>
  );
}

// ----- Tab: Orders -----
function OrdersTab({ orders, tiktokOrders }: { orders: any[]; tiktokOrders: any[] }) {
  const allOrders = [
    ...(orders || []).map((o) => ({ ...o, source: 'order', date: o.created_at })),
    ...(tiktokOrders || []).map((t) => ({ ...t, source: 'tiktok', date: t.created_time })),
  ].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  if (allOrders.length === 0) {
    return <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400 text-sm">注文履歴はありません</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">日付</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">種別</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">注文番号</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">商品</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">数量</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">金額</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ステータス</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {allOrders.map((order, i) => (
            <tr key={`${order.id}-${i}`} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{formatDate(order.date)}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                {order.source === 'tiktok' ? (
                  <span className="px-2 py-0.5 rounded text-xs bg-pink-100 text-pink-800">TikTok</span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-xs bg-orange-100 text-orange-800">通常</span>
                )}
              </td>
              <td className="px-4 py-3 text-sm font-mono text-gray-700">
                {order.order_number ? `#${order.order_number}` : (order.tiktok_order_id || order.id || '').toString().slice(-8)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-700">{order.menu_set || order.product_name || '—'}</td>
              <td className="px-4 py-3 text-sm text-gray-700">{order.quantity ? `×${order.quantity}` : '—'}</td>
              <td className="px-4 py-3 text-sm text-right text-gray-900">
                {order.amount ? `¥${order.amount.toLocaleString()}` : (order.order_amount || '—')}
              </td>
              <td className="px-4 py-3 text-sm text-gray-500">{ORDER_STATUS_LABELS[order.status] || order.status || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ----- Tab: Contacts -----
function ContactsTab({ contacts, messages }: { contacts: any[]; messages: any[] }) {
  const hasContacts = contacts && contacts.length > 0;
  const hasMessages = messages && messages.length > 0;

  if (!hasContacts && !hasMessages) {
    return <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400 text-sm">お問い合わせ・送信メッセージはありません</div>;
  }

  return (
    <div className="space-y-6">
      {hasContacts && (
        <div className="bg-white rounded-lg shadow p-5">
          <h3 className="font-bold text-gray-700 mb-3 text-sm uppercase tracking-wider">お問い合わせ ({contacts.length})</h3>
          <div className="space-y-3">
            {contacts.map((c) => (
              <div key={c.id} className="border border-gray-100 rounded p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">{c.title || '（件名なし）'}</span>
                  <span className="text-xs text-gray-500">{formatDateTime(c.created_at)}</span>
                </div>
                <div className="text-xs text-gray-600 whitespace-pre-wrap">{c.message}</div>
                {c.status && <div className="text-xs text-gray-400 mt-2">ステータス: {c.status}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {hasMessages && (
        <div className="bg-white rounded-lg shadow p-5">
          <h3 className="font-bold text-gray-700 mb-3 text-sm uppercase tracking-wider">送信メッセージ ({messages.length})</h3>
          <div className="space-y-3">
            {messages.map((m) => (
              <div key={m.id} className="border border-gray-100 rounded p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">{formatDateTime(m.sent_at || m.created_at)}</span>
                </div>
                <div className="text-xs text-gray-700 whitespace-pre-wrap">{m.message_text || m.body || ''}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ----- Tab: Survey -----
function SurveyTab({ surveys }: { surveys: any[] }) {
  const survey = (surveys || [])[0];
  if (!survey) {
    return <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400 text-sm">アンケート回答はありません</div>;
  }
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">購入時アンケート</h3>
      <dl className="space-y-4 text-sm">
        <div>
          <dt className="text-blue-600 font-medium mb-1">Q1. どこで知りましたか</dt>
          <dd className="text-gray-800">
            {(survey.q1_answers || []).map((a: string) => SURVEY_Q1_LABELS[a] || a).join('、') || '—'}
            {survey.q1_other_text && <span className="text-gray-500 ml-2">（{survey.q1_other_text}）</span>}
          </dd>
        </div>
        <div>
          <dt className="text-blue-600 font-medium mb-1">Q2. 誰が食べますか</dt>
          <dd className="text-gray-800">
            {(survey.q2_answers || []).map((a: string) => SURVEY_Q2_LABELS[a] || a).join('、') || '—'}
            {survey.q2_other_text && <span className="text-gray-500 ml-2">（{survey.q2_other_text}）</span>}
          </dd>
        </div>
        <div>
          <dt className="text-blue-600 font-medium mb-1">Q3. 目的</dt>
          <dd className="text-gray-800">
            {(survey.q3_answers || []).map((a: string) => SURVEY_Q3_LABELS[a] || a).join('、') || '—'}
            {survey.q3_other_text && <span className="text-gray-500 ml-2">（{survey.q3_other_text}）</span>}
          </dd>
        </div>
      </dl>
    </div>
  );
}

// ----- Helpers -----
function SummaryCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string | null | undefined; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className={mono ? 'font-mono text-xs text-gray-700' : 'text-gray-900'}>{value || '—'}</dd>
    </div>
  );
}
