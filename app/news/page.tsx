'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { newsItems } from '@/data/newsData';
import MobileHeader from '@/components/MobileHeader';

export default function NewsListPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Header */}
      <MobileHeader />

      <main className="pt-14 sm:pt-20 pb-20">
        <div className="max-w-[375px] px-4 md:max-w-[768px] md:px-6 lg:max-w-[1200px] lg:px-8 mx-auto">
          
          {/* Back Button - Part of the page flow */}
          <div className="sm:hidden mb-4 mt-2">
            <Link 
              href="/" 
              className="inline-flex items-center text-orange-600 font-medium"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>お知らせ一覧</span>
            </Link>
          </div>

          {/* Title */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-gray-900">
              お知らせ
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2">NEWS</p>
          </div>

          {/* Mobile: Vertical list */}
          <div className="sm:hidden space-y-4">
            {newsItems.map((item) => (
              <Link
                key={item.id}
                href={`/news/${item.id}`}
                className="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
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
          </div>

          {/* Desktop: List layout */}
          <div className="hidden sm:block">
            <div className="space-y-6">
              {newsItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/news/${item.id}`}
                  className="block bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <p className="text-sm text-gray-500">{item.date}</p>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-gray-600">
                        {item.excerpt}
                      </p>
                    </div>
                    <svg className="w-6 h-6 text-orange-600 group-hover:translate-x-1 transition-transform ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Desktop Back Button */}
          <div className="hidden sm:block mt-12 text-center">
            <Link 
              href="/"
              className="inline-block bg-white border-2 border-orange-600 text-orange-600 px-8 py-3 rounded-full font-semibold hover:bg-orange-50 transition-colors"
            >
              ホームに戻る
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}