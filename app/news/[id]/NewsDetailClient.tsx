'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { NewsItem } from '@/data/newsData';
import MobileHeader from '@/components/MobileHeader';

interface NewsDetailClientProps {
  newsItem: NewsItem;
}

const NewsDetailClient: React.FC<NewsDetailClientProps> = ({ newsItem }) => {
  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Header */}
      <MobileHeader />

      <main className="pt-14 sm:pt-20 pb-20">
        {/* Back Button - Fixed position on mobile */}
        <div className="fixed top-20 left-4 z-10 sm:hidden">
          <Link 
            href="/news" 
            className="block hover:opacity-80 transition-opacity"
          >
            <Image
              src="/Frame 7.svg"
              alt="戻る"
              width={92}
              height={40}
            />
          </Link>
        </div>

        <div className="max-w-[375px] px-4 md:max-w-[768px] md:px-6 lg:max-w-[800px] lg:px-8 mx-auto pt-16 sm:pt-0">

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
                <Image
                  src="/Frame 7.svg"
                  alt="ホーム"
                  width={24}
                  height={24}
                  className="mr-2"
                />
                ホームへ戻る
              </Link>
            </div>
          </div>

          {/* Footer Links */}
          <div className="mt-12 bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">ストア基本情報</h3>
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">定期コース一覧</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>すべてのメニュー</li>
                  <li>ベーシックコース</li>
                  <li>ローカーボコース</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">ストア基本情報</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>運営会社</li>
                  <li>個人情報保護方針</li>
                  <li>特商法に関する記載</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NewsDetailClient;