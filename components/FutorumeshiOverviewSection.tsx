import React from 'react';
import Image from 'next/image';

const FutorumeshiOverviewSection: React.FC = () => {
  return (
    <section
      id="about"
      className="relative overflow-hidden bg-[#fff7ed] py-8 sm:py-20"
    >
      {/* モバイル版: 狭い幅で中央配置 */}
      <div className="max-w-[400px] w-full px-6 mx-auto sm:hidden text-center">
        <header className="space-y-1 px-2 mb-3">
          <span className="inline-flex items-center justify-center gap-2 text-[clamp(0.6rem,2.5vw,0.75rem)] font-semibold tracking-[0.28em] uppercase text-orange-600">
            <span className="block h-[1px] w-6 bg-orange-400" />
            About Futoru Meshi
            <span className="block h-[1px] w-6 bg-orange-400" />
          </span>
          <h2 className="font-bold text-gray-900 leading-[1.1] text-[clamp(1.6rem,6vw,2rem)]">
            ふとるめしとは
          </h2>
        </header>
        
        <div className="py-3">
          <Image
            src="/copysub.png"
            alt="圧倒的「味」！！圧倒的「量」！！宅食サービス史上初！！それが、ふとるめし！！"
            width={600}
            height={300}
            className="w-full h-auto object-contain"
          />
        </div>
        
        <p className="text-[clamp(0.9rem,3.6vw,1.05rem)] text-gray-600 leading-[1.65] mt-3">
          <span className="font-bold text-orange-600 text-[clamp(1rem,4vw,1.25rem)] whitespace-nowrap">量が足りない、味が薄い、ご飯が進まない</span> 既存の宅食サービスでよく聞く悩みを解消し、ボリューム・味・ご飯との相性を妥協なく追求したお弁当です。
        </p>
      </div>

      {/* PC版: 広い幅で2カラムレイアウト */}
      <div className="hidden sm:block w-full max-w-[1200px] mx-auto px-8 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* 左カラム: テキスト */}
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
            </header>
            
            <div className="pt-4">
              <Image
                src="/copysub.png"
                alt="圧倒的「味」！！圧倒的「量」！！宅食サービス史上初！！それが、ふとるめし！！"
                width={600}
                height={300}
                className="w-full h-auto object-contain"
              />
            </div>
            
            <p className="text-[clamp(1rem,1.3vw,1.1rem)] lg:text-lg text-gray-600 leading-relaxed">
              <span className="font-bold text-orange-600 text-[clamp(1.15rem,1.5vw,1.3rem)] lg:text-xl whitespace-nowrap">量が足りない、味が薄い、ご飯が進まない</span> 既存の宅食サービスでよく聞く悩みを解消し、ボリューム・味・ご飯との相性を妥協なく追求したお弁当です。
            </p>
          </div>

          {/* 右カラム: 画像 */}
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
      </div>
    </section>
  );
};

export default FutorumeshiOverviewSection;

