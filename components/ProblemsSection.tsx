import React from 'react';

const ProblemsSection: React.FC = () => {
  const problems = [
    '食べても食べても太れない',
    '筋トレしても体重が増えない',
    '高カロリーな食事を作る時間がない',
    'プロテインだけでは栄養が偏る',
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white to-orange-50 py-12 sm:py-20">
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

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            こんなお悩み<br className="sm:hidden" />ありませんか？
          </h2>
        </div>

        {/* 悩みリスト */}
        <div className="space-y-4 sm:space-y-5 mb-10 sm:mb-16">
          {problems.map((problem, index) => (
            <div
              key={index}
              className="bg-white p-4 sm:p-6 rounded-xl border-2 border-gray-300"
            >
              <p className="text-base sm:text-lg lg:text-xl text-gray-700 font-medium leading-relaxed">
                {problem}
              </p>
            </div>
          ))}
        </div>

        {/* 結論テキスト */}
        <div className="text-center font-antique leading-none -mt-6 sm:-mt-8">
          <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            その悩み！
          </p>
          <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-orange-600">
            「ふとるめし」で全て解決！
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProblemsSection;
