'use client';

import React from 'react';
import Image from 'next/image';

const TargetUserSection: React.FC = () => {
  return (
    <section id="target-users" className="min-h-screen bg-white py-20">
      <div className="max-w-[375px] px-4 md:max-w-[768px] md:px-6 lg:max-w-[1200px] lg:px-8 mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            <span className="block sm:inline">どんな人に「<span className="text-orange-600">ふとるめし</span>」が</span>
            <span className="block sm:inline">必要なのか？</span>
          </h1>
        </div>

        {/* Desktop: Both sections visible */}
        <div className="hidden sm:block space-y-16">
          {/* Sports Athletes Section */}
          <div>
            <div className="relative mb-6">
              {/* Orange accent bar */}
              <div className="absolute left-0 top-0 w-1 h-full bg-orange-600"></div>
              
              <h2 className="text-3xl font-bold text-gray-900 pl-4">
                思うように体重が増えないスポーツ選手
              </h2>
            </div>
            <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
              <p>
                野球を頑張る学生にとって「体重を増やしたい！」と思う人は多い。特に小中学生などは体重がなかなか増えずに悩まれている選手もいる。「プロテインも摂取していますが、体重がなかなか増えません…」といった声があり、体重が増えないことは選手だけではなく親御さんにとっても大きな悩みになっている。
              </p>
              <p>
                頑張って食べようにも味が良くないと喉を通らない。白米ばかりでタンパク質が足りない。ホエイ・ソイプロテインどちらも体に合わない。
              </p>
              <div className="border-l-4 border-orange-600 pl-4 py-2 mt-6">
                <p className="font-semibold text-orange-600 text-xl">
                  ふとるめしは、全てのスポーツ選手の味方です。確かな味と計算されたPFCバランス。楽しくトレーニング、これがふとるめしの掲げるビジョンです。
                </p>
              </div>
            </div>
          </div>

          {/* Office Workers Section */}
          <div>
            <div className="relative mb-6">
              {/* Orange accent bar */}
              <div className="absolute left-0 top-0 w-1 h-full bg-orange-600"></div>
              
              <h2 className="text-3xl font-bold text-gray-900 pl-4">
                筋トレを頑張る社会人
              </h2>
            </div>
            <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
              <p>
                筋肉を増やすには、トレーニングだけでなく、たんぱく質を中心に、糖質や脂質・ビタミン・ミネラルなど幅広い栄養素が必要になります。
              </p>
              <p>
                つまり、あなたの経験は科学的に裏付けられており、忙しさによる栄養不足（特にタンパク質）が筋肉量の維持・増加を妨げ、結果として体重増加が困難になるという現象は実際に存在します。筋トレの効果を最大化するためには、時間がない中でも栄養バランスを意識した食事の工夫が重要です。
              </p>
              <div className="border-l-4 border-orange-600 pl-4 py-2 mt-6">
                <p className="font-semibold text-orange-600 text-xl">
                  忙しい社会人には「ふとるめし」が最適解。ハードワーカーやトレーニーにもぴったりなお弁当になっています。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TargetUserSection;