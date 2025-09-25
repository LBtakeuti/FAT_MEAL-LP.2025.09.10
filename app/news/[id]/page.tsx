import { notFound } from 'next/navigation';
import NewsDetailClient from './NewsDetailClient';
import { newsItems } from '@/data/newsData';

export async function generateStaticParams() {
  return newsItems.map((item) => ({
    id: item.id,
  }));
}

export default async function NewsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const newsItem = newsItems.find(item => item.id === id);
  
  if (!newsItem) {
    notFound();
  }

  return <NewsDetailClient newsItem={newsItem} />;
}