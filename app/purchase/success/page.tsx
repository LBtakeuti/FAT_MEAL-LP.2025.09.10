'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import MobileHeader from '@/components/MobileHeader';
import Footer from '@/components/Footer';

const PurchaseSuccessPage: React.FC = () => {
  const [orderInfo, setOrderInfo] = useState<{
    customerName: string;
    email: string;
    subtotal: number;
  } | null>(null);

  useEffect(() => {
    // ローカルストレージから注文情報を取得
    const customerInfoStr = localStorage.getItem('customerInfo');
    const subtotalStr = localStorage.getItem('subtotal');

    if (customerInfoStr && subtotalStr) {
      const customerInfo = JSON.parse(customerInfoStr);
      setOrderInfo({
        customerName: `${customerInfo.lastName} ${customerInfo.firstName}`,
        email: customerInfo.email,
        subtotal: parseInt(subtotalStr),
      });

      // 注文情報をクリア
      localStorage.removeItem('customerInfo');
      localStorage.removeItem('cart');
      localStorage.removeItem('subtotal');
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

      <main className="min-h-screen bg-gray-50 pt-16 sm:pt-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
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
              ご注文ありがとうございます！
            </h1>

            <p className="text-gray-600 mb-8">
              ご注文が正常に完了しました。<br />
              ご登録のメールアドレスに確認メールをお送りしましたので、ご確認ください。
            </p>

            {orderInfo && (
              <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">ご注文情報</h2>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">お名前</dt>
                    <dd className="text-gray-900">{orderInfo.customerName} 様</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">メールアドレス</dt>
                    <dd className="text-gray-900">{orderInfo.email}</dd>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <dt className="text-gray-600 font-semibold">合計金額</dt>
                    <dd className="text-xl text-orange-600 font-bold">
                      ¥{orderInfo.subtotal.toLocaleString()}
                    </dd>
                  </div>
                </dl>
              </div>
            )}

            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                商品の発送準備ができ次第、改めてご連絡いたします。
              </p>

              <div className="pt-4">
                <Link
                  href="/"
                  className="inline-block bg-orange-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
                >
                  トップページに戻る
                </Link>
              </div>
            </div>
          </div>

          {/* お問い合わせ情報 */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>ご不明な点がございましたら、お気軽にお問い合わせください。</p>
            <p className="mt-2">
              <a href="mailto:support@futorumeshi.com" className="text-orange-600 hover:underline">
                support@futorumeshi.com
              </a>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default PurchaseSuccessPage;
