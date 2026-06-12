'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Splide, SplideSlide } from '@splidejs/react-splide';
import { Reveal } from '@/components/ui/Reveal';
import type { Options } from '@splidejs/splide';
import '@splidejs/react-splide/css';
import type { ArticleListItem } from '@/types/article';

const DISPLAY_LIMIT = 10;

function getBlogCarouselOptions(count: number): Options {
  return {
    type: 'slide',
    perPage: 4,
    perMove: 1,
    gap: '1.25rem',
    pagination: count > 4,
    arrows: count > 4,
    breakpoints: {
      1280: {
        perPage: 4,
        arrows: count > 4,
        pagination: count > 4,
      },
      1024: {
        perPage: 3,
        arrows: count > 3,
        pagination: count > 3,
      },
      768: {
        perPage: 2,
        arrows: count > 2,
        pagination: count > 2,
      },
      640: {
        perPage: 1,
        gap: '0.75rem',
        padding: { left: '1.5rem', right: '1.5rem' },
        arrows: false,
        pagination: count > 1,
      },
    },
  };
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

interface BlogSectionProps {
  /** SEO-S2: サーバー取得済みの最新コラム（DISPLAY_LIMIT+1件まで）。あればSSRで即描画。 */
  initialArticles?: ArticleListItem[];
}

const BlogSection: React.FC<BlogSectionProps> = ({ initialArticles }) => {
  const seeded = initialArticles && initialArticles.length > 0;
  const [articles, setArticles] = useState<ArticleListItem[]>(
    seeded ? initialArticles.slice(0, DISPLAY_LIMIT) : [],
  );
  const [hasMore, setHasMore] = useState(seeded ? initialArticles.length > DISPLAY_LIMIT : false);
  const [loading, setLoading] = useState(!seeded);

  // SEO-S2: 初期データが無い場合のみクライアントfetchでフォールバック取得。
  useEffect(() => {
    if (seeded) return;
    const fetchLatest = async () => {
      try {
        const res = await fetch(`/api/blog/list?limit=${DISPLAY_LIMIT + 1}`);
        if (res.ok) {
          const data = await res.json();
          const items: ArticleListItem[] = data.items ?? [];
          setHasMore(items.length > DISPLAY_LIMIT);
          setArticles(items.slice(0, DISPLAY_LIMIT));
        }
      } catch (error) {
        console.error('コラムの取得に失敗しました:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLatest();
  }, [seeded]);

  if (loading) {
    return (
      <section id="blog" className="relative overflow-hidden bg-white pt-6 sm:pt-12 pb-12">
        <div className="max-w-[375px] px-4 md:max-w-[768px] md:px-6 lg:max-w-[1200px] lg:px-8 mx-auto">
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
    <section id="blog" className="relative overflow-hidden bg-white pt-6 sm:pt-12 pb-12">
      <div className="max-w-[375px] px-4 md:max-w-[768px] md:px-6 lg:max-w-[1200px] lg:px-8 mx-auto">
        {/* F73: 見出しフェードイン */}
        <Reveal className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-gray-900">
            最新コラム
          </h2>
        </Reveal>

        <Splide
          options={getBlogCarouselOptions(articles.length)}
          aria-label="最新コラム"
          className="blog-splide pb-8"
        >
          {articles.map((article) => (
            <SplideSlide key={article.id}>
              <Link
                href={`/blog/${article.slug}`}
                className="block group h-full"
              >
                <div className="relative aspect-video w-full overflow-hidden rounded-md bg-gray-100">
                  {article.thumbnail_url ? (
                    <Image
                      src={article.thumbnail_url}
                      alt={article.title}
                      fill
                      sizes="(max-width: 640px) 80vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : null}
                </div>
                <div className="mt-3">
                  <p className="text-xs text-gray-500">{formatDate(article.published_at)}</p>
                  <h3 className="mt-1 text-base font-bold text-gray-900 line-clamp-2">
                    {article.title}
                  </h3>
                  {article.excerpt && (
                    <p className="mt-1 text-sm text-gray-700 line-clamp-2">{article.excerpt}</p>
                  )}
                </div>
              </Link>
            </SplideSlide>
          ))}
        </Splide>

        {hasMore && (
          <div className="text-center mt-6">
            <Link
              href="/blog"
              className="inline-block bg-orange-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-orange-700 transition-colors"
            >
              もっと見る
            </Link>
          </div>
        )}
      </div>

      <style jsx global>{`
        .blog-splide .splide__arrow {
          background: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          width: 2.5rem;
          height: 2.5rem;
          opacity: 1;
          top: 50%;
          transform: translateY(-50%);
        }
        .blog-splide .splide__arrow--prev { left: -0.5rem; }
        .blog-splide .splide__arrow--next { right: -0.5rem; }
        .blog-splide .splide__arrow svg {
          fill: #ea580c;
          width: 1rem;
          height: 1rem;
        }
        .blog-splide .splide__arrow:hover {
          background: #fff7ed;
          transform: translateY(-50%);
        }
        .blog-splide .splide__pagination__page {
          background: #d1d5db;
          width: 8px;
          height: 8px;
        }
        .blog-splide .splide__pagination__page.is-active {
          background: #ea580c;
          transform: scale(1);
        }
        .blog-splide .splide__pagination {
          bottom: 0;
        }
        .blog-splide .splide__slide {
          height: auto;
        }
        .blog-splide .splide__slide > * {
          height: 100%;
        }
      `}</style>
    </section>
  );
};

export default BlogSection;
