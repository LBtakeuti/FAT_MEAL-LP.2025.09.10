import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase';
import type { ArticleDetail, ArticleListItem } from '@/types/article';
import ArticleContent from '@/components/blog/ArticleContent';
import ShareButtons from '@/components/blog/ShareButtons';
import TableOfContents from '@/components/blog/TableOfContents';
import RelatedArticles from '@/components/blog/RelatedArticles';
import { extractToc } from '@/lib/blog-toc';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function fetchArticle(slug: string): Promise<ArticleDetail | null> {
  const supabase = createServerClient() as any;
  // F50-4: スケジュール公開対応。published_at が未来の記事は表示しない。
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from('articles')
    .select(
      'id, slug, title, excerpt, content, thumbnail_url, tags, author, ' +
        'meta_title, meta_description, og_image_url, published_at, view_count',
    )
    .eq('slug', slug)
    .eq('is_published', true)
    .lte('published_at', nowIso)
    .maybeSingle();

  if (error) {
    console.error('[blog/[slug]] fetch error', error);
    return null;
  }
  return (data as ArticleDetail | null) ?? null;
}

async function fetchLatestExcluding(slug: string, limit = 5): Promise<ArticleListItem[]> {
  const supabase = createServerClient() as any;
  // F50-4: スケジュール公開対応。published_at が未来の記事は表示しない。
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from('articles')
    .select('id, slug, title, excerpt, thumbnail_url, tags, author, published_at')
    .eq('is_published', true)
    .neq('slug', slug)
    .lte('published_at', nowIso)
    .order('published_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('[blog/[slug]] latest fetch error', error);
    return [];
  }
  return (data as ArticleListItem[]) ?? [];
}

// F50-3: 関連記事（タグベース）。tags が同じ記事を最新順で取得する。
// タグが無い場合や、該当が0件の場合は最新記事をフォールバックで返す。
async function fetchRelatedArticles(
  slug: string,
  tags: string[] | null | undefined,
  limit = 4,
): Promise<ArticleListItem[]> {
  const supabase = createServerClient() as any;
  // F50-4: スケジュール公開対応。
  const nowIso = new Date().toISOString();
  if (tags && tags.length > 0) {
    const { data, error } = await supabase
      .from('articles')
      .select('id, slug, title, excerpt, thumbnail_url, tags, author, published_at')
      .eq('is_published', true)
      .neq('slug', slug)
      .overlaps('tags', tags)
      .lte('published_at', nowIso)
      .order('published_at', { ascending: false })
      .limit(limit);
    if (error) {
      console.error('[blog/[slug]] related fetch error', error);
    } else if (Array.isArray(data) && data.length > 0) {
      return data as ArticleListItem[];
    }
  }
  // フォールバック: 最新記事
  return fetchLatestExcluding(slug, limit);
}

