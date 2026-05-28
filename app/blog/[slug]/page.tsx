import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase';
import type { ArticleDetail, ArticleListItem } from '@/types/article';
import ArticleContent from '@/components/blog/ArticleContent';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function fetchArticle(slug: string): Promise<ArticleDetail | null> {
  const supabase = createServerClient() as any;
  const { data, error } = await supabase
    .from('articles')
    .select(
      'id, slug, title, excerpt, content, thumbnail_url, tags, author, ' +
        'meta_title, meta_description, og_image_url, published_at, view_count',
    )
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle();

  if (error) {
    console.error('[blog/[slug]] fetch error', error);
    return null;
  }
  return (data as ArticleDetail | null) ?? null;
}

async function fetchLatestExcluding(slug: string, limit = 5): Promise<ArticleListItem[]> {
  const supabase = createServerClient() as any;
  const { data, error } = await supabase
    .from('articles')
    .select('id, slug, title, excerpt, thumbnail_url, tags, author, published_at')
    .eq('is_published', true)
    .neq('slug', slug)
    .order('published_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('[blog/[slug]] latest fetch error', error);
    return [];
  }
  return (data as ArticleListItem[]) ?? [];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await fetchArticle(slug);
  if (!article) {
    return { title: 'コラムが見つかりません | ふとるめし' };
  }
  const title = article.meta_title || `${article.title} | ふとるめし コラム`;
  const description = article.meta_description || article.excerpt || 'ふとるめし編集部がお届けするコラム';
  const ogImage = article.og_image_url || article.thumbnail_url || undefined;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
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

  const supabase = createServerClient() as any;
  void supabase
    .from('articles')
    .update({ view_count: (article.view_count ?? 0) + 1 })
    .eq('id', article.id)
    .then(({ error }: { error: unknown }) => {
      if (error) console.error('[blog/[slug]] view_count update failed', error);
    });

  return (
    <main className="min-h-screen bg-[#F9F8F3] pt-24 sm:pt-28 pb-16">
      <div className="max-w-[375px] px-4 md:max-w-[768px] md:px-6 lg:max-w-[1200px] lg:px-8 mx-auto">
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

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)] gap-8 lg:gap-10">
          <article className="bg-white rounded-2xl shadow-sm overflow-hidden min-w-0">
            {article.thumbnail_url && (
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-gray-100">
                <Image
                  src={article.thumbnail_url}
                  alt={article.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 800px"
                  className="object-cover"
                  priority
                />
              </div>
            )}

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

              <ArticleContent content={article.content} />

              <div className="mt-12 p-6 sm:p-8 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl text-center">
                <p className="text-sm sm:text-base text-gray-700 mb-4">
                  ふとるための栄養設計を、毎月お届け
                </p>
                <Link
                  href="/purchase?type=subscription"
                  className="inline-block bg-orange-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-orange-700 transition-colors"
                >
                  ふとるめしを試す
                </Link>
              </div>
            </div>
          </article>

          {pickUp.length > 0 && (
            <aside className="lg:sticky lg:top-28 self-start">
              <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6">
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
                        <div className="relative w-20 h-20 shrink-0 overflow-hidden rounded bg-gray-100">
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

        <div className="mt-10 text-center">
          <Link href="/blog" className="text-sm text-orange-600 hover:underline">
            ← コラム一覧に戻る
          </Link>
        </div>
      </div>
    </main>
  );
}
