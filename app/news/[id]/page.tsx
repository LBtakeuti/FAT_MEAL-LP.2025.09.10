'use client';

import { useEffect, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import NewsDetailClient from './NewsDetailClient';

interface NewsItem {
  id: string;
  title: string;
  date: string;
  excerpt: string | null;
  content: string;
  image: string | null;
}

export default function NewsDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [newsItem, setNewsItem] = useState<NewsItem | null>(null);
  const [allNews, setAllNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // ニュース詳細と全ニュースを取得
        const [detailRes, allNewsRes] = await Promise.all([
          fetch(`/api/news/${id}`),
          fetch('/api/news')
        ]);

        if (!detailRes.ok) {
          setError(true);
          return;
        }

        const detail = await detailRes.json();
        const all = allNewsRes.ok ? await allNewsRes.json() : [];

        setNewsItem(detail);
        setAllNews(all);
      } catch (err) {
        console.error('ニュースの取得に失敗しました:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  if (error || !newsItem) {
    notFound();
  }

  return <NewsDetailClient newsItem={newsItem} allNews={allNews} />;
}
