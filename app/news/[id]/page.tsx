import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getNewsByIdServer, getNewsServer } from '@/lib/supabase';
import { SITE_URL, DEFAULT_OG_IMAGE, toSafeJsonLd } from '@/lib/seo';
import NewsDetailClient from './NewsDetailClient';

// SEO-S3: お知らせ個別を server 化。個別 title/description/canonical を generateMetadata で出し、
// パンくず構造化データ（BreadcrumbList）を付与。本文も SSR（クローラー露出）。
// 表示・挙動は不変（NewsDetailClient はそのまま、戻る導線等も維持）。
export const revalidate = 60;

interface PageProps {
  params: Promise<{ id: string }>;
}

// excerpt or content から description を生成（HTMLタグ除去・160字程度）。
function buildDescription(item: { excerpt: string | null; content: string }): string {
  const base = (item.excerpt && item.excerpt.trim()) || item.content || '';
  const text = base.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  return text.length > 160 ? `${text.slice(0, 157)}…` : text;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const item = await getNewsByIdServer(id);
  if (!item) {
    return { title: 'お知らせ | ふとるめし' };
  }
  const title = `${item.title} | お知らせ | ふとるめし`;
  const description = buildDescription(item);
  const canonical = `${SITE_URL}/news/${item.id}`;
  const ogImage = item.image || DEFAULT_OG_IMAGE;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      title,
      description,
      url: canonical,
      siteName: 'ふとるめし',
      locale: 'ja_JP',
      images: [ogImage],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function NewsDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [item, allNews] = await Promise.all([getNewsByIdServer(id), getNewsServer()]);
  if (!item) notFound();

  // SEO-S3: パンくず構造化データ（ふとるめし › お知らせ › タイトル）。
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ふとるめし', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'お知らせ', item: `${SITE_URL}/news` },
      { '@type': 'ListItem', position: 3, name: item.title, item: `${SITE_URL}/news/${item.id}` },
    ],
  };
  const safeBreadcrumbJsonLd = toSafeJsonLd(breadcrumbJsonLd);

  return (
    <>
      {/* SEO-S3: パンくず構造化データ（< > & エスケープ済み） */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeBreadcrumbJsonLd }}
      />
      <NewsDetailClient newsItem={item} allNews={allNews} />
    </>
  );
}
