'use client';

import Link from 'next/link';
import { ArticleForm, EMPTY_INITIAL } from '@/components/admin/articles/ArticleForm';

export default function AdminArticleNewPage() {
  return (
    <div>
      <div className="mb-4 text-sm text-gray-600">
        <Link href="/admin/articles" className="hover:text-orange-600">← 記事一覧へ</Link>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">新規記事作成</h1>
      <ArticleForm mode="create" initial={EMPTY_INITIAL} />
    </div>
  );
}
