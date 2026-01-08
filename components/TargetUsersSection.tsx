import React from 'react';
import Image from 'next/image';

const TargetUsersSection: React.FC = () => {
  const targets = [
    {
      title: '思うように体重が増えない スポーツ選手',
      description:
        'スポーツを全力で頑張る学生にとって「体重を増やしたい！」と思う人は多い。特に小中学生などは体重がなかなか増えずに悩まれている選手もいる。',
      quote: 'プロテインを飲んでいますが、体重がなかなか増えません…',
      message:
        'ふとるめしは、全てのスポーツ選手の味方です。確かな味と計算されたPFCバランス。楽しくトレーニング、これがふとるめしの掲げるビジョンです',
      label: 'SPORTS',
    },
    {
      title: '筋トレを頑張る 社会人',
      description:
        '筋肉を増やすには、トレーニングだけでなく、たんぱく質を中心に、糖質や脂質・ビタミン・ミネラルなど幅広い栄養素が必要になります。',
      quote: '',
      message:
        'ジム後の食事を「ふとるめし」に置き換えるだけでさらに効果的に、健康的に体重を増やそう！',
      label: 'FITNESS',
    },
  ];

  return (
    <section className="relative overflow-hidden bg-white py-12 sm:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="text-center mb-10 sm:mb-16">
          {/* セクションタイトル */}
          <div className="text-center mb-10 sm:mb-16 relative">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 relative z-10">
              どんな人に<br className="sm:hidden" />
              ふとるめしが必要なのか
            </h2>
            <div className="flex justify-center -mt-6 sm:-mt-8 relative z-0">
              <Image
                src="/b_simple_111_0M 2.png"
                alt=""
                width={3923}
                height={465}
                className="w-full max-w-3xl h-auto"
              />
            </div>
          </div>
        </div>

        {/* ターゲットカード */}
        <div className="space-y-12 sm:space-y-20">
          {targets.map((target, index) => (
            <div
              key={index}
              className="flex flex-col gap-6 sm:gap-8 lg:gap-12 items-center"
            >
              {/* コンテンツ */}
              <div className="w-full max-w-3xl space-y-4 sm:space-y-6">
                {/* ラベル */}
                <div className="inline-block bg-orange-500 text-white px-4 py-2 rounded-lg font-bold text-sm tracking-wider">
                  {target.label}
                </div>

                {/* タイトル */}
                <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl font-bold text-gray-900 leading-tight whitespace-nowrap">
                  {target.title}
                </h3>

                {/* 説明 */}
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  {target.description}
                </p>

                {/* 引用（あれば） */}
                {target.quote && (
                  <div className="bg-orange-50 border-l-4 border-orange-500 p-4 sm:p-5 rounded-r-lg">
                    <p className="text-sm sm:text-base text-gray-700 italic">
                      「{target.quote}」
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-2">
                      といった声があり、体重が増えないことは選手だけではなく親御さんにとっても大きな悩みになっている。
                    </p>
                  </div>
                )}

                {/* メッセージ */}
                <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-5 sm:p-6 rounded-xl shadow-lg">
                  <p className="text-sm sm:text-base lg:text-lg font-bold leading-relaxed">
                    {target.message}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TargetUsersSection;

