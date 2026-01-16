'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  shippingFee: number;
  totalPrice: number;
  description: string;
  perMeal: number;
  isTrial: boolean;
  isSubscription: boolean;
  deliveriesPerMonth?: number;
  comingSoon: boolean;
}

// 新しいプラン構成
const planOptions: PlanOption[] = [
  // お試しプラン（一回購入）
  {
    id: 'trial-6',
    quantity: 6,
    label: 'ふとるめし6食セット（お試しプラン）',
    price: 4200,
    shippingFee: 1500,
    totalPrice: 5700,
    description: '6種類×1個ずつ',
    perMeal: 950,
    isTrial: true,
    isSubscription: false,
    comingSoon: false,
  },
  // サブスクリプションプラン
  {
    id: 'subscription-monthly-12',
    quantity: 12,
    label: 'ふとるめし12食 月額プラン',
    price: 7280,
    shippingFee: 1500,
    totalPrice: 7280,
    description: '月1回配送（12食セット）',
    perMeal: 607,
    isTrial: false,
    isSubscription: true,
    deliveriesPerMonth: 1,
    comingSoon: false,
  },
  {
    id: 'subscription-monthly-24',
    quantity: 24,
    label: 'ふとるめし24食 月額プラン',
    price: 14600,
    shippingFee: 3000,
    totalPrice: 14600,
    description: '月2回配送（各12食セット）',
    perMeal: 608,
    isTrial: false,
    isSubscription: true,
    deliveriesPerMonth: 2,
    comingSoon: false,
  },
  {
    id: 'subscription-monthly-48',
    quantity: 48,
    label: 'ふとるめし48食 月額プラン',
    price: 27800,
    shippingFee: 6000,
    totalPrice: 27800,
    description: '月4回配送（各12食セット）',
    perMeal: 579,
    isTrial: false,
    isSubscription: true,
    deliveriesPerMonth: 4,
    comingSoon: false,
  },
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
  preferredDeliveryDate?: string;
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
    [key: string]: boolean;
  };
  maxQuantity: {
    [key: string]: number;
  };
}

// 日本の祝日（2024-2026年）
const JAPANESE_HOLIDAYS: string[] = [
  // 2024年
  '2024-01-01', '2024-01-08', '2024-02-11', '2024-02-12', '2024-02-23',
  '2024-03-20', '2024-04-29', '2024-05-03', '2024-05-04', '2024-05-05',
  '2024-05-06', '2024-07-15', '2024-08-11', '2024-08-12', '2024-09-16',
  '2024-09-22', '2024-09-23', '2024-10-14', '2024-11-03', '2024-11-04',
  '2024-11-23', '2024-12-23',
  // 2025年
  '2025-01-01', '2025-01-13', '2025-02-11', '2025-02-23', '2025-02-24',
  '2025-03-20', '2025-04-29', '2025-05-03', '2025-05-04', '2025-05-05',
  '2025-05-06', '2025-07-21', '2025-08-11', '2025-09-15', '2025-09-23',
  '2025-10-13', '2025-11-03', '2025-11-23', '2025-11-24',
  // 2026年
  '2026-01-01', '2026-01-12', '2026-02-11', '2026-02-23', '2026-03-20',
  '2026-04-29', '2026-05-03', '2026-05-04', '2026-05-05', '2026-05-06',
  '2026-07-20', '2026-08-11', '2026-09-21', '2026-09-22', '2026-09-23',
  '2026-10-12', '2026-11-03', '2026-11-23',
];

// 祝日かどうかをチェック
function isHoliday(date: Date): boolean {
  const dateStr = date.toISOString().split('T')[0];
  return JAPANESE_HOLIDAYS.includes(dateStr);
}

// 週末かどうかをチェック
function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // 日曜日または土曜日
}

// 営業日かどうかをチェック（土日祝日以外）
function isBusinessDay(date: Date): boolean {
  return !isWeekend(date) && !isHoliday(date);
}

// 営業日を追加
function addBusinessDays(startDate: Date, businessDays: number): Date {
  const currentDate = new Date(startDate);
  let addedDays = 0;

  while (addedDays < businessDays) {
    currentDate.setDate(currentDate.getDate() + 1);
    if (isBusinessDay(currentDate)) {
      addedDays++;
    }
  }

  return currentDate;
}

// 日付をフォーマット
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

