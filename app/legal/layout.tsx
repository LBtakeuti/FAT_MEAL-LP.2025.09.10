/**
 * SEO-S3: 特定商取引法に基づく表記用 layout（page.tsx が 'use client' のため metadata を layout で提供）。
 */
import type { Metadata } from 'next';
import { SITE_URL, DEFAULT_OG_IMAGE } from '@/lib/seo';

export const metadata: Metadata = {
  title: '特定商取引法に基づく表記 | ふとるめし',
  description: 'ふとるめしの特定商取引法に基づく表記です。販売事業者・販売価格・お支払い方法・返品等について記載しています。',
  alternates: { canonical: `${SITE_URL}/legal` },
  openGraph: {
    type: 'website',
    title: '特定商取引法に基づく表記 | ふとるめし',
    description: 'ふとるめしの特定商取引法に基づく表記です。',
    url: `${SITE_URL}/legal`,
    siteName: 'ふとるめし',
    locale: 'ja_JP',
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: '特定商取引法に基づく表記 | ふとるめし',
    description: 'ふとるめしの特定商取引法に基づく表記です。',
  },
};

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
