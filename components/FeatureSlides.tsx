'use client';

import React from 'react';

export const FeatureSlide1: React.FC = () => {
  return (
    <section className="min-h-[100dvh] bg-white flex flex-col justify-center py-12">
      <div className="px-4 max-w-[375px] mx-auto">
        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 whitespace-nowrap">
            <span className="inline-block">ふとるめしの<span className="text-orange-600">こだわり</span></span>
          </h2>
        </div>
        
        {/* Feature Icon */}
        <div className="flex justify-center mb-8">
          <div className="bg-orange-50 rounded-2xl w-[280px] h-[280px] flex items-center justify-center">
            <span className="text-[100px]">💪</span>
          </div>
        </div>
        
        {/* Feature Content */}
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4 inline-block relative">
            良質なタンパク質
            <span className="absolute bottom-0 left-0 w-full h-1 bg-orange-600"></span>
          </h3>
          <p className="text-base text-gray-700 leading-relaxed whitespace-pre-line">
            {`プロテインが苦手、お腹を下してしまう。
鶏むね肉は量が食べられない。
そう言った方におすすめ！
ふとるめしでは、味、量、質が担保されたお弁当を準備しています！`}
          </p>
        </div>
      </div>
    </section>
  );
};

export const FeatureSlide2: React.FC = () => {
  return (
    <section className="min-h-[100dvh] bg-white flex flex-col justify-center py-12">
      <div className="px-4 max-w-[375px] mx-auto">
        {/* Feature Icon */}
        <div className="flex justify-center mb-8">
          <div className="bg-orange-50 rounded-2xl w-[280px] h-[280px] flex items-center justify-center">
            <span className="text-[100px]">😋</span>
          </div>
        </div>
        
        {/* Feature Content */}
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4 inline-block border-b-4 border-orange-600 pb-1">
            確かな味
          </h3>
          <p className="text-base text-gray-700 leading-relaxed whitespace-pre-line">
            {`何度も改良を重ね、ご飯と合う最高のおかずをご用意！
ご飯と合う味付けだから勝手にご飯が進み、苦なく体重を増やすことが可能！「もう太れない」から卒業！ふとるめしをご賞味あれ！`}
          </p>
        </div>
      </div>
    </section>
  );
};

export const FeatureSlide3: React.FC = () => {
  return (
    <section className="min-h-[100dvh] bg-white flex flex-col justify-center py-12">
      <div className="px-4 max-w-[375px] mx-auto">
        {/* Feature Icon */}
        <div className="flex justify-center mb-8">
          <div className="bg-orange-50 rounded-2xl w-[280px] h-[280px] flex items-center justify-center">
            <span className="text-[100px]">⚡</span>
          </div>
        </div>
        
        {/* Feature Content */}
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4 inline-block border-b-4 border-orange-600 pb-1">
            レンジでチンだけ！
          </h3>
          <p className="text-base text-gray-700 leading-relaxed whitespace-pre-line">
            {`部活動やハードワーク、筋トレとあとは疲れて食べることをキャンセルしてしまう、洗い物が面倒でインスタント麺を食べている。そう言った方にふとるめしは最適解。
レンジでチン！して、あとは食べて容器を捨てるだけ!（自治体の指定の捨て方で）
ふとるめしは忙しい方々の味方です。`}
          </p>
        </div>
      </div>
    </section>
  );
};