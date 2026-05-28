'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import type { ArticleListItem } from '@/types/article';

const PAGE_SIZE = 12;

export default function BlogListPage() {
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchArticles = useCallback(async (currentOffset: number, append: boolean) => {
    if (append) setLoadingMore(true);
    try {
      const res = await fetch(`/api/blog/list?limit=${PAGE_SIZE}&offset=${currentOffset}`);
      if (res.ok) {
        const data = await res.json();
        setTotal(data.total ?? 0);
        setArticles((prev) => (append ? [...prev, ...(data.items ?? [])] : data.items ?? []));
      }
    } catch (e) {
      console.error('Failed to load articles', e);
    } finally {
      if (append) setLoadingMore(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles(0, false);
  }, [fetchArticles]);

  const handleLoadMore = () => {
    const next = offset + PAGE_SIZE;
    setOffset(next);
    fetchArticles(next, true);
  };

  const formatDate = (iso: string | null): string => {
    if (!iso) return '';
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  const hasMore = articles.length < total;

  return (
    <main className="min-h-screen bg-[#F9F8F3] pt-24 sm:pt-28 pb-16">
      <div className="max-w-[375px] px-4 md:max-w-[768px] md:px-6 lg:max-w-[1200px] lg:px-8 mx-auto">
        {/* パンくず */}
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
          <p className="mt-3 text-sm sm:text-base text-gray-600">
            ふとるためのヒント・栄養・部活サポートまで、編集部がお届けします
          </p>
        </header>

        {loading ? (
          <div className="text-center text-gray-500 py-16">読み込み中...</div>
        ) : articles.length === 0 ? (
          <div className="text-center text-gray-500 py-16">
            現在公開中のコラムはありません
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-10">
              {articles.map((article) => (
                <Link
                  key={article.id}
                  href={`/blog/${article.slug}`}
                  className="block bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow group overflow-hidden"
                >
                  {article.thumbnail_url && (
                    <div className="aspect-[16/9] w-full overflow-hidden bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={article.thumbnail_url}
                        alt={article.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-500">{formatDate(article.published_at)}</p>
                      <svg className="w-5 h-5 text-orange-600 group-hover:translate-x-1 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <h2 className="text-base font-bold text-gray-900 mb-2 line-clamp-2">
                      {article.title}
                    </h2>
                    {article.excerpt && (
                      <p className="text-sm text-gray-600 line-clamp-3">{article.excerpt}</p>
                    )}
                    {article.tags && article.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {article.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-700"
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
        )}
      </div>
    </main>
  );
}
