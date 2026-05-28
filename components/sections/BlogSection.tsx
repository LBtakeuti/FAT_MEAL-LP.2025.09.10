'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import type { ArticleListItem } from '@/types/article';

/**
 * F14-1: トップページに最新コラム3件を表示するセクション。
 * 既存の NewsSection と同じカードスタイルで揃える。
 */
const BlogSection: React.FC = () => {
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await fetch('/api/blog/list?limit=3');
        if (res.ok) {
          const data = await res.json();
          setArticles(data.items ?? []);
        }
      } catch (error) {
        console.error('コラムの取得に失敗しました:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLatest();
  }, []);

  const formatDate = (iso: string | null): string => {
    if (!iso) return '';
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}.${m}.${day}`;
  };

  if (loading) {
    return (
      <section id="blog" className="relative overflow-hidden bg-white pt-6 sm:pt-12 pb-12 flex flex-col">
        <div className="max-w-[375px] px-4 md:max-w-[768px] md:px-6 lg:max-w-[1200px] lg:px-8 mx-auto flex-1 flex flex-col">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-gray-900">
              最新コラム
            </h2>
          </div>
          <div className="text-center text-gray-500">読み込み中...</div>
        </div>
      </section>
    );
  }

  if (articles.length === 0) {
    return null;
  }

  return (
    <section id="blog" className="relative overflow-hidden bg-white pt-6 sm:pt-12 pb-12 flex flex-col">
      <div className="max-w-[375px] px-4 md:max-w-[768px] md:px-6 lg:max-w-[1200px] lg:px-8 mx-auto flex-1 flex flex-col">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-gray-900">
            最新コラム
          </h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            ふとるためのヒントを編集部がお届け
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/blog/${article.slug}`}
              className="block bg-[#fffaf3] rounded-xl shadow-sm hover:shadow-lg transition-shadow group overflow-hidden"
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
                <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2">
                  {article.title}
                </h3>
                {article.excerpt && (
                  <p className="text-sm text-gray-600 line-clamp-2">{article.excerpt}</p>
                )}
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/blog"
            className="inline-block bg-orange-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-orange-700 transition-colors"
          >
            すべてのコラムを見る
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BlogSection;
