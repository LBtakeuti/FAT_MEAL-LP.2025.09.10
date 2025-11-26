'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { NewsItem, newsItems } from '@/data/newsData';
import MobileHeader from '@/components/MobileHeader';
import Header from '@/components/Header';

interface NewsDetailClientProps {
  newsItem: NewsItem;
}

const NewsDetailClient: React.FC<NewsDetailClientProps> = ({ newsItem }) => {
  // 現在の記事を除いた最新3件のニュースを取得
  const relatedNews = newsItems
    .filter(item => item.id !== newsItem.id)
    .slice(0, 3);
  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Header */}
      <MobileHeader />
      
      {/* Desktop Header */}
      <Header />

      <main className="pt-14 sm:pt-20 pb-20">
        <div className="max-w-[375px] px-4 md:max-w-[768px] md:px-6 lg:max-w-[800px] lg:px-8 mx-auto">
          
          {/* Breadcrumb Navigation */}
          <div className="mb-6">
            <Link 
              href="/news" 
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm">お知らせ一覧</span>
            </Link>
          </div>

          {/* Article Header */}
          <div className="mb-8">
            <p className="text-sm text-gray-500 mb-3">{newsItem.date}</p>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {newsItem.title}
            </h1>
            {newsItem.excerpt && (
              <p className="text-gray-600 text-lg">
                {newsItem.excerpt}
              </p>
            )}
          </div>

          {/* Article Image if exists */}
          {newsItem.image && (
            <div className="relative w-full h-[200px] sm:h-[300px] md:h-[400px] mb-8 rounded-lg overflow-hidden">
              <Image
                src={newsItem.image}
                alt={newsItem.title}
                fill
                className="object-cover"
              />
            </div>
          )}

          {/* Article Content */}
          <div className="prose prose-gray max-w-none">
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
              {newsItem.content}
            </div>
          </div>

          {/* Related News Section */}
          {relatedNews.length > 0 && (
            <div className="mt-16 pt-8 border-t border-gray-200">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">おすすめニュース</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {relatedNews.map((item) => (
                  <Link
                    key={item.id}
                    href={`/news/${item.id}`}
                    className="group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {item.image && (
                      <div className="relative w-full h-40 overflow-hidden">
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <p className="text-xs text-gray-500 mb-2">{item.date}</p>
                      <h3 className="text-sm font-bold text-gray-900 line-clamp-2 group-hover:text-orange-600 transition-colors">
                        {item.title}
                      </h3>
                      {item.excerpt && (
                        <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                          {item.excerpt}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Footer - Desktop Only */}
          <div className="hidden sm:block mt-12 pt-8 border-t border-gray-200">
            <div className="flex justify-between gap-4">
              <Link
                href="/news"
                className="inline-flex items-center justify-center bg-white border-2 border-orange-600 text-orange-600 px-6 py-3 rounded-full font-semibold hover:bg-orange-50 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                お知らせ一覧
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center bg-orange-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-orange-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                ホームへ戻る
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NewsDetailClient;