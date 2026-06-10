/**
 * F49: コラム一覧用 layout（page.tsx が 'use client' のため metadata を layout で提供）
 */
import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.futorumeshi.com';

export const metadata: Metadata = {
  title: 'コラム | ふとるめし',
  description:
    'ふとりたい人のための食事・栄養・体作りに関するコラム記事一覧。痩せ型・部活生・成長期のお子さま向けの増量サポート情報を発信中。',
  alternates: {
    canonical: `${SITE_URL}/blog`,
  },
  openGraph: {
    type: 'website',
    title: 'コラム | ふとるめし',
    description:
      'ふとりたい人のための食事・栄養・体作りに関するコラム記事一覧。痩せ型・部活生・成長期のお子さま向けの増量サポート情報を発信中。',
    url: `${SITE_URL}/blog`,
    siteName: 'ふとるめし',
    locale: 'ja_JP',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'コラム | ふとるめし',
    description: 'ふとりたい人のための食事・栄養・体作りに関するコラム記事一覧',
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
