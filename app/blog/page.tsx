import Link from 'next/link';
import { getArticlesServer } from '@/lib/supabase';
import BlogListClient from './BlogListClient';

// SEO-S2: コラム一覧をサーバーレンダリング化。初回12件をサーバ取得し、
// 記事タイトル・/blog/[slug] への内部リンクを初期HTMLに出してクローラーに露出する。
// 「もっと見る」ページネーションは BlogListClient（client）に委譲。
export const revalidate = 60;

export default async function BlogListPage() {
  const { items, total } = await getArticlesServer(12, 0);

  return (
    <main className="min-h-screen bg-[#F9F8F3] pt-24 sm:pt-28 pb-16">
      <div className="max-w-[375px] px-4 md:max-w-[768px] md:px-6 lg:max-w-[1200px] lg:px-8 mx-auto">
        <nav className="text-xs sm:text-sm text-gray-500 mb-6" aria-label="パンくず">
          <ol className="flex items-center gap-1">
            <li>
              <Link href="/" className="hover:text-orange-600">ふとるめし</Link>
            </li>
            <li>›</li>
            <li className="text-gray-900">コラム</li>
          </ol>
        </nav>

        <header className="text-center mb-10 sm:mb-14">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900">
            コラム
          </h1>
        </header>

        <BlogListClient initialItems={items} initialTotal={total} />
      </div>
    </main>
  );
}
