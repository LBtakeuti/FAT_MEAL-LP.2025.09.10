'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import { MenuDetailModal } from '@/components/menu/MenuDetailModal';
import { PlanSelectorCards, type PlanCardData } from '@/components/purchase/PlanSelectorCards';
import { StripePaymentForm } from '@/components/purchase/StripePaymentForm';
import { getDeliveryDateRange } from '@/lib/business-days';
import type { MenuItem } from '@/types';

export interface PurchaseFlowProps {
  inSheet?: boolean;
  onClose?: () => void;
}

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

// 新3プラン体系（trial-6 / sub-6 / sub-12、月1回配送・段階割引なし）
const planOptions: PlanOption[] = [
  {
    id: 'trial-6',
    quantity: 6,
    label: 'ふとるめし6個セット（お試しプラン）',
    price: 4200,
    shippingFee: 1500,
    totalPrice: 5700,
    description: '6種類×1個ずつ',
    perMeal: 950,
    isTrial: true,
    isSubscription: false,
    comingSoon: false,
  },
  {
    id: 'sub-6',
    quantity: 6,
    label: '6食プラン（月額）',
    price: 3000,
    shippingFee: 1500,
    totalPrice: 4500,
    description: '月1回配送',
    perMeal: 750,
    isTrial: false,
    isSubscription: true,
    deliveriesPerMonth: 1,
    comingSoon: false,
  },
  {
    id: 'sub-12',
    quantity: 12,
    label: '12食プラン（月額）',
    price: 6000,
    shippingFee: 1500,
    totalPrice: 7500,
    description: '月1回配送',
    perMeal: 625,
    isTrial: false,
    isSubscription: true,
    deliveriesPerMonth: 1,
    comingSoon: false,
  },
];