// F49: 環境変数の origin（OG / canonical / JSON-LD で共有）
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.futorumeshi.com';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await fetchArticle(slug);
  if (!article) {
    return { title: 'コラムが見つかりません | ふとるめし' };
  }
  const title = article.meta_title || `${article.title} | ふとるめし コラム`;
  const description = article.meta_description || article.excerpt || 'ふとるめし編集部がお届けするコラム';
  const ogImage = article.og_image_url || article.thumbnail_url || undefined;
  const canonicalUrl = `${SITE_URL}/blog/${slug}`;
  return {
    title,
    description,
    // F49: 重複コンテンツ防止のため canonical URL を明示
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      type: 'article',
      url: canonicalUrl,
      siteName: 'ふとるめし',
      locale: 'ja_JP',
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
      ...(article.published_at ? { publishedTime: article.published_at } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default async function BlogDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const article = await fetchArticle(slug);
  if (!article) notFound();

  const pickUp = await fetchLatestExcluding(article.slug, 5);
  // F50-3: 関連記事（タグベース、フォールバック最新記事）
  const related = await fetchRelatedArticles(article.slug, article.tags, 4);

  const supabase = createServerClient() as any;
  void supabase
    .from('articles')
    .update({ view_count: (article.view_count ?? 0) + 1 })
    .eq('id', article.id)
    .then(({ error }: { error: unknown }) => {
      if (error) console.error('[blog/[slug]] view_count update failed', error);
    });

  // F49: Article 構造化データ（JSON-LD）。リッチリザルト対応のため検索エンジンに記事の主要情報を機械可読で提供
  const canonicalUrl = `${SITE_URL}/blog/${article.slug}`;
  const articleImage = article.og_image_url || article.thumbnail_url || `${SITE_URL}/icon.png`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.meta_description || article.excerpt || '',
    image: articleImage,
    datePublished: article.published_at || undefined,
    dateModified: article.published_at || undefined,
    // author は articles.author（既定値「ふとるめし編集部」のため Organization で出す）
    author: {
      '@type': 'Organization',
      name: article.author || 'ふとるめし編集部',
    },
    publisher: {
      '@type': 'Organization',
      name: 'ふとるめし',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/icon.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
  };

  // F49-fix: JSON.stringify は < > & をエスケープしないため、
  // article.title 等に "</script><script>alert(1)</script>" が含まれていると
  // ブラウザがスクリプトブロックを早期終了して XSS が成立する。
  // < > & を Unicode エスケープして安全な JSON 文字列に変換する。
  const safeJsonLd = JSON.stringify(jsonLd)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');

  return (
    <main className="min-h-screen bg-[#F9F8F3] pt-24 sm:pt-28 pb-16">
      {/* F49: Article 構造化データ（JSON-LD）でリッチリザルト対応 */}
      <script
        type="application/ld+json"
        // F49-fix: < > & を Unicode エスケープ済み（safeJsonLd）。
        // </script> インジェクションを防止する。
        dangerouslySetInnerHTML={{ __html: safeJsonLd }}
      />
      {/* F63: コラム詳細の本文コンテナを横方向に拡大（読みやすさを保ちつつ横いっぱい寄りに）。
          モバイルは左右padを詰め、PC/大画面は max-width を拡大。 */}
      <div className="max-w-full px-3 md:max-w-[900px] md:px-6 lg:max-w-[1320px] lg:px-8 xl:max-w-[1480px] mx-auto">
        <nav className="text-xs sm:text-sm text-gray-500 mb-6" aria-label="パンくず">
          <ol className="flex items-center gap-1 flex-wrap">
            <li>
              <Link href="/" className="hover:text-orange-600">ふとるめし</Link>
            </li>
            <li>›</li>
            <li>
              <Link href="/blog" className="hover:text-orange-600">コラム</Link>
            </li>
            <li>›</li>
            <li className="text-gray-900 truncate max-w-[200px] sm:max-w-none">{article.title}</li>
          </ol>
        </nav>

        {/* F72: 上部にも「コラム一覧に戻る」導線を設置（下部の既存ボタンは残置）。
            orange-600 トーンで、矢印付きの戻りリンク。 */}
        <div className="mb-6">
          <Link
            href="/blog"
            className="inline-flex items-center text-sm font-medium text-orange-600 hover:underline"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            コラム一覧に戻る
          </Link>
        </div>

        {article.thumbnail_url && (
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md bg-gray-100 mb-8">
            <Image
              src={article.thumbnail_url}
              alt={article.title}
              fill
              sizes="(max-width: 1024px) 100vw, 1200px"
              className="object-cover"
              priority
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)] gap-8 lg:gap-10">
          <article className="bg-white rounded-md shadow-sm overflow-hidden min-w-0">
            <div className="px-5 py-8 sm:px-10 sm:py-12">
              <header className="mb-8">
                <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-500 mb-3">
                  <time>{formatDate(article.published_at)}</time>
                  <span>·</span>
                  <span>{article.author}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 leading-snug">
                  {article.title}
                </h1>
                {article.tags && article.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {article.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2.5 py-1 rounded-full bg-orange-50 text-orange-700"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </header>

              {/* F50-1: 記事上部のシェアボタン */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <ShareButtons url={canonicalUrl} title={article.title} label="この記事をシェア" />
              </div>

              {/* F50-2: もくじ（見出し3個以上の場合のみ表示） */}
              <TableOfContents items={extractToc(article.content)} />

              <ArticleContent content={article.content} />

              {/* F50-1: 記事下部のシェアボタン（読了後の共有導線） */}
              <div className="mt-10 pt-6 border-t border-gray-200">
                <ShareButtons url={canonicalUrl} title={article.title} label="記事をシェアする" />
              </div>
            </div>
          </article>

          {pickUp.length > 0 && (
            <aside className="lg:sticky lg:top-28 self-start">
              <div className="bg-white rounded-md shadow-sm p-5 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold text-orange-600 mb-5 border-b-2 border-orange-600 pb-2">
                  Pick Up
                </h2>
                <ul className="space-y-4">
                  {pickUp.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={`/blog/${item.slug}`}
                        className="flex gap-3 group"
                      >
                        <div className="relative w-20 h-20 shrink-0 overflow-hidden rounded-md bg-gray-100">
                          {item.thumbnail_url ? (
                            <Image
                              src={item.thumbnail_url}
                              alt={item.title}
                              fill
                              sizes="80px"
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : null}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-gray-900 line-clamp-2 group-hover:text-orange-600 transition-colors">
                            {item.title}
                          </h3>
                          <p className="mt-1 text-xs text-gray-500">{formatDate(item.published_at)}</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          )}
        </div>

        {/* F50-3: 関連記事（タグベース、Pick Up と並列） */}
        <RelatedArticles items={related} />

        <div className="mt-10 text-center">
          <Link href="/blog" className="text-sm text-orange-600 hover:underline">
            ← コラム一覧に戻る
          </Link>
        </div>
      </div>
    </main>
  );
}
