import React from 'react';
import Image from 'next/image';

const ProblemsSection: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white to-orange-50 pt-4 sm:pt-6 pb-12 sm:pb-20">
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* セクション見出し */}
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-xs sm:text-sm md:text-base lg:text-2xl xl:text-3xl font-bold text-gray-900 leading-relaxed font-antique">
            <span className="whitespace-nowrap block">ふとるめしは</span>
            <span className="whitespace-nowrap block">「量」「味」「タンパク質」に振り切った</span>
            <span className="whitespace-nowrap block">今までにない冷凍弁当サービスです。</span>
          </h2>
        </div>

        {/* 画像配置 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
          <div className="relative w-full h-[200px] sm:h-[250px] lg:h-[320px] overflow-hidden">
            <Image
              src="/problems-worry.jpeg"
              alt="スポーツ選手"
              fill
              className="object-cover"
            />
          </div>
          <div className="relative w-full h-[200px] sm:h-[250px] lg:h-[320px] overflow-hidden">
            <Image
              src="/problems-skinny.jpeg"
              alt="スポーツ選手"
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* 追加テキスト */}
        <div className="text-center">
          <p className="text-xs sm:text-sm md:text-base lg:text-2xl xl:text-3xl font-bold text-gray-900 leading-relaxed font-antique">
            <span className="whitespace-nowrap block mb-2">楽しくトレーニング。</span>
            <span className="whitespace-nowrap block mb-4 sm:mb-6">努力にブーストを。</span>
            <span className="whitespace-nowrap block">それが、「<span className="text-orange-600">ふとるめし</span>」の掲げるビジョンです。</span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProblemsSection;
