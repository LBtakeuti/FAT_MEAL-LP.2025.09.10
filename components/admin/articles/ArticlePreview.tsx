'use client';

import ArticleContent from '@/components/blog/ArticleContent';
import { extractToc } from '@/lib/blog-toc';
import TableOfContents from '@/components/blog/TableOfContents';

/**
 * F51-1: 編集中の記事プレビュー。
 * 公開ページ（app/blog/[slug]/page.tsx）と同じスタイルで描画する。
 * - markdown を受け取り ArticleContent でレンダリング
 * - 見出し3個以上なら TOC も表示
 * - 公開ページのコンテナデザインに揃える（max-width / 余白 / カード風背景）
 */
interface ArticlePreviewProps {
  title: string;
  author: string;
  publishedAt: string | null;
  tags: string[];
  excerpt: string;
  markdown: string;
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function ArticlePreview({
  title,
  author,
  publishedAt,
  tags,
  excerpt,
  markdown,
}: ArticlePreviewProps) {
  const toc = extractToc(markdown);

  return (
    <div className="bg-[#F9F8F3] rounded-md p-5 sm:p-8 border border-gray-200">
      <p className="text-xs text-gray-500 mb-4">
        ※ 公開ページと同じスタイルで表示しています（管理画面プレビュー）
      </p>

      <article className="bg-white rounded-md shadow-sm overflow-hidden min-w-0">
        <div className="px-5 py-8 sm:px-10 sm:py-12">
          <header className="mb-8">
            <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-500 mb-3">
              {publishedAt && <time>{formatDate(publishedAt)}</time>}
              {publishedAt && author && <span>·</span>}
              {author && <span>{author}</span>}
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 leading-snug">
              {title || '（タイトル未入力）'}
            </h1>
            {tags && tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2.5 py-1 rounded-full bg-orange-50 text-orange-700"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            {excerpt && (
              <p className="mt-3 text-sm text-gray-600 italic">{excerpt}</p>
            )}
          </header>

          {/* TOC（見出し3個未満は内部で非表示） */}
          <TableOfContents items={toc} />

          {markdown ? (
            <ArticleContent content={markdown} />
          ) : (
            <p className="text-sm text-gray-400">（本文未入力）</p>
          )}
        </div>
      </article>
    </div>
  );
}
