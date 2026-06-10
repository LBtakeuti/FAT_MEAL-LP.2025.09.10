/**
 * F49: サイトマップ生成（Next.js App Router 標準）
 * - 静的URL: ランディング・各案内ページ
 * - 動的URL: 公開済み記事（articles.is_published=true）
 *
 * 環境変数 NEXT_PUBLIC_SITE_URL を origin として使用。
 */
import type { MetadataRoute } from 'next';
import { createServerClient } from '@/lib/supabase';

type ChangeFrequency = 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.futorumeshi.com';

const STATIC_ENTRIES: Array<{ path: string; changeFrequency: ChangeFrequency; priority: number }> = [
  { path: '/', changeFrequency: 'weekly', priority: 1.0 },
  { path: '/blog', changeFrequency: 'daily', priority: 0.8 },
  { path: '/purchase', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/menu-list', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/news', changeFrequency: 'weekly', priority: 0.5 },
  { path: '/contact', changeFrequency: 'yearly', priority: 0.4 },
  { path: '/login', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/legal', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticUrls: MetadataRoute.Sitemap = STATIC_ENTRIES.map((entry) => ({
    url: `${SITE_URL}${entry.path}`,
    lastModified: now,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));

  // 動的URL: 公開済み記事
  let articleUrls: MetadataRoute.Sitemap = [];
  try {
    const supabase = createServerClient() as any;
    const { data, error } = await supabase
      .from('articles')
      .select('slug, updated_at, published_at')
      .eq('is_published', true)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[sitemap] articles fetch error:', error);
    } else if (Array.isArray(data)) {
      articleUrls = data
        .filter((a: any) => typeof a?.slug === 'string' && a.slug)
        .map((a: any) => ({
          url: `${SITE_URL}/blog/${a.slug}`,
          lastModified: a.updated_at ? new Date(a.updated_at) : a.published_at ? new Date(a.published_at) : now,
          changeFrequency: 'monthly' as ChangeFrequency,
          priority: 0.6,
        }));
    }
  } catch (e) {
    // Supabase が利用できなくても静的URLだけは返す（ビルド時/ランタイム共に堅牢）
    console.error('[sitemap] unexpected error:', e);
  }

  return [...staticUrls, ...articleUrls];
}
