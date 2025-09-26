'use client';

import React from 'react';

export const TargetUserSlide1: React.FC = () => {
  return (
    <section className="h-[100dvh] bg-white px-4 pb-16 flex flex-col">
      <div className="max-w-[375px] md:max-w-[768px] lg:max-w-[1200px] mx-auto w-full flex-1 flex flex-col">
        {/* タイトル - コンパクトに */}
        <div className="pt-4 pb-3">
          <h1 className="text-lg sm:text-3xl md:text-4xl font-bold text-gray-900 text-center leading-[1.2]">
            ふとるめしの<span className="text-orange-600">こだわり</span>
          </h1>
        </div>
        
        {/* サブタイトル */}
        <div className="mb-3">
          <h2 className="text-base md:text-2xl font-bold text-gray-900 border-l-4 border-orange-600 pl-3">
            良質なタンパク質
          </h2>
        </div>
        
        {/* イラスト - サイズ調整 */}
        <div className="flex justify-center mb-3">
          <img 
            src="/target-user-1.svg" 
            alt="プロテイン不要のイラスト" 
            className="w-[180px] h-[180px] object-contain"
          />
        </div>
        
        {/* コンテンツエリア */}
        <div className="flex-1 flex flex-col">
          <div className="space-y-2.5 text-sm text-gray-700 leading-[1.5] mb-3">
            <p>
              プロテインが苦手、お腹を下してしまう。鶏むね肉は量が食べられない。そう言った方におすすめ！ふとるめしでは、味、量、質が担保されたお弁当を準備しています！
            </p>
          </div>
          
          {/* チェックリスト */}
          <div className="space-y-1.5 mb-3">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-orange-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm text-gray-700">プロテイン不要</span>
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 text-orange-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm text-gray-700">美味しく摂取</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export const TargetUserSlide2: React.FC = () => {
  return (
    <section className="h-[100dvh] bg-white px-4 pb-16 flex flex-col">
      <div className="max-w-[375px] md:max-w-[768px] lg:max-w-[1200px] mx-auto w-full flex-1 flex flex-col">
        {/* タイトル - 上部に配置 */}
        <div className="pt-6 pb-3">
          <h2 className="text-base md:text-2xl font-bold text-gray-900 border-l-4 border-orange-600 pl-3">
            高カロリー・高タンパク
          </h2>
        </div>
        
        {/* イラスト */}
        <div className="flex justify-center mb-3">
          <img 
            src="/target-user-2.svg" 
            alt="筋トレをする人のイラスト" 
            className="w-[200px] h-[200px] object-contain"
          />
        </div>
        
        {/* コンテンツエリア */}
        <div className="flex-1 flex flex-col justify-start">
          <div className="space-y-2.5 text-sm text-gray-700 leading-[1.5] mb-3">
            <p>
              体を大きくしたいなら、良質で高カロリーな食事が必須です！ふとるめしなら、1食あたり1,400kcal以上の高カロリー弁当をご用意。
            </p>
            <p>
              さらにタンパク質は70g以上！トレーニング後の栄養補給に最適です。美味しく食べながら、理想の体づくりをサポートします。
            </p>
          </div>
          
          {/* 栄養成分ハイライト */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-orange-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-orange-600">1,400+</div>
              <div className="text-xs text-gray-600">kcal/食</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-orange-600">70g+</div>
              <div className="text-xs text-gray-600">タンパク質</div>
            </div>
          </div>
          
          <div className="border-l-4 border-orange-600 pl-3 py-2 bg-orange-50">
            <p className="font-semibold text-orange-600 text-sm leading-[1.4]">
              毎日の食事が、あなたの成長につながる。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};