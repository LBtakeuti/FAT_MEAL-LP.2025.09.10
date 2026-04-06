'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import Link from 'next/link';
import LogoutModal from '@/components/ui/LogoutModal';

interface UserProfile {
  id: string;
  email: string;
  last_name?: string;
  first_name?: string;
  last_name_kana?: string;
  first_name_kana?: string;
  phone?: string;
  postal_code?: string;
  prefecture?: string;
  city?: string;
  address_detail?: string;
  building?: string;
}

interface Order {
  id: string;
  order_number: number;
  customer_name: string;
  customer_email: string;
  phone?: string;
  address?: string;
  menu_set: string;
  quantity: number;
  amount: number;
  status: 'order_received' | 'notified' | 'shipped' | 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  notes?: string;
  created_at: string;
}

interface Subscription {
  id: string;
  plan_name: string;
  plan_id: string;
  meals_per_delivery: number;
  deliveries_per_month: number;
  monthly_product_price: number;
  monthly_shipping_fee: number;
  monthly_total_amount: number;
  next_delivery_date: string | null;
  preferred_delivery_date: string | null;
  status: 'active' | 'paused' | 'canceled' | 'past_due';
  payment_status: string;
  started_at: string;
  canceled_at: string | null;
  current_period_start: string;
  current_period_end: string;
  stripe_subscription_id: string;
}

const prefectures = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
];

const CANCELLATION_REASONS = [
  {
    category: '量・配送に関すること',
    options: [
      { key: 'too_much_quantity', label: '届く量が多すぎた' },
      { key: 'too_frequent', label: '配送の頻度が多すぎた' },
      { key: 'freezer_full', label: '冷凍庫に入りきらなかった' },
    ],
  },
  {
    category: '商品・品質に関すること',
    options: [
      { key: 'taste_mismatch', label: '味が自分に合わなかった' },
      { key: 'menu_variety', label: 'メニューのバリエーションが少なかった' },
      { key: 'nutrition_mismatch', label: 'カロリーや栄養バランスが合わなかった' },
    ],
  },
  {
    category: '料金に関すること',
    options: [
      { key: 'too_expensive', label: '料金が高いと感じた' },
      { key: 'unexpected_price', label: '想定していた料金と違った' },
    ],
  },
  {
    category: '目的・状況の変化',
    options: [
      { key: 'goal_reached', label: '目標体重・体型に達した' },
      { key: 'sports_stopped', label: '部活・スポーツをやめた・休止した' },
      { key: 'self_managed', label: '自分で食事管理できるようになった' },
      { key: 'family_cooking', label: '家族・保護者が食事を用意できるようになった' },
    ],
  },
  {
    category: 'サービス・使い勝手に関すること',
    options: [
      { key: 'confusing_ui', label: '注文・解約の操作がわかりにくかった' },
      { key: 'delivery_schedule', label: '配送日の調整が難しかった' },
    ],
  },
];

