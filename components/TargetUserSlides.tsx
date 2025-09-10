'use client';

import React from 'react';

export const TargetUserSlide1: React.FC = () => {
  return (
    <section className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="max-w-[375px] md:max-w-[768px] lg:max-w-[1200px] mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            <span className="block">どんな人に「<span className="text-orange-600">ふとるめし</span>」が</span>
            <span className="block">必要なのか？</span>
          </h1>
        </div>
        
        <div className="relative">
          {/* Orange accent bar */}
          <div className="absolute left-0 top-0 w-1 h-16 bg-orange-600"></div>
          
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 pl-4">
            思うように体重が増えない<br />
            スポーツ選手
          </h2>
        </div>
        
        <div className="space-y-4 text-base md:text-lg text-gray-700 leading-relaxed mt-6">
          <p>
            野球を頑張る学生にとって「体重を増やしたい！」と思う人は多い。特に小中学生などは体重がなかなか増えずに悩まれている選手もいる。
          </p>
          <p>
            「プロテインも摂取していますが、体重がなかなか増えません…」といった声があり、体重が増えないことは選手だけではなく親御さんにとっても大きな悩みになっている。
          </p>
          <p>
            頑張って食べようにも味が良くないと喉を通らない。白米ばかりでタンパク質が足りない。ホエイ・ソイプロテインどちらも体に合わない。
          </p>
          
          <div className="border-l-4 border-orange-600 pl-4 py-2 mt-8">
            <p className="font-semibold text-orange-600 text-lg">
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
    <section className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="max-w-[375px] md:max-w-[768px] lg:max-w-[1200px] mx-auto">
        <div className="relative">
          {/* Orange accent bar */}
          <div className="absolute left-0 top-0 w-1 h-10 bg-orange-600"></div>
          
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 pl-4">
            筋トレを頑張る社会人
          </h2>
        </div>
        
        <div className="space-y-4 text-base md:text-lg text-gray-700 leading-relaxed mt-6">
          <p>
            筋肉を増やすには、トレーニングだけでなく、たんぱく質を中心に、糖質や脂質・ビタミン・ミネラルなど幅広い栄養素が必要になります。
          </p>
          <p>
            つまり、あなたの経験は科学的に裏付けられており、忙しさによる栄養不足（特にタンパク質）が筋肉量の維持・増加を妨げ、結果として体重増加が困難になるという現象は実際に存在します。
          </p>
          <p>
            筋トレの効果を最大化するためには、時間がない中でも栄養バランスを意識した食事の工夫が重要です。
          </p>
          
          <div className="border-l-4 border-orange-600 pl-4 py-2 mt-8">
            <p className="font-semibold text-orange-600 text-lg">
              忙しい社会人には「ふとるめし」が最適解。ハードワーカーやトレーニーにもぴったりなお弁当になっています。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};