import Link from 'next/link';
import Image from 'next/image';
import type { ArticleListItem } from '@/types/article';

/**
 * F50-3: 関連記事カードグリッド（記事下部に配置）
 * - タグベース or 最新記事フォールバックで取得した記事を表示
 * - 0件の場合は何も表示しない
 */
export default function RelatedArticles({ items }: { items: ArticleListItem[] }) {
  if (!items || items.length === 0) return null;

  return (
    <section aria-labelledby="related-heading" className="mt-12">
      <h2 id="related-heading" className="text-xl sm:text-2xl font-bold text-gray-900 mb-5">
        こちらの記事もおすすめ
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/blog/${item.slug}`}
            className="group flex flex-col bg-white rounded-md shadow-sm overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-gray-100">
              {item.thumbnail_url ? (
                <Image
                  src={item.thumbnail_url}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs">
                  No Image
                </div>
              )}
            </div>
            <div className="flex-1 p-3 sm:p-4">
              <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-snug group-hover:text-orange-600 transition-colors line-clamp-2">
                {item.title}
              </h3>
              {item.excerpt && (
                <p className="mt-2 text-xs text-gray-500 leading-snug line-clamp-2">
                  {item.excerpt}
                </p>
              )}
              {item.tags && item.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {item.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-700"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