export default function MyPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'subscriptions'>('profile');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // 解約モーダル用 state
  const [cancelModalSub, setCancelModalSub] = useState<Subscription | null>(null);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [cancelMessage, setCancelMessage] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);

  useEffect(() => {
    const supabase = createBrowserClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login');
        return;
      }
      setUser(session.user);
      loadProfile(session.user.id, session.user.email || '');
      loadOrders(session.user.email || '');
      loadSubscriptions(session.user.id, session.user.email || '');
    });
  }, [router]);

  const loadProfile = async (userId: string, email: string) => {
    try {
      const res = await fetch(`/api/users/profile?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      } else if (res.status === 404) {
        // プロフィールが存在しない場合は新規作成
        const createRes = await fetch('/api/users/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, email }),
        });
        if (createRes.ok) {
          const data = await createRes.json();
          setProfile(data);
        }
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async (email: string) => {
    setOrdersLoading(true);
    try {
      const res = await fetch(`/api/users/orders?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setOrdersLoading(false);
    }
  };

  const loadSubscriptions = async (userId: string, email: string) => {
    setSubscriptionsLoading(true);
    try {
      const res = await fetch(`/api/users/subscriptions?userId=${userId}&email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data.subscriptions || []);
      }
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
    } finally {
      setSubscriptionsLoading(false);
    }
  };

  const updateProfile = async (updatedProfile: Partial<UserProfile>) => {
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, ...updatedProfile }),
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        alert('プロフィールを更新しました');
      } else {
        const error = await res.json();
        alert(`更新に失敗しました: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('更新に失敗しました');
    }
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const toggleReason = (key: string) => {
    setSelectedReasons(prev =>
      prev.includes(key) ? prev.filter(r => r !== key) : [...prev, key]
    );
  };

  const handleCancelSubscription = async () => {
    if (!cancelModalSub || selectedReasons.length === 0) return;
    setCancelLoading(true);
    try {
      const res = await fetch('/api/users/subscriptions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: cancelModalSub.id,
          stripeSubscriptionId: cancelModalSub.stripe_subscription_id,
          reasons: selectedReasons,
          message: cancelMessage || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '解約に失敗しました');
      }
      setCancelSuccess(true);
      // サブスクリプション一覧を更新
      if (user) {
        loadSubscriptions(user.id, user.email || '');
      }
      // 3秒後にモーダルを閉じる
      setTimeout(() => {
        setCancelModalSub(null);
        setSelectedReasons([]);
        setCancelMessage('');
        setCancelSuccess(false);
      }, 3000);
    } catch (error: any) {
      alert(error.message || '解約処理に失敗しました');
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-gray-100 pt-24 sm:pt-8 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">マイページ</h1>
            <p className="text-gray-600 mt-2">会員情報とカートを管理できます</p>
          </div>

          {/* タブ */}
          <div className="flex space-x-1 sm:space-x-4 mb-6 border-b border-gray-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 sm:px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                activeTab === 'profile'
                  ? 'text-orange-600 border-b-2 border-orange-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              会員情報
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 sm:px-6 py-3 font-medium transition-colors whitespace-nowrap relative ${
                activeTab === 'orders'
                  ? 'text-orange-600 border-b-2 border-orange-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              購入履歴
              {orders.length > 0 && (
                <span className="ml-2 bg-gray-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {orders.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`px-4 sm:px-6 py-3 font-medium transition-colors whitespace-nowrap relative ${
                activeTab === 'subscriptions'
                  ? 'text-orange-600 border-b-2 border-orange-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              定期購入
              {subscriptions.filter(s => s.status === 'active').length > 0 && (
                <span className="ml-2 bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {subscriptions.filter(s => s.status === 'active').length}
                </span>
              )}
            </button>
          </div>

          {/* 会員情報タブ */}
          {activeTab === 'profile' && (
            <ProfileForm profile={profile} onUpdate={updateProfile} />
          )}

          {/* 購入履歴タブ */}
          {activeTab === 'orders' && (
            <OrderHistory orders={orders} loading={ordersLoading} />
          )}

          {/* 定期購入タブ */}
          {activeTab === 'subscriptions' && (
            <div className="space-y-6">
              {/* サブスクリプション一覧 */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">ご契約中の定期購入</h2>
                
                {subscriptionsLoading ? (
                  <div className="text-center py-8 text-gray-500">読み込み中...</div>
                ) : subscriptions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">現在ご契約中の定期購入はありません</p>
                    <Link href="/purchase" className="text-orange-600 hover:underline">
                      定期購入プランを見る →
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {subscriptions.map((sub) => (
                      <div key={sub.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-medium text-gray-900 text-lg">{sub.plan_name}</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {sub.meals_per_delivery}食/回 × 
                              {sub.deliveries_per_month === 1 ? '月1回' : 
                               sub.deliveries_per_month === 2 ? '月2回' : '月4回'}配送
                            </p>
                          </div>
                          <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                            sub.status === 'active' 
                              ? 'bg-green-100 text-green-800'
                              : sub.status === 'canceled'
                              ? 'bg-gray-100 text-gray-800'
                              : sub.status === 'past_due'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {sub.status === 'active' ? '契約中' : 
                             sub.status === 'canceled' ? '解約済み' : 
                             sub.status === 'past_due' ? '支払い遅延' :
                             sub.status === 'paused' ? '一時停止' : sub.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1 bg-gray-50 rounded-lg p-3">
                          <div className="flex justify-between">
                            <span>月額合計</span>
                            <span className="font-medium">¥{sub.monthly_total_amount?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>（商品: ¥{sub.monthly_product_price?.toLocaleString()} + 送料: ¥{sub.monthly_shipping_fee?.toLocaleString()}）</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
                            <span>契約開始日</span>
                            <span>{new Date(sub.started_at).toLocaleDateString('ja-JP')}</span>
                          </div>
                          {sub.next_delivery_date && sub.status === 'active' && (
                            <div className="flex justify-between">
                              <span>次回配送予定</span>
                              <span className="text-orange-600 font-medium">{new Date(sub.next_delivery_date).toLocaleDateString('ja-JP')}</span>
                            </div>
                          )}
                          {sub.current_period_end && sub.status === 'active' && (
                            <div className="flex justify-between">
                              <span>次回更新日</span>
                              <span>{new Date(sub.current_period_end).toLocaleDateString('ja-JP')}</span>
                            </div>
                          )}
                          {sub.canceled_at && (
                            <div className="flex justify-between text-red-600">
                              <span>解約日</span>
                              <span>{new Date(sub.canceled_at).toLocaleDateString('ja-JP')}</span>
                            </div>
                          )}
                        </div>
                        {sub.status === 'active' && (
                          <button
                            onClick={() => {
                              setCancelModalSub(sub);
                              setSelectedReasons([]);
                              setCancelMessage('');
                              setCancelSuccess(false);
                            }}
                            className="mt-3 w-full py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            解約する
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 解約についての説明 */}
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                <p className="text-xs leading-relaxed text-gray-500">
                  解約は各プランの「解約する」ボタンからお手続きいただけます。
                  解約後も課金済みの期間分は通常通り配送されます。
                  ご不明点は<a href="/contact" className="text-orange-600 hover:underline">お問い合わせ</a>よりご連絡ください。
                </p>
              </div>
            </div>
          )}

          {/* 解約理由選択モーダル */}
          {cancelModalSub && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
                {cancelSuccess ? (
                  <div className="text-center py-8">
                    <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">解約手続きが完了しました</h3>
                    <p className="text-sm text-gray-600">
                      解約確認メールをお送りしました。<br />
                      課金済みの期間分は通常通り配送されます。
                    </p>
                  </div>
                ) : (
                  <>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">定期購入の解約</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      {cancelModalSub.plan_name}を解約します。<br />
                      よろしければ解約の理由をお聞かせください（複数選択可）。
                    </p>

                    <div className="space-y-4 mb-4">
                      {CANCELLATION_REASONS.map((group) => (
                        <div key={group.category}>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">{group.category}</h4>
                          <div className="space-y-2">
                            {group.options.map((option) => (
                              <label key={option.key} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedReasons.includes(option.key)}
                                  onChange={() => toggleReason(option.key)}
                                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                                />
                                <span className="text-sm text-gray-700">{option.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        その他ご意見（任意）
                      </label>
                      <textarea
                        value={cancelMessage}
                        onChange={(e) => setCancelMessage(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="改善のためのご意見があればお聞かせください"
                      />
                    </div>

                    {selectedReasons.length === 0 && (
                      <p className="text-red-500 text-xs mb-3">解約の理由を1つ以上お選びください</p>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setCancelModalSub(null);
                          setSelectedReasons([]);
                          setCancelMessage('');
                        }}
                        className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                      >
                        キャンセル
                      </button>
                      <button
                        onClick={handleCancelSubscription}
                        disabled={cancelLoading || selectedReasons.length === 0}
                        className={`flex-1 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                          cancelLoading || selectedReasons.length === 0
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                      >
                        {cancelLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            処理中...
                          </>
                        ) : (
                          '解約を確定する'
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ログアウトボタン - ページ下部 */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <button
              onClick={() => setShowLogoutModal(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-gray-300 hover:border-red-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              ログアウト
            </button>
          </div>
        </div>
      </main>

      {/* ログアウトモーダル */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        loading={logoutLoading}
      />
    </>
  );
}

// プロフィールフォームコンポーネント
function ProfileForm({
  profile,
  onUpdate,
}: {
  profile: UserProfile | null;
  onUpdate: (p: Partial<UserProfile>) => void;
}) {
  const [formData, setFormData] = useState<UserProfile>({
    id: '',
    email: '',
    last_name: '',
    first_name: '',
    last_name_kana: '',
    first_name_kana: '',
    phone: '',
    postal_code: '',
    prefecture: '',
    city: '',
    address_detail: '',
    building: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        id: profile.id,
        email: profile.email,
        last_name: profile.last_name || '',
        first_name: profile.first_name || '',
        last_name_kana: profile.last_name_kana || '',
        first_name_kana: profile.first_name_kana || '',
        phone: profile.phone || '',
        postal_code: profile.postal_code || '',
        prefecture: profile.prefecture || '',
        city: profile.city || '',
        address_detail: profile.address_detail || '',
        building: profile.building || '',
      });
    }
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-6">会員情報</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* メールアドレス（読み取り専用） */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            メールアドレス
          </label>
          <input
            type="email"
            value={formData.email}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
          />
        </div>

        {/* 氏名 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              姓 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* フリガナ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              姓（カナ）
            </label>
            <input
              type="text"
              value={formData.last_name_kana}
              onChange={(e) => setFormData({ ...formData, last_name_kana: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              名（カナ）
            </label>
            <input
              type="text"
              value={formData.first_name_kana}
              onChange={(e) => setFormData({ ...formData, first_name_kana: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* 電話番号 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            電話番号
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="090-1234-5678"
          />
        </div>

        {/* 郵便番号 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            郵便番号
          </label>
          <input
            type="text"
            value={formData.postal_code}
            onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="123-4567"
          />
        </div>

        {/* 都道府県 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            都道府県
          </label>
          <select
            value={formData.prefecture}
            onChange={(e) => setFormData({ ...formData, prefecture: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">選択してください</option>
            {prefectures.map((pref) => (
              <option key={pref} value={pref}>
                {pref}
              </option>
            ))}
          </select>
        </div>

        {/* 市区町村 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            市区町村
          </label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* 番地 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            番地
          </label>
          <input
            type="text"
            value={formData.address_detail}
            onChange={(e) => setFormData({ ...formData, address_detail: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* 建物名 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            建物名
          </label>
          <input
            type="text"
            value={formData.building}
            onChange={(e) => setFormData({ ...formData, building: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="マンション名・部屋番号など"
          />
        </div>

        <div className="flex justify-end space-x-4">
          <Link
            href="/"
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            キャンセル
          </Link>
          <button
            type="submit"
            className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
          >
            更新
          </button>
        </div>
      </form>
    </div>
  );
}

// 購入履歴表示コンポーネント
function OrderHistory({
  orders,
  loading,
}: {
  orders: Order[];
  loading: boolean;
}) {
  const getStatusLabel = (status: Order['status']) => {
    // 管理画面のステータスをマイページ表示用に変換
    // order_received (注文受付) → 注文済み
    // notified (連絡済み) → 発送中
    // shipped (発送済み) → 配達完了
    const labels: { [key: string]: string } = {
      order_received: '注文済み',
      pending: '注文済み',  // 互換性のため
      notified: '発送中',
      confirmed: '発送中',  // 互換性のため
      shipped: '配達完了',
      delivered: '配達完了',  // 互換性のため
      cancelled: 'キャンセル',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: Order['status']) => {
    // 管理画面のステータスをマイページ表示用に変換
    const colors: { [key: string]: string } = {
      order_received: 'bg-blue-100 text-blue-800',  // 注文済み
      pending: 'bg-blue-100 text-blue-800',  // 互換性のため
      notified: 'bg-yellow-100 text-yellow-800',  // 発送中
      confirmed: 'bg-yellow-100 text-yellow-800',  // 互換性のため
      shipped: 'bg-green-100 text-green-800',  // 配達完了
      delivered: 'bg-green-100 text-green-800',  // 互換性のため
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">読み込み中...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-gray-600 mb-4">まだ購入履歴がありません</p>
        <Link
          href="/purchase"
          className="inline-block bg-orange-600 text-white px-6 py-2 rounded-md hover:bg-orange-700"
        >
          商品を購入する
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-6">購入履歴</h2>
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">注文番号</span>
                  <span className="font-mono font-medium">#{order.order_number}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>
                <span className="text-sm text-gray-500">{formatDate(order.created_at)}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">商品</p>
                  <p className="font-medium">{order.menu_set}</p>
                  <p className="text-sm text-gray-600">数量: {order.quantity}</p>
                </div>
                <div className="sm:text-right">
                  <p className="text-sm text-gray-500">お支払い金額</p>
                  <p className="text-xl font-bold text-orange-600">¥{order.amount.toLocaleString()}</p>
                </div>
              </div>

              {order.address && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-sm text-gray-500">配送先</p>
                  <p className="text-sm text-gray-700">{order.address}</p>
                </div>
              )}

              {order.notes && (
                <div className="mt-2">
                  <p className="text-sm text-gray-500">備考</p>
                  <p className="text-sm text-gray-700">{order.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
