'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface NewsItem {
  id: string;
  title: string;
  date: string;
  excerpt: string | null;
  content: string;
  image: string | null;
}

const NewsSection: React.FC = () => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch('/api/news');
        if (res.ok) {
          const data = await res.json();
          setNewsItems(data);
        }
      } catch (error) {
        console.error('ニュースの取得に失敗しました:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  // 日付をフォーマット（YYYY-MM-DD → YYYY.MM.DD）
  const formatDate = (dateStr: string) => {
    return dateStr.replace(/-/g, '.');
  };

  if (loading) {
    return (
      <section className="relative overflow-hidden bg-[#fff7ed] pt-6 sm:pt-12 pb-20 sm:pb-12 flex flex-col">
        <div className="relative max-w-[375px] px-4 md:max-w-[768px] md:px-6 lg:max-w-[1200px] lg:px-8 mx-auto flex-1 flex flex-col">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-gray-900">
              お知らせ
            </h2>
          </div>
          <div className="text-center text-gray-500">読み込み中...</div>
        </div>
      </section>
    );
  }

  if (newsItems.length === 0) {
    return (
      <section className="relative overflow-hidden bg-[#fff7ed] pt-6 sm:pt-12 pb-20 sm:pb-12 flex flex-col">
        <div className="relative max-w-[375px] px-4 md:max-w-[768px] md:px-6 lg:max-w-[1200px] lg:px-8 mx-auto flex-1 flex flex-col">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-gray-900">
              お知らせ
            </h2>
          </div>
          <div className="text-center text-gray-500">現在お知らせはありません</div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden bg-[#fff7ed] pt-6 sm:pt-12 pb-20 sm:pb-12 flex flex-col">
      {/* 上部の波形 */}
      <div className="absolute top-0 left-0 w-full overflow-hidden leading-none" style={{ transform: 'translateY(-1px)' }}>
        <svg
          className="relative block w-full h-16 sm:h-24"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
            className="fill-orange-50"
          ></path>
        </svg>
      </div>

      <div className="relative max-w-[375px] px-4 md:max-w-[768px] md:px-6 lg:max-w-[1200px] lg:px-8 mx-auto flex-1 flex flex-col">
        {/* Title */}
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-gray-900">
            お知らせ
          </h2>
        </div>

        {/* Mobile: Vertical list */}
        <div className="sm:hidden flex-1 flex flex-col">
          <div className="space-y-3 flex-1 overflow-y-auto">
            {newsItems.slice(0, 4).map((item) => (
              <Link
                key={item.id}
                href={`/news/${item.id}`}
                className="block bg-[#fffaf3] p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs text-gray-500">{formatDate(item.date)}</p>
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-gray-900 line-clamp-2">
                  {item.title}
                </h3>
              </Link>
            ))}
          </div>

          {/* View all button */}
          <div className="mt-6 mb-0">
            <Link
              href="/news"
              className="block w-full bg-orange-600 text-white py-3 rounded-full text-center font-semibold text-base hover:bg-orange-700 transition-colors"
            >
              お知らせを見る
            </Link>
          </div>
        </div>

        {/* Desktop: Grid layout */}
        <div className="hidden sm:block">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {newsItems.slice(0, 6).map((item) => (
              <Link
                key={item.id}
                href={`/news/${item.id}`}
                className="block bg-[#fffaf3] p-6 rounded-xl shadow-sm hover:shadow-lg transition-shadow group"
              >
                <div className="flex justify-between items-start mb-3">
                  <p className="text-sm text-gray-500">{formatDate(item.date)}</p>
                  <svg className="w-5 h-5 text-orange-600 group-hover:translate-x-1 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {item.excerpt || ''}
                </p>
              </Link>
            ))}
          </div>

          {/* View all button */}
          <div className="text-center">
            <Link
              href="/news"
              className="inline-block bg-orange-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-orange-700 transition-colors"
            >
              お知らせを見る
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsSection;
