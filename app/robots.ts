/**
 * F49: robots.txt 生成（Next.js App Router 標準）
 * - 公開ページは全て許可
 * - 管理画面・マイページ・API は除外
 * - sitemap.xml の場所を明示
 */
import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.futorumeshi.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/mypage', '/api'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
