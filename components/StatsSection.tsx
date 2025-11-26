import React from 'react';

const StatsSection: React.FC = () => {
  const stats = [
    {
      number: '900',
      unit: 'kcal',
      label: '1食平均カロリー',
      description: '確実なカロリー摂取で体重増加をサポート',
      color: 'from-orange-500 to-red-500',
    },
    {
      number: '70',
      unit: 'g',
      label: '平均たんぱく質',
      description: '筋肉づくりに必要な高たんぱく設計',
      color: 'from-blue-500 to-purple-500',
    },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-orange-50 to-white py-12 sm:py-20">
      {/* 上部の波形 - 白背景から遷移 */}
      <div className="absolute top-0 left-0 w-full overflow-hidden leading-none" style={{ transform: 'translateY(-1px)' }}>
        <svg
          className="relative block w-full h-16 sm:h-24"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
            className="fill-orange-50"
          ></path>
        </svg>
      </div>

      {/* 下部の波形 - 次のセクションへの遷移 */}
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
            className="fill-white"
          ></path>
        </svg>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            数字で見る<br className="sm:hidden" />「ふとるめし」
          </h2>
          <p className="text-base sm:text-lg text-gray-600">
            科学的根拠に基づいた栄養設計
          </p>
        </div>

        {/* 数字カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="relative bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow"
            >
              {/* グラデーション背景 */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5`}></div>
              
              <div className="relative p-8 sm:p-10 lg:p-12 text-center">
                {/* 数字 */}
                <div className="mb-4">
                  <span className={`text-6xl sm:text-7xl lg:text-8xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                    {stat.number}
                  </span>
                  <span className={`text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent ml-2`}>
                    {stat.unit}
                  </span>
                  <span className="text-2xl sm:text-3xl text-gray-400 ml-1">オーバー</span>
                </div>

                {/* ラベル */}
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                  {stat.label}
                </h3>

                {/* 説明 */}
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  {stat.description}
                </p>
              </div>

              {/* 装飾 */}
              <div className={`absolute -bottom-10 -right-10 w-40 h-40 bg-gradient-to-br ${stat.color} opacity-10 rounded-full blur-3xl`}></div>
            </div>
          ))}
        </div>

        {/* 補足情報 */}
        <div className="mt-10 sm:mt-16 text-center">
          <div className="inline-block bg-white px-6 sm:px-10 py-4 sm:py-6 rounded-xl shadow-md">
            <p className="text-sm sm:text-base text-gray-600">
              ※ メニューによって栄養成分は異なります
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;