interface CustomerInfo {
  lastName: string;
  firstName: string;
  lastNameKana: string;
  firstNameKana: string;
  email: string;
  emailConfirm: string;
  phone: string;
  postalCode: string;
  prefecture: string;
  city: string;
  address: string;
  building: string;
  password?: string;
  preferredDeliveryDate?: string;
  referralCode?: string;
  notes?: string;
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

// 営業日判定・営業日加算・配送可能範囲は lib/business-days.ts に集約。
// ここでは入力 value 用の日付フォーマッタのみローカル保持する。
function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const PurchaseFlow: React.FC<PurchaseFlowProps> = ({ inSheet = false, onClose }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState<'plan' | 'info' | 'confirm' | 'payment'>('plan');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [isSetupFlow, setIsSetupFlow] = useState(false);
  const [setupIntentId, setSetupIntentId] = useState<string | null>(null);
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null);
  // 購入タイプ（一回購入 or サブスクリプション）- デフォルトはサブスクリプション
  const [purchaseType, setPurchaseType] = useState<'one-time' | 'subscription-monthly'>('subscription-monthly');
  // お試しプランモード（URLパラメータでplan=trial-6が指定された場合のみtrue）
  const [isTrialMode, setIsTrialMode] = useState<boolean>(false);
  // カート形式で複数セットを管理（新3プラン体系）
  const [cart, setCart] = useState<CartItem[]>([
    { planId: 'trial-6', quantity: 0 },
    { planId: 'sub-6', quantity: 0 },
    { planId: 'sub-12', quantity: 0 },
  ]);
  // 在庫状況
  const [, setInventory] = useState<InventoryStatus | null>(null);
  const [, setInventoryLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>(() => {
    const defaults: CustomerInfo = {
      lastName: '',
      firstName: '',
      lastNameKana: '',
      firstNameKana: '',
      email: '',
      emailConfirm: '',
      phone: '',
      postalCode: '',
      prefecture: '',
      city: '',
      address: '',
      building: '',
      preferredDeliveryDate: '',
      referralCode: '',
      notes: '',
    };
    // sessionStorageから復元（パスワードは復元しない）
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('purchase_customerInfo');
        if (saved) return { ...defaults, ...JSON.parse(saved) };
      } catch {}
    }
    return defaults;
  });
  const [errors, setErrors] = useState<Partial<CustomerInfo>>({});

  // ログインユーザーとプロフィールの状態
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [, setProfileLoading] = useState(true);

  // step=confirm 復元後のプロフィール作成用（user確定前にlocalStorageが消えるため保持）
  const pendingProfileDataRef = useRef<CustomerInfo | null>(null);

  // クーポン
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState('');

  // 紹介コードのバリデーション状態
  const [referralCodeError, setReferralCodeError] = useState('');
  const [referralCodeValid, setReferralCodeValid] = useState(false);
  const [referralCodeValidating, setReferralCodeValidating] = useState(false);

  // メニュー一覧・アコーディオン開閉状態（排他制御、デフォルトで最初のサブスクプランを開く）
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [openPlanId, setOpenPlanId] = useState<string>('sub-12');
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);

  const [couponValidating, setCouponValidating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  // メニュー一覧を取得
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const res = await fetch('/api/menu');
        if (res.ok) {
          const data = await res.json();
          setMenuItems(data.map((item: any) => ({ ...item, features: item.features ?? [] })));
        }
      } catch (error) {
        console.error('Failed to fetch menu items:', error);
      }
    };
    fetchMenuItems();
  }, []);

  useEffect(() => {
    // step=confirm で復元中の場合はプラン設定をスキップ（cart上書き防止）
    if (searchParams.get('step') === 'confirm') return;

    const rawPlanParam = searchParams.get('plan');
    // legacy URL（?plan=subscription-monthly-12）は新 sub-12 にマッピング
    const planParam = rawPlanParam === 'subscription-monthly-12' ? 'sub-12' : rawPlanParam;
    const typeParam = searchParams.get('type');

    // ログイン後にサブスクリプション購入に戻ってきた場合
    if (typeParam === 'subscription' && user) {
      setPurchaseType('subscription-monthly');
      setIsTrialMode(false);
    }

    if (planParam === 'trial-6') {
      setIsTrialMode(false);
      setPurchaseType('one-time');
      setCart(prev => prev.map(item =>
        item.planId === 'trial-6' ? { ...item, quantity: 1 } : { ...item, quantity: 0 }
      ));
    } else if (planParam && planOptions.some(p => p.id === planParam)) {
      const plan = planOptions.find(p => p.id === planParam);
      if (plan && plan.isSubscription) {
        setIsTrialMode(false);
        setPurchaseType('subscription-monthly');
        setCart(prev => prev.map(item =>
          item.planId === planParam ? { ...item, quantity: 1 } : { ...item, quantity: 0 }
        ));
      }
    } else {
      // パラメータなしの場合はサブスクリプションをデフォルト選択（sub-12）
      setIsTrialMode(false);
      setPurchaseType('subscription-monthly');
    }
  }, [searchParams, user]);

  // 紹介コードの自動適用（URLパラメータ ?ref=CODE → sessionStorage → バックグラウンドバリデーション）
  useEffect(() => {
    const refParam = searchParams.get('ref');
    if (refParam) {
      sessionStorage.setItem('referral_code', refParam);
    }
    const storedCode = sessionStorage.getItem('referral_code');
    if (storedCode) {
      setCustomerInfo(prev => ({ ...prev, referralCode: storedCode }));
      validateReferralCode(storedCode);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // 個別メッセージ(LP)経由の attribution: ?promo=<slug> を sessionStorage に保持し、
  // 決済時に Stripe metadata へ伝搬する
  const [promoSlug, setPromoSlug] = useState<string>('');
  useEffect(() => {
    const promoParam = searchParams.get('promo');
    if (promoParam) {
      sessionStorage.setItem('promo_slug', promoParam);
    }
    const stored = sessionStorage.getItem('promo_slug');
    if (stored) setPromoSlug(stored);
  }, [searchParams]);

  // シートからの遷移: ?step=info なら info ステップへ自動進行（プラン選択済みのとき）
  useEffect(() => {
    const stepParam = searchParams.get('step');
    if (stepParam !== 'info') return;
    const planParam = searchParams.get('plan');
    if (!planParam || !planOptions.some((p) => p.id === planParam)) return;
    setCurrentStep('info');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // 会員登録後の STEP2 データ復元（?step=confirm で戻ってきた場合）
  useEffect(() => {
    const stepParam = searchParams.get('step');
    if (stepParam !== 'confirm') return;

    const saved = localStorage.getItem('purchase_step2_data');
    if (!saved) return;

    try {
      const { customerInfo: savedInfo, cart: savedCart, purchaseType: savedType, appliedCoupon: savedCoupon } = JSON.parse(saved);
      setCustomerInfo(savedInfo);
      setCart(savedCart);
      setPurchaseType(savedType);
      setIsTrialMode(savedType !== 'subscription-monthly');
      if (savedCoupon) setAppliedCoupon(savedCoupon);
      setCurrentStep('confirm');
      localStorage.removeItem('purchase_step2_data');
      window.scrollTo(0, 0);

      // user が null の場合もあるため、pendingProfileDataRef に保持しておく
      // 実際のプロフィール作成は下の useEffect で user 確定後に行う
      pendingProfileDataRef.current = savedInfo;
    } catch (err) {
      console.error('Failed to restore purchase data:', err);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // step=confirm 復元後、user が確定したらプロフィールを自動作成（新規会員のみ）
  useEffect(() => {
    if (!user || !pendingProfileDataRef.current) return;

    const savedInfo = pendingProfileDataRef.current;
    pendingProfileDataRef.current = null; // 二重実行防止

    fetch(`/api/users/profile?userId=${user.id}`)
      .then(res => {
        if (res.status === 404) {
          fetch('/api/users/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              email: savedInfo.email,
              last_name: savedInfo.lastName,
              first_name: savedInfo.firstName,
              last_name_kana: savedInfo.lastNameKana,
              first_name_kana: savedInfo.firstNameKana,
              phone: savedInfo.phone,
              postal_code: savedInfo.postalCode,
              prefecture: savedInfo.prefecture,
              city: savedInfo.city,
              address_detail: savedInfo.address,
              building: savedInfo.building,
            }),
          }).catch(err => console.error('Failed to create profile:', err));
        }
      })
      .catch(err => console.error('Failed to check profile:', err));
  }, [user]);

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

    const discount = appliedCoupon ? appliedCoupon.discount : 0;

    // お試しプランの場合、totalPriceは既に送料込み
    if (selectedPlan.isTrial) {
      const subtotal = selectedPlan.price; // 商品代金（送料別）
      const shippingFee = selectedPlan.shippingFee;
      const totalAmount = selectedPlan.totalPrice - discount; // 送料込み総額
      return { subtotal, shippingFee, totalAmount: Math.max(0, totalAmount) };
    }

    // サブスクリプションプランの場合、totalPriceは商品代金のみ
    const subtotal = selectedPlan.totalPrice;
    const shippingFee = selectedPlan.shippingFee;
    const totalAmount = subtotal + shippingFee - discount;

    return { subtotal, shippingFee, totalAmount: Math.max(0, totalAmount) };
  };

  const { subtotal, shippingFee, totalAmount } = calculateTotal();
  const discount = appliedCoupon ? appliedCoupon.discount : 0;

  // カートが空かどうか
  const isCartEmpty = cart.every(item => item.quantity === 0);

  // クーポン適用
  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setCouponError('クーポンコードを入力してください');
      return;
    }
    setCouponValidating(true);
    setCouponError('');
    try {
      const res = await fetch('/api/payment/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (data.valid) {
        setAppliedCoupon({ code: data.code, discount: data.discount || 0 });
        setCouponError('');
      } else {
        setCouponError(data.error || '無効なクーポンコードです');
        setAppliedCoupon(null);
      }
    } catch {
      setCouponError('検証に失敗しました');
      setAppliedCoupon(null);
    } finally {
      setCouponValidating(false);
    }
  };

  // クーポン削除
  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  // 紹介コードのバリデーション
  const validateReferralCode = async (code: string) => {
    if (!code || code.trim() === '') {
      setReferralCodeError('');
      setReferralCodeValid(false);
      return;
    }

    setReferralCodeValidating(true);
    setReferralCodeError('');
    setReferralCodeValid(false);

    try {
      const response = await fetch('/api/referral/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await response.json();

      if (data.valid) {
        setReferralCodeValid(true);
        setReferralCodeError('');
      } else {
        setReferralCodeValid(false);
        setReferralCodeError(data.message || '無効な紹介コードです');
      }
    } catch (error) {
      console.error('Referral code validation error:', error);
      setReferralCodeError('紹介コードの確認中にエラーが発生しました');
      setReferralCodeValid(false);
    } finally {
      setReferralCodeValidating(false);
    }
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
      emailConfirm: userProfile.email || user?.email || '',
      phone: userProfile.phone || '',
      postalCode: userProfile.postal_code || '',
      prefecture: userProfile.prefecture || '',
      city: userProfile.city || '',
      address: userProfile.address_detail || '',
      building: userProfile.building || '',
      preferredDeliveryDate: customerInfo.preferredDeliveryDate || '',
      referralCode: customerInfo.referralCode || '',
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
    setCustomerInfo(prev => {
      const updated = { ...prev, [name]: value };
      // パスワードとemailConfirm以外をsessionStorageに保存（再開時に復元用）
      // emailConfirmは復元しないことで、再訪問時に確認入力をやり直してもらう（typo検知のため）
      const toSave: Partial<CustomerInfo> = { ...updated };
      delete toSave.password;
      delete toSave.emailConfirm;
      try { sessionStorage.setItem('purchase_customerInfo', JSON.stringify(toSave)); } catch {}
      return updated;
    });
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

  // 配送希望日の最小日付（購入日 + 4営業日後）
  const getMinDeliveryDate = (): string => {
    const { min } = getDeliveryDateRange(new Date());
    return formatDate(min);
  };

  // 配送希望日の最大日付（min から1週間後・min含めて7日間）
  const getMaxDeliveryDate = (): string => {
    const { max } = getDeliveryDateRange(new Date());
    return formatDate(max);
  };

  // 配送日の検証（範囲内チェック・営業日は min 算出時にのみ考慮、範囲内の土日祝は許容）
  const validateDeliveryDate = (dateStr: string): string | null => {
    if (!dateStr) return '配送希望日を選択してください';
    const selectedDate = new Date(dateStr);
    const { min, max } = getDeliveryDateRange(new Date());
    if (selectedDate < min || selectedDate > max) {
      return `配送希望日は ${formatDate(min)} 〜 ${formatDate(max)} の範囲で選択してください`;
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
    // 未ログイン時のみメアド再入力チェック（既存ユーザーは email が user.email から自動入力されるため不要）
    if (!user) {
      if (!customerInfo.emailConfirm.trim()) {
        newErrors.emailConfirm = '確認用のメールアドレスを入力してください';
      } else if (customerInfo.email.trim() !== customerInfo.emailConfirm.trim()) {
        newErrors.emailConfirm = 'メールアドレスが一致しません。入力ミスがないかご確認ください';
      }
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

    // サブスクリプションかつ未ログインの場合はパスワード必須
    if (purchaseType === 'subscription-monthly' && !user) {
      if (!customerInfo.password || customerInfo.password.trim().length < 6) {
        newErrors.password = 'パスワードは6文字以上で入力してください';
      }
    }

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

  const resetSheetScroll = () => {
    window.scrollTo(0, 0);
    window.dispatchEvent(new Event('purchase-sheet-scroll-reset'));
  };

  const handleProceedToInfo = () => {
    if (!isCartEmpty) {
      setCurrentStep('info');
      resetSheetScroll();
    }
  };

  const PURCHASE_SESSION_KEY = 'purchase_step2_data';

  const handleProceedToConfirm = () => {
    if (validateForm()) {
      // STEP2 の入力内容を sessionStorage に保存（会員登録後の復元用）
      localStorage.setItem(PURCHASE_SESSION_KEY, JSON.stringify({
        customerInfo,
        cart,
        purchaseType,
        appliedCoupon,
      }));
      setCurrentStep('confirm');
      resetSheetScroll();
    }
  };

  const handleBackToPlan = () => {
    setCurrentStep('plan');
    resetSheetScroll();
  };

  const handleBackToInfo = () => {
    setCurrentStep('info');
    resetSheetScroll();
  };

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // アンケート state
  const [surveyQ1, setSurveyQ1] = useState<string[]>([]);
  const [surveyQ1Other, setSurveyQ1Other] = useState('');
  const [surveyQ2, setSurveyQ2] = useState<string[]>([]);
  const [surveyQ2Other, setSurveyQ2Other] = useState('');
  const [surveyQ3, setSurveyQ3] = useState<string[]>([]);
  const [surveyQ3Other, setSurveyQ3Other] = useState('');

  const isSurveyComplete = surveyQ1.length > 0 && surveyQ2.length > 0 && surveyQ3.length > 0;

  const toggleSurveyOption = (
    current: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    value: string
  ) => {
    setter(current.includes(value) ? current.filter(v => v !== value) : [...current, value]);
  };

  const handleProceedToPayment = async () => {
    if (!isCartEmpty && !checkoutLoading) {
      setCheckoutLoading(true);
      try {
        const selectedPlan = getSelectedPlan();
        if (!selectedPlan) {
          throw new Error('プランを選択してください');
        }

        // サブスクかつ未ログインの場合、自動会員登録
        if (purchaseType === 'subscription-monthly' && !user && customerInfo.password) {
          const signupRes = await fetch('/api/payment/auto-signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: customerInfo.email,
              password: customerInfo.password,
              firstName: customerInfo.firstName,
              lastName: customerInfo.lastName,
              firstNameKana: customerInfo.firstNameKana,
              lastNameKana: customerInfo.lastNameKana,
              phone: customerInfo.phone,
              postalCode: customerInfo.postalCode,
              prefecture: customerInfo.prefecture,
              city: customerInfo.city,
              addressDetail: customerInfo.address,
              building: customerInfo.building,
            }),
          });

          const signupData = await signupRes.json();

          if (!signupRes.ok) {
            throw new Error(signupData.error || '会員登録に失敗しました');
          }

          // ログインしてセッションを取得
          const supabase = createBrowserClient();
          const { error: loginError } = await supabase.auth.signInWithPassword({
            email: customerInfo.email,
            password: customerInfo.password,
          });

          if (loginError) {
            console.error('Auto login error:', loginError.message);
            // ログイン失敗してもユーザーは作成済みなので決済は続行
          } else {
            const { data: { user: loggedInUser } } = await supabase.auth.getUser();
            if (loggedInUser) setUser(loggedInUser);
          }
        }

        // お客様情報をsessionStorageに保存（PIIはlocalStorageに残さない）
        sessionStorage.setItem('customerInfo', JSON.stringify(customerInfo));
        sessionStorage.setItem('cart', JSON.stringify(cart));
        sessionStorage.setItem('subtotal', String(subtotal));
        sessionStorage.setItem('shippingFee', String(shippingFee));
        sessionStorage.setItem('discount', String(discount));
        sessionStorage.setItem('totalAmount', String(totalAmount));
        if (appliedCoupon) {
          sessionStorage.setItem('appliedCoupon', JSON.stringify(appliedCoupon));
        }

        // Stripe Elements用 PaymentIntent / Subscription 作成
        const response = await fetch('/api/payment/create-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            purchaseType,
            cart: cart.filter(item => item.quantity > 0),
            customerInfo: {
              lastName: customerInfo.lastName,
              firstName: customerInfo.firstName,
              lastNameKana: customerInfo.lastNameKana,
              firstNameKana: customerInfo.firstNameKana,
              email: customerInfo.email,
              phone: customerInfo.phone,
              postalCode: customerInfo.postalCode,
              prefecture: customerInfo.prefecture,
              city: customerInfo.city,
              address: customerInfo.address,
              building: customerInfo.building,
              preferredDeliveryDate: customerInfo.preferredDeliveryDate,
              referralCode: customerInfo.referralCode || undefined,
              notes: customerInfo.notes || undefined,
            },
            promoSlug: promoSlug || undefined,
            couponCode: appliedCoupon?.code,
            survey: {
              q1_answers: surveyQ1,
              q1_other_text: surveyQ1.includes('other') ? surveyQ1Other : undefined,
              q2_answers: surveyQ2,
              q2_other_text: surveyQ2.includes('other') ? surveyQ2Other : undefined,
              q3_answers: surveyQ3,
              q3_other_text: surveyQ3.includes('other') ? surveyQ3Other : undefined,
            },
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || '決済の準備に失敗しました');
        }

        // clientSecret を取得して決済フォームステップに遷移
        setClientSecret(data.clientSecret);
        setPaymentAmount(data.amount);
        setIsSetupFlow(!!data.isSetup);
        setSetupIntentId(data.setupIntentId || null);
        setStripeCustomerId(data.customerId || null);
        setCurrentStep('payment');
        resetSheetScroll();
      } catch (error: unknown) {
        console.error('Payment intent error:', error);
        alert(error instanceof Error ? error.message : '決済の準備に失敗しました。もう一度お試しください。');
      } finally {
        setCheckoutLoading(false);
      }
    }
  };

  const planCardData: PlanCardData[] = planOptions.map((plan) => ({
    id: plan.id,
    mealCount: plan.quantity,
    title: plan.isTrial ? 'お試し6個セット' : `${plan.quantity}食 月額プラン`,
    subtitle: plan.description,
    totalPrice: plan.totalPrice,
    perMeal: plan.perMeal,
    badge: plan.isTrial ? '初回限定' : undefined,
    shippingNote: plan.isSubscription ? '送料込' : undefined,
    isSubscription: plan.isSubscription,
  }));

  const currentSelectedId = cart.find((item) => item.quantity > 0)?.planId || null;

  const handlePlanSelect = (id: string) => {
    const plan = planOptions.find((p) => p.id === id);
    if (!plan) return;
    setCart((prev) =>
      prev.map((item) => (item.planId === id ? { ...item, quantity: 1 } : { ...item, quantity: 0 }))
    );
    setPurchaseType(plan.isTrial ? 'one-time' : 'subscription-monthly');
    if (plan.isSubscription) setOpenPlanId(plan.id);
    // プラン選択後、自動で次のステップに進む
    setTimeout(() => {
      setCurrentStep('info');
      resetSheetScroll();
    }, 150);
  };

  const renderPlanSelection = () => (
    <div className="space-y-6">
      <PlanSelectorCards
        plans={planCardData}
        selectedId={currentSelectedId}
        onSelect={handlePlanSelect}
        onProceed={handleProceedToInfo}
      />

      <p className="text-xs text-gray-400 text-center">
        送料無料 ・ いつでも解約可能 ・ 管理栄養士監修
      </p>
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
    <div className="space-y-6 [word-break:keep-all] [overflow-wrap:normal] [line-break:strict]">
      {/* 選択中のプラン表示 */}
      {!isCartEmpty && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <div className="min-w-0">
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
              onPaste={!user ? (e) => { e.preventDefault(); alert('入力ミス防止のためコピー＆ペーストはご利用いただけません。直接ご入力ください。'); } : undefined}
              placeholder="example@email.com"
              autoComplete="email"
              className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none ${errors.email ? 'border-red-500' : 'border-gray-300 focus:border-orange-600'}`}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          {/* メールアドレス（確認用） - 未ログイン時のみ */}
          {!user && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                メールアドレス（確認用） <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="emailConfirm"
                value={customerInfo.emailConfirm}
                onChange={handleInputChange}
                onPaste={(e) => { e.preventDefault(); alert('入力ミス防止のためコピー＆ペーストはご利用いただけません。直接ご入力ください。'); }}
                placeholder="同じメールアドレスをもう一度ご入力ください"
                autoComplete="off"
                className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none ${errors.emailConfirm ? 'border-red-500' : 'border-gray-300 focus:border-orange-600'}`}
              />
              {errors.emailConfirm && <p className="text-red-500 text-xs mt-1">{errors.emailConfirm}</p>}
              <p className="text-xs text-gray-400 mt-1">
                マイページのログインに使用しますので、入力ミスがないようご確認ください。
              </p>
            </div>
          )}

          {/* パスワード（サブスクかつ未ログイン時のみ） */}
          {purchaseType === 'subscription-monthly' && !user && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                パスワード <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={customerInfo.password || ''}
                  onChange={handleInputChange}
                  placeholder="6文字以上"
                  className={`w-full px-4 py-2 pr-12 border-2 rounded-lg focus:outline-none ${errors.password ? 'border-red-500' : 'border-gray-300 focus:border-orange-600'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              <p className="text-xs text-gray-400 mt-1">
                マイページのログインに使用します。購入時に会員登録が自動で行われます。
              </p>
              <p className="text-xs text-gray-400 mt-2">
                既にアカウントをお持ちの方は
                <button
                  type="button"
                  onClick={() => {
                    const refCode = localStorage.getItem('referral_code') || sessionStorage.getItem('referral_code');
                    const redirectUrl = refCode
                      ? `/purchase?type=subscription&step=confirm&ref=${refCode}`
                      : '/purchase?type=subscription&step=confirm';
                    window.location.href = `/login?redirect=${encodeURIComponent(redirectUrl)}`;
                  }}
                  className="text-orange-600 underline hover:text-orange-700 ml-1"
                >
                  ログイン
                </button>
              </p>
            </div>
          )}

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

      {/* 備考欄 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">備考</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            備考（任意）
          </label>
          <textarea
            name="notes"
            value={customerInfo.notes || ''}
            onChange={handleInputChange}
            placeholder="ご要望・ご連絡事項があればご記入ください"
            maxLength={500}
            rows={4}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-600 focus:outline-none resize-none"
          />
          <p className="text-right text-xs text-gray-400 mt-1">
            {(customerInfo.notes || '').length} / 500文字
          </p>
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
                    月額自動更新プラン（毎月一律）
                  </p>
                )}
              </div>
              <p className="text-lg text-gray-900">
                ¥{selectedPlan.totalPrice.toLocaleString()}
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
              {purchaseType === 'subscription-monthly' ? '月額合計（税込）' : '合計（税込）'}
            </p>
            <p className="text-2xl font-bold text-orange-600">¥{totalAmount.toLocaleString()}</p>
          </div>

          {/* 配送案内 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <div className="flex items-center gap-2 text-blue-700">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium">ご注文確認後、順次配送いたします</p>
            </div>
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
              <div className="flex flex-wrap items-center gap-2">
                <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-green-700 font-medium">{appliedCoupon.code}</span>
                <span className="text-green-600 text-sm">（¥{appliedCoupon.discount.toLocaleString()}割引）</span>
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
            <div className="flex flex-col sm:flex-row gap-2">
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
                disabled={!couponCode.trim() || couponValidating}
                className="px-6 py-2 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {couponValidating ? '確認中...' : '適用'}
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

        {/* 購入前アンケート（必須） */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">購入前に教えてください（必須）</h2>
          <p className="text-sm text-gray-500 mb-5">今後のサービス改善のためにお聞かせください。</p>

          {/* Q1: 認知経路 */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Q1. ふとるめしを何で知りましたか？</h3>
            <div className="space-y-2">
              {[
                { value: 'instagram', label: 'Instagram' },
                { value: 'tiktok', label: 'TikTok' },
                { value: 'youtube', label: 'YouTube' },
                { value: 'google', label: 'Google検索' },
                { value: 'friends', label: '友人・知人の紹介' },
                { value: 'school_club', label: '学校・部活の関係者' },
                { value: 'other', label: 'その他' },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={surveyQ1.includes(opt.value)}
                    onChange={() => toggleSurveyOption(surveyQ1, setSurveyQ1, opt.value)}
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
              {surveyQ1.includes('other') && (
                <input
                  type="text"
                  value={surveyQ1Other}
                  onChange={(e) => setSurveyQ1Other(e.target.value)}
                  placeholder="具体的に教えてください"
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              )}
            </div>
          </div>

          {/* Q2: 利用者 */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Q2. どなたが食べますか？</h3>
            <div className="space-y-2">
              {[
                { value: 'self', label: '自分' },
                { value: 'child', label: 'お子さま' },
                { value: 'partner', label: 'パートナー' },
                { value: 'other', label: 'その他' },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={surveyQ2.includes(opt.value)}
                    onChange={() => toggleSurveyOption(surveyQ2, setSurveyQ2, opt.value)}
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
              {surveyQ2.includes('other') && (
                <input
                  type="text"
                  value={surveyQ2Other}
                  onChange={(e) => setSurveyQ2Other(e.target.value)}
                  placeholder="具体的に教えてください"
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              )}
            </div>
          </div>

          {/* Q3: 期待 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Q3. ふとるめしに期待することは？</h3>
            <div className="space-y-2">
              {[
                { value: 'weight_gain', label: '体重・体格を増やしたい' },
                { value: 'muscle', label: '筋肉をつけてパフォーマンスを上げたい' },
                { value: 'convenience', label: '食事の準備の手間を減らしたい' },
                { value: 'nutrition', label: '栄養バランスをしっかり管理したい' },
                { value: 'competition', label: '試合・大会に向けて体をつくりたい' },
                { value: 'other', label: 'その他' },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={surveyQ3.includes(opt.value)}
                    onChange={() => toggleSurveyOption(surveyQ3, setSurveyQ3, opt.value)}
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
              {surveyQ3.includes('other') && (
                <input
                  type="text"
                  value={surveyQ3Other}
                  onChange={(e) => setSurveyQ3Other(e.target.value)}
                  placeholder="期待することを教えてください"
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              )}
            </div>
          </div>
        </div>

        {/* 特商法同意チェックボックス */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500 cursor-pointer"
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
          <div className="rounded-lg px-4 py-3 [word-break:keep-all] [overflow-wrap:normal]">
            <p className="text-xs text-gray-500 mb-1.5">定期購入（サブスクリプション）に関するご注意</p>
            <ul className="text-xs text-gray-500 space-y-1 leading-relaxed">
              <li>・ご購入後、毎月自動的に決済が行われます</li>
              <li>・お支払い済みの配送についてはキャンセルできかねます</li>
              <li>・ご不明点は<a href="/contact" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700">お問い合わせ</a>よりご連絡ください</li>
            </ul>
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
            disabled={checkoutLoading || !agreedToTerms || !isSurveyComplete}
            className={`flex-1 py-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
              checkoutLoading || !agreedToTerms || !isSurveyComplete
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

  const handleBackClick = () => {
    if (currentStep === 'plan') {
      if (inSheet && onClose) onClose();
      else router.push('/');
    } else if (currentStep === 'info') {
      handleBackToPlan();
    } else if (currentStep === 'payment') {
      setCurrentStep('confirm');
      setClientSecret(null);
      resetSheetScroll();
    } else {
      handleBackToInfo();
    }
  };

  const handlePaymentSuccess = () => {
    // 入力内容のキャッシュをクリア
    try { sessionStorage.removeItem('purchase_customerInfo'); } catch {}
    // 決済成功 → 完了ページへ（フルリロードでモーダルを確実に閉じる）
    window.location.href = '/purchase/complete';
  };

  const renderPaymentForm = () => {
    if (!clientSecret) return null;
    return (
      <div className="space-y-4">
        <StripePaymentForm
          clientSecret={clientSecret}
          amount={paymentAmount}
          isSetup={isSetupFlow}
          setupIntentId={setupIntentId || undefined}
          customerId={stripeCustomerId || undefined}
          onSuccess={handlePaymentSuccess}
          onBack={() => {
            setCurrentStep('confirm');
            setClientSecret(null);
            resetSheetScroll();
          }}
        />
      </div>
    );
  };

  const stepContent = (
    <>
      {currentStep === 'plan' && renderPlanSelection()}
      {currentStep === 'info' && renderCustomerInfoForm()}
      {currentStep === 'confirm' && renderConfirmation()}
      {currentStep === 'payment' && renderPaymentForm()}
    </>
  );

  if (inSheet) {
    return (
      <>
        <div className="px-4 py-5 md:px-6 md:py-6 pb-10">
          {currentStep !== 'plan' && (
            <div className="mb-4">
              <button
                onClick={handleBackClick}
                className="inline-flex items-center text-gray-600 hover:text-orange-600 transition-colors"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm">戻る</span>
              </button>
            </div>
          )}
          {stepContent}
        </div>
        {selectedMenuItem && (
          <MenuDetailModal
            item={selectedMenuItem}
            isOpen={true}
            onClose={() => setSelectedMenuItem(null)}
            showPurchaseButton={false}
          />
        )}
      </>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-gray-50 pt-16 sm:pt-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 戻るボタン */}
          <div className="mb-6">
            <button
              onClick={handleBackClick}
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

          {/* コンテンツ */}
          {stepContent}
        </div>
      </main>

      {/* メニュー詳細モーダル */}
      {selectedMenuItem && (
        <MenuDetailModal
          item={selectedMenuItem}
          isOpen={true}
          onClose={() => setSelectedMenuItem(null)}
          showPurchaseButton={false}
        />
      )}
    </>
  );
};

export default PurchaseFlow;
