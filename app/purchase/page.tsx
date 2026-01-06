'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import MobileHeader from '@/components/MobileHeader';
import Footer from '@/components/Footer';
import { createBrowserClient } from '@/lib/supabase';

// ユーザープロフィール型
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

interface PlanOption {
  id: string;
  quantity: number;
  label: string;
  price: number;
  description: string;
  perMeal: number;
  stripeLink: string;
  comingSoon: boolean;
}

const planOptions: PlanOption[] = [
  {
    id: 'plan-6',
    quantity: 6,
    label: 'ふとるめし6個セット',
    price: 3600,
    description: '6種類×1個ずつ',
    perMeal: 600,
    stripeLink: 'https://buy.stripe.com/3cI4gA2xxdnP7bkgC86Zy0b',
    comingSoon: false,
  },
  {
    id: 'plan-12',
    quantity: 12,
    label: 'ふとるめし12個セット',
    price: 6700,
    description: '6種類×2個ずつ',
    perMeal: 558,
    stripeLink: 'https://buy.stripe.com/6oU3cwdcbgA1dzIadK6Zy0c',
    comingSoon: false,
  },
  {
    id: 'plan-18',
    quantity: 18,
    label: 'ふとるめし18個セット',
    price: 9800,
    description: '6種類×3個ずつ',
    perMeal: 544,
    stripeLink: 'https://buy.stripe.com/bJeaEY6NNabD7bk4Tq6Zy0d',
    comingSoon: false,
  }
];

interface CustomerInfo {
  lastName: string;
  firstName: string;
  lastNameKana: string;
  firstNameKana: string;
  email: string;
  phone: string;
  postalCode: string;
  prefecture: string;
  city: string;
  address: string;
  building: string;
}

// カートアイテムの型
interface CartItem {
  planId: string;
  quantity: number;
}

// 在庫状況の型
interface InventoryStatus {
  available: boolean;
  minStock: number;
  sets: {
    'plan-6': boolean;
    'plan-12': boolean;
    'plan-18': boolean;
  };
  maxQuantity: {
    'plan-6': number;
    'plan-12': number;
    'plan-18': number;
  };
}

