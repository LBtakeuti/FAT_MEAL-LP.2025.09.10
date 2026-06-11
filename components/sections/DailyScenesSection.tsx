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
  /** 写真内キャプションの前半（白文字） */
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
    <section className="bg-white py-8 sm:py-10" aria-label="ふとるめしのある毎日">
      <div className="max-w-6xl mx-auto px-4">
        {/* 見出し（中央）。オレンジの筆ストロークを見出しの「背後に重ねて」装飾配置。
            F60-4: 実GT(figma_GT_overlap.png)では swoosh の縦範囲の上部に見出しが内包される
            （swoosh が見出しの背後を通る＝重なる）。swoosh を z 下げ・見出しを z 上げにし、
            見出しが swoosh の上部1/4〜1/3 に重なる位置に置く。
            色（淡いサーモン0.27）・幅(約60%)・右上がりの向きは維持。 */}
        <div className="relative mb-8 sm:mb-12 pt-8 sm:pt-12 text-center">
          {/* 装飾SVG（最適化不要のため unoptimized）。見出しの背後に重ねる（z-0）。
              F60-5: モバイルは幅88%・やや左寄せ・見出し1行目に弧がかかる縦位置。
              PC(sm+)は従来の left-12%/top-0/w-60% を維持（モバイル専用クラスで分岐）。 */}
          <Image
            src="/images/daily-scenes/swoosh.svg"
            alt=""
            aria-hidden="true"
            width={1081}
            height={284}
            unoptimized
            className="pointer-events-none absolute left-[6%] top-5 z-0 w-[88%] max-w-[680px] h-auto sm:left-[12%] sm:top-0 sm:w-[60%]"
          />
          {/* F60-6: 見出しはレスポンシブで出し分け。
              モバイル(base)=短縮版を1行で（whitespace-nowrap）。PC(sm+)=フル文言。 */}
          <h2 className="relative z-10 text-xl sm:text-2xl font-semibold text-gray-900">
            <span className="whitespace-nowrap sm:hidden">ふとるめしで、毎日を豊かに</span>
            <span className="hidden sm:inline">ふとるめしを取り入れて、毎日をもっと豊かに</span>
          </h2>
        </div>

        {/* 3カード。
            F60-4: モバイル=横スワイプのカルーセル（overflow-x-auto + scroll-snap、
            各カード basis ~80% で次カードがpeek）。PC(sm+)=従来の3カラムgrid。
            snap/スクロールバー非表示は globals の .daily-scenes-carousel で制御。 */}
        <div className="daily-scenes-carousel flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:gap-8 sm:overflow-visible">
          {scenes.map((scene) => (
            <article
              key={scene.image}
              className="flex shrink-0 basis-4/5 snap-start flex-col sm:basis-auto sm:shrink"
            >
              {/* 縦長写真 + 下グラデ + 中央キャプション */}
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
                {/* F60-3: キャプションを水平中央・下から約9%に配置（text-center）。
                    実GT(figma_GT_real.png)は朝昼夜とも均一サイズ・均一ウェイト。 */}
                <p className="absolute bottom-[9%] left-0 right-0 px-4 text-center text-lg sm:text-xl font-medium text-white drop-shadow-sm">
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
