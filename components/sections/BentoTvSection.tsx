import Image from 'next/image';

/**
 * F8: メディアロゴ直下に配置する、TV取材風の弁当ビジュアルセクション。
 * 1枚の合成画像（左: 開封ショット / 右: 6個並び）を横幅いっぱいに表示。装飾用でクリック挙動なし。
 */
export default function BentoTvSection() {
  return (
    <section className="bg-white py-6 sm:py-10" aria-label="ふとるめしのメニュー">
      <div className="max-w-6xl mx-auto px-4">
        <Image
          src="/images/sections/futorumeshi-tv.png"
          alt="ふとるめしの弁当メニュー：開封ショットと6個並びの紹介"
          width={8492}
          height={2454}
          sizes="(max-width: 1024px) 100vw, 1024px"
          className="w-full h-auto"
        />
      </div>
    </section>
  );
}