const PurchasePage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState<'plan' | 'info' | 'confirm'>('plan');
  // カート形式で複数セットを管理
  const [cart, setCart] = useState<CartItem[]>([
    { planId: 'plan-6', quantity: 0 },
    { planId: 'plan-12', quantity: 0 },
    { planId: 'plan-18', quantity: 0 },
  ]);
  // 在庫状況
  const [inventory, setInventory] = useState<InventoryStatus | null>(null);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    lastName: '',
    firstName: '',
    lastNameKana: '',
    firstNameKana: '',
    email: '',
    phone: '',
    postalCode: '',
    prefecture: '',
    city: '',
    address: '',
    building: '',
  });
  const [errors, setErrors] = useState<Partial<CustomerInfo>>({});

  // ログインユーザーとプロフィールの状態
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // 送料とクーポン
  const shippingFee = 990;
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState('');

  // 有効なクーポンコード
  const validCoupons: { [key: string]: number } = {
    'WELCOME1000': 1000,
    'FUTORU1000': 1000,
    'START1000': 1000,   // ふとるめしスタート記念割引
    'FUTORUMESHI1000': 1000,
  };

  // ログインユーザーとプロフィールを取得
  useEffect(() => {
    const loadUserProfile = async () => {
      const supabase = createBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);
        try {
          const res = await fetch(`/api/users/profile?userId=${session.user.id}`);
          if (res.ok) {
            const data = await res.json();
            setUserProfile(data);
          }
        } catch (error) {
          console.error('Failed to load profile:', error);
        }
      }
      setProfileLoading(false);
    };
    loadUserProfile();
  }, []);

  // 在庫状況を取得
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const response = await fetch('/api/inventory/check');
        if (response.ok) {
          const data = await response.json();
          setInventory(data);
        }
      } catch (error) {
        console.error('Failed to fetch inventory:', error);
      } finally {
        setInventoryLoading(false);
      }
    };
    fetchInventory();
  }, []);

  useEffect(() => {
    const planParam = searchParams.get('plan');
    if (planParam && planOptions.some(p => p.id === planParam)) {
      // URLパラメータで指定されたプランを1つカートに追加
      setCart(prev => prev.map(item =>
        item.planId === planParam ? { ...item, quantity: 1 } : item
      ));
    }
  }, [searchParams]);

  // カート内の合計金額を計算
  const subtotal = cart.reduce((total, item) => {
    const plan = planOptions.find(p => p.id === item.planId);
    return total + (plan ? plan.price * item.quantity : 0);
  }, 0);

  // カート内の合計食数を計算
  const totalMeals = cart.reduce((total, item) => {
    const plan = planOptions.find(p => p.id === item.planId);
    return total + (plan ? plan.quantity * item.quantity : 0);
  }, 0);

  // カートが空かどうか
  const isCartEmpty = cart.every(item => item.quantity === 0);

  // 割引額
  const discount = appliedCoupon ? appliedCoupon.discount : 0;

  // 合計金額（商品小計 + 送料 - 割引）
  const totalAmount = subtotal + shippingFee - discount;

  // クーポン適用
  const applyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (validCoupons[code]) {
      setAppliedCoupon({ code, discount: validCoupons[code] });
      setCouponError('');
    } else {
      setCouponError('無効なクーポンコードです');
      setAppliedCoupon(null);
    }
  };

  // クーポン削除
  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  // 登録済みプロフィール情報を入力フォームに反映
  const fillWithProfile = () => {
    if (!userProfile) return;

    setCustomerInfo({
      lastName: userProfile.last_name || '',
      firstName: userProfile.first_name || '',
      lastNameKana: userProfile.last_name_kana || '',
      firstNameKana: userProfile.first_name_kana || '',
      email: userProfile.email || user?.email || '',
      phone: userProfile.phone || '',
      postalCode: userProfile.postal_code || '',
      prefecture: userProfile.prefecture || '',
      city: userProfile.city || '',
      address: userProfile.address_detail || '',
      building: userProfile.building || '',
    });
    // エラーをクリア
    setErrors({});
  };

  // プロフィールにデータがあるかチェック
  const hasProfileData = userProfile && (
    userProfile.last_name ||
    userProfile.first_name ||
    userProfile.postal_code ||
    userProfile.prefecture
  );

  // カートの数量を更新
  const updateCartQuantity = (planId: string, newQuantity: number) => {
    setCart(prev => prev.map(item =>
      item.planId === planId ? { ...item, quantity: Math.max(0, newQuantity) } : item
    ));
  };

  const prefectures = [
    '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
    '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
    '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
    '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
    '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
    '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
    '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
  ];

  const [isSearchingAddress, setIsSearchingAddress] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof CustomerInfo]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // 郵便番号から住所を自動検索
  const searchAddressByPostalCode = async (postalCode: string) => {
    // ハイフンを除去して7桁の数字のみにする
    const cleanPostalCode = postalCode.replace(/-/g, '');

    if (cleanPostalCode.length !== 7) return;

    setIsSearchingAddress(true);
    try {
      const response = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${cleanPostalCode}`);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        setCustomerInfo(prev => ({
          ...prev,
          prefecture: result.address1,
          city: result.address2 + result.address3,
        }));
        // エラーをクリア
        setErrors(prev => ({ ...prev, prefecture: '', city: '' }));
      }
    } catch (error) {
      console.error('住所検索エラー:', error);
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomerInfo(prev => ({ ...prev, postalCode: value }));
    if (errors.postalCode) {
      setErrors(prev => ({ ...prev, postalCode: '' }));
    }

    // 7桁入力されたら自動検索
    const cleanValue = value.replace(/-/g, '');
    if (cleanValue.length === 7) {
      searchAddressByPostalCode(value);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<CustomerInfo> = {};

    if (!customerInfo.lastName.trim()) newErrors.lastName = '姓を入力してください';
    if (!customerInfo.firstName.trim()) newErrors.firstName = '名を入力してください';
    if (!customerInfo.lastNameKana.trim()) newErrors.lastNameKana = 'セイを入力してください';
    if (!customerInfo.firstNameKana.trim()) newErrors.firstNameKana = 'メイを入力してください';
    if (!customerInfo.email.trim()) {
      newErrors.email = 'メールアドレスを入力してください';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email)) {
      newErrors.email = '正しいメールアドレスを入力してください';
    }
    if (!customerInfo.phone.trim()) {
      newErrors.phone = '電話番号を入力してください';
    } else if (!/^[0-9-]+$/.test(customerInfo.phone)) {
      newErrors.phone = '正しい電話番号を入力してください';
    }
    if (!customerInfo.postalCode.trim()) {
      newErrors.postalCode = '郵便番号を入力してください';
    } else if (!/^\d{3}-?\d{4}$/.test(customerInfo.postalCode)) {
      newErrors.postalCode = '正しい郵便番号を入力してください';
    }
    if (!customerInfo.prefecture) newErrors.prefecture = '都道府県を選択してください';
    if (!customerInfo.city.trim()) newErrors.city = '市区町村を入力してください';
    if (!customerInfo.address.trim()) newErrors.address = '番地を入力してください';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProceedToInfo = () => {
    if (!isCartEmpty) {
      setCurrentStep('info');
      window.scrollTo(0, 0);
    }
  };

  const handleProceedToConfirm = () => {
    if (validateForm()) {
      setCurrentStep('confirm');
      window.scrollTo(0, 0);
    }
  };

  const handleBackToPlan = () => {
    setCurrentStep('plan');
    window.scrollTo(0, 0);
  };

  const handleBackToInfo = () => {
    setCurrentStep('info');
    window.scrollTo(0, 0);
  };

  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleProceedToPayment = async () => {
    if (!isCartEmpty && !checkoutLoading) {
      setCheckoutLoading(true);
      try {
        // お客様情報をローカルストレージに保存（決済完了後に使用）
        localStorage.setItem('customerInfo', JSON.stringify(customerInfo));
        localStorage.setItem('cart', JSON.stringify(cart));
        localStorage.setItem('subtotal', String(subtotal));
        localStorage.setItem('shippingFee', String(shippingFee));
        localStorage.setItem('discount', String(discount));
        localStorage.setItem('totalAmount', String(totalAmount));
        if (appliedCoupon) {
          localStorage.setItem('appliedCoupon', JSON.stringify(appliedCoupon));
        }

        // Stripe Checkout Sessionを作成
        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cart: cart.filter(item => item.quantity > 0),
            customerInfo: {
              lastName: customerInfo.lastName,
              firstName: customerInfo.firstName,
              email: customerInfo.email,
              phone: customerInfo.phone,
              postalCode: customerInfo.postalCode,
              prefecture: customerInfo.prefecture,
              city: customerInfo.city,
              address: customerInfo.address,
              building: customerInfo.building,
            },
            couponCode: appliedCoupon?.code,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || '決済の準備に失敗しました');
        }

        // Stripe Checkoutページへリダイレクト
        window.location.href = data.url;
      } catch (error: any) {
        console.error('Checkout error:', error);
        alert(error.message || '決済の準備に失敗しました。もう一度お試しください。');
        setCheckoutLoading(false);
      }
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center">
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep === 'plan' ? 'bg-orange-600 text-white' : 'bg-orange-600 text-white'}`}>
          1
        </div>
        <span className={`ml-2 text-sm font-medium ${currentStep === 'plan' ? 'text-orange-600' : 'text-gray-900'}`}>
          セット選択
        </span>
      </div>
      <div className={`w-12 h-0.5 mx-2 ${currentStep !== 'plan' ? 'bg-orange-600' : 'bg-gray-300'}`} />
      <div className="flex items-center">
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep === 'info' ? 'bg-orange-600 text-white' : currentStep === 'confirm' ? 'bg-orange-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
          2
        </div>
        <span className={`ml-2 text-sm font-medium ${currentStep === 'info' ? 'text-orange-600' : currentStep === 'confirm' ? 'text-gray-900' : 'text-gray-500'}`}>
          お客様情報
        </span>
      </div>
      <div className={`w-12 h-0.5 mx-2 ${currentStep === 'confirm' ? 'bg-orange-600' : 'bg-gray-300'}`} />
      <div className="flex items-center">
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep === 'confirm' ? 'bg-orange-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
          3
        </div>
        <span className={`ml-2 text-sm font-medium ${currentStep === 'confirm' ? 'text-orange-600' : 'text-gray-500'}`}>
          確認・決済
        </span>
      </div>
    </div>
  );

  // プランが在庫切れかどうかをチェック
  const isPlanOutOfStock = (planId: string): boolean => {
    if (!inventory) return false;
    return !inventory.sets[planId as keyof typeof inventory.sets];
  };

  // プランの最大購入可能数を取得
  const getMaxQuantity = (planId: string): number => {
    if (!inventory) return 99;
    return inventory.maxQuantity[planId as keyof typeof inventory.maxQuantity] || 0;
  };

  const renderPlanSelection = () => (
    <div className="space-y-6">
      {/* 在庫切れ警告 */}
      {inventory && !inventory.available && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="font-medium">現在、在庫切れのため販売を停止しております。</span>
          </div>
          <p className="text-sm text-red-600 mt-1">再入荷までしばらくお待ちください。</p>
        </div>
      )}

      {/* セット選択（カート形式） */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          セットを選択してください
        </h2>
        <p className="text-sm text-gray-500 mb-6">複数のセットを組み合わせて購入できます</p>
        <div className="space-y-4">
          {planOptions.map((plan) => {
            const cartItem = cart.find(item => item.planId === plan.id);
            const quantity = cartItem?.quantity || 0;
            const outOfStock = isPlanOutOfStock(plan.id);
            const maxQty = getMaxQuantity(plan.id);
            return (
              <div
                key={plan.id}
                className={`relative rounded-lg border-2 p-4 transition-all ${
                  plan.comingSoon || outOfStock
                    ? 'border-gray-200'
                    : quantity > 0
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200'
                }`}
              >
                {/* Coming Soon オーバーレイ */}
                {plan.comingSoon && (
                  <div className="absolute inset-0 bg-gray-100/80 backdrop-blur-[2px] rounded-lg z-10 flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-xl font-bold text-gray-500">Coming Soon</span>
                      <p className="text-sm text-gray-400 mt-1">準備中</p>
                    </div>
                  </div>
                )}

                {/* 在庫切れオーバーレイ */}
                {!plan.comingSoon && outOfStock && (
                  <div className="absolute inset-0 bg-red-50/80 backdrop-blur-[2px] rounded-lg z-10 flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-xl font-bold text-red-500">在庫切れ</span>
                      <p className="text-sm text-red-400 mt-1">申し訳ございません</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  {/* プラン情報 */}
                  <div className="flex-1">
                    <span className="text-lg font-semibold text-gray-900">
                      {plan.label}
                    </span>
                    <p className="text-sm text-gray-600 mt-1">
                      {plan.description}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xl font-bold text-orange-600">
                        ¥{plan.price.toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-500">
                        （1食あたり ¥{plan.perMeal.toLocaleString()}）
                      </span>
                    </div>
                  </div>

                  {/* 数量選択 */}
                  <div className="flex items-center space-x-3 ml-4">
                    <button
                      onClick={() => updateCartQuantity(plan.id, quantity - 1)}
                      disabled={quantity <= 0 || plan.comingSoon || outOfStock}
                      className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-orange-600 hover:text-orange-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <span className="text-2xl font-bold text-gray-900 w-8 text-center">{quantity}</span>
                    <button
                      onClick={() => updateCartQuantity(plan.id, quantity + 1)}
                      disabled={plan.comingSoon || outOfStock || quantity >= maxQty}
                      className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-orange-600 hover:text-orange-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* 残り在庫表示 */}
                {!plan.comingSoon && !outOfStock && maxQty <= 10 && (
                  <div className="mt-2 text-sm text-orange-600">
                    残り {maxQty} セットのみ
                  </div>
                )}

                {/* 小計表示 */}
                {quantity > 0 && !plan.comingSoon && (
                  <div className="mt-3 pt-3 border-t border-orange-200 flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      {plan.quantity * quantity}食
                    </span>
                    <span className="text-lg font-semibold text-orange-600">
                      ¥{(plan.price * quantity).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 合計金額 */}
      {!isCartEmpty && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">ご注文内容</p>
              {cart.filter(item => item.quantity > 0).map(item => {
                const plan = planOptions.find(p => p.id === item.planId);
                if (!plan) return null;
                return (
                  <p key={item.planId} className="text-gray-900">
                    {plan.label} × {item.quantity}
                  </p>
                );
              })}
              <p className="text-sm text-gray-500 mt-1">
                合計 {totalMeals}食
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">合計金額</p>
              <p className="text-3xl text-orange-600">¥{subtotal.toLocaleString()}</p>
              <p className="text-xs text-gray-500">税込</p>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleProceedToInfo}
        disabled={isCartEmpty}
        className="w-full bg-orange-500 text-white py-4 rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        お客様情報の入力へ進む
      </button>
    </div>
  );

  const renderCustomerInfoForm = () => (
    <div className="space-y-6">
      {/* 選択中のプラン表示 */}
      {!isCartEmpty && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm text-gray-500">ご注文内容</span>
              {cart.filter(item => item.quantity > 0).map(item => {
                const plan = planOptions.find(p => p.id === item.planId);
                if (!plan) return null;
                return (
                  <p key={item.planId} className="text-gray-900">
                    {plan.label} × {item.quantity}
                  </p>
                );
              })}
              <p className="text-sm text-gray-500">合計 {totalMeals}食</p>
            </div>
            <p className="text-xl text-orange-600">¥{subtotal.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* 登録情報を使用ボタン */}
      {user && hasProfileData && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <div>
                <p className="font-medium text-blue-900">会員登録済みです</p>
                <p className="text-sm text-blue-700">登録済みの住所情報を使用できます</p>
              </div>
            </div>
            <button
              onClick={fillWithProfile}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              登録情報を使用
            </button>
          </div>
        </div>
      )}

      {/* お客様情報 */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          お客様情報
        </h2>
        <div className="space-y-4">
          {/* 氏名 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                姓 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="lastName"
                value={customerInfo.lastName}
                onChange={handleInputChange}
                placeholder="山田"
                className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none ${errors.lastName ? 'border-red-500' : 'border-gray-300 focus:border-orange-600'}`}
              />
              {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="firstName"
                value={customerInfo.firstName}
                onChange={handleInputChange}
                placeholder="太郎"
                className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none ${errors.firstName ? 'border-red-500' : 'border-gray-300 focus:border-orange-600'}`}
              />
              {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
            </div>
          </div>

          {/* フリガナ */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                セイ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="lastNameKana"
                value={customerInfo.lastNameKana}
                onChange={handleInputChange}
                placeholder="ヤマダ"
                className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none ${errors.lastNameKana ? 'border-red-500' : 'border-gray-300 focus:border-orange-600'}`}
              />
              {errors.lastNameKana && <p className="text-red-500 text-xs mt-1">{errors.lastNameKana}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                メイ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="firstNameKana"
                value={customerInfo.firstNameKana}
                onChange={handleInputChange}
                placeholder="タロウ"
                className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none ${errors.firstNameKana ? 'border-red-500' : 'border-gray-300 focus:border-orange-600'}`}
              />
              {errors.firstNameKana && <p className="text-red-500 text-xs mt-1">{errors.firstNameKana}</p>}
            </div>
          </div>

          {/* メールアドレス */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              メールアドレス <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={customerInfo.email}
              onChange={handleInputChange}
              placeholder="example@email.com"
              className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none ${errors.email ? 'border-red-500' : 'border-gray-300 focus:border-orange-600'}`}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          {/* 電話番号 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              電話番号 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              value={customerInfo.phone}
              onChange={handleInputChange}
              placeholder="090-1234-5678"
              className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none ${errors.phone ? 'border-red-500' : 'border-gray-300 focus:border-orange-600'}`}
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
          </div>
        </div>
      </div>

      {/* 配送先情報 */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          配送先情報
        </h2>
        <div className="space-y-4">
          {/* 郵便番号 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              郵便番号 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="postalCode"
                value={customerInfo.postalCode}
                onChange={handlePostalCodeChange}
                placeholder="1234567"
                maxLength={8}
                className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none ${errors.postalCode ? 'border-red-500' : 'border-gray-300 focus:border-orange-600'}`}
              />
              {isSearchingAddress && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <svg className="animate-spin h-5 w-5 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
            </div>
            {errors.postalCode && <p className="text-red-500 text-xs mt-1">{errors.postalCode}</p>}
            <p className="text-xs text-gray-500 mt-1">※7桁入力で住所を自動検索します</p>
          </div>

          {/* 都道府県 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              都道府県 <span className="text-red-500">*</span>
            </label>
            <select
              name="prefecture"
              value={customerInfo.prefecture}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none ${errors.prefecture ? 'border-red-500' : 'border-gray-300 focus:border-orange-600'}`}
            >
              <option value="">選択してください</option>
              {prefectures.map(pref => (
                <option key={pref} value={pref}>{pref}</option>
              ))}
            </select>
            {errors.prefecture && <p className="text-red-500 text-xs mt-1">{errors.prefecture}</p>}
          </div>

          {/* 市区町村 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              市区町村 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="city"
              value={customerInfo.city}
              onChange={handleInputChange}
              placeholder="渋谷区"
              className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none ${errors.city ? 'border-red-500' : 'border-gray-300 focus:border-orange-600'}`}
            />
            {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
          </div>

          {/* 番地 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              番地 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="address"
              value={customerInfo.address}
              onChange={handleInputChange}
              placeholder="1-2-3"
              className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none ${errors.address ? 'border-red-500' : 'border-gray-300 focus:border-orange-600'}`}
            />
            {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
          </div>

          {/* 建物名・部屋番号 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              建物名・部屋番号
            </label>
            <input
              type="text"
              name="building"
              value={customerInfo.building}
              onChange={handleInputChange}
              placeholder="○○マンション 101号室"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-600 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* ボタン */}
      <div className="flex gap-4">
        <button
          onClick={handleBackToPlan}
          className="flex-1 bg-gray-200 text-gray-700 py-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
        >
          戻る
        </button>
        <button
          onClick={handleProceedToConfirm}
          className="flex-1 bg-orange-500 text-white py-4 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
        >
          確認画面へ進む
        </button>
      </div>
    </div>
  );

  const renderConfirmation = () => (
    <div className="space-y-6">
      {/* 注文内容 */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          ご注文内容
        </h2>
        {cart.filter(item => item.quantity > 0).map(item => {
          const plan = planOptions.find(p => p.id === item.planId);
          if (!plan) return null;
          return (
            <div key={item.planId} className="flex justify-between items-center py-3 border-b border-gray-200">
              <div>
                <p className="font-bold text-gray-900">{plan.label} × {item.quantity}</p>
                <p className="text-sm text-gray-600">{plan.description}</p>
                <p className="text-xs text-gray-500">{plan.quantity * item.quantity}食</p>
              </div>
              <p className="text-lg text-orange-600">¥{(plan.price * item.quantity).toLocaleString()}</p>
            </div>
          );
        })}

        {/* 小計 */}
        <div className="flex justify-between items-center py-3 border-b border-gray-200">
          <p className="text-gray-600">商品小計（{totalMeals}食）</p>
          <p className="text-gray-900">¥{subtotal.toLocaleString()}</p>
        </div>

        {/* 送料 */}
        <div className="flex justify-between items-center py-3 border-b border-gray-200">
          <p className="text-gray-600">送料</p>
          <p className="text-gray-900">¥{shippingFee.toLocaleString()}</p>
        </div>

        {/* クーポン割引 */}
        {appliedCoupon && (
          <div className="flex justify-between items-center py-3 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <p className="text-green-600">クーポン割引</p>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">{appliedCoupon.code}</span>
            </div>
            <p className="text-green-600">-¥{appliedCoupon.discount.toLocaleString()}</p>
          </div>
        )}

        {/* 合計 */}
        <div className="flex justify-between items-center py-4 mt-2">
          <p className="font-bold text-gray-900 text-lg">合計（税込）</p>
          <p className="text-2xl font-bold text-orange-600">¥{totalAmount.toLocaleString()}</p>
        </div>
      </div>

      {/* クーポンコード入力 */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          クーポンコード
        </h2>
        {appliedCoupon ? (
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-700 font-medium">{appliedCoupon.code}</span>
              <span className="text-green-600">（¥{appliedCoupon.discount.toLocaleString()}割引）</span>
            </div>
            <button
              onClick={removeCoupon}
              className="text-gray-500 hover:text-red-500 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value);
                setCouponError('');
              }}
              placeholder="クーポンコードを入力"
              className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-600 focus:outline-none"
            />
            <button
              onClick={applyCoupon}
              disabled={!couponCode.trim()}
              className="px-6 py-2 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              適用
            </button>
          </div>
        )}
        {couponError && (
          <p className="text-red-500 text-sm mt-2">{couponError}</p>
        )}
      </div>

      {/* お客様情報確認 */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          お客様情報
        </h2>
        <dl className="space-y-3">
          <div className="flex">
            <dt className="w-32 text-sm text-gray-600">お名前</dt>
            <dd className="flex-1 text-gray-900">{customerInfo.lastName} {customerInfo.firstName}（{customerInfo.lastNameKana} {customerInfo.firstNameKana}）</dd>
          </div>
          <div className="flex">
            <dt className="w-32 text-sm text-gray-600">メール</dt>
            <dd className="flex-1 text-gray-900">{customerInfo.email}</dd>
          </div>
          <div className="flex">
            <dt className="w-32 text-sm text-gray-600">電話番号</dt>
            <dd className="flex-1 text-gray-900">{customerInfo.phone}</dd>
          </div>
        </dl>
      </div>

      {/* 配送先確認 */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          配送先
        </h2>
        <dl className="space-y-3">
          <div className="flex">
            <dt className="w-32 text-sm text-gray-600">住所</dt>
            <dd className="flex-1 text-gray-900">
              〒{customerInfo.postalCode}<br />
              {customerInfo.prefecture}{customerInfo.city}{customerInfo.address}
              {customerInfo.building && <><br />{customerInfo.building}</>}
            </dd>
          </div>
        </dl>
      </div>

      {/* ボタン */}
      <div className="flex gap-4">
        <button
          onClick={handleBackToInfo}
          className="flex-1 bg-gray-200 text-gray-700 py-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
        >
          戻る
        </button>
        <button
          onClick={handleProceedToPayment}
          disabled={checkoutLoading}
          className={`flex-1 py-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
            checkoutLoading
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : 'bg-orange-500 text-white hover:bg-orange-600'
          }`}
        >
          {checkoutLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              処理中...
            </>
          ) : (
            'お支払いへ進む'
          )}
        </button>
      </div>

      <p className="text-center text-sm text-gray-500">
        「お支払いへ進む」をクリックすると、安全な決済ページへ移動します
      </p>
    </div>
  );

  return (
    <>
      {/* Header */}
      <div className="sm:hidden">
        <MobileHeader />
      </div>
      <div className="hidden sm:block">
        <Header />
      </div>

      <main className="min-h-screen bg-gray-50 pt-16 sm:pt-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 戻るボタン */}
          <div className="mb-6">
            <button
              onClick={() => currentStep === 'plan' ? router.back() : currentStep === 'info' ? handleBackToPlan() : handleBackToInfo()}
              className="inline-flex items-center text-gray-600 hover:text-orange-600 transition-colors"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm">戻る</span>
            </button>
          </div>

          {/* タイトル */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">ご購入手続き</h1>
          </div>

          {/* ステップインジケーター */}
          {renderStepIndicator()}

          {/* コンテンツ */}
          {currentStep === 'plan' && renderPlanSelection()}
          {currentStep === 'info' && renderCustomerInfoForm()}
          {currentStep === 'confirm' && renderConfirmation()}
        </div>
      </main>

      <Footer />
    </>
  );
};

const PurchasePageContent = () => {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">読み込み中...</div>}>
      <PurchasePage />
    </Suspense>
  );
};

export default PurchasePageContent;
