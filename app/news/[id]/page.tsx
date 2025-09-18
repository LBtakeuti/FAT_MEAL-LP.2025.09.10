import { notFound } from 'next/navigation';
import NewsDetailClient from './NewsDetailClient';
import { newsItems } from '@/data/newsData';

export async function generateStaticParams() {
  return newsItems.map((item) => ({
    id: item.id,
  }));
}

export default function NewsDetailPage({ params }: { params: { id: string } }) {
  const newsItem = newsItems.find(item => item.id === params.id);
  
  if (!newsItem) {
    notFound();
  }

  return <NewsDetailClient newsItem={newsItem} />;
}