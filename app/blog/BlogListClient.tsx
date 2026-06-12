'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { ArticleListItem } from '@/types/article';

const PAGE_SIZE = 12;

function formatDateDot(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

interface BlogListClientProps {
  /** SEO-S2: サーバーで取得した初回ページ（SSRで即描画＝記事リンク/タイトルが初期HTMLに出る）。 */
  initialItems: ArticleListItem[];
  initialTotal: number;
}

/**
 * SEO-S2: コラム一覧の表示＋「もっと見る」ページネーション。
 * 初回ページはサーバーから props で受け取りSSR描画（クローラーに記事リンク露出）。
 * 追加読み込みのみクライアントfetch。
 */
export default function BlogListClient({ initialItems, initialTotal }: BlogListClientProps) {
  const [articles, setArticles] = useState<ArticleListItem[]>(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [offset, setOffset] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const handleLoadMore = async () => {
    const next = offset + PAGE_SIZE;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/blog/list?limit=${PAGE_SIZE}&offset=${next}`);
      if (res.ok) {
        const data = await res.json();
        setTotal(data.total ?? total);
        setArticles((prev) => [...prev, ...(data.items ?? [])]);
        setOffset(next);
      }
    } catch (e) {
      console.error('Failed to load more articles', e);
    } finally {
      setLoadingMore(false);
    }
  };

  const hasMore = articles.length < total;

  if (articles.length === 0) {
    return (
      <div className="text-center text-gray-500 py-16">
        現在公開中のコラムはありません
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10 mb-10">
        {articles.map((article) => {
          const category = article.tags && article.tags.length > 0 ? article.tags[0] : null;
          return (
            <Link key={article.id} href={`/blog/${article.slug}`} className="group block">
              <article className="relative flex gap-4 sm:gap-5 items-start">
                <div className="relative shrink-0 w-28 sm:w-36 md:w-40 lg:w-44">
                  <p className="absolute -left-1 -top-3 sm:-top-4 z-10 text-2xl sm:text-3xl md:text-4xl font-extrabold text-orange-600 leading-none tracking-tight drop-shadow-sm">
                    {formatDateDot(article.published_at)}
                  </p>
                  <div className="relative aspect-square w-full overflow-hidden rounded-md bg-gray-100 mt-6 sm:mt-8">
                    {article.thumbnail_url ? (
                      <Image
                        src={article.thumbnail_url}
                        alt={article.title}
                        fill
                        sizes="(max-width: 768px) 30vw, 200px"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : null}
                    <div className="absolute inset-x-0 bottom-0 bg-black/70 text-white px-2 py-1.5">
                      <p className="text-[10px] sm:text-xs font-semibold line-clamp-2 leading-tight">
                        {article.title}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 min-w-0 pt-1">
                  {category && (
                    <span className="inline-block text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 mb-2">
                      {category}
                    </span>
                  )}
                  <h2 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 line-clamp-3 group-hover:text-orange-600 transition-colors">
                    {article.title}
                  </h2>
                  {article.excerpt && (
                    <p className="mt-2 text-xs sm:text-sm text-gray-600 line-clamp-2">
                      {article.excerpt}
                    </p>
                  )}
                </div>
              </article>
            </Link>
          );
        })}
      </div>

      {hasMore && (
        <div className="text-center">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="inline-block bg-orange-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50"
          >
            {loadingMore ? '読み込み中...' : 'もっと見る'}
          </button>
        </div>
      )}
    </>
  );
}