const PurchasePage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState<'plan' | 'info' | 'confirm'>('plan');
  // 購入タイプ（一回購入 or サブスクリプション）- デフォルトはサブスクリプション
  const [purchaseType, setPurchaseType] = useState<'one-time' | 'subscription-monthly'>('subscription-monthly');
  // お試しプランモード（URLパラメータでplan=trial-6が指定された場合のみtrue）
  const [isTrialMode, setIsTrialMode] = useState<boolean>(false);
  // カート形式で複数セットを管理
  const [cart, setCart] = useState<CartItem[]>([
    { planId: 'trial-6', quantity: 0 },
    { planId: 'subscription-monthly-12', quantity: 0 },
    { planId: 'subscription-monthly-24', quantity: 0 },
    { planId: 'subscription-monthly-48', quantity: 0 },
  ]);
  // 在庫状況
  const [, setInventory] = useState<InventoryStatus | null>(null);
  const [, setInventoryLoading] = useState(true);
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
    preferredDeliveryDate: '',
  });
  const [errors, setErrors] = useState<Partial<CustomerInfo>>({});

  // ログインユーザーとプロフィールの状態
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [, setProfileLoading] = useState(true);

  // クーポン
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState('');

  // 有効なクーポンコード
  const validCoupons: { [key: string]: number } = {
    'WELCOME1000': 1000,
    'FUTORU1000': 1000,
    'START1000': 1000,
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
    const typeParam = searchParams.get('type');
    
    // ログイン後にサブスクリプション購入に戻ってきた場合
    if (typeParam === 'subscription' && user) {
      setPurchaseType('subscription-monthly');
      setIsTrialMode(false);
    }
    
    // お試しプラン（trial-6）が指定された場合のみお試しモードに
    if (planParam === 'trial-6') {
      setIsTrialMode(true);
      setPurchaseType('one-time');
      setCart(prev => prev.map(item =>
        item.planId === 'trial-6' ? { ...item, quantity: 1 } : { ...item, quantity: 0 }
      ));
    } else if (planParam && planOptions.some(p => p.id === planParam)) {
      // その他のプラン（サブスクリプション）が指定された場合
      const plan = planOptions.find(p => p.id === planParam);
      if (plan && plan.isSubscription) {
        setIsTrialMode(false);
        setPurchaseType('subscription-monthly');
        setCart(prev => prev.map(item =>
          item.planId === planParam ? { ...item, quantity: 1 } : { ...item, quantity: 0 }
        ));
      }
    } else {
      // パラメータなしの場合はサブスクリプションモード
      setIsTrialMode(false);
      setPurchaseType('subscription-monthly');
    }
  }, [searchParams, user]);

  // カート内の選択されたプランを取得
  const getSelectedPlan = (): PlanOption | null => {
    const selectedItem = cart.find(item => item.quantity > 0);
    if (!selectedItem) return null;
    return planOptions.find(p => p.id === selectedItem.planId) || null;
  };

  // カート内の合計金額を計算
  const calculateTotal = (): { subtotal: number; shippingFee: number; totalAmount: number } => {
    const selectedPlan = getSelectedPlan();
    if (!selectedPlan) {
      return { subtotal: 0, shippingFee: 0, totalAmount: 0 };
    }

    const subtotal = selectedPlan.price;
    const shippingFee = selectedPlan.shippingFee;
    const discount = appliedCoupon ? appliedCoupon.discount : 0;
    const totalAmount = selectedPlan.totalPrice - discount;

    return { subtotal, shippingFee, totalAmount: Math.max(0, totalAmount) };
  };

  const { subtotal, shippingFee, totalAmount } = calculateTotal();
  const discount = appliedCoupon ? appliedCoupon.discount : 0;

  // カートが空かどうか
  const isCartEmpty = cart.every(item => item.quantity === 0);

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
      preferredDeliveryDate: customerInfo.preferredDeliveryDate || '',
    });
    setErrors({});
  };

  // プロフィールにデータがあるかチェック
  const hasProfileData = userProfile && (
    userProfile.last_name ||
    userProfile.first_name ||
    userProfile.postal_code ||
    userProfile.prefecture
  );

  // カートの数量を更新（将来の拡張用）
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    const cleanPostalCode = postalCode.replace(/-/g, '');

    if (cleanPostalCode.length !== 7) return;

    setIsSearchingAddress(true);
    try {
      const response = await fetch(`/api/address?postalCode=${cleanPostalCode}`);
      const data = await response.json();

      if (response.ok && data.prefecture) {
        setCustomerInfo(prev => ({
          ...prev,
          prefecture: data.prefecture,
          city: data.city,
        }));
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

    const cleanValue = value.replace(/-/g, '');
    if (cleanValue.length === 7) {
      searchAddressByPostalCode(value);
    }
  };

  // 配送希望日の最小日付を取得（3営業日後）
  const getMinDeliveryDate = (): string => {
    const today = new Date();
    const minDate = addBusinessDays(today, 3);
    return formatDate(minDate);
  };

  // 配送希望日の最大日付を取得（60日後まで）
  const getMaxDeliveryDate = (): string => {
    const today = new Date();
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 60);
    return formatDate(maxDate);
  };

  // 配送日の検証
  const validateDeliveryDate = (dateStr: string): string | null => {
    if (!dateStr) return '配送希望日を選択してください';

    const selectedDate = new Date(dateStr);
    const minDate = new Date(getMinDeliveryDate());

    if (selectedDate < minDate) {
      return '注文日から3営業日後以降の日付を選択してください';
    }

    if (isWeekend(selectedDate)) {
      return '土日は選択できません';
    }

    if (isHoliday(selectedDate)) {
      return '祝日は選択できません';
    }

    return null;
  };

  // 配送希望日の変更ハンドラー
  const handleDeliveryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomerInfo(prev => ({ ...prev, preferredDeliveryDate: value }));

    const error = validateDeliveryDate(value);
    if (error) {
      setErrors(prev => ({ ...prev, preferredDeliveryDate: error }));
    } else {
      setErrors(prev => ({ ...prev, preferredDeliveryDate: '' }));
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

    // サブスクリプションの場合の配送希望日チェック - 一時的に無効化
    // if (purchaseType === 'subscription-monthly') {
    //   const deliveryError = validateDeliveryDate(customerInfo.preferredDeliveryDate || '');
    //   if (deliveryError) {
    //     newErrors.preferredDeliveryDate = deliveryError;
    //   }
    // }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProceedToInfo = () => {
    if (!isCartEmpty) {
      // サブスクリプションモードでログインしていない場合はログインを促す
      if (!isTrialMode && !user) {
        router.push('/login?redirect=/purchase&type=subscription');
        return;
      }
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
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleProceedToPayment = async () => {
    if (!isCartEmpty && !checkoutLoading) {
      setCheckoutLoading(true);
      try {
        const selectedPlan = getSelectedPlan();
        if (!selectedPlan) {
          throw new Error('プランを選択してください');
        }

        // お客様情報をローカルストレージに保存
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
            purchaseType: purchaseType,
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
              preferredDeliveryDate: customerInfo.preferredDeliveryDate,
            },
            couponCode: appliedCoupon?.code,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || '決済の準備に失敗しました');
        }

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
          プラン選択
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

  const renderPlanSelection = () => (
    <div className="space-y-6">
      {/* お試しモードの場合のみ表示するお試しプラン情報 */}
      {isTrialMode && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-orange-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs px-3 py-1 rounded-md font-medium shadow-sm">
              初回限定
            </span>
            <h2 className="text-xl font-bold text-gray-900">お試しプラン</h2>
          </div>
          <p className="text-sm text-gray-600 mb-2">
            6種類×1個ずつのセットを1回だけ購入できます。定期契約なしでお気軽にお試しいただけます。
          </p>
          <div className="text-lg font-bold text-orange-600">
            ¥5,700（税込・送料込）
          </div>
        </div>
      )}

      {/* サブスクリプションモードの場合のヘッダー */}
      {!isTrialMode && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="bg-gradient-to-r from-orange-600 to-red-500 text-white text-xs px-3 py-1 rounded-md font-medium shadow-sm">
              お得な定期
            </span>
            <h2 className="text-xl font-bold text-gray-900">ふとるめし定期便</h2>
          </div>
          <p className="text-sm text-gray-600">
            毎月自動でお届け。お得な定期プランをお選びください。
          </p>
          {!user && (
            <div className="mt-3 flex items-center gap-2 text-sm text-blue-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>月額プランのご購入にはログインが必要です</span>
              <button
                onClick={() => router.push('/login?redirect=/purchase&type=subscription')}
                className="ml-2 underline hover:text-blue-700"
              >
                ログインする
              </button>
            </div>
          )}
        </div>
      )}

      {/* プラン選択 */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {isTrialMode ? 'お試しプランを選択してください' : '月額プランを選択してください'}
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          {isTrialMode 
            ? 'お試しプランは1回のみの購入です。'
            : '月額プランは1つまで選択可能です。毎月自動で課金・配送されます。'}
        </p>
        <div className="space-y-4">
          {planOptions
            .filter(plan => 
              isTrialMode 
                ? plan.isTrial 
                : plan.isSubscription
            )
            .map((plan) => {
              const cartItem = cart.find(item => item.planId === plan.id);
              const quantity = cartItem?.quantity || 0;

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-lg border-2 p-4 transition-all cursor-pointer ${
                    quantity > 0
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    // 他のプランを0にして、選択したプランを1にする（トグル動作）
                    const isSelected = quantity > 0;
                    setCart(prev => prev.map(item => 
                      item.planId === plan.id 
                        ? { ...item, quantity: isSelected ? 0 : 1 }
                        : { ...item, quantity: 0 }
                    ));
                  }}
                >
                  {/* お試しプランバッジ */}
                  {plan.isTrial && (
                    <div className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs px-3 py-1 rounded-md font-medium shadow-sm">
                      初回限定
                    </div>
                  )}
                  
                  {/* サブスクリプションバッジ */}
                  {plan.isSubscription && (
                    <div className="absolute top-2 right-2 bg-gradient-to-r from-orange-600 to-red-500 text-white text-xs px-3 py-1 rounded-md font-medium shadow-sm">
                      お得な定期
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex-1 pr-20">
                      <span className="text-lg font-semibold text-gray-900">
                        {plan.label}
                      </span>
                      <p className="text-sm text-gray-600 mt-1">
                        {plan.description}
                      </p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-2">
                        <span className="text-xl font-bold text-orange-600">
                          ¥{plan.totalPrice.toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-500">
                          （¥{plan.totalPrice.toLocaleString()} + 送料¥{plan.shippingFee.toLocaleString()}）
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        1食あたり ¥{plan.perMeal.toLocaleString()}
                      </div>
                    </div>

                    {/* 選択状態表示 */}
                    <div className="flex items-center">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        quantity > 0
                          ? 'border-orange-600 bg-orange-600'
                          : 'border-gray-300'
                      }`}>
                        {quantity > 0 && (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 小計表示 */}
                  {quantity > 0 && (
                    <div className="mt-3 pt-3 border-t border-orange-200 flex justify-between items-center">
                      {purchaseType === 'subscription-monthly' ? (
                        <>
                          <span className="text-sm text-gray-600">
                            {plan.quantity}食/月（{plan.deliveriesPerMonth}回配送）
                          </span>
                          <span className="text-lg font-semibold text-orange-600">
                            ¥{(plan.totalPrice + plan.shippingFee).toLocaleString()}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-sm text-gray-600">
                            {plan.quantity}食（1回限り）
                          </span>
                          <span className="text-lg font-semibold text-orange-600">
                            ¥{plan.totalPrice.toLocaleString()}
                          </span>
                        </>
                      )}
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
              {(() => {
                const selectedPlan = getSelectedPlan();
                if (!selectedPlan) return null;
                return (
                  <p className="text-gray-900 font-medium">
                    {selectedPlan.label}
                  </p>
                );
              })()}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">
                {purchaseType === 'subscription-monthly' ? '商品代金' : '合計金額'}
              </p>
              <p className="text-3xl text-orange-600">
                ¥{(() => {
                  const selectedPlan = getSelectedPlan();
                  return selectedPlan ? selectedPlan.totalPrice.toLocaleString() : '0';
                })()}
              </p>
              <p className="text-xs text-gray-500">
                {purchaseType === 'subscription-monthly' ? '税込・別途送料' : '税込・送料込'}
              </p>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleProceedToInfo}
        disabled={isCartEmpty}
        className="w-full bg-orange-500 text-white py-4 rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {!isTrialMode && !user ? (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            ログインして進む
          </>
        ) : (
          'お客様情報の入力へ進む'
        )}
      </button>
    </div>
  );

  // 配送希望日選択UI - 一時的に非表示のためコメントアウト
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _renderDeliveryDateSelection = () => {
    if (purchaseType !== 'subscription-monthly') {
      return null;
    }

    const minDate = getMinDeliveryDate();
    const maxDate = getMaxDeliveryDate();

    return (
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          初回配送希望日を選択してください
        </h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            配送希望日 <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="preferredDeliveryDate"
            value={customerInfo.preferredDeliveryDate || ''}
            onChange={handleDeliveryDateChange}
            min={minDate}
            max={maxDate}
            className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none ${
              errors.preferredDeliveryDate
                ? 'border-red-500'
                : 'border-gray-300 focus:border-orange-600'
            }`}
          />
          {errors.preferredDeliveryDate && (
            <p className="text-red-500 text-xs mt-1">{errors.preferredDeliveryDate}</p>
          )}
          <div className="text-xs text-gray-500 mt-2 space-y-1">
            <p>• 注文日から3営業日後以降の日付を選択してください</p>
            <p>• 土日祝日は選択できません</p>
            <p>• 選択可能期間: {minDate} ～ {maxDate}</p>
          </div>
        </div>
        {customerInfo.preferredDeliveryDate && !errors.preferredDeliveryDate && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">
                配送予定日: {new Date(customerInfo.preferredDeliveryDate).toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCustomerInfoForm = () => (
    <div className="space-y-6">
      {/* 選択中のプラン表示 */}
      {!isCartEmpty && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm text-gray-500">ご注文内容</span>
              {(() => {
                const selectedPlan = getSelectedPlan();
                if (!selectedPlan) return null;
                return (
                  <p className="text-gray-900 font-medium">
                    {selectedPlan.label}
                  </p>
                );
              })()}
            </div>
            <p className="text-xl text-orange-600">
              ¥{(() => {
                const selectedPlan = getSelectedPlan();
                return selectedPlan ? selectedPlan.totalPrice.toLocaleString() : '0';
              })()}
              {purchaseType === 'subscription-monthly' && <span className="text-sm text-gray-500 ml-1">+送料</span>}
            </p>
          </div>
        </div>
      )}

      {/* 配送希望日選択（サブスクリプションのみ）- 一時的に非表示 */}
      {/* {renderDeliveryDateSelection()} */}

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

  const renderConfirmation = () => {
    const selectedPlan = getSelectedPlan();
    
    return (
      <div className="space-y-6">
        {/* 注文内容 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            ご注文内容
          </h2>
          {selectedPlan && (
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <div>
                <p className="font-bold text-gray-900">{selectedPlan.label}</p>
                <p className="text-sm text-gray-600">
                  {selectedPlan.description}
                </p>
                {purchaseType === 'subscription-monthly' && (
                  <p className="text-xs text-green-600 font-medium mt-1">
                    月額自動更新プラン
                  </p>
                )}
              </div>
              <p className="text-lg text-orange-600">
                ¥{selectedPlan.totalPrice.toLocaleString()}
                {purchaseType === 'subscription-monthly' && <span className="text-sm text-gray-500 ml-1">+送料</span>}
              </p>
            </div>
          )}

          {/* 商品代金 */}
          <div className="flex justify-between items-center py-3 border-b border-gray-200">
            <p className="text-gray-600">商品代金</p>
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
            <p className="font-bold text-gray-900 text-lg">
              合計（税込）
            </p>
            <p className="text-2xl font-bold text-orange-600">¥{totalAmount.toLocaleString()}</p>
          </div>
        </div>

        {/* 配送希望日（サブスクリプションのみ）- 一時的に非表示 */}
        {/* {purchaseType === 'subscription-monthly' && customerInfo.preferredDeliveryDate && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              初回配送希望日
            </h2>
            <div className="flex items-center gap-2 text-gray-900">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-medium">
                {new Date(customerInfo.preferredDeliveryDate).toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })}
              </span>
            </div>
          </div>
        )} */}

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

        {/* 特商法同意チェックボックス */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1 w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500 cursor-pointer"
            />
            <span className="text-sm text-gray-700">
              <a
                href="/legal"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-600 underline hover:text-orange-700"
              >
                特定商取引法に基づく表記
              </a>
              に同意する
            </span>
          </label>
        </div>

        {/* サブスクリプション解約に関する注意書き */}
        {purchaseType === 'subscription-monthly' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="font-bold text-amber-800 mb-2">定期購入（サブスクリプション）に関するご注意</h3>
                <ul className="text-sm text-amber-700 space-y-1.5">
                  <li>・ご購入後、毎月自動的に決済が行われます</li>
                  <li>・解約をご希望の場合は、次回決済日の3日前までにマイページから解約手続きを行ってください</li>
                  <li>・お支払い済みの配送についてはキャンセルできかねます</li>
                  <li>・ご不明点は<a href="/contact" target="_blank" rel="noopener noreferrer" className="text-amber-800 underline hover:text-amber-900">お問い合わせ</a>よりご連絡ください</li>
                </ul>
              </div>
            </div>
          </div>
        )}

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
            disabled={checkoutLoading || !agreedToTerms}
            className={`flex-1 py-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
              checkoutLoading || !agreedToTerms
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
  };

  return (
    <>
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
