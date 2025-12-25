'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';

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

interface CartItem {
  id: string;
  menu_item_id: string;
  menu_item_name: string;
  quantity: number;
  price: number;
  image?: string;
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

export default function MyPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'cart'>('profile');

  useEffect(() => {
    const supabase = createBrowserClient();
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login');
        return;
      }
      setUser(session.user);
      loadProfile(session.user.id);
      loadCart(session.user.id);
    });
  }, [router]);

  const loadProfile = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/profile?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      } else if (res.status === 404) {
        // プロフィールが存在しない場合は新規作成
        const res = await fetch('/api/users/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, email: user?.email }),
        });
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCart = async (userId: string) => {
    try {
      const res = await fetch(`/api/cart?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setCartItems(data.items || []);
      }
    } catch (error) {
      console.error('Failed to load cart:', error);
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

  const updateCartItem = async (cartItemId: string, quantity: number) => {
    try {
      const res = await fetch('/api/cart', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, cartItemId, quantity }),
      });
      if (res.ok) {
        loadCart(user.id);
      } else {
        alert('カートの更新に失敗しました');
      }
    } catch (error) {
      console.error('Failed to update cart:', error);
      alert('カートの更新に失敗しました');
    }
  };

  const deleteCartItem = async (cartItemId: string) => {
    if (!confirm('この商品をカートから削除しますか？')) return;

    try {
      const res = await fetch('/api/cart', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, cartItemId }),
      });
      if (res.ok) {
        loadCart(user.id);
      } else {
        alert('カートからの削除に失敗しました');
      }
    } catch (error) {
      console.error('Failed to delete cart item:', error);
      alert('カートからの削除に失敗しました');
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

  const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">マイページ</h1>
          <p className="text-gray-600 mt-2">会員情報とカートを管理できます</p>
        </div>

        {/* タブ */}
        <div className="flex space-x-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'profile'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            会員情報
          </button>
          <button
            onClick={() => setActiveTab('cart')}
            className={`px-6 py-3 font-medium transition-colors relative ${
              activeTab === 'cart'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            カート
            {cartItems.length > 0 && (
              <span className="ml-2 bg-orange-600 text-white text-xs px-2 py-0.5 rounded-full">
                {cartItems.length}
              </span>
            )}
          </button>
        </div>

        {/* 会員情報タブ */}
        {activeTab === 'profile' && (
          <ProfileForm profile={profile} onUpdate={updateProfile} />
        )}

        {/* カートタブ */}
        {activeTab === 'cart' && (
          <CartView
            items={cartItems}
            totalAmount={totalAmount}
            onUpdate={updateCartItem}
            onDelete={deleteCartItem}
          />
        )}
      </div>
    </div>
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

// カート表示コンポーネント
function CartView({
  items,
  totalAmount,
  onUpdate,
  onDelete,
}: {
  items: CartItem[];
  totalAmount: number;
  onUpdate: (cartItemId: string, quantity: number) => void;
  onDelete: (cartItemId: string) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-600 mb-4">カートは空です</p>
        <Link
          href="/menu-list"
          className="inline-block bg-orange-600 text-white px-6 py-2 rounded-md hover:bg-orange-700"
        >
          メニューを見る
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-6">カート</h2>
      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center space-x-4 border-b border-gray-200 pb-4"
          >
            {item.image && (
              <div className="w-20 h-20 relative flex-shrink-0">
                <Image
                  src={item.image}
                  alt={item.menu_item_name}
                  fill
                  className="object-cover rounded-md"
                />
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{item.menu_item_name}</h3>
              <p className="text-gray-600">¥{item.price.toLocaleString()}</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onUpdate(item.id, Math.max(1, item.quantity - 1))}
                className="w-8 h-8 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center justify-center"
              >
                -
              </button>
              <span className="w-12 text-center">{item.quantity}</span>
              <button
                onClick={() => onUpdate(item.id, item.quantity + 1)}
                className="w-8 h-8 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center justify-center"
              >
                +
              </button>
            </div>
            <div className="text-right">
              <p className="font-medium">
                ¥{(item.price * item.quantity).toLocaleString()}
              </p>
              <button
                onClick={() => onDelete(item.id)}
                className="text-red-600 text-sm hover:underline mt-1"
              >
                削除
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-medium">合計金額</span>
          <span className="text-2xl font-bold text-orange-600">
            ¥{totalAmount.toLocaleString()}
          </span>
        </div>
        <Link
          href="/purchase"
          className="block w-full bg-orange-600 text-white text-center py-3 rounded-md hover:bg-orange-700 font-medium"
        >
          購入手続きへ進む
        </Link>
      </div>
    </div>
  );
}

