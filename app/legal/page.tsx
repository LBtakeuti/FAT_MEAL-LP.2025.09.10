'use client';

import React from 'react';
import Link from 'next/link';
import Footer from '@/components/Footer';

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-white">
      <main className="pt-16 sm:pt-20 pb-20">
        <div className="max-w-[375px] px-4 md:max-w-[768px] md:px-6 lg:max-w-[1000px] lg:px-8 mx-auto">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 text-center mb-8">
            特定商取引法に基づく表記
          </h1>

          <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 space-y-6">
            {/* 販売業者の名称 */}
            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-sm sm:text-base font-semibold text-gray-700 mb-2">
                1. 販売業者の名称
              </h2>
              <p className="text-gray-900">LandBridge株式会社</p>
            </div>

            {/* 所在地 */}
            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-sm sm:text-base font-semibold text-gray-700 mb-2">
                2. 所在地
              </h2>
              <p className="text-gray-900">
                事業所の住所（登記簿上の住所）<br />
                〒343-0827 埼玉県越谷市川柳町2丁目401
              </p>
            </div>

            {/* 電話番号 */}
            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-sm sm:text-base font-semibold text-gray-700 mb-2">
                3. 電話番号
              </h2>
              <p className="text-gray-900">
                070-9134-3208<br />
                <span className="text-sm text-gray-600">
                  受付時間 10:00-18:00（土日祝を除く）
                </span>
              </p>
            </div>

            {/* メールアドレス */}
            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-sm sm:text-base font-semibold text-gray-700 mb-2">
                4. メールアドレス
              </h2>
              <p className="text-gray-900">sales@landbridge.co.jp</p>
            </div>

            {/* 運営統括責任者 */}
            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-sm sm:text-base font-semibold text-gray-700 mb-2">
                5. 運営統括責任者
              </h2>
              <p className="text-gray-900">三森　一輝</p>
            </div>

            {/* 交換および返品 */}
            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-sm sm:text-base font-semibold text-gray-700 mb-2">
                6. 交換および返品（返金ポリシー）
              </h2>
              <div className="text-gray-900 text-sm sm:text-base space-y-2">
                <p>商品到着時に必ず商品をご確認ください。</p>
                <p>
                  ご注文の商品と異なる場合、破損・汚損などの不良品があった場合は、
                  当社負担で交換いたします。
                </p>
                <p>当店にご連絡をいただいた上で、着払いにて返送してください。</p>
                <p>
                  食品、生鮮品という商品の性質上、それ以外の返品はお受けいたしかねます。
                </p>
                <p>注文後のキャンセルは致しかねますのでご了承ください。</p>
              </div>
            </div>

            {/* 引渡時期 */}
            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-sm sm:text-base font-semibold text-gray-700 mb-2">
                7. 引渡時期
              </h2>
              <p className="text-gray-900">
                注文は１週間以内に処理され、商品は14日以内に到着します。
              </p>
            </div>

            {/* 受け付け可能な決済手段 */}
            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-sm sm:text-base font-semibold text-gray-700 mb-2">
                8. 受け付け可能な決済手段
              </h2>
              <p className="text-gray-900">クレジットカードまたは国内の銀行振込</p>
            </div>

            {/* 決済期間 */}
            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-sm sm:text-base font-semibold text-gray-700 mb-2">
                9. 決済期間
              </h2>
              <p className="text-gray-900 text-sm sm:text-base">
                顧客が商品購入代金を支払う時期<br />
                クレジットカード決済の場合はただちに処理されますが、
                国内の銀行振込の場合は注文から3日以内にお振り込みいただく必要があります
              </p>
            </div>

            {/* 販売価格 */}
            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-sm sm:text-base font-semibold text-gray-700 mb-2">
                10. 販売価格
              </h2>
              <ul className="text-gray-900 text-sm sm:text-base space-y-1">
                <li>・ふとるめし6個セット：¥4,200（税込）</li>
                <li>・ふとるめし12個セット：¥8,400（税込）</li>
                <li>・ふとるめし18個セット：¥12,600（税込）</li>
              </ul>
            </div>

            {/* 商品代金以外の必要料金 */}
            <div className="pb-4">
              <h2 className="text-sm sm:text-base font-semibold text-gray-700 mb-2">
                11. 商品代金以外の必要料金
              </h2>
              <ul className="text-gray-900 text-sm sm:text-base space-y-1">
                <li>・消費税（10%）</li>
                <li>・送料</li>
              </ul>
            </div>
          </div>

          {/* Back Button */}
          <div className="mt-8 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-white border-2 border-orange-600 text-orange-600 px-6 py-3 rounded-full font-semibold hover:bg-orange-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>ホームに戻る</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}