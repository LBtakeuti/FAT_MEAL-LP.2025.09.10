'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import MobileHeader from '@/components/MobileHeader';
import Footer from '@/components/Footer';

export default function PurchaseCompletePage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [orderInfo, setOrderInfo] = useState<any>(null);

  useEffect(() => {
    // ローカルストレージから注文情報を取得
    const customerInfo = localStorage.getItem('customerInfo');
    const cart = localStorage.getItem('cart');
    const totalAmount = localStorage.getItem('totalAmount');

    if (customerInfo && cart && totalAmount) {
      setOrderInfo({
        customerInfo: JSON.parse(customerInfo),
        cart: JSON.parse(cart),
        totalAmount: parseInt(totalAmount),
      });

      // 注文完了後、ローカルストレージをクリア
      localStorage.removeItem('customerInfo');
      localStorage.removeItem('cart');
      localStorage.removeItem('subtotal');
      localStorage.removeItem('shippingFee');
      localStorage.removeItem('discount');
      localStorage.removeItem('totalAmount');
      localStorage.removeItem('appliedCoupon');
    }
  }, []);

  return (
    <>
      <div className="sm:hidden">
        <MobileHeader />
      </div>
      <div className="hidden sm:block">
        <Header />
      </div>

      <main className="min-h-screen bg-gray-100 pt-24 sm:pt-8 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            {/* 成功アイコン */}
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
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
              <Link
                href="/"
                className="block w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
              >
                トップページに戻る
              </Link>
              <Link
                href="/mypage"
                className="block w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                マイページで注文を確認
              </Link>
            </div>

            <p className="text-xs text-gray-500 mt-6">
              ご不明な点がございましたら、お問い合わせください。
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
