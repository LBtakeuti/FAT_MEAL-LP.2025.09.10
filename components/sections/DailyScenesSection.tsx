import Image from 'next/image';

/**
 * F60: 「ふとるめしのある毎日」セクション。
 * 朝・昼・夜の食卓シーンを3カードで紹介する。
 * - 各カード: 縦長写真（下方向に黒グラデ）＋写真左下に白キャプション（「ふとるめし」のみブランドオレンジ）
 * - カード下（白背景）に 小見出し（オレンジ）＋ 本文（黒）
 * MediaLogosSection と ComparisonSection の間に配置（HomeContent.tsx）。
 */

type Scene = {
  /** 写真ファイル名（public/images/daily-scenes/配下のwebp） */
  image: string;
  /** 写真の alt */
  alt: string;
  /** 写真左下キャプションの前半（白文字） */
  captionLead: string;
  /** カード下の小見出し（ブランドオレンジ） */
  title: string;
  /** カード下の本文（黒） */
  body: string;
};

const scenes: Scene[] = [
  {
    image: '/images/daily-scenes/asa.webp',
    alt: '忙しい朝の食卓でほほえむ女性',
    captionLead: '忙しい朝に',
    title: '朝のふとるめし',
    body: '愛情はそのまま、手間だけおまかせ。朝のお弁当づくりをふとるめしに置き換えて、空いた時間を自分のために。',
  },
  {
    image: '/images/daily-scenes/hiru.webp',
    alt: 'お弁当を食べる男性',
    captionLead: '軽食に',
    title: 'お昼のふとるめし',
    body: 'おなかをすかせて帰ってくる子どもに、温めるだけの軽食を。',
  },
  {
    image: '/images/daily-scenes/yoru.webp',
    alt: '夜の食卓を囲む家族',
    captionLead: '夜の一品に',
    title: '夜のふとるめし',
    body: 'あと一品ほしい夜に。並べるだけで、増量に必要な栄養がそろいます。',
  },
];

export default function DailyScenesSection() {
  return (
    <section className="bg-white py-12 sm:py-16" aria-label="ふとるめしのある毎日">
      <div className="max-w-6xl mx-auto px-4">
        {/* 見出し（中央）。上にオレンジの筆ストロークを装飾配置。
            F60-2: swoosh はコンテンツ幅の約60%（最大~680px）で右に跳ね上がる形に拡大配置。
            Figma座標（枠1757基準）の x=15.1%/幅60.7% を踏襲（比率1081:284を保持）。 */}
        <div className="relative mb-10 sm:mb-14 pt-16 sm:pt-20 text-center">
          {/* 装飾SVG。最適化パイプラインを通す実益が薄いため unoptimized 指定（review F60軽微対応）。
              F60-2-fix: 見出しの上に弧が乗るよう上方へ配置（baseline跨ぎを解消）。 */}
          <Image
            src="/images/daily-scenes/swoosh.svg"
            alt=""
            aria-hidden="true"
            width={1081}
            height={284}
            unoptimized
            className="pointer-events-none absolute left-[12%] top-0 w-[60%] max-w-[680px] h-auto"
          />
          <h2 className="relative text-xl sm:text-2xl font-semibold text-gray-900">
            ふとるめしを取り入れて、毎日をもっと豊かに
          </h2>
        </div>

        {/* 3カード（PC=3カラム横並び / モバイル=縦積み） */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
          {scenes.map((scene) => (
            <article key={scene.image} className="flex flex-col">
              {/* 縦長写真 + 下グラデ + 左下キャプション */}
              <div className="relative aspect-[529/750] w-full overflow-hidden rounded-lg">
                <Image
                  src={scene.image}
                  alt={scene.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover"
                />
                {/* 下方向の黒グラデ（キャプションの可読性確保）。
                    F60-2: Figma同等の readable な見え方にするため高さ約60%・濃いめに強化。 */}
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/85 via-black/40 to-transparent"
                  aria-hidden="true"
                />
                <p className="absolute bottom-5 left-5 text-lg sm:text-xl font-semibold text-white drop-shadow-sm">
                  {scene.captionLead}
                  <span className="text-orange-600">ふとるめし</span>
                </p>
              </div>

              {/* カード下のテキスト（白背景）：小見出し（オレンジ）＋本文（黒）。
                  F60-2: Figma比率に合わせ小見出しを text-lg(w500)、本文を text-base に。 */}
              <div className="pt-4">
                <h3 className="text-lg font-medium text-orange-600">{scene.title}</h3>
                <p className="mt-1 text-sm sm:text-base leading-relaxed text-gray-900">{scene.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
