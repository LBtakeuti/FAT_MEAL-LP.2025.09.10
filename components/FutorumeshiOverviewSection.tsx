import React from 'react';
import Image from 'next/image';

const FutorumeshiOverviewSection: React.FC = () => {
  return (
    <section
      id="about"
      className="relative overflow-hidden bg-gradient-to-br from-[#fff7ed] via-[#fffaf3] to-white h-[100dvh] sm:min-h-screen flex items-center justify-center"
    >
      <div className="absolute -top-16 -left-16 h-40 w-40 bg-orange-100/40 rounded-full blur-3xl" />
      <div className="absolute bottom-4 right-2 h-44 w-44 bg-orange-200/30 rounded-full blur-[80px]" />

      {/* モバイル版: 狭い幅で中央配置 */}
      <div className="max-w-[360px] w-full px-4 sm:hidden text-center relative -translate-y-4">
        <header className="space-y-2">
          <span className="inline-flex items-center justify-center gap-2 text-[clamp(0.6rem,2.5vw,0.75rem)] font-semibold tracking-[0.28em] uppercase text-orange-600">
            <span className="block h-[1px] w-6 bg-orange-400" />
            About Futoru Meshi
            <span className="block h-[1px] w-6 bg-orange-400" />
          </span>
          <h2 className="font-bold text-gray-900 leading-[1.1] text-[clamp(1.6rem,6vw,2rem)]">
            ふとるめしとは
          </h2>
          <p className="text-[clamp(1rem,4vw,1.2rem)] text-gray-600 leading-[1.5]">
            <span className="font-bold text-orange-600 text-[clamp(1.1rem,4.5vw,1.4rem)] whitespace-nowrap">量が足りない、味が薄い、ご飯が進まない</span> 既存の宅食サービスでよく聞く悩みを解消し、ボリューム・味・ご飯との相性を妥協なく追求したお弁当です。
          </p>
        </header>

        <div className="mt-3 grid gap-3 text-[clamp(1rem,4vw,1.15rem)] text-gray-700 leading-[1.5] text-left">
          <div className="space-y-2.5">
            <p className="text-gray-800">
              栄養管理士監修の高カロリー×高栄養設計で、免疫アップもフィジカル強化もサポートします。
            </p>
          </div>

          <div className="space-y-2.5">
            <ul className="space-y-1.5 list-disc list-inside text-[clamp(1rem,4vw,1.15rem)]">
              <li>食べやすさと満足感を追求した主菜</li>
              <li>ご飯が進む味付けと計算されたPFCバランス</li>
              <li>「食べ切れない・続かない」という壁を越える味とボリューム</li>
            </ul>
            <div className="text-center space-y-1">
              <p className="text-[clamp(1.1rem,4.5vw,1.3rem)] text-gray-900 font-semibold tracking-wide">
                努力にブーストを、もっと栄養を。
              </p>
              <p className="text-[clamp(1rem,4vw,1.2rem)] lg:text-lg text-gray-500">
                これが「ふとるめし」の掲げるビジョンです。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* PC版: 広い幅で2カラムレイアウト */}
      <div className="hidden sm:block w-full max-w-[1200px] mx-auto px-8 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* 左カラム: 見出しと概要 */}
          <div className="space-y-8">
            <header className="space-y-4">
              <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.3em] uppercase text-orange-600">
                <span className="block h-[1px] w-8 bg-orange-400" />
                About Futoru Meshi
                <span className="block h-[1px] w-8 bg-orange-400" />
              </span>
              <h2 className="font-bold text-gray-900 leading-tight text-[clamp(2.5rem,3.5vw,3rem)]">
                ふとるめしとは
              </h2>
              <p className="text-[clamp(1rem,1.3vw,1.1rem)] lg:text-lg text-gray-600 leading-relaxed">
                <span className="font-bold text-orange-600 text-[clamp(1.15rem,1.5vw,1.3rem)] lg:text-xl whitespace-nowrap">量が足りない、味が薄い、ご飯が進まない</span> 既存の宅食サービスでよく聞く悩みを解消し、ボリューム・味・ご飯との相性を妥協なく追求したお弁当です。
              </p>
            </header>
            <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-lg">
              <Image
                src="/photo-1602273660127-a0000560a4c1.jpeg"
                alt="ふとるめしのおかずイメージ"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>

          {/* 右カラム: 詳細説明 */}
          <div className="space-y-6 text-[clamp(1rem,1.25vw,1.1rem)] lg:text-lg text-gray-700 leading-relaxed">
            <div className="space-y-4">
              <p className="text-gray-800 font-medium">
                栄養管理士監修の高カロリー×高栄養設計で、免疫アップもフィジカル強化もサポートします。
              </p>
            </div>

            <div className="space-y-4 pt-4">
              <ul className="space-y-3 list-disc list-inside text-gray-700">
                <li>食べやすさと満足感を追求した主菜</li>
                <li>ご飯が進む味付けと計算されたPFCバランス</li>
                <li>「食べ切れない・続かない」という壁を越える味とボリューム</li>
              </ul>
              <div className="pt-4">
                <p className="text-[clamp(1.2rem,1.6vw,1.35rem)] font-semibold text-gray-900 tracking-wide mb-2">
                  努力にブーストを、もっと栄養を。
                </p>
                <p className="text-[clamp(0.95rem,3.8vw,1.15rem)] lg:text-lg text-gray-500">
                  これが「ふとるめし」の掲げるビジョンです。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FutorumeshiOverviewSection;

