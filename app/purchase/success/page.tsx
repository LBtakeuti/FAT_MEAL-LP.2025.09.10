'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import MobileHeader from '@/components/MobileHeader';
import Footer from '@/components/Footer';

interface OrderInfo {
  customerName: string;
  email: string;
  amount: number;
  items: string;
}

const PurchaseSuccessContent: React.FC = () => {
  const searchParams = useSearchParams();
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processOrder = async () => {
      const sessionId = searchParams.get('session_id');

      // ローカルストレージから顧客情報を取得
      const customerInfoStr = localStorage.getItem('customerInfo');
      const customerInfo = customerInfoStr ? JSON.parse(customerInfoStr) : null;

      if (sessionId) {
        // Stripeセッションがある場合、サーバーで処理
        try {
          const response = await fetch('/api/orders/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, customerInfo }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.order) {
              setOrderInfo({
                customerName: data.order.customerName,
                email: data.order.email,
                amount: data.order.amount,
                items: data.order.items,
              });
            }
          } else {
            console.error('Failed to process order');
          }
        } catch (err) {
          console.error('Error processing order:', err);
          setError('注文処理中にエラーが発生しました');
        }
      } else if (customerInfo) {
        // セッションIDがない場合はローカルストレージから表示
        const subtotalStr = localStorage.getItem('subtotal');
        setOrderInfo({
          customerName: `${customerInfo.lastName} ${customerInfo.firstName}`,
          email: customerInfo.email,
          amount: subtotalStr ? parseInt(subtotalStr) : 0,
          items: '',
        });
      }

      // ローカルストレージをクリア
      localStorage.removeItem('customerInfo');
      localStorage.removeItem('cart');
      localStorage.removeItem('subtotal');
      localStorage.removeItem('shippingFee');
      localStorage.removeItem('discount');
      localStorage.removeItem('totalAmount');
      localStorage.removeItem('appliedCoupon');

      setIsProcessing(false);
    };

    processOrder();
  }, [searchParams]);

  if (isProcessing) {
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
              <div className="animate-spin w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">注文を処理中...</p>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

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
            {error ? (
              <>
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-4">エラーが発生しました</h1>
                <p className="text-gray-600 mb-8">{error}</p>
              </>
            ) : (
              <>
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
                      {orderInfo.items && (
                        <div className="flex justify-between">
                          <dt className="text-gray-600">注文内容</dt>
                          <dd className="text-gray-900 text-right">{orderInfo.items}</dd>
                        </div>
                      )}
                      <div className="flex justify-between pt-2 border-t border-gray-200">
                        <dt className="text-gray-600 font-semibold">合計金額</dt>
                        <dd className="text-xl text-orange-600 font-bold">
                          ¥{orderInfo.amount.toLocaleString()}
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
              </>
            )}
          </div>

          {/* お問い合わせ情報 */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>ご不明な点がございましたら、お気軽にお問い合わせください。</p>
            <p className="mt-2">
              <a href="mailto:info@landbridge.co.jp" className="text-orange-600 hover:underline">
                info@landbridge.co.jp
              </a>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

const PurchaseSuccessPage: React.FC = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full"></div>
      </div>
    }>
      <PurchaseSuccessContent />
    </Suspense>
  );
};

export default PurchaseSuccessPage;
