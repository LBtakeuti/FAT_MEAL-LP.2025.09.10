'use client';

import Link from 'next/link';

interface PopularArticle {
  id: string;
  slug: string;
  title: string;
  view_count: number;
}

interface Props {
  articles: PopularArticle[];
  loading?: boolean;
}

export function PopularArticles({ articles, loading = false }: Props) {
  return (
    <div className="bg-white p-5 rounded-md shadow">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">記事閲覧ランキング（Top 5）</h3>
      {loading ? (
        <div className="py-8 text-center text-gray-400 text-sm">読み込み中…</div>
      ) : articles.length === 0 ? (
        <div className="py-8 text-center text-gray-400 text-sm">公開記事がありません</div>
      ) : (
        <ol className="divide-y divide-gray-100">
          {articles.map((a, idx) => (
            <li key={a.id} className="py-2 flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 text-xs font-bold flex items-center justify-center shrink-0">
                {idx + 1}
              </span>
              <Link
                href={`/blog/${a.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-0 text-sm text-gray-900 hover:text-orange-600 line-clamp-1"
              >
                {a.title}
              </Link>
              <span className="text-xs text-gray-500 shrink-0">
                {a.view_count.toLocaleString('ja-JP')} 閲覧
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
