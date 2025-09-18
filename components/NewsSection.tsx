'use client';

import React from 'react';
import Link from 'next/link';
import { newsItems } from '@/data/newsData';

const NewsSection: React.FC = () => {
  return (
    <section className="bg-gray-50 py-12 sm:py-20">
      <div className="max-w-[375px] px-4 md:max-w-[768px] md:px-6 lg:max-w-[1200px] lg:px-8 mx-auto">
        {/* Title */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-gray-900">
            お知らせ
          </h2>
        </div>

        {/* Mobile: Vertical list */}
        <div className="sm:hidden space-y-4">
          {newsItems.slice(0, 2).map((item) => (
            <Link
              key={item.id}
              href={`/news/${item.id}`}
              className="block bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs text-gray-500">{item.date}</p>
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-gray-900 line-clamp-2">
                {item.title}
              </h3>
            </Link>
          ))}

          {/* View all button */}
          <Link
            href="/news"
            className="block w-full bg-orange-600 text-white py-3 rounded-full text-center font-semibold hover:bg-orange-700 transition-colors"
          >
            お知らせを見る
          </Link>
        </div>

        {/* Desktop: Grid layout */}
        <div className="hidden sm:block">
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {newsItems.slice(0, 4).map((item) => (
              <Link
                key={item.id}
                href={`/news/${item.id}`}
                className="block bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-shadow group"
              >
                <div className="flex justify-between items-start mb-3">
                  <p className="text-sm text-gray-500">{item.date}</p>
                  <svg className="w-5 h-5 text-orange-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {item.excerpt}
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