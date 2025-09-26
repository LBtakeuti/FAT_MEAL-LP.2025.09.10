'use client';

import React from 'react';

export const TargetUserSlide1: React.FC = () => {
  return (
    <section className="h-[100dvh] bg-white px-4 pb-20 flex flex-col">
      <div className="max-w-[375px] md:max-w-[768px] lg:max-w-[1200px] mx-auto w-full flex-1 flex flex-col">
        {/* タイトル */}
        <div className="pt-6 pb-4">
          <h1 className="text-base sm:text-3xl md:text-4xl font-bold text-gray-900 text-center leading-[1.3]">
            どんな人に「<span className="text-orange-600">ふとるめし</span>」が必要なのか？
          </h1>
        </div>
        
        {/* サブタイトル */}
        <div className="mb-4">
          <h2 className="text-base md:text-2xl font-bold text-gray-900 border-l-4 border-orange-600 pl-3">
            思うように体重が増えないスポーツ選手
          </h2>
        </div>
        
        {/* イラスト - スポーツ選手のイラストに変更 */}
        <div className="flex justify-center mb-4">
          <img 
            src="/target-user-1.svg" 
            alt="スポーツ選手のイラスト" 
            className="w-[180px] h-[180px] object-contain"
          />
        </div>
        
        {/* コンテンツエリア */}
        <div className="flex-1 flex flex-col">
          <div className="space-y-2.5 text-sm text-gray-700 leading-[1.5] mb-3">
            <p>
              野球を頑張る学生にとって「体重を増やしたい！」と思う人は多い。特に小中学生などは体重がなかなか増えずに悩まれている選手もいる。
            </p>
            <p>
              「プロテインも摂取していますが、体重がなかなか増えません…」といった声があり、体重が増えないことは選手だけではなく親御さんにとっても大きな悩みになっている。
            </p>
            <p>
              頑張って食べようにも味が良くないと喉を通らない。白米ばかりでタンパク質が足りない。ホエイ・ソイプロテインどちらも体に合わない。
            </p>
          </div>
          
          {/* ハイライト */}
          <div className="border-l-4 border-orange-600 pl-3 py-2 bg-orange-50 mb-3">
            <p className="font-semibold text-orange-600 text-sm leading-[1.4]">
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
    <section className="h-[100dvh] bg-white px-4 pb-20 flex flex-col">
      <div className="max-w-[375px] md:max-w-[768px] lg:max-w-[1200px] mx-auto w-full flex-1 flex flex-col">
        {/* サブタイトル */}
        <div className="pt-8 pb-4">
          <h2 className="text-base md:text-2xl font-bold text-gray-900 border-l-4 border-orange-600 pl-3">
            筋トレを頑張る社会人
          </h2>
        </div>
        
        {/* イラスト */}
        <div className="flex justify-center mb-4">
          <img 
            src="/target-user-2.svg" 
            alt="筋トレをする社会人のイラスト" 
            className="w-[200px] h-[200px] object-contain"
          />
        </div>
        
        {/* コンテンツエリア */}
        <div className="flex-1 flex flex-col justify-start">
          <div className="space-y-2.5 text-sm text-gray-700 leading-[1.5] mb-3">
            <p>
              筋肉を増やすには、トレーニングだけでなく、たんぱく質を中心に、糖質や脂質・ビタミン・ミネラルなど幅広い栄養素が必要になります。
            </p>
            <p>
              つまり、あなたの経験や科学的に裏付けされており、忙しさに上質な栄養素料（特にたんぱく質）が摂れずに筋肉の維持・増加に失敗、結果トレで体を壊すだけの無意味な活動になっています。
            </p>
            <p>
              サプリメントの種類は変わらないし、不足分のタンパク質を補うんでしょうが、所詮サプリメントなんて筋トレ前後しかタイミングがないので、1日2日でも充分なタンパク質が摂れない日があると大きくパフォーマンスが下がります。
            </p>
          </div>
          
          {/* ハイライト */}
          <div className="border-l-4 border-orange-600 pl-3 py-2 bg-orange-50 mb-3">
            <p className="font-semibold text-orange-600 text-sm leading-[1.4]">
              ふとるめしは、ジムに行くのと同じくらい必要。科学的証明と検証が済んでいるから結果が出る。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};