import React from 'react';
import Image from 'next/image';

const TargetUsersSection: React.FC = () => {
  const targets = [
    {
      title: '思うように体重が増えない\nスポーツ選手',
      image: '/baseball-g24ce42811_640.jpg',
      description:
        'スポーツを全力で頑張る学生にとって「体重を増やしたい！」と思う人は多い。特に小中学生などは体重がなかなか増えずに悩まれている選手もいる。',
      quote: 'プロテインを飲んでいますが、体重がなかなか増えません…',
      message:
        'ふとるめしは、全てのスポーツ選手の味方です。確かな味と計算されたPFCバランス。楽しくトレーニング、これがふとるめしの掲げるビジョンです',
      label: 'SPORTS',
    },
    {
      title: '筋トレを頑張る\n社会人',
      image: '/FOOD.avif',
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
      {/* 上部の波形 */}
      <div className="absolute top-0 left-0 w-full overflow-hidden leading-none" style={{ transform: 'translateY(-1px)' }}>
        <svg
          className="relative block w-full h-16 sm:h-24"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
            className="fill-white"
          ></path>
        </svg>
      </div>

      {/* 下部の波形 */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none" style={{ transform: 'translateY(1px)' }}>
        <svg
          className="relative block w-full h-16 sm:h-24"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          style={{ transform: 'scaleY(-1)' }}
        >
          <path
            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
            className="fill-orange-50"
          ></path>
        </svg>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            どんな人に<br className="sm:hidden" />
            ふとるめしが必要なのか
          </h2>
        </div>

        {/* ターゲットカード */}
        <div className="space-y-12 sm:space-y-20">
          {targets.map((target, index) => (
            <div
              key={index}
              className={`flex flex-col ${
                index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
              } gap-6 sm:gap-8 lg:gap-12 items-center`}
            >
              {/* 画像 */}
              <div className="w-full lg:w-1/2">
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
                  <Image
                    src={target.image}
                    alt={target.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
              </div>

              {/* コンテンツ */}
              <div className="w-full lg:w-1/2 space-y-4 sm:space-y-6">
                {/* ラベル */}
                <div className="inline-block bg-orange-500 text-white px-4 py-2 rounded-lg font-bold text-sm tracking-wider">
                  {target.label}
                </div>

                {/* タイトル */}
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight whitespace-pre-line">
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

