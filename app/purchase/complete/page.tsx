'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface LocalOrderInfo {
  customerInfo: {
    lastName: string;
    firstName: string;
    email: string;
    postalCode: string;
    prefecture: string;
    city: string;
    address: string;
    building?: string;
  };
  cart: unknown[];
  totalAmount: number;
}

function PurchaseCompleteContent() {
  const searchParams = useSearchParams();
  const [orderInfo, setOrderInfo] = useState<LocalOrderInfo | null>(null);
  const [activating, setActivating] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);

  useEffect(() => {
    // PaymentIntentリダイレクト後の処理（買い切りの場合）
    const paymentIntentParam = searchParams.get('payment_intent');
    const paymentIntentStatus = searchParams.get('redirect_status');

    if (paymentIntentParam && paymentIntentStatus === 'succeeded') {
      // 決済成功 — Meta Pixel Purchase イベント発火
      const amount = localStorage.getItem('totalAmount');
      if (typeof window !== 'undefined' && typeof (window as any).fbq === 'function' && amount) {
        (window as any).fbq('track', 'Purchase', { value: parseInt(amount), currency: 'JPY' });
      }
    }

    // 3Dセキュアのフルページリダイレクト後のサブスク有効化
    const setupIntentParam = searchParams.get('setup_intent');
    const redirectStatus = searchParams.get('redirect_status') || paymentIntentStatus;

    if (setupIntentParam && redirectStatus === 'succeeded') {
      // SetupIntentからcustomerIdを取得してサブスク開始
      const activateSubscription = async () => {
        setActivating(true);
        try {
          // SetupIntentの情報をサーバーから取得してactivate
          const res = await fetch('/api/payment/activate-subscription-redirect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ setupIntentId: setupIntentParam }),
          });
          if (!res.ok) {
            const data = await res.json();
            setActivationError(data.error || 'サブスクリプションの開始に失敗しました');
          }
        } catch {
          setActivationError('サブスクリプションの開始に失敗しました。お問い合わせください。');
        } finally {
          setActivating(false);
        }
      };
      activateSubscription();
    }

    // sessionStorageから注文情報を取得
    const customerInfo = sessionStorage.getItem('customerInfo');
    const cart = sessionStorage.getItem('cart');
    const totalAmount = sessionStorage.getItem('totalAmount');

    if (customerInfo && cart && totalAmount) {
      setOrderInfo({
        customerInfo: JSON.parse(customerInfo),
        cart: JSON.parse(cart),
        totalAmount: parseInt(totalAmount),
      });

      // 注文完了後、sessionStorageをクリア
      sessionStorage.removeItem('customerInfo');
      sessionStorage.removeItem('cart');
      sessionStorage.removeItem('subtotal');
      sessionStorage.removeItem('shippingFee');
      sessionStorage.removeItem('discount');
      sessionStorage.removeItem('totalAmount');
      sessionStorage.removeItem('appliedCoupon');
      sessionStorage.removeItem('purchase_customerInfo');
    }

    // Meta Pixel Purchase イベント発火（3DSリダイレクト後用）
    if (redirectStatus === 'succeeded' && typeof window !== 'undefined' && typeof (window as any).fbq === 'function') {
      const amount = sessionStorage.getItem('totalAmount');
      if (amount) {
        (window as any).fbq('track', 'Purchase', {
          value: parseInt(amount),
          currency: 'JPY',
        });
      }
    }
  }, [searchParams]);

  return (
    <main className="min-h-screen bg-gray-100 pt-24 sm:pt-8 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          {activating ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4" />
              <p className="text-gray-600">サブスクリプションを開始しています...</p>
            </>
          ) : activationError ? (
            <>
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">エラーが発生しました</h1>
              <p className="text-gray-600 mb-6">{activationError}</p>
              <Link href="/" className="block w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors">
                トップページに戻る
              </Link>
            </>
          ) : (
            <>
              {/* 成功アイコン */}
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                ご注文ありがとうございます
              </h1>

              <p className="text-gray-600 mb-6">
                ご注文が正常に完了しました。<br />
                確認メールをお送りしましたので、ご確認ください。
              </p>

              {orderInfo && (
                <div className="bg-gray-50 rounded-lg p-6 text-left mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">注文内容</h2>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>
                      <span className="font-medium">お名前：</span>
                      {orderInfo.customerInfo.lastName} {orderInfo.customerInfo.firstName}
                    </p>
                    <p>
                      <span className="font-medium">メールアドレス：</span>
                      {orderInfo.customerInfo.email}
                    </p>
                    <p>
                      <span className="font-medium">お届け先：</span>
                      〒{orderInfo.customerInfo.postalCode} {orderInfo.customerInfo.prefecture}
                      {orderInfo.customerInfo.city}{orderInfo.customerInfo.address}
                      {orderInfo.customerInfo.building && ` ${orderInfo.customerInfo.building}`}
                    </p>
                    <div className="pt-4 border-t border-gray-200 mt-4">
                      <p className="text-lg font-bold text-gray-900">
                        合計金額：¥{orderInfo.totalAmount.toLocaleString()}（税込・送料込）
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <Link href="/" className="block w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors">
                  トップページに戻る
                </Link>
                <Link href="/mypage" className="block w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors">
                  マイページで注文を確認
                </Link>
              </div>

              <p className="text-xs text-gray-500 mt-6">
                ご不明な点がございましたら、お問い合わせください。
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default function PurchaseCompletePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gray-100 pt-24 sm:pt-8 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="animate-pulse">
              <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-6"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        </div>
      </main>
    }>
      <PurchaseCompleteContent />
    </Suspense>
  );
}
