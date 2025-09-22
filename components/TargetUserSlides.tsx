'use client';

import React from 'react';

export const TargetUserSlide1: React.FC = () => {
  return (
    <section className="h-[100dvh] bg-white px-4 pb-24 flex flex-col">
      <div className="max-w-[375px] md:max-w-[768px] lg:max-w-[1200px] mx-auto w-full flex-1 flex flex-col">
        {/* タイトル - 画面の1/5 */}
        <div className="h-[20vh] flex items-center justify-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 text-center leading-[1.3]">
            <span className="block">どんな人に「<span className="text-orange-600">ふとるめし</span>」が</span>
            <span className="block">必要なのか？</span>
          </h1>
        </div>
        
        {/* サブタイトル */}
        <div className="mb-4">
          <h2 className="text-[18px] md:text-2xl font-bold text-gray-900 border-b-4 border-orange-600 pb-2 whitespace-nowrap">
            思うように体重が増えないスポーツ選手
          </h2>
        </div>
        
        {/* コンテンツエリア - 残りのスペース */}
        <div className="flex-1 flex flex-col">
          <div className="space-y-4 text-base text-gray-700 leading-[1.8] mb-6">
            <p className="text-base">
              野球を頑張る学生にとって「体重を増やしたい！」と思う人は多い。特に小中学生などは体重がなかなか増えずに悩まれている選手もいる。
            </p>
            <p className="text-base">
              「プロテインも摂取していますが、体重がなかなか増えません…」といった声があり、体重が増えないことは選手だけではなく親御さんにとっても大きな悩みになっている。
            </p>
            <p className="text-base">
              頑張って食べようにも味が良くないと喉を通らない。白米ばかりでタンパク質が足りない。ホエイ・ソイプロテインどちらも体に合わない。
            </p>
          </div>
          
          <div className="border-l-4 border-orange-600 pl-4 py-3 bg-orange-50 mb-4">
            <p className="font-semibold text-orange-600 text-base leading-[1.6]">
              ふとるめしは、全てのスポーツ選手の味方です。確かな味と計算されたPFCバランス。楽しくトレーニング、これがふとるめしの掲げるビジョンです。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export const TargetUserSlide2: React.FC = () => {
  return (
    <section className="h-[100dvh] bg-white px-4 pb-24 flex flex-col">
      <div className="max-w-[375px] md:max-w-[768px] lg:max-w-[1200px] mx-auto w-full flex-1 flex flex-col">
        {/* タイトル - 上部に配置 */}
        <div className="pt-8 pb-4">
          <h2 className="text-[18px] md:text-2xl font-bold text-gray-900 border-b-4 border-orange-600 pb-2">
            筋トレを頑張る社会人
          </h2>
        </div>
        
        {/* コンテンツエリア - 残りのスペースで上寄せ */}
        <div className="flex-1 flex flex-col pt-4">
          <div className="space-y-5 text-base text-gray-700 leading-[1.8] mb-8">
            <p>
              筋肉を増やすには、トレーニングだけでなく、たんぱく質を中心に、糖質や脂質・ビタミン・ミネラルなど幅広い栄養素が必要になります。
            </p>
            <p>
              つまり、あなたの経験は科学的に裏付けられており、忙しさによる栄養不足（特にタンパク質）が筋肉量の維持・増加を妨げ、結果として体重増加が困難になるという現象は実際に存在します。
            </p>
            <p>
              筋トレの効果を最大化するためには、時間がない中でも栄養バランスを意識した食事の工夫が重要です。
            </p>
          </div>
          
          {/* 強調メッセージ - 少し余白を開けて配置 */}
          <div className="border-l-4 border-orange-600 pl-4 py-3 bg-orange-50 mt-8">
            <p className="font-semibold text-orange-600 text-base leading-[1.6]">
              忙しい社会人には「ふとるめし」が最適解。ハードワーカーやトレーニーにもぴったりなお弁当になっています。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};