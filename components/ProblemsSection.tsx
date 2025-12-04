import React from 'react';
import Image from 'next/image';

const ProblemsSection: React.FC = () => {
  const speechBubbles = [
    '/e1081_1 1.svg',
    '/e1081_1 5.svg',
    '/e1081_1 6.svg',
    '/e1081_1 7.svg',
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white to-orange-50 pt-32 sm:pt-40 lg:pt-48 pb-12 sm:pb-20">
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
        {/* セクション見出し */}
        <div className="text-center mb-4 sm:mb-6">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
            こんな悩みありませんか？
          </h2>
        </div>

        {/* 吹き出しSVGと人のイラスト用スペース - モバイル・PC共通 */}
        <div className="relative w-full mb-10 sm:mb-16 min-h-[350px] sm:min-h-[500px] lg:min-h-[600px] flex items-center justify-center">
          {/* 中央：人のイラスト用スペース */}
          <div className="absolute w-full max-w-[200px] sm:max-w-[380px] lg:max-w-[420px] h-[250px] sm:h-[400px] lg:h-[500px] flex items-center justify-center">
            {/* 後で人のイラストを配置 */}
          </div>

          {/* 半円状に配置された吹き出しSVG - PCの配置を保持、モバイルはサイズのみ縮小 */}
          {/* 1つ目: 左端 */}
          <div
            className="absolute w-[105px] sm:w-[220px] lg:w-[280px] max-w-[105px] sm:max-w-[220px] lg:max-w-[280px] overflow-hidden"
            style={{
              left: '12%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <Image
              src={speechBubbles[0]}
              alt=""
              width={423}
              height={283}
              className="w-full h-auto object-contain max-w-full"
            />
          </div>

          {/* 2つ目: 左上 */}
          <div
            className="absolute w-[105px] sm:w-[220px] lg:w-[280px] max-w-[105px] sm:max-w-[220px] lg:max-w-[280px] overflow-hidden"
            style={{
              left: '32%',
              top: '20%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <Image
              src={speechBubbles[1]}
              alt=""
              width={423}
              height={283}
              className="w-full h-auto object-contain max-w-full"
            />
          </div>

          {/* 3つ目: 右上 */}
          <div
            className="absolute w-[105px] sm:w-[220px] lg:w-[280px] max-w-[105px] sm:max-w-[220px] lg:max-w-[280px] overflow-hidden"
            style={{
              left: '68%',
              top: '20%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <Image
              src={speechBubbles[2]}
              alt=""
              width={423}
              height={283}
              className="w-full h-auto object-contain max-w-full"
            />
          </div>

          {/* 4つ目: 右端 */}
          <div
            className="absolute w-[105px] sm:w-[220px] lg:w-[280px] max-w-[105px] sm:max-w-[220px] lg:max-w-[280px] overflow-hidden"
            style={{
              left: '88%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <Image
              src={speechBubbles[3]}
              alt=""
              width={423}
              height={283}
              className="w-full h-auto object-contain max-w-full"
            />
          </div>
        </div>

        {/* 結論テキスト */}
        <div className="text-center font-antique">
          <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            今までの常識を覆す、ふとるめし。
          </p>
          <p className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-600">
            ぜひご賞味あれ！
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProblemsSection;
