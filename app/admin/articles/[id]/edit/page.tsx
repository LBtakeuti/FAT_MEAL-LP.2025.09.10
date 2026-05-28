'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArticleForm, EMPTY_INITIAL, type ArticleFormInitial } from '@/components/admin/articles/ArticleForm';
import { LoadingSpinner } from '@/components/admin/ui';

export default function AdminArticleEditPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [initial, setInitial] = useState<ArticleFormInitial | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/admin/articles/${id}`)
      .then(async (r) => {
        if (r.status === 404) { setNotFound(true); return; }
        if (!r.ok) throw new Error(String(r.status));
        const json = await r.json();
        const a = json.article;
        setInitial({
          id: a.id,
          slug: a.slug ?? '',
          title: a.title ?? '',
          excerpt: a.excerpt ?? '',
          content: a.content ?? '',
          thumbnail_url: a.thumbnail_url ?? '',
          tags: Array.isArray(a.tags) ? a.tags : [],
          author: a.author ?? 'ふとるめし編集部',
          is_published: !!a.is_published,
          published_at: a.published_at ?? null,
          meta_title: a.meta_title ?? '',
          meta_description: a.meta_description ?? '',
          og_image_url: a.og_image_url ?? '',
        });
      })
      .catch((err) => {
        console.error('Failed to load article', err);
        setInitial({ ...EMPTY_INITIAL });
      });
  }, [id]);

  if (notFound) {
    return (
      <div>
        <Link href="/admin/articles" className="text-sm text-orange-600 hover:underline">← 記事一覧へ</Link>
        <div className="mt-8 text-center text-gray-500">記事が見つかりません</div>
      </div>
    );
  }

  if (!initial) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="mb-4 text-sm text-gray-600">
        <Link href="/admin/articles" className="hover:text-orange-600">← 記事一覧へ</Link>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">記事を編集</h1>
      <ArticleForm mode="edit" initial={initial} />
    </div>
  );
}
