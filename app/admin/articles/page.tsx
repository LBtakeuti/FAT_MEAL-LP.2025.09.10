'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ConfirmDialog, LoadingSpinner, useToast } from '@/components/admin/ui';

interface AdminArticleListItem {
  id: string;
  slug: string;
  title: string;
  thumbnail_url: string | null;
  is_published: boolean;
  published_at: string | null;
  view_count: number;
  updated_at: string;
}

interface ListResponse {
  articles: AdminArticleListItem[];
  total: number;
}

const PAGE_SIZE = 20;

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

type StatusFilter = 'all' | 'published' | 'draft';

export default function AdminArticlesPage() {
  const [items, setItems] = useState<AdminArticleListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  // F51-2: フィルタ追加（公開状態 / タグ）
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [tagFilter, setTagFilter] = useState<string>('');
  const [tagInput, setTagInput] = useState<string>('');
  const toast = useToast();

  const fetchList = useCallback(
    async (params: { offset: number; search: string; status: StatusFilter; tag: string }) => {
      setLoading(true);
      try {
        const sp = new URLSearchParams();
        sp.set('limit', String(PAGE_SIZE));
        sp.set('offset', String(params.offset));
        if (params.search) sp.set('search', params.search);
        if (params.status === 'published') sp.set('isPublished', 'true');
        else if (params.status === 'draft') sp.set('isPublished', 'false');
        if (params.tag) sp.set('tag', params.tag);
        const res = await fetch(`/api/admin/articles?${sp.toString()}`);
        if (!res.ok) throw new Error(String(res.status));
        const json: ListResponse = await res.json();
        setItems(json.articles ?? []);
        setTotal(json.total ?? 0);
      } catch (err) {
        console.error('Failed to fetch articles', err);
        toast.error('記事一覧の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    fetchList({ offset, search, status: statusFilter, tag: tagFilter });
  }, [fetchList, offset, search, statusFilter, tagFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0);
    setSearch(searchInput.trim());
  };

  const handleTagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0);
    setTagFilter(tagInput.trim());
  };

  const togglePublish = async (article: AdminArticleListItem) => {
    setBusyId(article.id);
    try {
      const res = await fetch(`/api/admin/articles/${article.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: !article.is_published }),
      });
      if (!res.ok) throw new Error(String(res.status));
      toast.success(article.is_published ? '下書きに戻しました' : '公開しました');
      fetchList({ offset, search, status: statusFilter, tag: tagFilter });
    } catch (err) {
      console.error('Failed to toggle publish', err);
      toast.error('状態切替に失敗しました');
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setBusyId(deleteId);
    try {
      const res = await fetch(`/api/admin/articles/${deleteId}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        const msg = json?.message || json?.error || `削除に失敗しました（HTTP ${res.status}）`;
        toast.error(msg);
        return;
      }
      toast.success('削除しました');
      fetchList({ offset, search, status: statusFilter, tag: tagFilter });
    } catch (err) {
      console.error('Failed to delete article', err);
      toast.error('削除に失敗しました');
    } finally {
      setBusyId(null);
      setDeleteId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <div>
      <div className="bg-white shadow rounded-md">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center gap-4 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-900">コラム記事管理</h1>
          <Link
            href="/admin/articles/new"
            className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors text-sm font-semibold"
          >
            + 新規作成
          </Link>
        </div>

        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 space-y-3">
          <form onSubmit={handleSearchSubmit} className="flex gap-2 items-center">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="タイトルで検索"
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm flex-1 max-w-xs focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <button
              type="submit"
              className="bg-gray-800 text-white px-3 py-1.5 rounded-md text-sm hover:bg-gray-900"
            >
              検索
            </button>
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); setSearchInput(''); setOffset(0); }}
                className="text-xs text-gray-500 hover:underline"
              >
                クリア
              </button>
            )}
          </form>
          {/* F51-2: 公開状態 + タグフィルタ */}
          <div className="flex flex-wrap items-center gap-2">
            {(['all', 'published', 'draft'] as StatusFilter[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => { setOffset(0); setStatusFilter(s); }}
                className={`px-3 py-1.5 rounded-md text-xs ${
                  statusFilter === s
                    ? 'bg-orange-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {s === 'all' ? 'すべて' : s === 'published' ? '公開中' : '下書き'}
              </button>
            ))}
            <form onSubmit={handleTagSubmit} className="flex items-center gap-2 ml-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="タグで絞り込み"
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-44 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <button
                type="submit"
                className="bg-gray-800 text-white px-3 py-1.5 rounded-md text-xs hover:bg-gray-900"
              >
                適用
              </button>
              {tagFilter && (
                <button
                  type="button"
                  onClick={() => { setTagFilter(''); setTagInput(''); setOffset(0); }}
                  className="text-xs text-gray-500 hover:underline"
                >
                  クリア
                </button>
              )}
            </form>
          </div>
        </div>

        {loading ? (
          <div className="py-16"><LoadingSpinner /></div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-gray-500">記事がありません</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-16">サムネ</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">タイトル / slug</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">公開状態</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-40">公開日</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider w-20">閲覧</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider w-56">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((article) => (
                  <tr key={article.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <div className="relative w-12 h-12 rounded-md overflow-hidden bg-gray-100">
                        {article.thumbnail_url ? (
                          <Image
                            src={article.thumbnail_url}
                            alt=""
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="font-semibold text-gray-900 line-clamp-1">{article.title}</div>
                      <div className="text-xs text-gray-500 line-clamp-1">/{article.slug}</div>
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          article.is_published
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {article.is_published ? '公開中' : '下書き'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {formatDateTime(article.published_at)}
                    </td>
                    <td className="px-4 py-2 text-sm text-right text-gray-700">
                      {article.view_count.toLocaleString('ja-JP')}
                    </td>
                    <td className="px-4 py-2 text-right space-x-2 whitespace-nowrap">
                      <Link
                        href={`/admin/articles/${article.id}/edit`}
                        className="inline-block text-xs px-2 py-1 rounded-md border border-gray-300 hover:bg-gray-100"
                      >
                        編集
                      </Link>
                      <button
                        type="button"
                        onClick={() => togglePublish(article)}
                        disabled={busyId === article.id}
                        className={`text-xs px-2 py-1 rounded-md border ${
                          article.is_published
                            ? 'border-gray-300 hover:bg-gray-100'
                            : 'border-orange-500 text-orange-600 hover:bg-orange-50'
                        } disabled:opacity-50`}
                      >
                        {article.is_published ? '下書きに戻す' : '公開する'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteId(article.id)}
                        disabled={busyId === article.id}
                        className="text-xs px-2 py-1 rounded-md border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600">
            <div>
              全 {total.toLocaleString('ja-JP')} 件中 {offset + 1}–{Math.min(offset + items.length, total)} 件
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                className="px-3 py-1 rounded-md border border-gray-300 disabled:opacity-40 hover:bg-gray-100"
              >
                前へ
              </button>
              <span>{currentPage} / {totalPages}</span>
              <button
                type="button"
                disabled={offset + PAGE_SIZE >= total}
                onClick={() => setOffset(offset + PAGE_SIZE)}
                className="px-3 py-1 rounded-md border border-gray-300 disabled:opacity-40 hover:bg-gray-100"
              >
                次へ
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        title="記事を削除しますか？"
        description="削除すると元に戻せません。公開中の記事も即座に非表示になります。"
        confirmLabel="削除する"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
