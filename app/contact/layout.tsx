/**
 * SEO-S3: お問い合わせ用 layout（page.tsx が 'use client' のため metadata を layout で提供）。
 */
import type { Metadata } from 'next';
import { SITE_URL, DEFAULT_OG_IMAGE } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'お問い合わせ | ふとるめし',
  description: 'ふとるめしへのお問い合わせはこちらから。商品・定期購入・配送に関するご質問を承ります。',
  alternates: { canonical: `${SITE_URL}/contact` },
  openGraph: {
    type: 'website',
    title: 'お問い合わせ | ふとるめし',
    description: 'ふとるめしへのお問い合わせはこちらから。',
    url: `${SITE_URL}/contact`,
    siteName: 'ふとるめし',
    locale: 'ja_JP',
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'お問い合わせ | ふとるめし',
    description: 'ふとるめしへのお問い合わせはこちらから。',
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
