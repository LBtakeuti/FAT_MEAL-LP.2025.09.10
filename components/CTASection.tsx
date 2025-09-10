'use client';

import React from 'react';

const CTASection: React.FC = () => {
  return (
    <section id="pricing" className="min-h-screen flex items-center bg-gradient-to-br from-orange-50 to-white py-20">
      <div className="max-w-[375px] px-4 md:max-w-[768px] md:px-6 lg:max-w-[1200px] lg:px-8 mx-auto text-center">
        <div className="mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            今すぐ<span className="text-orange-600">ふとるめし</span>を始めよう
          </h2>
          <p className="text-xl text-gray-700 mb-8">
            あなたの健康的な体重増加をサポートします
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 md:p-12 shadow-lg mb-12">
          <h3 className="text-3xl font-bold text-gray-900 mb-8">
            選べる3つのプラン
          </h3>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-orange-600 transition-all hover:shadow-lg">
              <h4 className="text-xl font-bold text-gray-900 mb-2">お試しプラン</h4>
              <p className="text-3xl font-bold text-orange-600 mb-4">
                ¥4,980
                <span className="text-sm text-gray-600">/5食</span>
              </p>
              <ul className="text-left space-y-2 text-gray-700">
                <li>✓ 人気メニュー5食セット</li>
                <li>✓ 送料無料</li>
                <li>✓ 初回限定価格</li>
              </ul>
            </div>

            <div className="border-2 border-orange-600 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 relative shadow-lg">
              <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-orange-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                人気No.1
              </span>
              <h4 className="text-xl font-bold text-gray-900 mb-2">定期プラン</h4>
              <p className="text-3xl font-bold text-orange-600 mb-4">
                ¥13,980
                <span className="text-sm text-gray-600">/15食</span>
              </p>
              <ul className="text-left space-y-2 text-gray-700">
                <li>✓ 15食から選べる</li>
                <li>✓ 送料無料</li>
                <li>✓ 10%OFF</li>
                <li>✓ いつでも変更・解約可能</li>
              </ul>
            </div>

            <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-orange-600 transition-all hover:shadow-lg">
              <h4 className="text-xl font-bold text-gray-900 mb-2">都度購入</h4>
              <p className="text-3xl font-bold text-orange-600 mb-4">
                ¥15,980
                <span className="text-sm text-gray-600">/15食</span>
              </p>
              <ul className="text-left space-y-2 text-gray-700">
                <li>✓ 必要な時だけ注文</li>
                <li>✓ 送料無料（8食以上）</li>
                <li>✓ メニュー自由選択</li>
              </ul>
            </div>
          </div>

          <button className="bg-orange-600 text-white px-12 py-4 rounded-full text-xl font-bold hover:bg-orange-700 transition-colors shadow-lg">
            今すぐ注文する
          </button>
        </div>

        <div id="contact" className="mt-12 p-6 bg-gray-50 rounded-xl">
          <p className="text-gray-700 font-semibold mb-2">お問い合わせ</p>
          <p className="text-2xl font-bold text-orange-600">0120-XXX-XXX</p>
          <p className="text-sm text-gray-600">受付時間: 平日 9:00-18:00</p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;