'use client';

import React from 'react';

const WhySection: React.FC = () => {
  return (
    <section id="why" className="min-h-screen flex items-center bg-gray-50 py-20">
      <div className="max-w-[375px] px-4 md:max-w-[768px] md:px-6 lg:max-w-[1200px] lg:px-8 mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            なぜ<span className="text-orange-600">ふとるめし</span>が必要なのか
          </h2>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              低体重がもたらすリスク
            </h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <span className="text-red-500 text-xl mr-3">⚠️</span>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">免疫力の低下</h4>
                  <p className="text-gray-600">栄養不足により、感染症にかかりやすくなります</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-red-500 text-xl mr-3">⚠️</span>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">筋力・体力の低下</h4>
                  <p className="text-gray-600">日常生活の質が低下し、転倒リスクも増加します</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-red-500 text-xl mr-3">⚠️</span>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">骨密度の減少</h4>
                  <p className="text-gray-600">骨折のリスクが高まり、回復も遅くなります</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 rounded-xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              適切な体重管理の重要性
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              健康的な体重を維持することは、単に見た目の問題ではありません。
              適切な体重は、身体機能を正常に保ち、病気への抵抗力を高め、
              生活の質を向上させる重要な要素です。
            </p>
            <p className="text-gray-700 leading-relaxed">
              特に高齢者や療養中の方にとって、十分な栄養摂取は回復力を高め、
              健康寿命を延ばすために不可欠です。
            </p>
          </div>

          <div className="bg-white rounded-xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              ふとるめしができること
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start">
                <span className="text-green-500 text-xl mr-3">✅</span>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">確実なカロリー摂取</h4>
                  <p className="text-gray-600 text-sm">1食600kcal以上で効率的に栄養補給</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-green-500 text-xl mr-3">✅</span>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">栄養バランス</h4>
                  <p className="text-gray-600 text-sm">管理栄養士監修の最適な栄養配分</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-green-500 text-xl mr-3">✅</span>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">継続しやすさ</h4>
                  <p className="text-gray-600 text-sm">豊富なメニューで飽きずに続けられる</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-green-500 text-xl mr-3">✅</span>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">手軽さ</h4>
                  <p className="text-gray-600 text-sm">レンジで温めるだけの簡単調理</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhySection;