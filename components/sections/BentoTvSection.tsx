import Image from 'next/image';
import { Reveal } from '@/components/ui/Reveal';

/**
 * F8: トップページ上部に配置する、TV取材風の弁当ビジュアルセクション。
 * オレンジ枠付きの1枚画像を横幅いっぱいに表示。装飾用でクリック挙動なし。
 */
export default function BentoTvSection() {
  return (
    <section className="bg-white py-6 sm:py-10" aria-label="ふとるめしのメニュー">
      <div className="max-w-6xl mx-auto px-4">
        {/* F73: フェードイン */}
        <Reveal>
          <Image
            src="/images/sections/futorumeshi-tv.webp"
            alt="ふとるめしの弁当メニュー：開封ショットと6個並びの紹介"
            width={3402}
            height={984}
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="w-full h-auto"
          />
        </Reveal>
      </div>
    </section>
  );
}
